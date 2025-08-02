import { atom, selector, selectorFamily } from "recoil";
import APIServices from "./services/api-service";
import { IMAGE_DOMAINS } from "./utils/imageHelper";
import ZaloServices from "./services/zalo-service";

export const displayNameState = atom({
  key: "displayName",
  default: "",
});

export const bottomNavigationStatus = atom({
  key: "bottomNavigationStatus",
  default: true,
});

export const loadingState = atom({
  key: "loadingState",
  default: true,
});

export const poweredByBlockState = atom({
  key: "poweredByBlockState",
  default: null,
});

export const configState = selector({
  key: "Configs",
  get: async ({ get }) => {
    const response = await APIServices.getConfigs();
    let configs = response.data ? response.data : {};
    return configs;
  },
});

export const listEventState = selector({
  key: "ListEventState",
  get: async ({ get }) => {
    const response = await APIServices.getEvents(0, 20);
    // GraphQL response structure: { data: { eventInformations: [...] } }
    let events = response.data?.eventInformations ? response.data.eventInformations : [];
    return events;
  },
});

export const listMembershipState = selector({
  key: "ListMembershipState",
  get: async ({ get }) => {
    try {
      console.log('listMembershipState: Fetching membership fees via GraphQL');
      const response = await APIServices.getMemberships(0, 20);

      // Handle both old and new response formats
      let memberships = [];
      if (response.data && response.data.memberships) {
        memberships = response.data.memberships;
      } else if (response.data && response.data.membershipFees) {
        // Direct GraphQL response format
        memberships = response.data.membershipFees.map(fee => ({
          id: fee.documentId,
          documentId: fee.documentId,
          ma_bien_lai: fee.ma_bien_lai,
          member: fee.hoi_vien,
          chi_hoi: fee.chi_hoi,
          so_tien_da_dong: fee.so_tien_da_dong,
          nam_dong_phi: fee.nam_dong_phi,
          ngay_dong_phi: fee.ngay_dong_phi,
          createdAt: fee.createdAt,
          updatedAt: fee.updatedAt,
          publishedAt: fee.publishedAt,
          // Legacy fields for backward compatibility
          customFields: {
            "Tên Công Ty": fee.hoi_vien?.company || "YBA HCM",
            "Tên Ưu Đãi": `Hội phí ${fee.nam_dong_phi}`,
            "Mô tả": `Số tiền: ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ`,
            "Nội Dung Ưu Đãi": {
              html: `<p>Hội phí năm ${fee.nam_dong_phi}</p><p>Số tiền đã đóng: ${fee.so_tien_da_dong?.toLocaleString('vi-VN')} VNĐ</p><p>Ngày đóng: ${fee.ngay_dong_phi}</p>`
            },
            "Banner": [{
              url: `${IMAGE_DOMAINS.API}/public/yba/membership-banner.png`
            }],
            "Hình Ảnh": [{
              url: fee.hoi_vien?.member_image?.url || `${IMAGE_DOMAINS.API}/public/yba/membership-icon.png`
            }],
            "Ưu tiên hiển thị": false,
            "Tạo lúc": fee.createdAt
          }
        }));
      }

      console.log('listMembershipState: Fetched memberships:', memberships.length);
      return memberships;
    } catch (error) {
      console.error('listMembershipState error:', error);
      return [];
    }
  },
});

// New selector for membership fees using GraphQL
export const membershipFeesState = selector({
  key: "MembershipFeesState",
  get: async ({ get }) => {
    try {
      console.log('membershipFeesState: Fetching membership fees via GraphQL');
      const response = await APIServices.getMembershipFees({}, { start: 0, limit: 50 });

      if (response.data?.membershipFees) {
        return response.data.membershipFees;
      } else {
        return [];
      }
    } catch (error) {
      console.error('membershipFeesState error:', error);
      return [];
    }
  },
});

// Selector for member-specific membership fees
export const memberMembershipFeesState = selectorFamily({
  key: "MemberMembershipFeesState",
  get: (memberId) => async ({ get }) => {
    try {
      if (!memberId) return [];

      console.log('memberMembershipFeesState: Fetching fees for member:', memberId);
      const response = await APIServices.getMemberMembershipFees(memberId);

      if (response.data?.membershipFees) {
        return response.data.membershipFees;
      } else {
        return [];
      }
    } catch (error) {
      console.error('memberMembershipFeesState error:', error);
      return [];
    }
  },
});

// ===== NEW: Member Benefits Recoil State =====
export const memberBenefitsRefreshTrigger = atom({
  key: "memberBenefitsRefreshTrigger",
  default: 0,
});

export const listMemberBenefitsState = selector({
  key: "ListMemberBenefitsState",
  get: async ({ get }) => {
    get(memberBenefitsRefreshTrigger); // Subscribe to refresh trigger

    try {
      console.log('listMemberBenefitsState: Fetching member benefits via GraphQL');

      const response = await APIServices.getMemberBenefits({
        hien_thi: { eq: true }
      }, {
        start: 0,
        limit: 50
      });

      if (response.error === 0) {
        console.log('listMemberBenefitsState: Loaded member benefits:', response.data.length);
        return response.data;
      } else {
        console.error('listMemberBenefitsState: Error loading member benefits:', response.message);
        return [];
      }
    } catch (error) {
      console.error('listMemberBenefitsState error:', error);
      return [];
    }
  },
});

export const memberBenefitInfoState = selectorFamily({
  key: "MemberBenefitInfoState",
  get: (id) => async ({ get }) => {
    try {
      if (!id) return null;

      console.log('memberBenefitInfoState: Fetching member benefit by ID:', id);

      const response = await APIServices.getMemberBenefit(id);

      if (response.error === 0) {
        console.log('memberBenefitInfoState: Loaded member benefit:', response.data);
        return response.data;
      } else {
        console.error('memberBenefitInfoState: Error loading member benefit:', response.message);
        return null;
      }
    } catch (error) {
      console.error('memberBenefitInfoState error:', error);
      return null;
    }
  },
});

export const listSponsorState = selector({
  key: "ListSponsorState",
  get: async ({ get }) => {
    const response = await APIServices.getSponsors();
    let sponsors = response.data ? response.data.sponsors : [];
    return sponsors;
  },
});

export const listCategoriesState = selector({
  key: "ListCategoriesState",
  get: async ({ get }) => {
    const response = await APIServices.getCategories();
    let categories = response.data ? response.data.categories : [];
    return categories;
  },
});

export const listChapterState = selector({
  key: "ListChapterState",
  get: async ({ get }) => {
    const response = await APIServices.getChapters(0, 20);
    // GraphQL response structure: { data: { chapters: [...] } }
    let chapters = response.data?.chapters ? response.data.chapters : [];

    // Transform chapters to maintain backward compatibility
    const transformedChapters = chapters.map(chapter => ({
      ...chapter,
      id: chapter.documentId, // Add id field for backward compatibility
      name: chapter.ten_chi_hoi // Add name field for backward compatibility
    }));

    return [
      {
        name: "Tất cả",
        id: 0,
      },
      ...transformedChapters,
    ];
  },
});

export const eventRefreshTrigger = atom({
  key: "eventRefreshTrigger",
  default: 0,
});

export const eventInfoState = selectorFamily({
  key: "EventInfoState",
  get:
    (id) =>
    async ({ get }) => {
      get(eventRefreshTrigger);
      const response = await APIServices.getEventInfo(id);
      // GraphQL response structure: { data: { eventInformation: {...} } }
      return response.data?.eventInformation || null;
    },
});

export const membershipInfoState = selectorFamily({
  key: "MembershipInfoState",
  get:
    (id) =>
    async ({ get }) => {
      let memberships = get(listMembershipState);
      return memberships.find((v) => v.id == id);
    },
});

export const postInfoState = selectorFamily({
  key: "PostInfoState",
  get:
    (id) =>
    async ({ get }) => {
      const response = await APIServices.getPostInfo(id);
      // GraphQL response structure: { data: { post: {...} } }
      return response.data?.post || null;
    },
});

export const categoryInfoState = selectorFamily({
  key: "CategoryInfoState",
  get:
    (id) =>
    async ({ get }) => {
      let categories = get(listCategoriesState);
      return categories.find((v) => v.id == id);
    },
});

export const sponsorInfoState = selectorFamily({
  key: "SponsorInfoState",
  get:
    (id) =>
    async ({ get }) => {
      let sponsors = get(listSponsorState);
      return sponsors.find((v) => v.id == id);
    },
});

export const listTicketState = selector({
  key: "ListTicketState",
  get: async ({ get }) => {
    const refreshValue = get(refreshTrigger);

    // ===== NEW: Get user data from AuthContext states =====
    const userInfo = get(userZaloProfileState); // This will be updated by AuthContext
    const memberInfo = get(memberInfoState);
    const userType = get(userTypeState);

    // Determine user identifiers from AuthContext data
    const isMember = userType === 'member';
    const zaloId = userInfo?.id || null;
    const memberId = memberInfo?.documentId || null;

    console.log("listTicketState: Using AuthContext data", {
      isMember,
      memberId,
      zaloId,
      userType,
      hasUserInfo: !!userInfo,
      hasMemberInfo: !!memberInfo,
      refreshValue
    });

    // Don't call API if user has no valid identifier
    if (!zaloId && !memberId) {
      console.log("listTicketState: No valid identifier, returning empty array");
      return [];
    }

    try {
      // Call getMyTickets with zaloId and memberId from AuthContext
      const response = await APIServices.getMyTickets(zaloId, memberId);

      console.log("listTicketState: API response", {
        error: response?.error,
        ticketCount: response?.data?.length || 0,
        message: response?.message,
        usedZaloId: zaloId,
        usedMemberId: memberId
      });

      return response?.data || [];
    } catch (error) {
      console.error("listTicketState error:", error);
      return [];
    }
  },
});

export const listEventTicketState = selector({
  key: "ListEventTicketState",
  get: async ({ get }) => {
    const zaloProfile = get(userZaloProfileState);

    // Get auth info to check if user is member
    const authInfo = APIServices.getAuthInfo();
    const isMember = authInfo?.isMember || false;
    const memberId = authInfo?.memberId || null;

    console.log("listEventTicketState: User info", {
      isMember,
      memberId,
      zaloId: zaloProfile?.id
    });

    // Don't call API if user has no valid identifier
    if (!zaloProfile?.id && !memberId) {
      console.log("listEventTicketState: No valid identifier, returning empty array");
      return [];
    }

    try {
      // Use member ID if user is member, otherwise use Zalo ID
      const response = await APIServices.getMyTickets(
        zaloProfile?.id,
        isMember ? memberId : null
      );
      return response?.data || [];
    } catch (error) {
      console.error("listEventTicketState error:", error);
      return [];
    }
  },
});

export const userProfileState = selector({
  key: "UserProfileState",
  get: async ({ get }) => {
    // Don't automatically call getMyProfile - always start as guest
    // Only call this when user explicitly takes member action
    return null;
  },
});

export const zaloProfileRefreshTrigger = atom({
  key: "zaloProfileRefreshTrigger",
  default: 0,
});

// ===== NEW AUTH STATES =====
export const memberInfoState = atom({
  key: "memberInfoState",
  default: null,
});

export const userTypeState = atom({
  key: "userTypeState",
  default: "guest", // "guest" or "member"
});

export const userZaloProfileState = selector({
  key: "UserZaloProfileState",
  get: async ({ get }) => {
    get(zaloProfileRefreshTrigger);
    try {
      console.log('userZaloProfileState: Getting complete Zalo user info');

      // ✅ REFACTORED: Use API service to get Zalo user info with direct SDK import
      const zaloInfoResult = await APIServices.getZaloUserInfo();
      const zaloUserInfo = zaloInfoResult.error === 0 ? zaloInfoResult.data : null;

      console.log('userZaloProfileState: Complete Zalo user info received:', {
        hasId: !!zaloUserInfo?.id,
        hasName: !!zaloUserInfo?.name,
        hasAvatar: !!zaloUserInfo?.avatar,
        source: zaloInfoResult.source || 'none',
        id: zaloUserInfo?.id,
        name: zaloUserInfo?.name
      });

      // Get auth info for member status
      const authInfo = APIServices.getAuthInfo();

      // ✅ COMBINE COMPLETE ZALO INFO WITH AUTH INFO
      const combinedProfile = {
        // Complete Zalo information
        id: zaloUserInfo?.id || null,
        name: zaloUserInfo?.name || null,
        avatar: zaloUserInfo?.avatar || null,

        // Auth information
        isMember: authInfo?.isMember || false,
        memberId: authInfo?.memberId || null,
        phone: authInfo?.phone || null,
        email: authInfo?.email || null,
        jwt: authInfo?.jwt || null,

        // Complete info object for all actions
        info: zaloUserInfo || null,

        // Source tracking for debugging
        zaloInfoSource: zaloInfoResult.source || 'none'
      };

      console.log('userZaloProfileState: Complete combined profile:', {
        zaloId: combinedProfile.id,
        zaloName: combinedProfile.name,
        hasAvatar: !!combinedProfile.avatar,
        isMember: combinedProfile.isMember,
        memberId: combinedProfile.memberId,
        hasUserInfo: !!combinedProfile.info,
        source: combinedProfile.zaloInfoSource
      });

      return combinedProfile;

    } catch (error) {
      console.error('userZaloProfileState error:', error);

      // Try to get auth info and stored Zalo info as fallback
      try {
        const authInfo = APIServices.getAuthInfo();

        // ✅ TRY TO GET STORED ZALO INFO as last resort
        const storedZaloResult = APIServices.loadZaloUserInfo();
        const storedZaloInfo = storedZaloResult.error === 0 ? storedZaloResult.data : null;

        console.log('userZaloProfileState: Using fallback data:', {
          hasStoredZalo: !!storedZaloInfo,
          storedZaloId: storedZaloInfo?.id,
          hasAuth: !!authInfo
        });

        return {
          // Stored Zalo information (if available)
          id: storedZaloInfo?.id || null,
          name: storedZaloInfo?.name || null,
          avatar: storedZaloInfo?.avatar || null,
          info: storedZaloInfo || null,

          // Auth information
          isMember: authInfo?.isMember || false,
          memberId: authInfo?.memberId || null,
          phone: authInfo?.phone || null,
          email: authInfo?.email || null,
          jwt: authInfo?.jwt || null,

          // Source tracking
          zaloInfoSource: storedZaloInfo ? 'stored-fallback' : 'none'
        };
      } catch (authError) {
        console.error('userZaloProfileState: Complete fallback failed:', authError);
        // Return default guest profile on complete failure
        return {
          id: null,
          name: null,
          avatar: null,
          info: null,
          isMember: false,
          memberId: null,
          phone: null,
          email: null,
          jwt: null,
          zaloInfoSource: 'failed'
        };
      }
    }
  },
});

export const currentProfileState = atom({
  key: "currentProfileState",
  default: null,
});

export const refreshTrigger = atom({
  key: "refreshTrigger",
  default: 0,
});

const fetchPotentialsUntilFound = async (
  zaloId,
  startPage = 1,
  retryCount = 0
) => {
  const MAX_RETRIES = 3;
  try {
    let page = startPage;
    while (true) {
      const response = await APIServices.getPotentialMembers(page);
      const { total, members } = response?.data || {};

      if (!members || members.length === 0) {
        if (retryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchPotentialsUntilFound(zaloId, 1, retryCount + 1);
        }
        break;
      }

      const foundPotential = members.find(
        (item) => item?.customFields?.["Zalo ID"] === zaloId
      );

      if (foundPotential) return { found: true, potential: foundPotential };

      const lastPage = total;
      if (page >= lastPage) {
        break;
      }

      page++;
    }
    return { found: false, potential: null };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchPotentialsUntilFound(zaloId, startPage, retryCount + 1);
    }
    return { found: false, potential: null };
  }
};

export const currentPotentialSelector = selector({
  key: "currentPotentialSelector",
  get: async ({ get }) => {
    get(refreshTrigger);
    const zaloProfile = get(userZaloProfileState);

    if (!zaloProfile?.id) return null;

    const { potential } = await fetchPotentialsUntilFound(zaloProfile.id);
    return potential;
  },
});

export const vietQrState = atom({
  key: "vietQrState",
  default: "",
});

export const ticketInfoState = selectorFamily({
  key: "TicketInfoState",
  get:
    (id) =>
    async ({ get }) => {
      let tickets = get(listTicketState);
      return tickets.find((v) => v.id == id);
    },
});

export const listSponsorsState = atom({
  key: "listSponsorsState",
  default: [],
});

export const suggestFollowState = atom({
  key: "suggestFollowState",
  default: true,
});

export const selectedChapterState = atom({
  key: "selectedChapterState",
  default: 0,
});

export const listPostsState = selector({
  key: "selectedPostState",
  get: async ({ get }) => {
    const response = await APIServices.getPosts(0, 20);
    // GraphQL response structure: { data: { posts: [...] } }
    let posts = response.data?.posts ? { posts: response.data.posts } : { posts: [] };
    return posts;
  },
});

const fetchMembers = async (page) => {
  const response = await APIServices.getMembers(page);
  return response?.data;
};

const fetchPotentialMembers = async (page) => {
  const response = await APIServices.getPotentialMembers(page);
  return response?.data;
};

export const memberListRefreshTrigger = atom({
  key: "memberListRefreshTrigger",
  default: 0,
});

export const potentialListRefreshTrigger = atom({
  key: "potentialListRefreshTrigger",
  default: 0,
});

export const listPotentialsState = selector({
  key: "ListPotentialState",
  get: async ({ get }) => {
    get(potentialListRefreshTrigger);
    const { data } = await APIServices.getPotentialMembers(1);
    const { total, members } = data || {};
    let accumulatedUsers = members ? members : [];

    const pages = total;

    if (total) {
      let page = pages;

      try {
        while (true) {
          if (page === 1) {
            break;
          }

          const data = await fetchPotentialMembers(page);
          accumulatedUsers = [...accumulatedUsers, ...data.members];

          if (accumulatedUsers.length >= total || data.members.length === 0) {
            break;
          }

          page--;
        }
        return accumulatedUsers;
      } catch (error) {
        console.error("Error fetching users:", error);
        return accumulatedUsers;
      }
    }

    return accumulatedUsers;
  },
});

export const refreshUserProfile = selector({
  key: "RefreshUserProfile",
  get: async () => {
    const response = await APIServices.getMyProfile();
    return response.data ? response.data : {};
  },
});

export const listTicketOfEventState = selectorFamily({
  key: "ListTicketOfEventState",
  get:
    (eventId) =>
    async ({ get }) => {
      const response = await APIServices.getEventTickets(eventId);
      // GraphQL response structure: { data: { ticketPricesManages: [...] } }
      return response.data?.ticketPricesManages || [];
    },
});

export const ticketEventInfoState = selectorFamily({
  key: "TicketEventInfoState",
  get:
    ({ eventId, ticketId }) =>
    async ({ get }) => {
      const tickets = get(listTicketOfEventState(eventId));
      return tickets?.find((v) => v.documentId == ticketId);
    },
});

export const ticketEventState = selectorFamily({
  key: "TicketEventState",
  get:
    (eventId) =>
    async ({ get }) => {
      const response = await APIServices.getEventInfo(eventId);
      // GraphQL response structure: { data: { eventInformation: {...} } }
      return response.data?.eventInformation || null;
    },
});

const fetchTicketsForEvent = async (eventId) => {
  try {
    const response = await APIServices.getEventTickets(eventId);
    // GraphQL response structure: { data: { ticketPricesManages: [...] } }
    return response.data?.ticketPricesManages || [];
  } catch (error) {
    console.error(`Error fetching tickets for event ${eventId}:`, error);
    return [];
  }
};

export const multipleEventTicketsState = selectorFamily({
  key: "MultipleEventTicketsState",
  get: (eventIds) => async () => {
    if (!Array.isArray(eventIds)) return [];

    try {
      const ticketsPromises = eventIds.map((eventId) =>
        fetchTicketsForEvent(eventId)
      );
      const ticketsArrays = await Promise.all(ticketsPromises);

      const allTickets = ticketsArrays.flatMap((tickets, index) =>
        tickets.map((ticket) => ({
          ...ticket,
          eventId: eventIds[index],
        }))
      );

      return allTickets;
    } catch (error) {
      console.error("Error fetching multiple event tickets:", error);
      return [];
    }
  },
});

export const refreshEventAndTickets = selector({
  key: "RefreshEventAndTickets",
  get: async ({ get }) => {
    get(refreshTrigger);
    const zaloProfile = get(userZaloProfileState);
    const eventResponse = await APIServices.getEvents(0, 20);
    const ticketResponse = await APIServices.getMyTickets(zaloProfile?.id);
    // GraphQL response structure: { data: { eventInformations: [...] } }
    const events = eventResponse.data?.eventInformations || [];
    const tickets = ticketResponse.data || [];
    return { events, tickets };
  },
});

export const phoneNumberRefreshTrigger = atom({
  key: "phoneNumberRefreshTrigger",
  default: 0,
});

// Simplified member status selector for quick checks
export const memberStatusState = selector({
  key: "MemberStatusState",
  get: async ({ get }) => {
    get(phoneNumberRefreshTrigger);

    const authInfo = APIServices.getAuthInfo();

    return {
      isMember: authInfo.isMember || false,
      memberId: authInfo.memberId || null,
      hasJWT: !!authInfo.jwt
    };
  },
});

// Optimized user profile selector - only fetches when needed
export const userByPhoneNumberState = selector({
  key: "UserByPhoneNumberState",
  get: async ({ get }) => {
    // Get refresh trigger to invalidate cache when needed
    get(phoneNumberRefreshTrigger);

    try {
      // Get simplified auth info
      const authInfo = APIServices.getAuthInfo();
      console.log('userByPhoneNumberState: Simplified auth check:', {
        isMember: authInfo.isMember,
        memberId: authInfo.memberId,
        hasJWT: !!authInfo.jwt
      });

      // Only fetch member data if user is a verified member
      if (authInfo?.isMember && authInfo?.memberId) {
        console.log('userByPhoneNumberState: Fetching member data for verified member:', authInfo.memberId);

        const memberResponse = await APIServices.getMember(authInfo.memberId);
        console.log('userByPhoneNumberState: Member response:', memberResponse);

        if (memberResponse.error === 0 && memberResponse.member) {
          console.log('userByPhoneNumberState: Successfully fetched member profile');
          return memberResponse.member;
        } else {
          console.warn('userByPhoneNumberState: Failed to fetch member data:', memberResponse);
        }
      }

      // No member data available - user is guest
      console.log('userByPhoneNumberState: Returning null (guest user or no member data)');
      return null;

    } catch (error) {
      console.error('userByPhoneNumberState error:', error);
      return null;
    }
  },
});

const modifiedSaveMemberInfo = async (data) => {
  const response = await APIServices.saveMemberInfo(data);
  await APIServices.saveJson();
  return response;
};
