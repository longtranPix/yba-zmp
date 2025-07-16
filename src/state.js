import { atom, selector, selectorFamily } from "recoil";
import APIServices from "./services/api-service";

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
    const response = await APIServices.getMemberships(0, 20);
    let memberships =
      response.data && response.data.memberships
        ? response.data.memberships
        : [];
    return memberships;
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
      let posts = get(listPostsState);
      return posts.posts.find((v) => v.documentId == id);
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
    const zaloProfile = get(userZaloProfileState);

    // Don't call API if user is guest (no Zalo ID)
    if (!zaloProfile?.id) {
      console.log("listTicketState: No Zalo ID, returning empty array");
      return [];
    }

    try {
      const response = await APIServices.getMyTickets(zaloProfile.id);
      console.log("response ticket", response?.data);
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

    // Don't call API if user is guest (no Zalo ID)
    if (!zaloProfile?.id) {
      console.log("listEventTicketState: No Zalo ID, returning empty array");
      return [];
    }

    try {
      const response = await APIServices.getMyTickets(zaloProfile.id);
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

export const userZaloProfileState = selector({
  key: "UserZaloProfileState",
  get: async ({ get }) => {
    get(zaloProfileRefreshTrigger);
    try {
      const response = await APIServices.getAuthInfo();
      // Always return an object with default values for guest users
      return response || {
        id: null,
        info: null,
        isMember: false,
        phone: null,
        email: null,
        jwt: null
      };
    } catch (error) {
      console.error('userZaloProfileState error:', error);
      // Return default guest profile on error
      return {
        id: null,
        info: null,
        isMember: false,
        phone: null,
        email: null,
        jwt: null
      };
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

export const userByPhoneNumberState = selector({
  key: "UserByPhoneNumberState",
  get: async ({ get }) => {
    // Get refresh trigger to invalidate cache when needed
    get(phoneNumberRefreshTrigger);

    try {
      // Get auth info to check if user has member data
      const authInfo = await APIServices.getAuthInfo();
      console.log('userByPhoneNumberState: authInfo:', authInfo);

      // If user is a member and we have member data, return it
      if (authInfo?.isMember && authInfo?.memberData) {
        console.log('userByPhoneNumberState: Returning cached member data:', authInfo.memberData);
        return authInfo.memberData;
      }

      // If user has member ID but no cached member data, fetch it
      if (authInfo?.memberId) {
        console.log('userByPhoneNumberState: Fetching member data by ID:', authInfo.memberId);
        const memberResponse = await APIServices.getMember(authInfo.memberId);
        console.log('userByPhoneNumberState: Member response:', memberResponse);
        if (memberResponse.error === 0 && memberResponse.member) {
          return memberResponse.member;
        }
      }

      // No member data available - user is guest
      console.log('userByPhoneNumberState: No member data - user is guest');
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
