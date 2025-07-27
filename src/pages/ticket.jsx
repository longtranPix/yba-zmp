import React, { useState, useEffect } from "react";
import { Icon, Page, useNavigate } from "zmp-ui";
import {
  listTicketState,
  ticketEventState,
  refreshTrigger,
} from "../state";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Helper from "../utils/helper";
import Tags from "../components/tags";
import { getRouteParams, openShareSheet } from "zmp-sdk/apis";
import IconShare from "../components/icons/share-icon";
import { useAuth } from "../contexts/AuthContext";
import { getImageProps } from "../utils/imageHelper";

const TicketPage = () => {
  const navigate = useNavigate();
  const setRefreshTrigger = useSetRecoilState(refreshTrigger);

  // ===== NEW: Use AuthContext for user data =====
  const { userInfo, member, userType, isMember } = useAuth();

  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const { tabId = 0 } = getRouteParams();
  const [selectTab, setSelectTab] = useState(tabId);
  const listTicket = useRecoilValue(listTicketState);

  // Tickets are already filtered by member ID or Zalo ID in the API via AuthContext data
  // No need to filter again here since getMyTickets handles the filtering
  const tickets = listTicket || [];

  // Get user identifiers from AuthContext
  const zaloId = userInfo?.id;
  const memberId = member?.documentId;

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

  const handleClick = (t) => {
    console.log('handleClick called with ticket:', {
      id: t.id || t.ticketId || t.documentId,
      ma_ve: t.ma_ve || t.ticketCode,
      ten_nguoi_dang_ky: t.ten_nguoi_dang_ky || t.registrantName,
      da_check_in: t.da_check_in,
      trang_thai_thanh_toan: t.trang_thai_thanh_toan,
      ve_chinh: t.ve_chinh,
      isChildTicket: t.ve_chinh === false,
      hasParent: !!(t.ve_cha)
    });

    // ✅ ENHANCED ID RESOLUTION for child tickets
    const ticketId = t.id || t.ticketId || t.documentId;

    if (!ticketId) {
      console.error('No valid ticket ID found for navigation:', t);
      return;
    }

    // Use GraphQL EventRegistration field names
    // ✅ ENHANCED CHECK-IN LOGIC with better validation
    const isNotCheckedIn = t.da_check_in !== true;
    const isPaid = t.trang_thai_thanh_toan === "Thanh_toan";

    if (isNotCheckedIn && isPaid) {
      console.log('Navigating to check-in for ticket:', ticketId);
      checkin(ticketId);
      return;
    }

    console.log('Navigating to ticket detail for ticket:', ticketId);
    navigate(`/tickets/detail/${ticketId}`);
  };

  const changeTags = (index) => {
    setSelectTab(index);
  };

  const checkin = (id) => {
    navigate(`/tickets/qrcode/${id}`);
  };

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

  const getTickets = () => {
    if (!tickets) return [];

    let filteredTickets = [];
    if (selectTab == 0) {
      filteredTickets = tickets;
    } else if (selectTab == 1) {
      // Upcoming events (not checked in and event date is in the future)
      let currentTime = new Date().getTime();
      filteredTickets = tickets.filter((v) => {
        // Use GraphQL EventRegistration field names
        const eventDate = v.eventDate || v.ngay_su_kien;
        const eventTime = eventDate ? new Date(eventDate).getTime() : null;
        const isCheckedIn = v.isCheckedIn || v.da_check_in === true;
        return eventTime && eventTime >= currentTime && !isCheckedIn;
      });
    } else if (selectTab == 2) {
      // Attended events (checked in)
      filteredTickets = tickets.filter((v) => {
        // Use GraphQL EventRegistration field names
        const isCheckedIn = v.isCheckedIn || v.da_check_in === true;
        return isCheckedIn;
      });
    }

    console.log('Filtered tickets:', filteredTickets);

    // ✅ FILTER OUT CHILD TICKETS - Only show main tickets in the list
    // Child tickets will be displayed under their parent tickets
    const mainTicketsOnly = filteredTickets.filter((ticket) => {
      // Show ticket if it's a main ticket (ve_chinh = true) OR if it doesn't have a parent (ve_cha is null/undefined)
      const isMainTicket = ticket.ve_chinh === true || ticket.ve_chinh === undefined;
      const hasNoParent = !ticket.ve_cha;
      return isMainTicket || hasNoParent;
    });

    console.log('Main tickets only:', mainTicketsOnly);

    // Sort tickets by createdAt timestamp (newest first)
    // Create a copy of the array before sorting to avoid mutating read-only arrays
    return [...mainTicketsOnly].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Reverse order to show newest first
    });
  };

  // ✅ GET CHILD TICKETS for a specific main ticket with full data
  const getChildTickets = (mainTicket) => {
    if (!tickets || !mainTicket) return [];

    const mainTicketId = mainTicket.id || mainTicket.documentId;
    let childTickets = [];

    // ✅ ALWAYS FIND FULL CHILD TICKET DATA from tickets array
    // This ensures we get complete ticket objects with all properties needed for handleClick
    childTickets = tickets.filter((ticket) => {
      const parentId = ticket.ve_cha?.documentId || ticket.ve_cha;
      return parentId === mainTicketId && ticket.ve_chinh === false;
    });

    // ✅ FALLBACK: If no child tickets found by ve_cha, try using ve_con references
    if (childTickets.length === 0 && mainTicket.ve_con && mainTicket.ve_con.length > 0) {
      console.log('No child tickets found by ve_cha, trying ve_con references...');

      // Map ve_con references to full ticket objects
      childTickets = mainTicket.ve_con.map((childRef) => {
        // Find the full ticket object by matching documentId or ma_ve
        const childId = childRef.documentId || childRef.id;
        const childCode = childRef.ma_ve;

        const fullChildTicket = tickets.find((ticket) => {
          return (
            (ticket.id === childId || ticket.documentId === childId) ||
            (childCode && (ticket.ma_ve === childCode || ticket.ticketCode === childCode))
          );
        });

        if (fullChildTicket) {
          console.log('Found full child ticket data:', {
            childRef,
            fullTicket: fullChildTicket
          });
          return fullChildTicket;
        } else {
          console.warn('Could not find full data for child ticket:', childRef);
          // ✅ ENHANCE CHILD REFERENCE with missing properties for handleClick compatibility
          return {
            ...childRef,
            id: childRef.documentId || childRef.id,
            ticketId: childRef.documentId || childRef.id,
            // Add default values for handleClick function
            da_check_in: false,
            trang_thai_thanh_toan: "Chua_thanh_toan",
            ve_chinh: false,
            ve_cha: { documentId: mainTicketId },
            // Copy event info from main ticket
            eventId: mainTicket.eventId,
            su_kien: mainTicket.su_kien,
            eventName: mainTicket.eventName,
            ten_su_kien: mainTicket.ten_su_kien,
            eventDate: mainTicket.eventDate,
            ngay_su_kien: mainTicket.ngay_su_kien
          };
        }
      }).filter(Boolean); // Remove any null/undefined entries
    }

    console.log('Child tickets for main ticket:', {
      mainTicketId,
      childCount: childTickets.length,
      childTickets: childTickets.map(ct => ({
        id: ct.id || ct.documentId,
        ma_ve: ct.ma_ve,
        ten_nguoi_dang_ky: ct.ten_nguoi_dang_ky,
        hasFullData: !!(ct.trang_thai_thanh_toan && ct.da_check_in !== undefined)
      }))
    });

    return childTickets;
  };

  // Extract event IDs from tickets using GraphQL field names
  const eventIds = [
    ...new Set(
      tickets
        ?.map((ticket) => ticket?.eventId || ticket?.su_kien?.documentId)
        .filter(Boolean)
    ),
  ];
  const events = eventIds.map((id) => useRecoilValue(ticketEventState(id)));
  const eventMap = Object.fromEntries(
    eventIds.map((id, index) => [id, events[index]])
  );

  return (
    <Page className="page bg-white safe-page-content">
      {tickets && tickets.length > 0 && (
        <Tags items={filter} onClick={changeTags} active={selectTab} />
      )}
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
      {getTickets() &&
        getTickets().map((ticket, i) => {
          // Use GraphQL EventRegistration field names
          const eventId = ticket?.eventId || ticket?.su_kien?.documentId;
          const event = eventMap[eventId];
          const childTickets = getChildTickets(ticket);
          const hasChildTickets = childTickets && childTickets.length > 0;

          return (
            <div key={i} className="my-4">
              {/* ✅ MAIN TICKET - Full size display */}
              <div
                onClick={() => handleClick(ticket)}
                className={`border px-4 py-3 rounded-lg flex items-center shadow-sm ${hasChildTickets ? 'border-b-0 rounded-b-none bg-blue-50' : ''
                  }`}
              >
                <img
                  className="block w-20 h-20 mr-3 object-cover rounded-lg"
                  {
                  ...getImageProps(event?.hinh_anh?.url ||
                    ticket?.eventImage ||
                    "https://api.ybahcm.vn/public/yba/yba-01.png")
                  }
                />
                <div className="pl-3 flex-1">
                  {/* ✅ GROUP TICKET INDICATOR */}
                  {hasChildTickets && (
                    <div className="flex items-center mb-1">
                      <Icon icon="zi-user-group" size={14} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium ml-1">
                        Vé nhóm ({childTickets.length + 1} người)
                      </span>
                    </div>
                  )}

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
                      {ticket?.eventDate || ticket?.ngay_su_kien
                        ? Helper.formatTime(
                          new Date(ticket.eventDate || ticket.ngay_su_kien).getTime()
                        )
                        : "Chưa có ngày"}
                    </span>
                  </p>
                  <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                    <Icon icon="zi-calendar" size={16} />
                    <span className="px-2">
                      Mã vé: {ticket?.ticketCode || ticket?.ma_ve || "N/A"}
                    </span>
                  </p>
                  <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                    <Icon icon="zi-user" size={16} />
                    <span className="px-2 line-clamp-1">
                      {hasChildTickets ? 'Người đại diện: ' : ''}
                      {ticket?.registrantName ||
                        ticket?.ten_nguoi_dang_ky ||
                        "Chưa có tên"}
                    </span>
                  </p>

                  {/* Additional ticket information using GraphQL fields */}
                  {ticket?.hien_thi_loai_ve && (
                    <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                      <Icon icon="zi-tag" size={16} />
                      <span className="px-2 line-clamp-1">
                        {ticket.hien_thi_loai_ve}
                      </span>
                    </p>
                  )}

                  {/* Payment status indicator */}
                  {ticket?.trang_thai_thanh_toan && (
                    <p className="text-xs pt-1 items-center flex">
                      <Icon
                        icon={ticket.trang_thai_thanh_toan === "Thanh_toan" ? "zi-check-circle" : "zi-clock-1"}
                        size={16}
                        className={ticket.trang_thai_thanh_toan === "Thanh_toan" ? "text-green-500" : "text-orange-500"}
                      />
                      <span className={`px-2 ${ticket.trang_thai_thanh_toan === "Thanh_toan" ? "text-green-500" : "text-orange-500"}`}>
                        {ticket.trang_thai_thanh_toan === "Thanh_toan" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </p>
                  )}

                  {/* Check-in status indicator */}
                  {ticket?.da_check_in === true && (
                    <p className="text-xs text-green-500 pt-1 items-center flex">
                      <Icon icon="zi-check-circle" size={16} />
                      <span className="px-2">Đã check-in</span>
                    </p>
                  )}
                </div>
                <div className="ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareTicket(
                        ticket?.eventName ||
                        ticket?.ten_su_kien ||
                        event?.ten_su_kien ||
                        event?.customFields?.["Sự kiện"] ||
                        event?.name,
                        ticket?.eventImage ||
                        event?.hinh_anh?.url ||
                        // event?.customFields?.["Hình ảnh"]?.[0]?.url,
                        ticket.id || ticket.ticketId
                      );
                    }}
                    className="flex flex-col items-center text-[#999999] text-xs text-center rounded-lg whitespace-nowrap"
                  >
                    <IconShare />
                    <span className="mt-1">Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* ✅ CHILD TICKETS - Smaller display under main ticket */}
              {hasChildTickets && (
                <div className="border border-t-0 rounded-b-lg bg-gray-50">
                  {childTickets.map((childTicket, childIndex) => (
                    <div
                      key={`child-${childIndex}`}
                      onClick={() => handleClick(childTicket)}
                      className={`px-4 py-2 flex items-center hover:bg-gray-100 ${childIndex < childTickets.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                    >
                      <div className="w-4 h-4 mr-3 flex items-center justify-center">
                        <Icon icon="zi-user" size={12} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {childTicket?.ten_nguoi_dang_ky ||
                            childTicket?.registrantName ||
                            `Thành viên ${childIndex + 1}`}
                        </p>
                        <div className="flex items-center space-x-4">
                          <p className="text-xs text-gray-500">
                            Mã vé: {childTicket?.ma_ve || childTicket?.ticketCode || "N/A"}
                          </p>
                          {childTicket?.so_dien_thoai && (
                            <p className="text-xs text-gray-500">
                              {childTicket.so_dien_thoai}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            // ✅ ENHANCED ID RESOLUTION for child ticket sharing
                            const childTicketId = childTicket.id || childTicket.ticketId || childTicket.documentId;

                            console.log('Sharing child ticket:', {
                              childTicketId,
                              childTicket,
                              eventName: ticket?.eventName || ticket?.ten_su_kien || event?.ten_su_kien
                            });

                            if (!childTicketId) {
                              console.error('No valid child ticket ID for sharing:', childTicket);
                              return;
                            }

                            shareTicket(
                              ticket?.eventName ||
                              ticket?.ten_su_kien ||
                              event?.ten_su_kien ||
                              event?.name,
                              ticket?.eventImage ||
                              event?.hinh_anh?.url,
                              childTicketId
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <IconShare size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </Page>
  );
};

export default TicketPage;
