# Recoil State Documentation - YBA HCM Application

## Overview
This document describes all Recoil atoms and selectors used in the YBA HCM application and analyzes the feasibility of migrating to Zustand.

## Atom States (Simple State Storage)

### 1. UI State Management
| Atom Name | Key | Default Value | Purpose | Used in Components |
|-----------|-----|---------------|---------|-------------------|
| `displayNameState` | "displayName" | `""` | User display name | **No direct usage found** |
| `bottomNavigationStatus` | "bottomNavigationStatus" | `true` | Bottom nav visibility | • `src/components/header.jsx` (line 4, 18)<br>• `src/components/navigation-bar.jsx` (line 11) |
| `loadingState` | "loadingState" | `true` | Global loading state | **No direct usage found** |
| `poweredByBlockState` | "poweredByBlockState" | `null` | Powered by component data | • `src/components/powered-by-block.jsx` (line 5, 8) |
| `suggestFollowState` | "suggestFollowState" | `true` | Follow suggestion visibility | • `src/pages/register-member.jsx` (line 24, 155-156) |
| `selectedChapterState` | "selectedChapterState" | `0` | Currently selected chapter | • `src/pages/event.jsx` (line 8) |

### 2. Data State Management
| Atom Name | Key | Default Value | Purpose | Used in Components |
|-----------|-----|---------------|---------|-------------------|
| `currentProfileState` | "currentProfileState" | `null` | Current user profile | **No direct usage found** |
| `vietQrState` | "vietQrState" | `""` | VietQR payment data | • `src/pages/register-member.jsx` (line 21, 141)<br>• `src/pages/ticket-detail.jsx` (line 5)<br>• `src/pages/payment.jsx` (line 3, 11, 71) |
| `listSponsorsState` | "listSponsorsState" | `[]` | Sponsors list cache | **No direct usage found** |

### 3. Refresh Triggers
| Atom Name | Key | Default Value | Purpose | Used in Components |
|-----------|-----|---------------|---------|-------------------|
| `refreshTrigger` | "refreshTrigger" | `0` | Global refresh trigger | • `src/pages/register.jsx` (line 5)<br>• `src/pages/ticket.jsx` (line 7)<br>• `src/pages/manage-ticket.jsx` (line 7)<br>• `src/pages/member-verify.jsx` (line 5) |
| `eventRefreshTrigger` | "eventRefreshTrigger" | `0` | Event data refresh | • `src/pages/event-detail.jsx` (line 10) |
| `zaloProfileRefreshTrigger` | "zaloProfileRefreshTrigger" | `0` | Zalo profile refresh | • `src/pages/event-detail.jsx` (line 11)<br>• `src/pages/member-verify.jsx` (line 8) |
| `memberListRefreshTrigger` | "memberListRefreshTrigger" | `0` | Member list refresh | • `src/pages/member-info.jsx` (line 5) |
| `potentialListRefreshTrigger` | "potentialListRefreshTrigger" | `0` | Potential members refresh | **No direct usage found** |
| `phoneNumberRefreshTrigger` | "phoneNumberRefreshTrigger" | `0` | Phone number data refresh | • `src/pages/event-detail.jsx` (line 12)<br>• `src/pages/member-verify.jsx` (line 9) |

## Selector States (Computed/Async State)

### 1. Configuration Selectors
| Selector Name | Key | API Call | Purpose | Used in Components |
|---------------|-----|----------|---------|-------------------|
| `configState` | "Configs" | `APIServices.getConfigs()` | App configuration | • `src/pages/register-member.jsx` (line 23, 143)<br>• `src/pages/index.jsx` (line 16)<br>• `src/pages/event-detail.jsx` (line 5)<br>• `src/pages/user.jsx` (line 4)<br>• `src/pages/member-info.jsx` (line 4)<br>• `src/pages/ticket-detail.jsx` (line 5)<br>• `src/pages/payment.jsx` (line 3, 12) |

### 2. List Data Selectors
| Selector Name | Key | API Call | Purpose | Used in Components |
|---------------|-----|----------|---------|-------------------|
| `listEventState` | "ListEventState" | `APIServices.getEvents(0, 20)` | Events list | • `src/pages/index.jsx` (line 14)<br>• `src/pages/event.jsx` (line 7, 16) |
| `listMembershipState` | "ListMembershipState" | `APIServices.getMemberships(0, 20)` | Memberships list | **No direct usage found** |
| `listSponsorState` | "ListSponsorState" | `APIServices.getSponsors()` | Sponsors list | **No direct usage found** |
| `listCategoriesState` | "ListCategoriesState" | `APIServices.getCategories()` | Categories list | **No direct usage found** |
| `listChapterState` | "ListChapterState" | `APIServices.getChapters(0, 20)` | Chapters list | • `src/pages/index.jsx` (line 15)<br>• `src/pages/event.jsx` (line 9) |
| `listTicketState` | "ListTicketState" | `APIServices.getMyTickets()` | User tickets | • `src/pages/register-member.jsx` (line 22, 142)<br>• `src/pages/ticket.jsx` (line 4)<br>• `src/pages/manage-ticket.jsx` (line 4)<br>• `src/pages/event-detail.jsx` (line 8, 29) |
| `listEventTicketState` | "ListEventTicketState" | `APIServices.getMyTickets()` | Event tickets | **No direct usage found** |
| `listPostsState` | "selectedPostState" | `APIServices.getPosts(0, 20)` | Posts list | • `src/pages/index.jsx` (line 17) |
| `listPotentialsState` | "ListPotentialState" | `APIServices.getPotentialMembers()` | Potential members | **No direct usage found** |

### 3. User Profile Selectors
| Selector Name | Key | API Call | Purpose | Used in Components |
|---------------|-----|----------|---------|-------------------|
| `userProfileState` | "UserProfileState" | `APIServices.getMyProfile()` | User profile | • `src/pages/member-info.jsx` (line 7) |
| `userZaloProfileState` | "UserZaloProfileState" | `APIServices.getAuthInfo()` | Zalo profile | • `src/pages/register-member.jsx` (line 9)<br>• `src/pages/register.jsx` (line 7)<br>• `src/pages/ticket.jsx` (line 5)<br>• `src/pages/manage-ticket.jsx` (line 5)<br>• `src/pages/event-detail.jsx` (line 7, 30)<br>• `src/pages/user.jsx` (line 5)<br>• `src/pages/member-info.jsx` (line 8)<br>• `src/pages/member-verify.jsx` (line 7) |
| `refreshUserProfile` | "RefreshUserProfile" | `APIServices.getMyProfile()` | Refreshed profile | **No direct usage found** |
| `userByPhoneNumberState` | "UserByPhoneNumberState" | `APIServices.getMember()` | User by phone | • `src/pages/register-member.jsx` (line 8)<br>• `src/pages/register.jsx` (line 6)<br>• `src/pages/index.jsx` (line 19)<br>• `src/pages/event.jsx` (line 11)<br>• `src/pages/event-detail.jsx` (line 9)<br>• `src/pages/user.jsx` (line 6)<br>• `src/pages/member-info.jsx` (line 6)<br>• `src/pages/member-verify.jsx` (line 6) |

### 4. Complex Data Selectors
| Selector Name | Key | Purpose | Used in Components |
|---------------|-----|---------|-------------------|
| `currentPotentialSelector` | "currentPotentialSelector" | Find current user in potentials | **No direct usage found** |
| `refreshEventAndTickets` | "RefreshEventAndTickets" | Combined events & tickets | **No direct usage found** |

## Selector Families (Parameterized Selectors)

### 1. Info Selectors by ID
| Selector Family | Key | Parameter | Purpose | Used in Components |
|-----------------|-----|-----------|---------|-------------------|
| `eventInfoState` | "EventInfoState" | `id` | Event details by ID | • `src/pages/register-member.jsx` (line 20, 137)<br>• `src/pages/event-detail.jsx` (line 4) |
| `membershipInfoState` | "MembershipInfoState" | `id` | Membership by ID | **No direct usage found** |
| `postInfoState` | "PostInfoState" | `id` | Post by ID | • `src/pages/post-detail.jsx` (line 6, 13) |
| `categoryInfoState` | "CategoryInfoState" | `id` | Category by ID | **No direct usage found** |
| `sponsorInfoState` | "SponsorInfoState" | `id` | Sponsor by ID | **No direct usage found** |
| `ticketInfoState` | "TicketInfoState" | `id` | Ticket by ID | • `src/pages/ticket-detail.jsx` (line 5) |

### 2. Event-Related Selectors
| Selector Family | Key | Parameter | Purpose | Used in Components |
|-----------------|-----|-----------|---------|-------------------|
| `listTicketOfEventState` | "ListTicketOfEventState" | `eventId` | Tickets for event | • `src/pages/register-member.jsx` (line 25)<br>• `src/pages/event-detail.jsx` (line 6, 28) |
| `ticketEventInfoState` | "TicketEventInfoState" | `{eventId, ticketId}` | Ticket in event | • `src/pages/register-member.jsx` (line 7, 138) |
| `ticketEventState` | "TicketEventState" | `eventId` | Event for ticket | • `src/pages/ticket.jsx` (line 6)<br>• `src/pages/manage-ticket.jsx` (line 6) |
| `multipleEventTicketsState` | "MultipleEventTicketsState" | `eventIds[]` | Multiple event tickets | • `src/pages/index.jsx` (line 18)<br>• `src/pages/event.jsx` (line 10, 18) |

## Helper Functions
| Function | Purpose |
|----------|---------|
| `fetchPotentialsUntilFound` | Search through paginated potential members |
| `fetchMembers` | Fetch members by page |
| `fetchPotentialMembers` | Fetch potential members by page |
| `fetchTicketsForEvent` | Fetch tickets for specific event |
| `modifiedSaveMemberInfo` | Save member info with JSON backup |

## State Dependencies Graph
```
refreshTrigger → listTicketState → ticketInfoState
zaloProfileRefreshTrigger → userZaloProfileState → currentPotentialSelector
eventRefreshTrigger → eventInfoState
listMembershipState → membershipInfoState
listSponsorState → sponsorInfoState
listCategoriesState → categoryInfoState
listPostsState → postInfoState
```

## Can Zustand Replace All Recoil States?

### ✅ **YES - Zustand can fully replace all Recoil functionality**

#### **Advantages of Migration:**
1. **Simpler API** - No providers, atoms, or selectors
2. **Better Performance** - No unnecessary re-renders
3. **Smaller Bundle** - Zustand is much lighter than Recoil
4. **TypeScript Support** - Better type inference
5. **DevTools** - Built-in Redux DevTools support
6. **No Suspense Issues** - Handles async data better

#### **Migration Strategy:**

**1. Simple Atoms → Zustand State**
```javascript
// Recoil
const loadingState = atom({ key: "loadingState", default: true });

// Zustand
const useAppStore = create((set) => ({
  loading: true,
  setLoading: (loading) => set({ loading }),
}));
```

**2. Selectors → Computed Values/Actions**
```javascript
// Recoil
const configState = selector({
  key: "Configs",
  get: async () => await APIServices.getConfigs()
});

// Zustand
const useConfigStore = create((set, get) => ({
  config: null,
  loading: false,
  fetchConfig: async () => {
    set({ loading: true });
    const response = await APIServices.getConfigs();
    set({ config: response.data, loading: false });
  }
}));
```

**3. Selector Families → Dynamic Actions**
```javascript
// Zustand
const useEventStore = create((set, get) => ({
  events: {},
  fetchEvent: async (id) => {
    if (!get().events[id]) {
      const response = await APIServices.getEventInfo(id);
      set(state => ({
        events: { ...state.events, [id]: response.data }
      }));
    }
  }
}));
```

### **Recommended Migration Approach:**
1. **Phase 1**: Replace simple atoms (UI state)
2. **Phase 2**: Replace list selectors with React Query + Zustand
3. **Phase 3**: Replace complex selectors and families
4. **Phase 4**: Remove Recoil dependency

**Result**: Zustand can completely replace all 35+ Recoil states with better performance and simpler code!
