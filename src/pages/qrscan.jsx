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
      console.log('QRScan: Processing QR code:', result.text);

      // ===== FIXED: Try to extract documentId from QR code =====
      let documentId = result.text;

      // Handle different QR code formats
      if (result.text.includes('documentId=')) {
        // Format: "documentId=ABC123" or URL with documentId parameter
        const match = result.text.match(/documentId=([^&\s]+)/);
        if (match) {
          documentId = match[1];
        }
      } else if (result.text.includes('/ticket/')) {
        // Format: URL with ticket ID in path
        const match = result.text.match(/\/ticket\/([^\/\?]+)/);
        if (match) {
          documentId = match[1];
        }
      } else if (result.text.startsWith('http')) {
        // Try to extract ID from URL path
        const urlParts = result.text.split('/');
        documentId = urlParts[urlParts.length - 1];
      }

      console.log('QRScan: Extracted documentId:', documentId);

      // ✅ ENHANCED: Use improved QR check-in API with pre-check
      const response = await APIService.checkInByQRCode(documentId);

      console.log('QRScan: API response:', response);

      if (response?.error === 0) {
        // ✅ SUCCESS: Ticket was successfully checked in
        const ticketData = response.data;

        showModal({
          type: "success",
          title: "Check-in thành công",
          message: `Vé ${ticketData.ma_ve} - ${ticketData.ten_nguoi_dang_ky} đã được check-in thành công`,
        });

        console.log('QRScan: Check-in successful:', {
          documentId: ticketData.documentId,
          ma_ve: ticketData.ma_ve,
          ten_nguoi_dang_ky: ticketData.ten_nguoi_dang_ky,
          da_check_in: ticketData.da_check_in
        });

      } else {
        // ✅ ERROR: Handle different error scenarios
        const ticketData = response.data;

        // Check if this is an "already checked in" error with ticket data
        if (ticketData && ticketData.da_check_in === true) {
          showModal({
            type: "error",
            title: "Vé đã được check-in",
            message: `Vé ${ticketData.ma_ve} của ${ticketData.ten_nguoi_dang_ky} đã được check-in trước đó`,
          });
        } else {
          // Other errors (ticket not found, system errors, etc.)
          showModal({
            type: "error",
            title: response?.alert?.title || "Check-in thất bại",
            message: response?.alert?.message || response?.message || "Không thể check-in vé này. Vui lòng kiểm tra lại mã QR.",
          });
        }

        console.error('QRScan: Check-in failed:', {
          error: response?.error,
          message: response?.message,
          alert: response?.alert,
          ticketData: ticketData
        });
      }

    } catch (error) {
      console.error("QRScan: System error:", error);
      showModal({
        type: "error",
        title: "Lỗi hệ thống",
        message: "Có lỗi xảy ra khi xử lý mã QR. Vui lòng thử lại hoặc liên hệ YBA để được hỗ trợ.",
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
          onResult={(result, _error) => {
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
