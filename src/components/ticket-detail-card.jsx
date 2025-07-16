import React from "react";
import Helper from "../utils/helper";
import { QRCode } from "zmp-qrcode";

const TicketDetailCard = ({
  event,
  ticket,
  goBack,
  shareTicket,
  isShareView = true,
}) => {
  return (
    <div>
      <div className=" p-4 bg-white rounded-2xl">
        <div>
          <div className="w-[170px] m-auto">
            <QRCode value={ticket?.id + ""} className="m-auto" />
          </div>
          <p className="p-2 mt-4 text-center text-sm w-full">
            Quét QR để checkin sự kiện
          </p>
        </div>
        <img
          className="block w-full rounded-lg"
          src={`${
            event?.customFields?.["Hình ảnh"]?.[0].url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png"
          }`}
        />
        <div className="pt-2">
          <p className="text-lg font-semibold">
            {event?.customFields?.["Sự kiện"] || event?.name}
          </p>
          <div className="gap-y-4 my-2 text-sm">
            <div className="text-xs">Thời gian</div>
            <div className="font-semibold">
              {Helper.formatTime(event?.customFields?.["Thời gian tổ chức"])}
            </div>

            <div className="text-xs mt-3">Địa chỉ</div>
            <div className="font-semibold">
              {event?.customFields?.["Địa điểm"]}
            </div>

            <div className="text-xs mt-3">Đơn vị tổ chức</div>
            <div className="font-semibold pb-2 line-clamp-1 border-b border-dashed border-gray-200">
              {event?.customFields?.["Chi Hội"]?.[0]?.data ||
                event?.chapter?.name}
            </div>
          </div>
          <div className="flex justify-between ">
            <div>
              <div className="text-xs mt-2">Tên người đăng ký</div>
              <div className="font-semibold">
                {ticket?.customFields["Tên người đăng ký"]}
              </div>
            </div>
            <div>
              <div className="text-xs mt-2 text-right">
                Số điện thoại người đăng ký
              </div>
              <div className="font-semibold text-right">
                {ticket?.customFields["Số điện thoại"]}
              </div>
            </div>
          </div>
          <div className="flex justify-between ">
            <div>
              <div className="text-xs mt-2">Loại</div>
              <div className="font-semibold">
                {ticket?.customFields["Loại vé"]}
              </div>
            </div>
            <div>
              <div className="text-xs mt-2 text-right">Mã vé</div>
              <div className="font-semibold text-right">
                {ticket?.customFields?.["Mã vé"] || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0E3D8A] border-t flex justify-between">
        <button
          onClick={goBack}
          className={`bg-slate-200 text-black font-bold py-3 rounded-lg text-normal ${
            isShareView ? "w-1/4" : "w-full"
          }`}
        >
          Đóng
        </button>
        {isShareView && (
          <button
            onClick={shareTicket}
            className="w-3/4 bg-slate-200 text-black font-bold py-3 rounded-lg text-normal ml-4 disabled:bg-blue-200"
          >
            Chia sẻ
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketDetailCard;
