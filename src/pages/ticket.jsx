import { useState, useEffect } from "react";
import { Icon, Page, useNavigate } from "zmp-ui";
import {
  refreshTrigger,
} from "../state";
import { useSetRecoilState } from "recoil";
import Helper from "../utils/helper";
import Tags from "../components/tags";
import { getRouteParams, openShareSheet } from "zmp-sdk/apis";
import IconShare from "../components/icons/share-icon";
import { useAuth } from "../contexts/AuthContext";
import { getImageProps } from "../utils/imageHelper";
import APIServices from "../services/api-service";

const TicketPage = () => {
  const navigate = useNavigate();
  const setRefreshTrigger = useSetRecoilState(refreshTrigger);

  // ===== NEW: Use AuthContext for user data =====
  const { userInfo, member } = useAuth();

  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const { tabId = 0 } = getRouteParams();
  const [selectTab, setSelectTab] = useState(tabId);

  // Get user identifiers from AuthContext
  const zaloId = userInfo?.id;
  const memberId = member?.documentId;

  // ===== PAGINATION STATE - Using start/limit format =====
  const [tickets, setTickets] = useState([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState(true);
  const LIMIT = 10;

  // ===== LOAD TICKETS FROM API - Using start/limit format =====
  const loadTickets = async (start = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setTickets([]); // Clear existing tickets for fresh load
    }

    try {
      console.log('Loading tickets:', { start, limit: LIMIT, isLoadMore, zaloId, memberId });

      // Convert start/limit to page/pageSize for the API call
      const page = Math.floor(start / LIMIT) + 1;
      const response = await APIServices.getMyTicketsPaginated(
        zaloId,
        memberId,
        page,
        LIMIT
      );

      if (response.error === 0) {
        const newTickets = response.data || [];

        if (isLoadMore) {
          // Append new tickets to existing ones
          setTickets(prevTickets => [...prevTickets, ...newTickets]);
        } else {
          // Replace tickets for fresh load
          setTickets(newTickets);
        }

        setCurrentOffset(start + LIMIT);
        setHasMoreTickets(response.hasMore);

        console.log('Tickets loaded successfully:', {
          start,
          limit: LIMIT,
          newTicketsCount: newTickets.length,
          hasMore: response.hasMore,
          totalTickets: isLoadMore ? tickets.length + newTickets.length : newTickets.length
        });
      } else {
        console.error('Error loading tickets:', response.message);
        if (!isLoadMore) {
          setTickets([]);
        }
        setHasMoreTickets(false);
      }
    } catch (error) {
      console.error('Exception loading tickets:', error);
      if (!isLoadMore) {
        setTickets([]);
      }
      setHasMoreTickets(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load initial tickets when component mounts or user changes
  useEffect(() => {
    if (zaloId || memberId) {
      loadTickets(0, false);
    }
  }, [zaloId, memberId]);

  // Load more tickets function
  const loadMoreTickets = () => {
    if (!isLoadingMore && hasMoreTickets) {
      loadTickets(currentOffset, true);
    }
  };

  const [filter] = useState([
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
    // Reset pagination and reload tickets when changing tabs
    setCurrentOffset(0);
    setHasMoreTickets(true);
    if (zaloId || memberId) {
      loadTickets(0, false);
    }
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

  // ✅ FIX: Simplified approach - don't load external event data to avoid hooks issues
  // Use event data that's already available in the ticket object itself

  // ✅ FIX: Create a helper function that doesn't use hooks
  const renderTicketItem = (ticket, index) => {
    const childTickets = getChildTickets(ticket);
    const hasChildTickets = childTickets && childTickets.length > 0;

    return (
      <div key={index} className="my-4">
        {/* ✅ MAIN TICKET - Full size display */}
        <div
          onClick={() => handleClick(ticket)}
          className={`border px-4 py-3 rounded-lg flex items-center shadow-sm ${hasChildTickets ? 'border-b-0 rounded-b-none bg-blue-50' : ''
            }`}
        >
          <img
            className="block w-20 h-20 mr-3 object-cover rounded-lg"
            {
            ...getImageProps(
              ticket?.su_kien?.hinh_anh?.url ||
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
                  "Sự kiện YBA",
                  ticket?.eventImage ||
                  "https://api.ybahcm.vn/public/yba/yba-01.png",
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
                        eventName: ticket?.eventName || ticket?.ten_su_kien || "Sự kiện YBA"
                      });

                      if (!childTicketId) {
                        console.error('No valid child ticket ID for sharing:', childTicket);
                        return;
                      }

                      shareTicket(
                        ticket?.eventName ||
                        ticket?.ten_su_kien ||
                        "Sự kiện YBA",
                        ticket?.eventImage ||
                        "https://api.ybahcm.vn/public/yba/yba-01.png",
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
  };

  return (
    <Page className="page bg-white safe-page-content">
      {tickets && tickets.length > 0 && (
        <Tags items={filter} onClick={changeTags} active={selectTab} />
      )}

      {/* Loading state for initial load */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải vé...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && getTickets().length == 0 && (
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
      {/* ✅ RENDER TICKETS using the helper function to avoid hooks in loops */}
      {getTickets() &&
        getTickets().map((ticket, i) => renderTicketItem(ticket, i))}


      {/* Load More Button */}
      {!isLoading && getTickets().length > 0 && hasMoreTickets && (
        <div className="pb-10 mt-5">
          <button
            onClick={loadMoreTickets}
            disabled={isLoadingMore}
            className="block h-10 px-6 mx-auto font-bold text-white rounded-lg bg-blue-custom text-normal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang tải...
              </div>
            ) : (
              'Xem thêm'
            )}
          </button>
        </div>
      )}
    </Page>
  );
};

export default TicketPage;
