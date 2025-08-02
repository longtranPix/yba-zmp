import { useState, useEffect } from "react";
import { Page, useNavigate } from "zmp-ui";
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

const ManageTicketPage = () => {
  const navigate = useNavigate();
  const setRefreshTrigger = useSetRecoilState(refreshTrigger);

  // ===== UPDATED: Use AuthContext for member data only =====
  const { member } = useAuth();

  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const { tabId = 0 } = getRouteParams();
  const [selectTab, setSelectTab] = useState(tabId);

  // Get member ID for filtering tickets
  const memberId = member?.documentId;

  // ===== PAGINATION STATE - Using start/limit format =====
  const [tickets, setTickets] = useState([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState(true);
  const LIMIT = 10;

  // ===== LOAD TICKETS FROM API - Filtered by memberId only =====
  const loadTickets = async (start = 0, isLoadMore = false) => {
    // Only load tickets if user is a member
    if (!memberId) {
      console.log('ManageTicketPage: No member ID available, skipping ticket load');
      setTickets([]);
      setIsLoading(false);
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setTickets([]); // Clear existing tickets for fresh load
    }

    try {
      console.log('ManageTicketPage: Loading tickets for member:', { memberId, start, limit: LIMIT, isLoadMore });

      // Convert start/limit to page/pageSize for the API call
      const page = Math.floor(start / LIMIT) + 1;

      // ✅ UPDATED: Only use memberId, no zaloId for manage tickets
      const response = await APIServices.getMyTicketsPaginated(
        null, // No zaloId for member-only tickets
        memberId, // Only member tickets
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

        console.log('ManageTicketPage: Tickets loaded successfully:', {
          start,
          limit: LIMIT,
          newTicketsCount: newTickets.length,
          hasMore: response.hasMore,
          totalTickets: isLoadMore ? tickets.length + newTickets.length : newTickets.length
        });
      } else {
        console.error('ManageTicketPage: Error loading tickets:', response.message);
        if (!isLoadMore) {
          setTickets([]);
        }
        setHasMoreTickets(false);
      }
    } catch (error) {
      console.error('ManageTicketPage: Exception loading tickets:', error);
      if (!isLoadMore) {
        setTickets([]);
      }
      setHasMoreTickets(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load initial tickets when component mounts or member changes
  useEffect(() => {
    if (memberId) {
      loadTickets(0, false);
    }
  }, [memberId]);

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
    console.log('ManageTicketPage: handleClick called with ticket:', {
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
      console.error('ManageTicketPage: No valid ticket ID found for navigation:', t);
      return;
    }

    // Use GraphQL EventRegistration field names
    // ✅ ENHANCED CHECK-IN LOGIC with better validation
    const isNotCheckedIn = t.da_check_in !== true;
    const isPaid = t.trang_thai_thanh_toan === "Thanh_toan";

    if (isNotCheckedIn && isPaid) {
      console.log('ManageTicketPage: Navigating to check-in for ticket:', ticketId);
      checkin(ticketId);
      return;
    }

    console.log('ManageTicketPage: Navigating to ticket detail for ticket:', ticketId);
    navigate(`/tickets/detail/${ticketId}`);
  };

  const changeTags = (index) => {
    setSelectTab(index);
    // Reset pagination and reload tickets when changing tabs
    setCurrentOffset(0);
    setHasMoreTickets(true);
    if (memberId) {
      loadTickets(0, false);
    }
  };

  const checkin = (id) => {
    navigate(`/tickets/qrcode/${id}`);
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

    console.log('ManageTicketPage: Filtered tickets:', filteredTickets);

    // ✅ FILTER OUT CHILD TICKETS - Only show main tickets in the list
    // Child tickets will be displayed under their parent tickets
    const mainTicketsOnly = filteredTickets.filter((ticket) => {
      // Show ticket if it's a main ticket (ve_chinh = true) OR if it doesn't have a parent (ve_cha is null/undefined)
      const isMainTicket = ticket.ve_chinh === true || ticket.ve_chinh === undefined;
      const hasNoParent = !ticket.ve_cha;
      return isMainTicket || hasNoParent;
    });

    console.log('ManageTicketPage: Main tickets only:', mainTicketsOnly);

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
      console.log('ManageTicketPage: No child tickets found by ve_cha, trying ve_con references...');

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
          console.log('ManageTicketPage: Found full child ticket data:', {
            childRef,
            fullTicket: fullChildTicket
          });
          return fullChildTicket;
        } else {
          console.warn('ManageTicketPage: Could not find full data for child ticket:', childRef);
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

    console.log('ManageTicketPage: Child tickets for main ticket:', {
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

  const shareTicket = async (ticket) => {
    try {
      const ticketId = ticket?.id || ticket?.documentId || ticket?.ticketId;
      const eventId = ticket?.eventId || ticket?.su_kien?.documentId;
      const event = eventMap[eventId];

      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            event?.ten_su_kien || ticket?.eventName || ticket?.ten_su_kien || "Sự kiện YBA",
            100
          ),
          description: `Vé của ${ticket?.ten_nguoi_dang_ky || ticket?.registrantName || "thành viên"}`,
          thumbnail: event?.hinh_anh_su_kien?.url || "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/detail/${ticketId}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

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
              ticket?.eventImage ||
              "https://api.ybahcm.vn/public/yba/yba-01.png")
            }
          />
          <div className="pl-3 flex-1">
            {/* ✅ GROUP TICKET INDICATOR */}
            {hasChildTickets && (
              <div className="flex items-center mb-1">
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
              <span className="px-2">
                {ticket?.eventDate || ticket?.ngay_su_kien
                  ? Helper.formatTime(
                    new Date(ticket.eventDate || ticket.ngay_su_kien).getTime()
                  )
                  : "Chưa có ngày"}
              </span>
            </p>
            <p className="text-xs text-[##6F7071] pt-1 items-center flex">
              <span className="px-2">
                Mã vé: {ticket?.ticketCode || ticket?.ma_ve || "N/A"}
              </span>
            </p>
            <p className="text-xs text-[##6F7071] pt-1 items-center flex">
              <span className="px-2 line-clamp-1">
                {hasChildTickets ? 'Người đại diện: ' : ''}
                {ticket?.registrantName ||
                  ticket?.ten_nguoi_dang_ky ||
                  "Chưa có tên"}
              </span>
            </p>

            {/* Payment status indicator */}
            {ticket?.trang_thai_thanh_toan && (
              <p className="text-xs pt-1 items-center flex">
                <span className={`px-2 ${ticket.trang_thai_thanh_toan === "Thanh_toan" ? "text-green-500" : "text-orange-500"}`}>
                  {ticket.trang_thai_thanh_toan === "Thanh_toan" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </p>
            )}

            {/* Check-in status indicator */}
            {ticket?.da_check_in === true && (
              <p className="text-xs text-green-500 pt-1 items-center flex">
                <span className="px-2">Đã check-in</span>
              </p>
            )}
          </div>
          <div className="ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                shareTicket(ticket);
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
                      const childTicketId = childTicket.id || childTicket.ticketId || childTicket.documentId;
                      if (childTicketId) {
                        shareTicket(childTicket);
                      }
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

      {/* No member message */}
      {!memberId && !isLoading && (
        <div className="flex items-center justify-center h-full -translate-y-8">
          <div className="mx-auto text-center">
            <img
              className="w-24 h-auto block m-auto"
              src="https://api.ybahcm.vn/public/yba/yba-01.png"
            />
            <p className="text-normal text-[#6F7071] my-2 px-16">
              Bạn cần là hội viên để xem vé của mình
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && memberId && getTickets().length == 0 && (
        <div className="flex items-center justify-center h-full -translate-y-8">
          <div className="mx-auto text-center">
            <img
              className="w-24 h-auto block m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
            />
            <p className="text-normal text-[#6F7071] my-2 px-16">
              {selectTab === 0 ? "Bạn chưa có vé nào" :
               selectTab === 1 ? "Không có vé sắp tham gia" :
               "Không có vé đã tham gia"}
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

export default ManageTicketPage;
