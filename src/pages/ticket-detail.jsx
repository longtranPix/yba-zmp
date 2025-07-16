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

const TicketDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
        let ticketResponse = await APIService.getTicketInfo(id);
        console.log(ticketResponse);
        if (ticketResponse.data) {
          setTicket(ticketResponse.data);
          // if (
          //   ticketResponse.data.customFields?.["Trạng thái"]?.[0] ==
          //   "Đã Phát Hành"
          // ) {
          //   navigate(`/tickets/views/${ticketResponse.data.id}`);
          // }
          const eventId =
            ticketResponse.data.customFields?.["Sự kiện"]?.[0]?.id;
          if (eventId) {
            let response = await APIService.getEventInfo(eventId);
            if (response.data) {
              setEvent(response.data);
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
    if (event?.customFields?.["Nội Dung Sự Kiện"]?.html) {
      setShowViewMoreButton(
        event.customFields["Nội Dung Sự Kiện"].html.length >= 100
      );
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
    let userInfo = await APIService.getAuthInfo();
    await APIService.sendEventContact(
      userInfo?.zaloIDByOA,
      event.id,
      event.customFields["Sự kiện"]
    );
    let oaId = configs?.oaInfo?.id || 0;
    if (oaId > 0) {
      ZaloService.openOfficialAccount(oaId);
    }
  };

  const getTicketStatus = () => {
    let ticketStatus = ticket?.customFields?.["Trạng thái"]?.[0] || "";
    switch (ticketStatus) {
      case "Vé mới":
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-2 py-1.5 rounded-lg">
              Đang xử lý
            </span>
          </div>
        );
      case "Đã Hủy":
        return (
          <div className="col-span-2 mt-1">
            <span className="text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-2 py-1.5 rounded-lg">
              Đã hủy
            </span>
          </div>
        );
      case "Đã Phát Hành":
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
              {ticketStatus || "Đang xử lý"}
            </span>
          </div>
        );
    }
  };

  const gotoPayment = async () => {
    try {
      let res = await APIService.getVietQR({
        code: ticket.customFields["Mã thanh toán"],
        salePrice: ticket.customFields["Giá vé"],
        "Ngân hàng": event.customFields["Ngân hàng"]?.[0]?.data || "",
        "Tk Ngân Hàng": event.customFields["Tk Ngân Hàng"] || "",
        "Tên Tk Ngân Hàng": event.customFields["Tên Tk Ngân Hàng"] || "",
      });

      setVietQr({
        url: res.data.qr,
        bankInfo: {
          accountNumber: event.customFields["Tk Ngân Hàng"] || "",
          accountName: event.customFields["Tên Tk Ngân Hàng"] || "",
          bankName: event.customFields["Ngân hàng"]?.[0]?.data || "",
          bankInfo: event.customFields["Ngân hàng"]?.[0] || null,
        },
      });

      navigate(`/payment?ticketId=${ticket.id}&eventId=${ticket?.event?.id}`);
    } catch (error) {
      console.error("Error getting VietQR:", error);
      Helper.showAlert("Không thể tạo mã thanh toán. Vui lòng thử lại sau.");
    }
  };

  const shareLink = `tickets/detail/${ticket?.id}`;

  const shareTicket = async () => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${
              event?.customFields["Sự kiện"] || event?.name
            }`,
            100
          ),
          description: `Truy cập để xem thông tin chi tiết vé điện tử sự kiện ${
            event?.customFields["Sự kiện"] || event?.name
          }. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            event?.customFields["Hình ảnh"]?.[0]?.url ||
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
    return ticket?.customFields?.["Loại vé"] === "Miễn Phí";
  };

  return (
    <Page className="bg-white page safe-page-content">
      {ticket?.customFields["Trạng thái"]?.[0] === "Đã Phát Hành" && (
        <div>
          <div className="flex flex-col items-center w-full m-auto mb-2">
            <QRCode value={ticket?.id + ""} size={200} className="m-auto " />
          </div>
          <p className="w-full p-2 text-sm text-center">
            Quét QR để checkin sự kiện
          </p>
        </div>
      )}
      <img
        className="block w-full rounded-lg"
        src={`${
          event?.customFields?.["Hình ảnh"]?.[0].url ||
          "https://api.ybahcm.vn/public/yba/yba-01.png"
        }`}
      />
      <div className="py-4">
        <p className="text-lg font-bold">
          {event?.customFields?.["Sự kiện"] || ""}
        </p>
        {ticket?.paymentStatus !== "Đã Thanh Toán" && (
          <div className="py-2 text-gray-700 text-normal">
            <div
              className={`${showFullDescription ? "" : "line-clamp-3"}`}
              dangerouslySetInnerHTML={{
                __html:
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
        
        {event?.customFields?.["Trạng thái"]?.[0] === "Kết thúc" &&
            ticket?.customFields["Check in"] === true &&
            ticket?.customFields["Đánh giá"] === null && (
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
        {ticket?.paymentStatus !== "Đã Thanh Toán" &&
          !isTicketFree() &&
          ticket?.ticketPrice > 0 && (
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
                event?.customFields?.["Thời gian tổ chức"]
              )}
            </div>
            <div className="text-[#6F7071]">Thời gian</div>
            <div className="col-span-2 ">
              {Helper.formatTimeOnly(
                event?.customFields?.["Thời gian tổ chức"]
              )}
            </div>
            <div className="text-[#6F7071]">Địa điểm</div>
            <div className="col-span-2 ">
              {event?.customFields?.["Địa điểm"]}
            </div>
            <div className="text-[#6F7071]">Đơn vị tổ chức</div>
            <div className="col-span-2 ">
              {event?.customFields?.["Chi Hội"]?.[0]?.data}
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
                {ticket?.customFields?.["Tên người đăng ký"]}
              </div>
              <div className="text-[#6F7071]">Số điện thoại</div>
              <div className="col-span-2 ">
                {ticket?.customFields?.["Số điện thoại"]}
              </div>
              <div className="text-[#6F7071]">Email</div>
              <div className="col-span-2 ">
                {ticket?.customFields?.["Email"]}
              </div>
              <div className="text-[#6F7071]">Mã vé</div>
              <div className="col-span-2 ">
                {ticket?.customFields?.["Mã vé"] || "N/A"}
              </div>
              <div className="text-[#6F7071]">Loại vé</div>
              <div className="col-span-2 ">
                {ticket?.customFields?.["Loại vé"]}
              </div>
              {isTicketFree() ? null : (
                <div className="text-[#6F7071]">Giá vé</div>
              )}
              {isTicketFree() ? null : (
                <div className="col-span-2 ">
                  {Helper.formatCurrency(ticket?.customFields?.["Giá vé"])}
                </div>
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
      {(ticket?.customFields["Trạng thái thanh toán"]?.[0] === "Thanh toán" &&
        ticket?.customFields["Trạng thái"]?.[0] !== "Đã Phát Hành") ||
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
                ticket?.customFields["Trạng thái thanh toán"]?.[0] ===
                  "Thanh Toán" || isTicketFree()
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
