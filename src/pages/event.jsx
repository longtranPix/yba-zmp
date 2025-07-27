import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Icon, Page, useNavigate } from "zmp-ui"
import Tags from "../components/tags"
import { useRecoilState, useRecoilValue } from "recoil"
import Helper from "../utils/helper"
import { getEventImageUrl, getImageProps, getEmptyStateIcon } from "../utils/imageHelper"
import {
  listEventState,
  selectedChapterState,
  listChapterState,
  multipleEventTicketsState,
} from "../state"
import { useAuth } from "../contexts/AuthContext"
import APIService from "../services/api-service"
const EventPage = () => {
  const navigate = useNavigate()

  // ===== FIXED: Use AuthContext instead of Recoil states and manual API calls =====
  const {
    userInfo,           // Zalo profile data
    member,             // Member data
    isMember,           // Member status from AuthContext
    isAuthenticated,
    isLoading: authLoading,
    userType,
    activateGuestAuthentication,
    getAllZaloDataWithPermissions
  } = useAuth()

  const events = useRecoilValue(listEventState)
  const eventIds = events.map((event) => event.documentId)
  const allEventTickets = useRecoilValue(multipleEventTicketsState(eventIds))
  const getLowestPrice = (eventId) => {
    const eventTickets = allEventTickets.filter(
      (ticket) => ticket.eventId === eventId
    )
    if (!eventTickets || eventTickets.length === 0) return 0

    const prices = eventTickets
      .map((ticket) => ticket.gia || 0)
      .filter((price) => price !== null)

    if (prices.length === 0) return null
    return Math.min(...prices)
  }
  const chapters = useRecoilValue(listChapterState)
  const [selectedChapter, setSelectedChapter] =
    useRecoilState(selectedChapterState)

  // ===== FIXED: State for client-side chapter filtering =====
  const [filteredEvents, setFilteredEvents] = useState([])
  const [isLoadingChapterEvents, setIsLoadingChapterEvents] = useState(false)

  // ===== FIXED: Optimize changeTags with useCallback to prevent re-renders =====
  const changeTags = useCallback((index) => {
    console.log('changeTags called with index:', index);
    setSelectedChapter(index);
  }, [setSelectedChapter]);

  // ===== FIXED: Check authentication status and activate if needed =====
  // useEffect(() => {
  //   const checkAuthenticationAndActivate = async () => {
  //     try {
  //       console.log('EventPage: Checking authentication status for event filtering', {
  //         isAuthenticated,
  //         authLoading,
  //         hasUserInfo: !!userInfo,
  //         hasMember: !!member,
  //         isMember,
  //         userType
  //       });

  //       // If still loading authentication, wait
  //       if (authLoading) {
  //         console.log('EventPage: Authentication still loading, waiting...');
  //         return;
  //       }

  //       // ===== FIXED: If not authenticated, activate authentication =====
  //       if (!isAuthenticated) {
  //         console.log('EventPage: Not authenticated, activating guest authentication');
  //         try {
  //           await activateGuestAuthentication();
  //           console.log('EventPage: Guest authentication activated successfully');
  //         } catch (error) {
  //           console.error('EventPage: Error activating guest authentication:', error);
  //         }
  //       }

  //       // If authenticated but missing user info, try to get it
  //       if (isAuthenticated && !userInfo?.id) {
  //         console.log('EventPage: Authenticated but missing user info, getting user data');
  //         try {
  //           const result = await getAllZaloDataWithPermissions();
  //           if (result.success) {
  //             console.log('EventPage: User data retrieved successfully');
  //           } else {
  //             console.log('EventPage: Failed to get user data:', result.message);
  //           }
  //         } catch (error) {
  //           console.error('EventPage: Error getting user data:', error);
  //         }
  //       }

  //       console.log('EventPage: Final authentication status:', {
  //         isAuthenticated,
  //         isMember,
  //         userType,
  //         hasUserInfo: !!userInfo,
  //         hasMember: !!member
  //       });

  //     } catch (error) {
  //       console.error('EventPage: Error during authentication check:', error);
  //     }
  //   };

  //   checkAuthenticationAndActivate();
  // }, [isAuthenticated, authLoading, userInfo, member, isMember, userType, activateGuestAuthentication, getAllZaloDataWithPermissions]);

  // ===== FIXED: Add debounce to prevent rapid API calls =====
  useEffect(() => {
    const loadEventsByChapter = async () => {
      if (selectedChapter === 0) {
        // Show all events when "Tất cả" is selected
        console.log('EventPage: All chapters selected, showing all events');
        setFilteredEvents(events || []);
        return;
      }

      if (!chapters || chapters.length === 0) {
        console.log('EventPage: No chapters available');
        setFilteredEvents([]);
        return;
      }

      // Get selected chapter name
      const selectedChapterData = chapters[selectedChapter];
      if (!selectedChapterData) {
        console.log('EventPage: Invalid chapter selection');
        setFilteredEvents([]);
        return;
      }

      const chapterName = selectedChapterData.ten_chi_hoi;
      console.log('EventPage: Loading events for chapter:', chapterName);
      setIsLoadingChapterEvents(true);

      try {
        // ===== SIMPLE: Call API to get events filtered by chapter name =====
        const result = await APIService.getEventsByChapter(chapterName, 0, 50);

        if (result.error === 0 && result.data?.events) {
          console.log('EventPage: Chapter events loaded:', {
            chapter: chapterName,
            count: result.data.events.length
          });
          setFilteredEvents(result.data.events);
        } else {
          console.error('EventPage: Error loading chapter events:', result.message);
          setFilteredEvents([]);
        }
      } catch (error) {
        console.error('EventPage: Error loading chapter events:', error);
        setFilteredEvents([]);
      } finally {
        setIsLoadingChapterEvents(false);
      }
    };

    // ===== FIXED: Add debounce to prevent rapid API calls =====
    const timeoutId = setTimeout(() => {
      loadEventsByChapter();
    }, 200); // 200ms debounce

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [selectedChapter, chapters, events]);

  // ===== FIXED: Optimize with useMemo to prevent unnecessary re-calculations =====
  const filteredEventsWithMemberCheck = useMemo(() => {
    console.log('getEventWithFilter: Filtering events', {
      totalEvents: events?.length || 0,
      chapterFilteredEvents: filteredEvents?.length || 0,
      isMember: isMember,
      selectedChapter: selectedChapter,
      isLoadingChapterEvents: isLoadingChapterEvents
    });

    // Use chapter-filtered events if available, otherwise use empty array
    const eventsToFilter = filteredEvents.length > 0 ? filteredEvents : [];

    const memberFilteredEvents = eventsToFilter.filter((event) => {
      // Filter member-only events: chi_danh_cho_hoi_vien = true
      if (event.chi_danh_cho_hoi_vien && !isMember) {
        console.log('getEventWithFilter: Filtering out member-only event for guest user:', {
          eventTitle: event.ten_su_kien || event.tieu_de,
          eventId: event.documentId,
          chi_danh_cho_hoi_vien: event.chi_danh_cho_hoi_vien,
          isMember: isMember
        });
        return false; // Hide member-only events from guest users
      }

      // Log member-only events shown to verified members
      if (event.chi_danh_cho_hoi_vien && isMember) {
        console.log('getEventWithFilter: Showing member-only event to verified member:', {
          eventTitle: event.ten_su_kien || event.tieu_de,
          eventId: event.documentId,
          chi_danh_cho_hoi_vien: event.chi_danh_cho_hoi_vien,
          isMember: isMember
        });
      }

      return true
    })

    console.log('getEventWithFilter: Final filtered results', {
      originalCount: events?.length || 0,
      chapterFilteredCount: filteredEvents?.length || 0,
      memberFilteredCount: memberFilteredEvents.length,
      selectedChapter: selectedChapter,
      isMember: isMember
    });

    return memberFilteredEvents
  }, [filteredEvents, isMember, events, selectedChapter, isLoadingChapterEvents]);

  const getEventStatus = (event) => {
    // GraphQL field: trang_thai (ENUM_EVENTINFORMATION_TRANG_THAI)
    const status = event.trang_thai
    switch (status) {
      case "Huy":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#333333]">
            Sự kiện đã hủy
          </div>
        )
      case "Sap_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#EF8521]">
            Sự kiện sắp diễn ra
          </div>
        )
      case "Dang_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#00B050]">
            Sự kiện đang diễn ra
          </div>
        )
      case "Nhap":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#999999]">
            Bản nháp
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Page
      className="page bg-white safe-page-content"
      restoreScrollOnBack={true}
    >
      <Tags
        items={chapters}
        onClick={changeTags}
        active={selectedChapter}
        isLoading={isLoadingChapterEvents}
      />
      {filteredEventsWithMemberCheck?.map((k, i) => {
        return (
          <div
            className="my relative mb-4 border rounded-lg shadow-sm"
            key={i}
            onClick={() => {
              navigate(`/events/detail/${k.documentId}`)
            }}
          >
            <img
              className="block w-full rounded-t-lg"
              {...getImageProps(k.hinh_anh?.url)}
              alt={k.ten_su_kien || "Event image"}
            />
            {getEventStatus(k)}
            {/* Member-only event indicator */}
            {k.chi_danh_cho_hoi_vien && (
              <div className="absolute top-4 right-4 z-10 h-8 rounded-3xl bg-blue-600 px-3 flex items-center text-sm font-medium text-white">
                <Icon icon="zi-user-circle" size={16} className="mr-1" />
                Dành cho hội viên
              </div>
            )}
            <div className="p-3">
              <p className="font-bold">{k.ten_su_kien}</p>
              <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                <Icon
                  icon="zi-clock-1"
                  size={16}
                />
                <span className="px-2">
                  Ngày diễn ra:{" "}
                  <strong>
                    {Helper.formatDateWithDay(
                      k.thoi_gian_to_chuc
                    )}
                  </strong>
                </span>
              </p>
              <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                <Icon
                  icon="zi-location"
                  size={16}
                />
                <span className="px-2">{k.dia_diem}</span>
              </p>
            </div>
            <div className="flex p-3 justify-between border-t">
              <span className="text-sm">Phí tham dự</span>
              <span className="text-normal font-bold">
                {Helper.formatCurrency(getLowestPrice(k.documentId))}
              </span>
            </div>
          </div>
        )
      })}
      {filteredEventsWithMemberCheck.length == 0 && (
        <div className="flex h-3/4 items-center justify-center">
          <div className="flex flex-col text-center items-center justify-center">
            <img
              className="w-24 h-auto block m-auto"
              src={getEmptyStateIcon()}
              alt="No events"
            />
            <p className="text-normal text-[#6F7071] my-2">Chưa có sự kiện</p>
          </div>
        </div>
      )}
    </Page>
  )
}

export default EventPage
