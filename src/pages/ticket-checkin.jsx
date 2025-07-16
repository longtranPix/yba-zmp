import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import Helper from "../utils/helper";
import APIService from "../services/api-service";
import TicketCheckinLoading from "../components/skeletons/ticket-checkin-loading";
import copy from "copy-to-clipboard";

const TicketCheckinPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (id < 0) {
      return setLoading(false);
    }
    APIService.getTicketInfo(id)
      .then((results) => {
        if (results.data) {
          setTicket(results.data);
        } else {
          Helper.showAlert(
            results?.message ||
              "Không tìm thấy thông tin vé, vui lòng kiểm tra lại"
          );
        }
      })
      .catch(console)
      .finally(() => {
        if (!ticket?.customFields?.["Sự kiện"]?.[0].id) {
          setLoading(false);
        }
      });
  }, [id]);

  useEffect(() => {
    if (!ticket?.customFields?.["Sự kiện"]?.[0].id) return;

    APIService.getEventInfo(ticket.customFields?.["Sự kiện"][0].id)
      .then((results) => {
        if (results.data) {
          setEvent(results.data);
        } else {
          Helper.showAlert(
            "Không tìm thấy thông tin sự kiện, vui lòng kiểm tra lại"
          );
        }
      })
      .catch(console)
      .finally(() => {
        setLoading(false);
      });
  }, [ticket]);

  const canCheckin = () => {
    return ticket && !ticket.customFields["Check in"];
  };

  const goBack = () => {
    navigate(-1);
  };

  const checkin = async () => {
    if (!ticket?.customFields?.["Check in"]) {
      const response = await APIService.updateTicket(
        ticket.customFields["Zalo ID OA"],
        ticket.id
      );
      if (
        (response && response.error == 0 && response.message == "Success") ||
        response.message == "success" ||
        response.message == 200
      ) {
        APIService.getTicketInfo(id)
          .then((results) => {
            if (results.data) {
              setTicket(results.data);
            }
          })
          .catch(console);
        Helper.showAlertInfo(`Check-in sự kiện thành công`, 0);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
        return;
      } else {
        return Helper.showAlert(`${response.message}`);
      }
    }
  };

  const handleCopy = (content) => {
    copy(content, { debug: true });
    Helper.showAlertInfo(`Copy to clipboard: ${content}`);
  };

  const getStatus = () => {
    let checkin = ticket?.customFields?.["Check in"] || false;
    if (!checkin) {
      return (
        <span className="text-[#999999] bg-[#F4F4F5] px-3 py-px border border-[#E5E5E5] rounded-lg font-medium text-sm">
          Chưa check-in
        </span>
      );
    } else {
      return (
        <span className="text-[#00B050] bg-[#00B050] bg-opacity-5 px-3 py-px border border-[#00B050] rounded-lg flex items-center font-medium text-sm">
          <Icon icon="zi-check" size={16} />{" "}
          <span className="ml-1">Đã checkin</span>
        </span>
      );
    }
  };

  if (loading) {
    return <TicketCheckinLoading />;
  }
  if (!ticket) {
    return (
      <div className="h-96 pt-40 px-12 font-bold bg-white text-center text-red-500">
        Không tìm thấy thông tin vé trên hệ thống, vui lòng kiểm tra lại.
      </div>
    );
  }
  return (
    <Page className="page bg-white safe-page-content">
      <div className="border rounded-2xl py-9 px-4 mt-6">
        <img
          className="rounded-md"
          src={
            event?.customFields["Hình ảnh"]?.[0].url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png"
          }
        />
        <p className="font-bold text-lg text-center py-4">
          {event?.customFields["Sự kiện"] || event?.name}
        </p>
        <div className="col-span-2 mt-1 flex justify-center">{getStatus()}</div>
        <div className="border-t border-dashed my-4 py-4">
          <div className="flex justify-between">
            <div className="">
              <p className="text-sm text-[#5F5A5A]">ID hội viên</p>
              <p className="font-bold text-sm text-[#0D0D0D] py">
                {ticket?.customFields["Zalo ID"] || "..."}
              </p>
            </div>
            <div className="">
              <p className="text-sm text-[#5F5A5A] text-right">
                Tên người đăng ký
              </p>
              <p className="font-bold text-sm text-[#0D0D0D] py text-right">
                {ticket.customFields["Tên người đăng ký"]}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <div className="">
              <p className="text-sm text-[#5F5A5A]">Trạng thái thanh toán</p>
              <p className="font-bold text-sm text-[#0D0D0D] py">
                {ticket.customFields["Trạng thái thanh toán"]}
              </p>
            </div>
            <div className="">
              <p className="text-sm text-[#5F5A5A] text-right">Loại vé</p>
              <p className="font-bold text-sm text-[#0D0D0D] py">
                {ticket.customFields["Loại vé"]}
              </p>
            </div>
          </div>
        </div>
        <div className="text-center h-10 bg-[#F4F4F4] flex items-center justify-center -mx-4">
          <p className="font-bold flex items-center">
            <span>{ticket.customFields["Mã vé"]}</span>
            <Icon
              className="px-2 -pt-1"
              icon="zi-copy"
              size={16}
              onClick={() => handleCopy(ticket.customFields["Mã vé"])}
            />
          </p>
        </div>
      </div>
      {canCheckin() ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
          <button
            className="bg-slate-200 text-black font-bold py-3 rounded-lg text-normal w-1/2 mr-4"
            onClick={goBack}
          >
            Đóng
          </button>
          <button
            className="bg-blue-custom disabled:bg-blue-200 text-white font-bold py-3 rounded-lg text-normal w-1/2"
            onClick={checkin}
          >
            Xác nhận vé
          </button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
          <button
            className="bg-slate-200 text-black font-bold py-3 rounded-lg text-normal w-full"
            onClick={goBack}
          >
            Đóng
          </button>
        </div>
      )}
    </Page>
  );
};

export default TicketCheckinPage;
