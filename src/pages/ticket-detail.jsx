import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import BillingIcon from "../components/icons/billing-icon";
import { useParams } from "react-router-dom";
import { ticketInfoState, vietQrState, configState } from "../state";
import { useRecoilValue, useSetRecoilState } from "recoil";
import Helper from "../utils/helper";
import APIService from "../services/api-service";
import ZaloService from "../services/zalo-service";
import { openShareSheet } from "zmp-sdk/apis";
import EventSponsors from "../components/event-sponsor";
import { QRCode } from "zmp-qrcode";
import { useAuth } from "../contexts/AuthContext";
import { getImageProps } from "../utils/imageHelper";

const TicketDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ===== NEW: Use AuthContext for user data =====
  const { userInfo, member, userType } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [event, setEvent] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showViewButton, setShowViewMoreButton] = useState(true);
  const setVietQr = useSetRecoilState(vietQrState);
  const configs = useRecoilValue(configState);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    var load = async () => {
      try {
        console.log("TicketDetailPage: Loading ticket details for ID:", id)
        let ticketResponse = await APIService.getTicketInfo(id);
        console.log("log ticket: ", ticketResponse);
        if (ticketResponse.data) {
          setTicket(ticketResponse.data);
          // if (
          //   ticketResponse.data.customFields?.["Trạng thái"]?.[0] ==
          //   "Đã Phát Hành"
          // ) {
          //   navigate(`/tickets/views/${ticketResponse.data.id}`);
          // }
          // Use GraphQL EventRegistration field names
          const eventId =
            ticketResponse.data.eventId ||
            ticketResponse.data.su_kien?.documentId ||
            ticketResponse.data.customFields?.["Sự kiện"]?.[0]?.id;
          if (eventId) {
            let response = await APIService.getEventInfo(eventId);
            if (response.data?.eventInformation) {
              setEvent(response.data.eventInformation);
              let res = await APIService.getSponsorsOfEvents(response.data.id);
              if (res.data) {
                let sorted = Helper.sortEventSponsers(res.data.sponsors);
                setSponsors(sorted);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading ticket details:", error);
      }
    };

    if (id) {
      load();
    }
  }, [id]);

  useEffect(() => {
    // Use GraphQL EventInformation field names with fallback
    const eventContent =
      event?.noi_dung_su_kien ||
      event?.customFields?.["Nội Dung Sự Kiện"]?.html ||
      event?.customFields?.["Nội Dung Sự Kiện"]?.text ||
      "";

    if (eventContent) {
      setShowViewMoreButton(eventContent.length >= 100);
    }
  }, [event]);

  const checkin = () => {
    navigate(`/tickets/qrcode/${ticket.id}`);
  };

  const goBack = () => {
    navigate(-1);
  };

  const viewMore = () => {
    setShowFullDescription(true);
    setShowViewMoreButton(false);
  };

  const openContact = async () => {
    // ===== NEW: Use AuthContext userInfo instead of APIService.getAuthInfo() =====
    await APIService.sendEventContact(
      userInfo?.id, // Use Zalo ID from AuthContext
      event.id,
      event?.ten_su_kien || event?.customFields?.["Sự kiện"] || event?.name
    );
    let oaId = configs?.oaInfo?.id || 0;
    if (oaId > 0) {
      ZaloService.openOfficialAccount(oaId);
    }
  };

  const getTicketStatus = () => {
    // Use GraphQL EventRegistration field names
    let ticketStatus =
      ticket?.trang_thai ||
      ticket?.customFields?.["Trạng thái"]?.[0] ||
      "";

    // Map GraphQL enum values to display text
    const statusMap = {
      "Moi": "Vé mới",
      "Cho_duyet": "Đang xử lý",
      "Da_duyet": "Đã phê duyệt",
      "Tu_choi": "Đã từ chối",
      "Da_phat_hanh": "Đã Phát Hành",
      "Da_huy": "Đã Hủy"
    };

    const displayStatus = statusMap[ticketStatus] || ticketStatus;

    switch (displayStatus) {
      case "Vé mới":
      case "Đang xử lý":
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-2 py-1.5 rounded-lg">
              Đang xử lý
            </span>
          </div>
        );
      case "Đã Hủy":
      case "Đã từ chối":
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-2 py-1.5 rounded-lg">
              Đã hủy
            </span>
          </div>
        );
      case "Đã Phát Hành":
      case "Đã phê duyệt":
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#00B050] bg-green-50 font-bold border border-[#00B050] px-2 py-1.5 rounded-lg">
              Phát hành thành công
            </span>
          </div>
        );
      default:
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-2 py-1.5 rounded-lg">
              {displayStatus || "Đang xử lý"}
            </span>
          </div>
        );
    }
  };

  const gotoPayment = async () => {
    try {
      // Use the enhanced payment QR generation function with event bank information
      const ticketId = ticket?.documentId || ticket?.ticketId;
      const eventId = event?.documentId || ticket?.event?.id;

      console.log('Generating payment QR for ticket:', { ticketId, eventId });

      let res = await APIService.generatePaymentQRForTicket(ticketId, eventId);

      if (res.error === 0) {
        // Set VietQR state for payment screen using event bank information
        setVietQr({
          url: res.data.qr,
          bankInfo: res.data.bankInfo,
        });

        // Navigate to payment screen
        navigate(`/payment?ticketId=${ticketId}&eventId=${eventId}`);
      } else {
        throw new Error(res.message || "Failed to generate payment QR");
      }
    } catch (error) {
      console.error("Error generating payment QR:", error);
      Helper.showAlert("Không thể tạo mã thanh toán. Vui lòng thử lại sau.");
    }
  };

  const shareLink = `tickets/detail/${ticket?.id}`;

  const shareTicket = async () => {
    try {
      const eventName =
        event?.ten_su_kien ||
        event?.customFields?.["Sự kiện"] ||
        event?.name ||
        "Sự kiện";

      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${eventName}`,
            100
          ),
          description: `Truy cập để xem thông tin chi tiết vé điện tử sự kiện ${eventName}. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            getImageProps(event?.hinh_anh?.url).src ||
            event?.customFields?.["Hình ảnh"]?.[0]?.url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: shareLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleRating = async () => {
    const feedback = {
      id: event?.id,
      rating: rating,
      comment: comment,
    };
    if (feedback.rating === 0) {
      return Helper.showAlert("Vui lòng chấm điểm cho sự kiện");
    }
    if (feedback.comment.length === 0) {
      return Helper.showAlert("Vui lòng nhập bình luận của bạn");
    }

    const res = await APIService.feedback(ticket.id, feedback);
    if (res && res.error == 0) {
      Helper.showAlertInfo("Đánh giá sự kiện thành công");
      setRating(0);
      setComment("");
    }
  };

  const isTicketFree = () => {
    // Use GraphQL EventRegistration field names
    return (
      ticket?.loai_ve === "Mien_phi" ||
      ticket?.gia_ve === 0 ||
      ticket?.customFields?.["Loại vé"] === "Miễn Phí"
    );
  };

  return (
    <Page className="bg-white page safe-page-content">
      {/* ✅ FIXED: Use correct ticket status values from GraphQL schema */}
      {(ticket?.trang_thai === "Da_phat_hanh" ||
        ticket?.status === "Da_phat_hanh" ||
        ticket?.customFields?.["Trạng thái"]?.[0] === "Da_phat_hanh") && (
          <div>
            <div className="flex flex-col items-center w-full m-auto mb-2">
              <QRCode
                value={ticket?.id || ticket?.documentId || ticket?.ticketId || ""}
                size={200}
                className="m-auto "
              />
            </div>
            <p className="w-full p-2 text-sm text-center">
              Quét QR để checkin sự kiện
            </p>
          </div>
        )}
      <img
        className="block w-full rounded-lg"
        {...getImageProps(
          event?.hinh_anh?.url ||
          "https://api.ybahcm.vn/public/yba/yba-01.png"
        )}
      />
      <div className="py-4">
        <p className="text-lg font-bold">
          {event?.ten_su_kien ||
            event?.customFields?.["Sự kiện"] ||
            event?.name ||
            ""}
        </p>
        {/* ✅ FIXED: Use correct payment status values from GraphQL schema */}
        {(ticket?.trang_thai_thanh_toan !== "Thanh_toan" &&
          ticket?.paymentStatus !== "Thanh_toan" &&
          ticket?.customFields?.["Trạng thái thanh toán"]?.[0] !== "Thanh_toan") && (
            <div className="py-2 text-gray-700 text-normal">
              <div
                className={`${showFullDescription ? "" : "line-clamp-3"}`}
                dangerouslySetInnerHTML={{
                  __html:
                    event?.noi_dung_su_kien ||
                    event?.customFields?.["Nội Dung Sự Kiện"]?.html ||
                    event?.customFields?.["Nội Dung Sự Kiện"]?.text ||
                    "",
                }}
              />
              {showViewButton && (
                <p
                  className="block w-full m-auto text-center text-blue-700"
                  onClick={viewMore}
                >
                  {" "}
                  Xem thêm
                </p>
              )}
            </div>
          )}

        {(event?.trang_thai === "Ket_thuc" ||
          event?.customFields?.["Trạng thái"]?.[0] === "Kết thúc") &&
          (ticket?.da_check_in === true ||
            ticket?.customFields?.["Check in"] === true) &&
          (ticket?.danh_gia === null ||
            ticket?.customFields?.["Đánh giá"] === null) && (
            <>
              <div className="mt-5 mb-3 text-base font-bold">
                Đánh giá sự kiện
              </div>
              <div className="grid grid-cols-3 gap-4 px-3 py-3 my-2 text-sm border rounded-lg">
                <div className="text-[#6F7071]">Chấm điểm</div>
                <div className="flex items-center col-span-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      fill={star <= rating ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      className="w-[27px] h-[27px] text-yellow-400 cursor-pointer"
                      stroke={star > rating ? "currentColor" : ""}
                      strokeWidth="2"
                      onClick={() => setRating(star)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 17.27l6.18 3.73-1.64-7.03L21.64 9.5l-7.19-.61L12 2 9.55 8.89 2.36 9.5l5.46 4.47L6.18 21z"
                      />
                    </svg>
                  ))}
                  <div className="ml-2 text-sm font-medium text-black">
                    {rating} / 5
                  </div>
                </div>
                <div className="text-[#6F7071]">Bình luận</div>
                <div className="col-span-2 ">
                  <textarea
                    placeholder="Viết nhận xét của bạn..."
                    className="w-full h-20 px-3 py-2 mt-3 text-sm border rounded-md resize focus:outline-none focus:ring focus:ring-blue-300"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={100}
                  ></textarea>
                  <div className="mt-1 text-sm text-right text-gray-500">
                    {comment.length} / 100
                  </div>
                </div>
                <div className="flex justify-center col-span-3">
                  <button
                    onClick={handleRating}
                    className="h-10 px-3 py-2 mx-auto font-bold text-white rounded-lg bg-blue-custom text-normal disabled:bg-slate-300 mx"
                  >
                    Đánh giá
                  </button>
                </div>
              </div>
            </>
          )}
        {/* ✅ FIXED: Use correct payment status values and field names */}
        {(ticket?.trang_thai_thanh_toan !== "Thanh_toan" &&
          ticket?.paymentStatus !== "Thanh_toan" &&
          ticket?.customFields?.["Trạng thái thanh toán"]?.[0] !== "Thanh_toan") &&
          !isTicketFree() &&
          (ticket?.gia_ve > 0 || ticket?.ticketPrice > 0) && (
            <div
              className="mb-3 flex items-center px-3 py-2 border rounded-md border-[#006EFF] justify-between"
              onClick={gotoPayment}
            >
              <div className="flex items-center">
                <BillingIcon />
                <div className="pl-2">
                  <p className="text-sm">Thanh toán</p>
                  <p className="text-[13px] text-[#6F7071]">
                    Bỏ qua nếu bạn đã thực hiện thanh toán
                  </p>
                </div>
              </div>
              <div className="basis-2 right">
                <Icon icon="zi-chevron-right" />
              </div>
            </div>
          )}
        <div>
          <div className="grid grid-cols-3 gap-4 px-2 py-4 my-4 text-sm border rounded-lg">
            <div className="text-[#6F7071]">Ngày diễn ra</div>
            <div className="col-span-2 ">
              {Helper.formatDateWithDay(
                event?.thoi_gian_to_chuc ||
                event?.customFields?.["Thời gian tổ chức"]
              )}
            </div>
            <div className="text-[#6F7071]">Thời gian</div>
            <div className="col-span-2 ">
              {Helper.formatTimeOnly(
                event?.thoi_gian_to_chuc ||
                event?.customFields?.["Thời gian tổ chức"]
              )}
            </div>
            <div className="text-[#6F7071]">Địa điểm</div>
            <div className="col-span-2 ">
              {event?.dia_diem ||
                event?.customFields?.["Địa điểm"]}
            </div>
            <div className="text-[#6F7071]">Đơn vị tổ chức</div>
            <div className="col-span-2 ">
              {event?.chi_hoi ||
                event?.customFields?.["Chi Hội"]?.[0]?.data}
            </div>
            <div className="text-[#6F7071]">Trạng thái vé</div>
            {getTicketStatus()}
          </div>
          <div>
            <p className="text-[#0D0D0D] text-normal font-bold py-2">
              Thông tin người đăng ký
            </p>
            <div className="grid grid-cols-3 gap-4 px-2 py-4 my-4 text-sm border rounded-lg">
              <div className="text-[#6F7071]">Tên</div>
              <div className="col-span-2 ">
                {ticket?.ten_nguoi_dang_ky ||
                  ticket?.registrantName ||
                  ticket?.customFields?.["Tên người đăng ký"]}
              </div>
              <div className="text-[#6F7071]">Số điện thoại</div>
              <div className="col-span-2 ">
                {ticket?.so_dien_thoai ||
                  ticket?.phone ||
                  ticket?.customFields?.["Số điện thoại"]}
              </div>
              <div className="text-[#6F7071]">Email</div>
              <div className="col-span-2 ">
                {ticket?.email ||
                  ticket?.customFields?.["Email"]}
              </div>
              <div className="text-[#6F7071]">Mã vé</div>
              <div className="col-span-2 ">
                {ticket?.ma_ve ||
                  ticket?.ticketCode ||
                  ticket?.customFields?.["Mã vé"] ||
                  "N/A"}
              </div>
              <div className="text-[#6F7071]">Loại vé</div>
              <div className="col-span-2 ">
                {ticket?.hien_thi_loai_ve ||
                  ticket?.ticketType ||
                  ticket?.customFields?.["Loại vé"] ||
                  "N/A" === "Tra_phi" ? "Trả phí" : "Miễn phí"}
              </div>

              {/* Purchase Date - NEW */}
              {ticket?.ngay_mua && (
                <>
                  <div className="text-[#6F7071]">Ngày mua</div>
                  <div className="col-span-2 ">
                    {Helper.formatDateWithDay(ticket.ngay_mua)}
                  </div>
                </>
              )}

              {/* Payment Status - NEW */}
              <div className="text-[#6F7071]">Trạng thái thanh toán</div>
              <div className="col-span-2 ">
                <span className={`px-2 py-1 rounded text-xs ${ticket?.paymentStatus === "Thanh_toan"
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                  }`}>
                  {ticket?.paymentStatus === "Thanh_toan"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </span>
              </div>

              {/* Check-in Status - NEW */}
              <div className="text-[#6F7071]">Trạng thái check-in</div>
              <div className="col-span-2 ">
                <span className={`px-2 py-1 rounded text-xs ${ticket?.checkInStatus === true
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                  }`}>
                  {ticket?.checkInStatus === true ? "Đã check-in" : "Chưa check-in"}
                </span>
              </div>

              {/* Price */}
              {!isTicketFree() && (
                <>
                  <div className="text-[#6F7071]">Giá vé</div>
                  <div className="col-span-2 ">
                    {Helper.formatCurrency(
                      ticket?.gia_ve ||
                      ticket?.price ||
                      ticket?.customFields?.["Giá vé"]
                    )}
                  </div>
                </>
              )}

              {/* Customer Notes - NEW */}
              {ticket?.ghi_chu_khach_hang && (
                <>
                  <div className="text-[#6F7071]">Ghi chú</div>
                  <div className="col-span-2 ">
                    {ticket.ghi_chu_khach_hang}
                  </div>
                </>
              )}
            </div>
          </div>
          <EventSponsors sponsors={sponsors} />

          <div
            onClick={openContact}
            className="flex items-center justify-between p-3 my-4 border rounded-lg"
          >
            <p>
              <Icon icon="zi-chat" size={24} />
              <span className="px-4">Liên hệ với chúng tôi</span>
            </p>
            <Icon icon="zi-chevron-right" />
          </div>
        </div>
      </div>
      {/* ✅ FIXED: Use correct status values and simplified logic */}
      {((ticket?.trang_thai_thanh_toan === "Thanh_toan" ||
        ticket?.paymentStatus === "Thanh_toan" ||
        ticket?.customFields?.["Trạng thái thanh toán"]?.[0] === "Thanh_toan") &&
        (ticket?.trang_thai !== "Da_phat_hanh" ||
          ticket?.status !== "Da_phat_hanh" ||
          ticket?.customFields?.["Trạng thái"]?.[0] !== "Da_phat_hanh")) ||
        !isTicketFree() ? (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <button
            className="w-full py-3 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-200 text-normal"
            onClick={shareTicket}
          >
            Chia sẻ
          </button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <div className="w-1/6 mr-2">
            <button
              className="w-full py-3 font-bold text-black rounded-lg bg-slate-200 disabled:opacity-50 text-normal"
              onClick={goBack}
            >
              Đóng
            </button>
          </div>
          <div className="w-5/6 ml-2">
            <button
              disabled={
                /* ✅ FIXED: Use correct payment status values */
                ticket?.trang_thai_thanh_toan === "Thanh_toan" ||
                ticket?.paymentStatus === "Thanh_toan" ||
                ticket?.customFields?.["Trạng thái thanh toán"]?.[0] === "Thanh_toan" ||
                isTicketFree()
              }
              className="w-full py-3 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-200 text-normal"
              onClick={gotoPayment}
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
    </Page>
  );
};

export default TicketDetailPage;
