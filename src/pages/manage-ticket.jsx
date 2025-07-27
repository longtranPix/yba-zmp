import React, { useState, useEffect } from "react";
import { Icon, Page, useNavigate } from "zmp-ui";
import {
  listTicketState,
  ticketEventState,
  refreshTrigger,
} from "../state";
import Tags from "../components/tags";
import { useRecoilValue, useSetRecoilState } from "recoil";
import Helper from "../utils/helper";
import { useAuth } from "../contexts/AuthContext";
import { getRouteParams, openShareSheet } from "zmp-sdk/apis";
import IconShare from "../components/icons/share-icon";

const ManageTicketPage = () => {
  const navigate = useNavigate();
  const { tabId = 0 } = getRouteParams();
  const [selectTab, setSelectTab] = useState(tabId);
  const setRefreshTrigger = useSetRecoilState(refreshTrigger);

  // ===== NEW: Use AuthContext for user data =====
  const { userInfo, member, userType } = useAuth();

  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const [filter, setFilters] = useState([
    {
      name: "Tất cả",
    },
    {
      name: "Sắp tham gia",
    },
    {
      name: "Đã tham gia",
    },
  ]);

  const changeTags = (index) => {
    setSelectTab(index);
  };

  const listTicket = useRecoilValue(listTicketState);

  // ===== NEW: Tickets are already filtered by AuthContext data in listTicketState =====
  // No need to filter again here since getMyTickets handles the filtering using zaloId and memberId
  const tickets = listTicket || [];

  const handleClick = (ticket) => {
    // Use GraphQL field names with fallback to old structure
    const ticketId = ticket?.id || ticket?.documentId || ticket?.ticketId;
    navigate(`/tickets/detail/${ticketId}`);
  };

  const getTickets = () => {
    if (!tickets) return [];

    let filteredTickets = [];
    if (selectTab == 0) {
      filteredTickets = tickets;
    } else if (selectTab == 1) {
      // Upcoming events (not checked in and event date is in the future)
      let currentTime = new Date().getTime();
      filteredTickets = tickets.filter((v) => {
        // Use GraphQL field names with fallback to customFields
        const eventId = v?.eventId || v?.su_kien?.documentId || v?.customFields?.["Sự kiện"]?.[0]?.id;
        const event = eventMap[eventId];

        // Get event date from GraphQL fields or customFields
        const eventDate = event?.thoi_gian_to_chuc || event?.customFields?.["Thời gian tổ chức"];
        const eventDateTime = eventDate ? new Date(eventDate).getTime() : null;

        // Check if user has checked in using GraphQL fields or customFields
        const isCheckin = v?.da_check_in === true || v?.customFields?.["Check in"] === true;

        return eventDateTime && eventDateTime >= currentTime && !isCheckin;
      });
    } else if (selectTab == 2) {
      // Past events or checked in events
      filteredTickets = tickets.filter((v) => {
        // Use GraphQL field names with fallback to customFields
        const isCheckin = v?.da_check_in === true || v?.customFields?.["Check in"] === true;

        // Also include past events
        const eventId = v?.eventId || v?.su_kien?.documentId || v?.customFields?.["Sự kiện"]?.[0]?.id;
        const event = eventMap[eventId];
        const eventDate = event?.thoi_gian_to_chuc || event?.customFields?.["Thời gian tổ chức"];
        const eventDateTime = eventDate ? new Date(eventDate).getTime() : null;
        const currentTime = new Date().getTime();

        return isCheckin || (eventDateTime && eventDateTime < currentTime);
      });
    }

    console.log('Filtered tickets:', filteredTickets);

    // Sort tickets by createdAt timestamp (newest first)
    // Create a copy of the array before sorting to avoid mutating read-only arrays
    return [...filteredTickets].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Reverse order to show newest first
    });
  };

  // Get unique event IDs from tickets using GraphQL field names with fallback
  const eventIds = [
    ...new Set(
      tickets
        ?.map((ticket) => ticket?.eventId || ticket?.su_kien?.documentId || ticket?.customFields?.["Sự kiện"]?.[0]?.id)
        .filter(Boolean)
    ),
  ];
  const events = eventIds.map((id) => useRecoilValue(ticketEventState(id)));
  const eventMap = Object.fromEntries(
    eventIds.map((id, index) => [id, events[index]])
  );

  const shareTicket = async (eventName, eventPhoto, id) => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(`Vé điện tử sự kiện ${eventName}`, 100),
          description: `Truy cập để xem thông tin chi tiết vé điện tử sự kiện ${eventName}. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            eventPhoto || "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/detail/${id}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Page className="page bg-white safe-page-content">
      <Tags items={filter} onClick={changeTags} active={selectTab} />
      {getTickets().length == 0 && (
        <div className="flex items-center justify-center h-full -translate-y-8">
          <div className="mx-auto text-center">
            <img
              className="w-24 h-auto block m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
            />
            <p className="text-normal text-[#6F7071] my-2 px-16">
              Hiện tại bạn chưa có vé tham dự sự kiện nào
            </p>
          </div>
        </div>
      )}
      {getTickets().map((ticket, i) => {
        // Use GraphQL EventRegistration field names with fallback to customFields
        const eventId = ticket?.eventId || ticket?.su_kien?.documentId || ticket?.customFields?.["Sự kiện"]?.[0]?.id;
        const event = eventMap[eventId];

        return (
          <div
            onClick={() => handleClick(ticket)}
            className="my-4 border px-4 py-3 rounded-lg flex items-center shadow-sm "
            key={i}
          >
            <img
              className="block w-20 h-20 mr-3 object-cover rounded-lg"
              src={
                "https://api.ybahcm.vn/public/yba/yba-01.png" ||
                ticket?.eventImage ||
                event?.hinh_anh?.url ||
                event?.customFields?.["Hình ảnh"]?.[0]?.url
              }
            />
            <div className="pl-3 ">
              <p className="font-bold line-clamp-2 text-sm">
                {ticket?.eventName ||
                  ticket?.ten_su_kien ||
                  event?.ten_su_kien ||
                  event?.customFields?.["Sự kiện"] ||
                  event?.name ||
                  "Chưa có tên sự kiện"}
              </p>
              <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                <Icon icon="zi-clock-1" size={16} />
                <span className="px-2">
                  {ticket?.eventDate || ticket?.ngay_su_kien || event?.thoi_gian_to_chuc
                    ? Helper.formatTime(
                        new Date(ticket.eventDate || ticket.ngay_su_kien || event.thoi_gian_to_chuc).getTime()
                      )
                    : ticket?.customFields?.["Ngày tổ chức"]?.[0]
                    ? Helper.formatTime(
                        new Date(ticket.customFields["Ngày tổ chức"][0]).getTime()
                      )
                    : "Chưa có ngày"}
                </span>
              </p>
              <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                <Icon icon="zi-calendar" size={16} />
                <span className="px-2">
                  Mã vé: {ticket?.ticketCode || ticket?.ma_ve || ticket?.customFields?.["Mã vé"] || "N/A"}
                </span>
              </p>
              <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                <Icon icon="zi-user" size={16} />
                <span className="px-2 line-clamp-1">
                  {ticket?.registrantName ||
                    ticket?.ten_nguoi_dang_ky ||
                    ticket?.customFields?.["Tên người đăng ký"] ||
                    "Chưa có tên"}
                </span>
              </p>

              {/* Additional ticket information using GraphQL fields */}
              {(ticket?.hien_thi_loai_ve || ticket?.customFields?.["Loại vé"]) && (
                <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                  <Icon icon="zi-tag" size={16} />
                  <span className="px-2 line-clamp-1">
                    {ticket.hien_thi_loai_ve || ticket.customFields?.["Loại vé"]}
                  </span>
                </p>
              )}

              {/* Payment status indicator */}
              {(ticket?.trang_thai_thanh_toan || ticket?.customFields?.["Trạng thái thanh toán"]) && (
                <p className="text-xs pt-1 items-center flex">
                  <Icon
                    icon={
                      (ticket.trang_thai_thanh_toan === "Thanh_toan" || ticket.customFields?.["Trạng thái thanh toán"] === "Đã thanh toán")
                        ? "zi-check-circle"
                        : "zi-clock-1"
                    }
                    size={16}
                    className={
                      (ticket.trang_thai_thanh_toan === "Thanh_toan" || ticket.customFields?.["Trạng thái thanh toán"] === "Đã thanh toán")
                        ? "text-green-500"
                        : "text-orange-500"
                    }
                  />
                  <span className={`px-2 ${
                    (ticket.trang_thai_thanh_toan === "Thanh_toan" || ticket.customFields?.["Trạng thái thanh toán"] === "Đã thanh toán")
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}>
                    {(ticket.trang_thai_thanh_toan === "Thanh_toan" || ticket.customFields?.["Trạng thái thanh toán"] === "Đã thanh toán")
                      ? "Đã thanh toán"
                      : "Chưa thanh toán"}
                  </span>
                </p>
              )}
            </div>
            <div className="ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the ticket click
                  shareTicket(
                    ticket?.eventName ||
                      ticket?.ten_su_kien ||
                      event?.ten_su_kien ||
                      event?.customFields?.["Sự kiện"] ||
                      event?.name,
                    ticket?.eventImage ||
                      event?.hinh_anh?.url ||
                      event?.customFields?.["Hình ảnh"]?.[0]?.url,
                    ticket.id || ticket.documentId
                  );
                }}
                className="flex flex-col items-center text-[#999999] text-xs text-center rounded-lg whitespace-nowrap"
              >
                <IconShare />
                <span className="mt-1">Chia sẻ</span>
              </button>
            </div>
          </div>
        );
      })}
    </Page>
  );
};

export default ManageTicketPage;
