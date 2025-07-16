import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import { Box, Modal, Page } from "zmp-ui";
import frame from "../assets/frame.png";
import APIService from "../services/api-service";
import WarningIcon from "../components/icons/warning-icon";
import SuccessIcon from "../components/icons/success-icon";

const QRScanPage = () => {
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "", // 'success', 'error'
    title: "",
    message: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedCode = useRef(null);

  const showModal = (config) => {
    setIsProcessing(true); // Chặn xử lý quét mới
    setModalConfig({ ...config, visible: true });
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      closeModal();
    }, 3000);
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setIsProcessing(false);
      lastScannedCode.current = null;
    }, 1000);
  };

  const handleScan = async (result) => {
    if (!result || isProcessing || modalConfig.visible) return;

    if (lastScannedCode.current === result.text) return;

    lastScannedCode.current = result.text;

    try {
      const ticketInfo = await APIService.getTicketInfo(result.text);

      if (!ticketInfo || ticketInfo.error !== 0) {
        return showModal({
          type: "error",
          title: "Mã QR không hợp lệ",
          message:
            ticketInfo?.message || "Không tìm thấy thông tin vé trên hệ thống",
        });
      }

      if (ticketInfo.data?.customFields["Check in"]) {
        return showModal({
          type: "error",
          title: "Vé đã được check-in",
          message: "Vé này đã được check-in trước đó",
        });
      }

      const response = await APIService.updateTicket(
        ticketInfo.data.customFields["Zalo ID OA"],
        ticketInfo.data.id
      );

      if (
        response?.error === 0 ||
        response?.message === "Success" ||
        response?.message === "success" ||
        response?.message === 200
      ) {
        showModal({
          type: "success",
          title: "Check-in thành công",
          message: `Vé ${ticketInfo.data.customFields["Mã vé"]} đã được check-in`,
        });
      } else {
        showModal({
          type: "error",
          title: "Check-in thất bại",
          message: "Có lỗi xảy ra khi check-in",
        });
      }
    } catch (error) {
      console.error("System error:", error);
      showModal({
        type: "error",
        title: "Mã QR không hợp lệ",
        message: "Liên hệ với YBA để được hỗ trợ",
      });
    }
  };

  return (
    <Page>
      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <img
            src={frame}
            alt="frame"
            className="object-cover w-full absolute z-10"
          />
        </div>
        <QrReader
          videoStyle={{
            height: "100%",
            objectFit: "cover",
            position: "absolute",
          }}
          containerStyle={{
            width: "100%",
            height: "100%",
            position: "absolute",
          }}
          videoContainerStyle={{
            height: "100%",
          }}
          constraints={{
            facingMode: "environment",
          }}
          onResult={(result, error) => {
            if (!!result) {
              handleScan(result);
            }
          }}
        />
        <div className="absolute top-[19%] text-white text-lg font-semibold w-full left-0 text-center z-20">
          Đưa mã vé vào khu vực quét mã
        </div>
      </div>

      <Modal
        visible={modalConfig.visible}
        title=""
        onClose={closeModal}
        verticalActions
      >
        <Box p={6}>
          <div className="text-center flex justify-center mb-4">
            {modalConfig.type === "success" ? <SuccessIcon /> : <WarningIcon />}
          </div>
          <div className="text-center font-bold text-lg my-4">
            {modalConfig.title}
          </div>
          <div className="text-center text-[#222] my-4">
            {modalConfig.message}
          </div>
          <button
            className={`${
              modalConfig.type === "success" ? "bg-green-600" : "bg-blue-custom"
            } disabled:bg-blue-50 text-white font-bold py-2 rounded-lg text-normal w-full block h-12`}
            onClick={closeModal}
          >
            Đóng
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default QRScanPage;
