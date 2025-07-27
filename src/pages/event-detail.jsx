import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate, Box, Modal } from "zmp-ui";
import {
  eventInfoState,
  configState,
  listTicketOfEventState,
  listTicketState,
  eventRefreshTrigger,
} from "../state";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useParams } from "react-router-dom";
import Helper from "../utils/helper";
import APIService from "../services/api-service";
import ZaloService from "../services/zalo-service";
import { getEventImageUrl, getImageProps } from "../utils/imageHelper";
import { openShareSheet } from "zmp-sdk/apis";
import EventSponsors from "../components/event-sponsor";
import IWarningIcon from "../components/icons/i-warning-icon";
import CountdownTimer from "../components/CountdownTimer";
import { useAuth } from "../contexts/AuthContext";
import { useAuthGuard } from "../hooks/useAuthGuard";

const EventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This is now documentId from the URL

  // ✅ OPTIMIZED: Use lazy authentication - only request permissions when needed
  const {
    isAuthenticated,
    userInfo, // This is zaloProfile
    member, // This is memberInfo
    isMember,
    userType,
    activateGuestAuthentication,
    isLoading: authLoading
  } = useAuth();

  const {
    navigateWithAuth,
    canAccessFeature
  } = useAuthGuard();

  // Add validation for event ID
  if (!id) {
    console.error('EventDetailPage: No event ID provided in URL params');
    navigate('/');
    return null;
  }

  const event = useRecoilValue(eventInfoState(id)); // Use Recoil state with documentId
  const tickets = useRecoilValue(listTicketOfEventState(id));
  const listTicket = useRecoilValue(listTicketState);

  // ===== FIXED: Use AuthContext member data for ticket filtering =====
  const myTickets = (listTicket && Array.isArray(listTicket))
    ? listTicket.filter((t) => {
      // Check if ticket belongs to this event using GraphQL field names
      const ticketEventId = t?.eventId || t?.su_kien?.documentId || t?.customFields?.["Sự kiện"]?.[0]?.documentId;

      // Check if ticket belongs to current user
      const ticketMemberId = t?.hoi_vien?.documentId;
      const currentMemberId = member?.documentId;

      // Match by event and user (either member ID or Zalo ID)
      const belongsToEvent = ticketEventId === id;
      const belongsToUser = ticketMemberId && ticketMemberId === currentMemberId;
      console.log('check ticket: ', belongsToEvent, belongsToUser, member);

      return belongsToEvent && belongsToUser;
    })
    : [];

  // Early return if event is not loaded yet
  if (!event) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Đang tải thông tin sự kiện...</p>
          <p className="text-sm text-gray-500 mt-2">Event ID: {id}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Quay về trang chủ
          </button>
        </div>
      </Page>
    );
  }

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showViewButton, setShowViewMoreButton] = useState(true);
  const [alreadyBuyPopup, setAlreadyBuyPopup] = useState(false);
  const [nonMemberPopup, setNonMemberPopup] = useState(false);
  const [inActiveMember, setInActiveMember] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const configs = useRecoilValue(configState);
  const [ticketCounts, setTicketCounts] = useState({});
  const refreshEvent = useSetRecoilState(eventRefreshTrigger);


  // ===== NEW: useEffect to check authentication when accessing event detail =====
  // useEffect(() => {
  //   const checkAuthenticationForEventDetail = async () => {
  //     console.log("EventDetail: Checking authentication for event detail access");

  //     // Check if user is authenticated
  //     try {
  //       if (authLoading) {
  //         console.log("EventDetail: Authentication still loading, waiting...");
  //         return;
  //       }

  //       if (!isAuthenticated) {
  //         console.log("EventDetail: User not authenticated, activating guest authentication");

  //         // Use the AuthContext function to activate guest authentication
  //         const result = await activateGuestAuthentication();

  //         if (result.success) {
  //           console.log("EventDetail: Guest authentication activated successfully:", {
  //             userType: result.userType,
  //             zaloId: result.zaloId
  //           });
  //         } else {
  //           console.log("EventDetail: Failed to activate guest authentication:", result.error);
  //           navigate(-1)
  //         }
  //       } else {
  //         console.log("EventDetail: User already authenticated as:", userType);
  //       }

  //     } catch (error) {

  //     }
  //   }
  //   checkAuthenticationForEventDetail();

  //   // const initPage = async () => {
  //   //   // Check authentication first when user clicks to event detail
  //   //   await checkAuthenticationForEventDetail();

  //   //   // Then refresh page data
  //   //   refreshEvent((prev) => prev + 1);
  //   //   // ===== FIXED: AuthContext automatically handles user info refresh =====
  //   // };

  //   // initPage();
  // }, [id, isAuthenticated, userType, activateGuestAuthentication]);

  // ===== FIXED: Remove Recoil refresh triggers, AuthContext handles this automatically =====

  // Add effect to handle navigation back from register-member and ensure proper event loading
  // useEffect(() => {
  //   // Log for debugging
  //   console.log('EventDetailPage: Event ID from params:', id);
  //   console.log('EventDetailPage: Event loaded:', !!event);
  //   console.log('EventDetailPage: Event documentId:', event?.documentId);

  //   // If we have an ID but no event, the state might need refreshing
  //   if (id && !event) {
  //     console.log('EventDetailPage: Event not loaded, state may need refresh');
  //     // Trigger a refresh of the event state
  //     refreshEvent((prev) => prev + 1);
  //   }

  //   // Validate that the event ID matches the URL parameter
  //   if (event && event.documentId !== id) {
  //     console.warn('EventDetailPage: Event documentId mismatch with URL param', {
  //       urlParam: id,
  //       eventDocumentId: event.documentId
  //     });
  //   }
  // }, [id, event, refreshEvent]);

  const isComboTicket = (ticket) => {
    return ticket?.ve_nhom === true;
  };

  const getComboText = (ticket) => {
    if (isComboTicket(ticket)) {
      // Note: Combo ticket details need to be added to GraphQL schema
      // For now, return a generic message
      return "Vé nhóm";
    }
    return null;
  };

  const totalSoldTickets =
    listTicket?.reduce(
      (sum, ticket) =>
        sum +
        (ticket.customFields?.["Trạng thái thanh toán"]?.[0] === "Thanh toán" &&
          ticket.customFields?.["Trạng thái"]?.[0] === "Đã Phát Hành" &&
          ticket.customFields?.["Sự kiện"]?.[0]?.documentId === id
          ? 1
          : 0),
      0
    ) || 0;

  const maxEventTickets = event?.so_ve_toi_da || 0;

  const getEventStatusDisplay = (event, tickets) => {
    const currentTime = new Date().getTime();
    // Note: End registration date field needs to be added to GraphQL schema
    const eventEndRegistration = new Date(
      event.thoi_gian_to_chuc // Using event time as fallback
    ).getTime();

    const totalRemainingTickets = tickets.reduce(
      (sum, ticket) => sum + (ticket.so_luong_ve_phat_hanh || 0),
      0
    );
    const hasAvailableTickets = totalRemainingTickets > 0;

    if (totalSoldTickets >= maxEventTickets) {
      return {
        message: "Đã hết vé",
        showTimer: false,
      };
    }

    if (!hasAvailableTickets) {
      return {
        message: "Đã hết vé",
        showTimer: false,
      };
    }

    if (currentTime > eventEndRegistration) {
      return {
        message: "Đã hết thời gian mua vé",
        showTimer: false,
      };
    }

    return {
      message: null,
      showTimer: true,
    };
  };

  const getTicketButtonText = (
    isTicketAvailable,
    currentTime,
    ticketEndTime,
    remainingTickets
  ) => {
    if (remainingTickets === 0) {
      return "Đã hết vé";
    }
    if (currentTime > ticketEndTime) {
      return "Đã hết hạn";
    }
    if (!isTicketAvailable) {
      return "Chưa mở bán";
    }
    return "Đăng ký";
  };

  // Event data is now loaded via Recoil state (eventInfoState) using documentId

  useEffect(() => {
    if (!event) return;
    var load = async () => {
      let res = await APIService.getSponsorsOfEvents(event.documentId);
      if (res.data) {
        let sorted = Helper.sortEventSponsers(res.data.sponsors);
        console.log('EventDetailPage: Sorted sponsors:', sorted);
        setSponsors(sorted);
      }
    };
    const content = event?.noi_dung_su_kien || "";
    if (content.length < 300) {
      setShowViewMoreButton(false);
    }
    load();
  }, [event]);

  useEffect(() => {
    const initialCounts = {};
    tickets.forEach((ticket) => {
      if (isComboTicket(ticket)) {
        initialCounts[ticket.documentId] = 1; // Default to 1 for group tickets
      }
    });
    setTicketCounts(initialCounts);
  }, [tickets]);


  const goBack = () => {
    navigate(-1);
  };

  const isMemberOfEventOrg = (profile, event) => {
    // Member organization checking will need to be implemented when relationships are available
    // For now, return false
    return false;
  };

  const register = async (ticket) => {
    console.log("register", ticket);

    if (totalSoldTickets >= maxEventTickets) {
      return;
    }

    // ✅ REFACTORED: Check authentication BEFORE navigating to registration screen
    try {
      // For member-only tickets, require member authentication
      const requireMember = ticket.chi_danh_cho_hoi_vien === true;

      console.log('EventDetail: Checking authentication before navigation', {
        requireMember,
        ticketType: ticket.ten_hien_thi_ve
      });

      // Check if user can access registration with current auth status
      const accessCheck = canAccessFeature({
        requireAuth: true,
        requireMember
      });

      // If already authenticated and authorized, navigate directly
      if (accessCheck.canAccess) {
        // Check member status if this is a member-only ticket and user is member
        if (requireMember && member) {
          const memberStatus = member.trang_thai_hoi_vien;
          const accountStatus = member.trang_thai;

          if (memberStatus === "Ngung_hoat_dong" || accountStatus === "Khoa_tai_khoan") {
            setInActiveMember(true);
            return;
          }
        }

        // Navigate directly if already authenticated
        const eventId = event?.documentId || id;
        if (!eventId) {
          console.error('EventDetailPage: No valid event ID for registration');
          return;
        }

        console.log('EventDetail: Already authenticated, navigating to registration');
        navigate(
          `/members/register-member?eventId=${eventId}&ticketId=${ticket.documentId
          }&ticketCount=${ticketCounts[ticket.documentId] || 1}`
        );
        return;
      }

      // Need authentication - use navigation guard
      const eventId = event?.documentId || id;
      if (!eventId) {
        console.error('EventDetailPage: No valid event ID for registration');
        return;
      }

      const registrationPath = `/members/register-member?eventId=${eventId}&ticketId=${ticket.documentId}&ticketCount=${ticketCounts[ticket.documentId] || 1}`;

      console.log('EventDetail: Requesting authentication before navigation');
      const navigationSuccess = await navigateWithAuth(navigate, registrationPath, {
        requireAuth: true,
        requireMember,
        requirePhone: false,
        screenName: 'Event Registration'
      });

      if (!navigationSuccess) {
        // Navigation was blocked due to authentication failure
        // Error messages are already shown by the auth guard
        if (requireMember) {
          setNonMemberPopup(true);
        }
      }

    } catch (error) {
      console.error('EventDetail: Error during registration navigation:', error);
      Helper.showAlert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
    }
  };

  const viewMore = () => {
    setShowFullDescription(true);
    setShowViewMoreButton(false);
  };

  const openContact = async () => {
    // ===== NEW: Use AuthContext userInfo instead of APIService.getAuthInfo() =====
    await APIService.sendEventContact(
      userInfo?.id, // Use Zalo ID from AuthContext
      event.documentId,
      event.ten_su_kien
    );
    let oaId = configs?.oaInfo?.id || 0;
    if (oaId > 0) {
      ZaloService.openOfficialAccount(oaId);
    }
  };

  // ===== FIXED: Format event description from markdown to HTML =====
  const formatEventDescription = (content) => {
    if (!content) return "";

    // Convert markdown-style formatting to HTML
    let formattedContent = content
      // Convert **bold** to <strong>bold</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert # headers to <h3> tags
      .replace(/^# (.*$)/gm, '<h3>$1</h3>')
      // Convert ## headers to <h4> tags
      .replace(/^## (.*$)/gm, '<h4>$1</h4>')
      // Convert ### headers to <h5> tags
      .replace(/^### (.*$)/gm, '<h5>$1</h5>')
      // Convert line breaks to <br> tags
      .replace(/\n/g, '<br>')
      // Convert URLs to clickable links
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">$1</a>')
      // Convert bullet points (- item) to <ul><li> format
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      // Wrap consecutive <li> items in <ul> tags
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // Clean up multiple consecutive <br> tags
      .replace(/(<br>\s*){3,}/g, '<br><br>');

    return formattedContent;
  };

  const handleClickDescription = (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
    }
  };

  const canRegister = () => {
    let currentTime = new Date().getTime();
    let eventTime = new Date(
      event.thoi_gian_to_chuc
    ).getTime();
    return currentTime <= eventTime;
  };

  const share = async () => {
    console.log('pages.event-detail', event);
    try {
      const title = Helper.truncateText(
        event?.ten_su_kien || "",
        100
      );
      const photoUrl = getImageProps(event.hinh_anh?.url).src || "https://api.ybahcm.vn/public/yba/yba-01.png";
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: title,
          description:
            "Truy cập (link) để cập nhật tất cả thông tin sự kiện của YBA HCM.",
          thumbnail: photoUrl || "https://api.ybahcm.vn/public/yba/yba-01.png",
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleTicketCountChange = (ticketId, value) => {
    const ticket = tickets.find((t) => t.documentId === ticketId);
    const remainingTickets = ticket?.so_luong_ve_phat_hanh || 0;
    const maxEventTickets = event?.so_ve_toi_da || 0;
    const maxAllowed = Math.min(remainingTickets, maxEventTickets);

    let numValue = parseInt(value) || 1;

    if (isComboTicket(ticket)) {
      numValue = 1; // Default for group tickets
    } else {
      numValue = Math.min(Math.max(1, numValue), maxAllowed);
    }

    setTicketCounts({
      ...ticketCounts,
      [ticketId]: numValue,
    });
  };

  if (!event)
    return (
      <Page className="bg-white page safe-page-content">
        <div className="mx-auto mt-10 text-center mb-44">
          <img
            className="block w-24 h-auto m-auto"
            src="https://api.ybahcm.vn/public/yba/icon-empty.png"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy thông tin sự kiện hoặc sự kiện đã kết thúc, vui lòng
            quay lại sau
          </p>
        </div>
      </Page>
    );
  return (
    <Page className="bg-white page safe-page-content">
      <img
        className="block w-full rounded-lg"
        {...getImageProps(event?.hinh_anh?.url)}
        alt={event?.ten_su_kien || "Event image"}
      />
      <div className="py-4">
        <p className="text-lg font-bold">{event?.ten_su_kien}</p>
        <div className="py-2 text-gray-700 text-normal">
          <div className="ql-snow">
            <div
              className={`ql-editor event-description ${!showFullDescription ? "max-h-32 overflow-hidden" : ""
                }`}
              dangerouslySetInnerHTML={{
                __html: formatEventDescription(event?.noi_dung_su_kien || "")
              }}
              onClick={handleClickDescription}
              style={{
                lineHeight: '1.6',
                fontSize: '14px'
              }}
            />
            {showViewButton && (
              <p
                className="block w-full m-auto text-center text-blue-700 cursor-pointer"
                onClick={viewMore}
              >
                {" "}
                Xem thêm
              </p>
            )}
          </div>
        </div>

        {/* ===== FIXED: Add CSS styles for formatted content ===== */}
        <style jsx>{`
          .event-description h3 {
            font-size: 16px;
            font-weight: bold;
            margin: 12px 0 8px 0;
            color: #333;
          }
          .event-description h4 {
            font-size: 15px;
            font-weight: bold;
            margin: 10px 0 6px 0;
            color: #333;
          }
          .event-description h5 {
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0 4px 0;
            color: #333;
          }
          .event-description ul {
            margin: 8px 0;
            padding-left: 20px;
          }
          .event-description li {
            margin: 4px 0;
            list-style-type: disc;
          }
          .event-description strong {
            font-weight: bold;
            color: #333;
          }
          .event-description a {
            color: #1976d2;
            text-decoration: underline;
            word-break: break-all;
          }
          .event-description a:hover {
            color: #1565c0;
          }
        `}</style>
        <div className="grid grid-cols-5 gap-4 px-3 py-3 my-2 text-sm border rounded-lg">
          <div className="text-[#6F7071] col-span-2">Ngày diễn ra</div>
          <div className="col-span-3 ">
            {Helper.formatDateWithDay(
              event.thoi_gian_to_chuc
            )}
          </div>
          {/* <div className="text-[#6F7071] col-span-2">Người phụ trách</div>
          <div className="col-span-3 font-bold">
            {event.nguoi_phu_trach || "Chưa cập nhật"}
          </div> */}
          <div className="text-[#6F7071] col-span-2">Địa điểm tổ chức</div>
          <div className="col-span-3 ">{event.dia_diem}</div>
          <div className="text-[#6F7071] col-span-2">Chi hội</div>
          <div className="col-span-3 ">
            {event.chi_hoi || "Chưa cập nhật"}
          </div>
          <div className="text-[#6F7071] col-span-2">Trạng thái</div>
          <div className="col-span-3 ">
            {event.trang_thai === "Sap_dien_ra" ? "Sắp diễn ra" :
              event.trang_thai === "Dang_dien_ra" ? "Đang diễn ra" :
                event.trang_thai === "Huy" ? "Đã hủy" :
                  event.trang_thai === "Nhap" ? "Bản nháp" : event.trang_thai}
          </div>
        </div>
        {tickets && tickets.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-5 mb-3 text-base font-bold">
              <div>Giá vé</div>
              {(() => {
                const status = getEventStatusDisplay(event, tickets);
                if (status.message) {
                  return (
                    <div className="text-sm font-medium text-[#F50000]">
                      {status.message}
                    </div>
                  );
                }
                if (status.showTimer) {
                  return (
                    <CountdownTimer
                      endDate={event.thoi_gian_to_chuc}
                    />
                  );
                }
                return null;
              })()}
            </div>
            <div className="grid gap-4 px-3 py-3 border rounded-lg my-2 text-sm bg-[#F3F9FF]">
              {tickets.map((ticket, i) => {
                // GraphQL fields: thoi_gian_bat_dau, thoi_gian_ket_thuc
                const ticketStartTime = new Date(
                  ticket.thoi_gian_bat_dau || event.createdAt
                ).getTime();
                const ticketEndTime = new Date(
                  ticket.thoi_gian_ket_thuc || event.thoi_gian_to_chuc
                ).getTime();
                const currentTime = new Date().getTime();
                const eventEndRegistration = new Date(
                  event.thoi_gian_to_chuc
                ).getTime();
                const isTicketAvailable =
                  currentTime >= ticketStartTime &&
                  currentTime <= ticketEndTime &&
                  currentTime <= eventEndRegistration;

                return (
                  <div
                    key={ticket.documentId}
                    className="grid grid-cols-3 gap-4 text-[#333333] text-sm font-bold"
                  >
                    <div className="content-center ">
                      <div>
                        {ticket.ten_hien_thi_ve}
                        {isComboTicket(ticket) && (
                          <div className="mt-1 text-xs text-blue-600">
                            {getComboText(ticket)}
                          </div>
                        )}
                      </div>
                      {ticket.so_luong_ve_phat_hanh === 0 && (
                        <div className="text-sm text-[#F50000] font-normal">
                          Đã hết vé
                        </div>
                      )}
                    </div>
                    <div className="content-center text-left">
                      {!isComboTicket(ticket) &&
                        ticket.ve_nhom === true ? (
                        <input
                          type="number"
                          min="1"
                          max={ticket.so_luong_ve_phat_hanh}
                          value={ticketCounts[ticket.documentId] || ""}
                          onChange={(e) =>
                            handleTicketCountChange(ticket.documentId, e.target.value)
                          }
                          className="w-32 py-1 bg-transparent outline-none"
                          placeholder="Nhập số vé"
                        />
                      ) : (
                        Helper.formatCurrency(ticket.gia)
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      {ticket.loai_ve === "Lien_He" ? (
                        <button
                          onClick={openContact}
                          disabled={
                            !isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0
                          }
                          className={`${!isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0
                            ? "!bg-gray-400"
                            : "bg-[#0E3D8A]"
                            } text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap`}
                        >
                          Liên hệ
                        </button>
                      ) : (
                        <button
                          onClick={() => register(ticket)}
                          disabled={
                            !isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0 ||
                            (ticket.ve_nhom &&
                              (!ticketCounts[ticket.documentId] ||
                                ticketCounts[ticket.documentId] <= 0)) ||
                            totalSoldTickets >= maxEventTickets ||
                            (ticket.so_luong_ve_phat_hanh || 0) === 0 ||
                            (ticket.chi_danh_cho_hoi_vien && !isMember)
                          }
                          className={`${!isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0 ||
                            (ticket.ve_nhom &&
                              (!ticketCounts[ticket.documentId] ||
                                ticketCounts[ticket.documentId] <= 0)) ||
                            totalSoldTickets >= maxEventTickets ||
                            (ticket.so_luong_ve_phat_hanh || 0) === 0 ||
                            (ticket.chi_danh_cho_hoi_vien && !isMember)
                            ? "!bg-gray-400"
                            : "bg-[#0E3D8A]"
                            } text-white text-xs font-bold px-4 py-2 h-8 rounded-lg whitespace-nowrap`}
                        >
                          {getTicketButtonText(
                            isTicketAvailable,
                            currentTime,
                            ticketEndTime,
                            ticket.so_luong_ve_phat_hanh || 0
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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
      {myTickets &&
        myTickets.length > 0 &&
        event.trang_thai === "Huy" ? (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <div className="w-full">
            <button
              className="w-full h-10 py-2 font-bold text-black rounded-lg bg-slate-200 text-normal mx"
              onClick={goBack}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <div className="w-1/4 mr-2">
            <button
              className="w-full h-10 py-2 font-bold text-black rounded-lg bg-slate-200 text-normal mx"
              onClick={goBack}
            >
              Trở lại
            </button>
          </div>
          <div className="w-3/4 ml-2">
            <button
              className="w-full h-10 py-2 font-bold text-white rounded-lg bg-blue-custom text-normal disabled:bg-slate-300 mx"
              onClick={share}
            >
              Chia sẻ
            </button>
          </div>
        </div>
      )}
      <Modal
        visible={nonMemberPopup}
        title=""
        onClose={() => {
          setNonMemberPopup(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Vé này chỉ áp dụng cho hội viên. Vui lòng chọn loại vé khác hoặc
            liên hệ ban tổ chức.
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={openContact}
          >
            Liên hệ ban tổ chức
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setNonMemberPopup(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
      <Modal
        visible={inActiveMember}
        title=""
        onClose={() => {
          setInActiveMember(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Tài khoản của ban đã ngừng hoạt động
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={openContact}
          >
            Liên hệ ban tổ chức
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setInActiveMember(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
      {/* <Modal
        visible={alreadyBuyPopup}
        title=""
        onClose={() => {
          setAlreadyBuyPopup(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Mỗi hội viên chỉ được đăng ký một vé. Bạn đã mua vé với tư cách hội
            viên trước đó
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={() => setAlreadyBuyPopup(false)}
          >
            Xem vé đã mua
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setAlreadyBuyPopup(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal> */}
    </Page>
  );
};

export default EventDetailPage;
