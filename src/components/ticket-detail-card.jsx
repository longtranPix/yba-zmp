import React from "react";
import Helper from "../utils/helper";
import { QRCode } from "zmp-qrcode";
import { getEventImageUrl, getImageProps } from "../utils/imageHelper";

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
            {/* ✅ FIXED: Use correct ticket ID field from updated API response */}
            <QRCode value={ticket?.documentId || ticket?.ticketId || ticket?.id || ""} className="m-auto" />
          </div>
          <p className="p-2 mt-4 text-center text-sm w-full">
            Quét QR để checkin sự kiện
          </p>
        </div>
        <img
          className="block w-full rounded-lg"
          {...getImageProps(
            // ✅ FIXED: Use correct image structure from GraphQL response
            event?.hinh_anh?.url ||
            event?.customFields?.["Hình ảnh"]?.[0]?.url ||
            ticket?.su_kien?.hinh_anh?.url
          )}
          alt={event?.ten_su_kien || ticket?.su_kien?.ten_su_kien || "Event image"}
        />
        <div className="pt-2">
          <p className="text-lg font-semibold">
            {/* ✅ FIXED: Use correct event name from GraphQL response */}
            {event?.ten_su_kien ||
             event?.customFields?.["Sự kiện"] ||
             event?.name ||
             ticket?.eventName ||
             ticket?.ten_su_kien ||
             "Sự kiện YBA"}
          </p>
          <div className="gap-y-4 my-2 text-sm">
            <div className="text-xs">Thời gian</div>
            <div className="font-semibold">
              {/* ✅ FIXED: Use correct time field from GraphQL response */}
              {Helper.formatTime(
                event?.thoi_gian_to_chuc ||
                event?.customFields?.["Thời gian tổ chức"] ||
                ticket?.eventDate ||
                ticket?.ngay_su_kien
              )}
            </div>

            <div className="text-xs mt-3">Địa chỉ</div>
            <div className="font-semibold">
              {/* ✅ FIXED: Use correct location field from GraphQL response */}
              {event?.dia_diem ||
               event?.customFields?.["Địa điểm"] ||
               ticket?.su_kien?.dia_diem ||
               "Địa điểm sẽ được thông báo"}
            </div>

            <div className="text-xs mt-3">Đơn vị tổ chức</div>
            <div className="font-semibold pb-2 line-clamp-1 border-b border-dashed border-gray-200">
              {/* ✅ FIXED: Use correct organizer field from GraphQL response */}
              {event?.customFields?.["Chi Hội"]?.[0]?.data ||
               event?.chapter?.name ||
               "Hội doanh nhân trẻ TP.HCM (YBA HCM)"}
            </div>
          </div>
          <div className="flex justify-between ">
            <div>
              <div className="text-xs mt-2">Tên người đăng ký</div>
              <div className="font-semibold">
                {/* ✅ FIXED: Use correct registrant name from GraphQL response */}
                {ticket?.ten_nguoi_dang_ky ||
                 ticket?.registrantName ||
                 ticket?.customFields?.["Tên người đăng ký"] ||
                 "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs mt-2 text-right">
                Số điện thoại người đăng ký
              </div>
              <div className="font-semibold text-right">
                {/* ✅ FIXED: Use correct phone number from GraphQL response */}
                {ticket?.so_dien_thoai ||
                 ticket?.customFields?.["Số điện thoại"] ||
                 "N/A"}
              </div>
            </div>
          </div>
          <div className="flex justify-between ">
            <div>
              <div className="text-xs mt-2">Loại</div>
              <div className="font-semibold">
                {/* ✅ FIXED: Use correct ticket type from GraphQL response */}
                {ticket?.hien_thi_loai_ve ||
                 ticket?.ticketType ||
                 ticket?.loai_ve ||
                 ticket?.customFields?.["Loại vé"] ||
                 "Vé thường"}
              </div>
            </div>
            <div>
              <div className="text-xs mt-2 text-right">Mã vé</div>
              <div className="font-semibold text-right">
                {/* ✅ FIXED: Use correct ticket code from GraphQL response */}
                {ticket?.ma_ve ||
                 ticket?.ticketCode ||
                 ticket?.customFields?.["Mã vé"] ||
                 ticket?.id ||
                 "N/A"}
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
