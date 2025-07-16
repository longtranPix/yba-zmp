# YBA HCM Mobile App - API Documentation

## Overview

This document describes all the API endpoints used in the YBA HCM mobile application. The app uses two main API domains:

- **Main API**: `https://yba.tsx.vn` (production) / `http://192.168.0.108:3038` (development)
- **Strapi CMS**: `http://localhost:1337` (configuration data)

## Authentication

Most endpoints require Bearer token authentication. The app uses Zalo Mini App authentication flow:

1. Get access token from Zalo
2. Login with access token to get JWT
3. Use JWT for subsequent API calls

### Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## API Endpoints

### 1. Authentication & User Management

#### Login
- **Endpoint**: `POST /accounts/login`
- **Authentication**: None
- **Request Body**:
```json
{
  "accessToken": "string",
  "phoneNumber": "string"
}
```
- **Response**:
```json
{
  "data": {
    "jwt": "string",
    "isAdmin": boolean,
    "isMember": boolean,
    "info": {
      "customFields": {
        "Số điện thoại": ["string"]
      }
    }
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (performLogin function - internal authentication flow)
  - `src/pages/register.jsx` (line 222 - after successful member registration)
  - `src/pages/member-info.jsx` (line 217 - after profile update)
  - `src/pages/event-detail.jsx` (line 172 - page initialization)
  - `src/services/api-service.js` (checkIsAdmin method - to refresh admin status)

#### Get User Profile
- **Endpoint**: `GET /users/me`
- **Authentication**: Required
- **Response**: User profile data
- **Used in Components**:
  - `src/state.js` (userProfileState selector - line 168)
  - `src/state.js` (refreshUserProfile selector - line 356)
  - Recoil state management for user profile data

#### Update User Profile
- **Endpoint**: `PUT /users/me`
- **Authentication**: Required
- **Request Body**: User profile data
- **Response**: Updated user profile
- **Used in Components**:
  - `src/services/api-service.js` (saveMemberInfo method - line 336)
  - `src/pages/member-info.jsx` (profile update functionality)
  - Automatically calls `saveJson(true)` after update

#### Register Member
- **Endpoint**: `POST /users/register`
- **Authentication**: Required
- **Request Body**: Member registration data
- **Response**: Registration confirmation
- **Used in Components**:
  - `src/pages/register.jsx` (line 215 - member registration form)
  - `src/pages/member-info.jsx` (line 210 - profile registration)
  - `src/services/api-service.js` (registerMember method - line 311)

#### Update Member Registration
- **Endpoint**: `PUT /users/register`
- **Authentication**: Required
- **Request Body**: Updated member data
- **Response**: Update confirmation
- **Used in Components**:
  - `src/services/api-service.js` (updateRegisterMember method - line 324)
  - Internal method for member data updates

### 2. Configuration (Strapi CMS)

#### Get App Configuration
- **Endpoint**: `GET /api/configs`
- **Base URL**: `http://localhost:1337`
- **Authentication**: None
- **Response**:
```json
{
  "error": 0,
  "data": {
    "oaInfo": {
      "id": "string",
      "name": "string"
    },
    "bankInfo": {
      "accountNumber": "string",
      "accountName": "string",
      "bankName": "string",
      "bankInfo": {
        "data": "string",
        "id": "string"
      }
    },
    "banners": [
      {
        "image": "string",
        "url": "string",
        "id": "string"
      }
    ],
    "appInfo": {
      "version": "string",
      "environment": "string"
    }
  }
}
```
- **Used in Components**:
  - `src/state.js` (configState selector - line 27)
  - `src/pages/index.jsx` (via configState recoil selector)
  - `src/pages/ticket-detail.jsx` (via configState recoil selector)
  - `src/pages/event-detail.jsx` (via configState recoil selector)
  - `src/pages/user.jsx` (via configState recoil selector)
  - `src/services/api-service.js` (getConfigs method - line 126)

### 3. Events Management

#### Get Events List
- **Endpoint**: `GET /events/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number (pagination offset)
  - `limit`: number (items per page)
- **Response**: List of events
- **Used in Components**:
  - `src/state.js` (listEventState selector - line 36)
  - `src/state.js` (userTicketsAndEventsState selector - line 432)
  - `src/pages/index.jsx` (via listEventState recoil selector)
  - `src/pages/event.jsx` (via listEventState recoil selector)
  - `src/services/api-service.js` (getEvents method - line 255)

#### Get Event Details
- **Endpoint**: `GET /events/{eventId}`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
- **Response**: Event details
- **Used in Components**:
  - `src/state.js` (eventInfoState selector family - line 99)
  - `src/state.js` (eventInfoStateNew selector family - line 386)
  - `src/pages/event-detail.jsx` (line 135 - direct API call)
  - `src/pages/ticket-detail.jsx` (line 43 - direct API call)
  - `src/services/api-service.js` (getEventInfo method - line 354)

#### Get Event Tickets
- **Endpoint**: `GET /events/{eventId}/tickets`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
- **Response**: Available tickets for event
- **Used in Components**:
  - `src/state.js` (listTicketOfEventState selector family - line 366)
  - `src/state.js` (fetchTicketsForEvent function - line 393)
  - `src/pages/event-detail.jsx` (via listTicketOfEventState recoil selector)
  - `src/services/api-service.js` (getEventTickets method - line 288)

#### Register for Event
- **Endpoint**: `POST /events/{eventId}/{ticketId}/register`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
  - `ticketId`: string (ticket ID)
- **Request Body**:
```json
{
  "data": "object",
  "zaloIdByOA": "string"
}
```
- **Response**: Registration confirmation
- **Used in Components**:
  - `src/pages/register-member.jsx` (line 318 & 467 - event registration)
  - `src/services/api-service.js` (registerEvent method - line 389)

#### Get Event Sponsors
- **Endpoint**: `GET /events/{eventId}/sponsors`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
- **Response**: List of event sponsors
- **Used in Components**:
  - `src/pages/ticket-detail.jsx` (line 46 - get sponsors for event)
  - `src/services/api-service.js` (getSponsorsOfEvents method - line 347)

#### Send Event Contact
- **Endpoint**: `POST /events/{eventId}/contact`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
- **Request Body**:
```json
{
  "zaloIDByOA": "string",
  "eventName": "string"
}
```
- **Response**: Contact confirmation
- **Used in Components**:
  - `src/pages/event-detail.jsx` (line 232 - openContact function)
  - `src/pages/ticket-detail.jsx` (line 87 - openContact function)
  - `src/services/api-service.js` (sendEventContact method - line 614)

#### Submit Event Feedback
- **Endpoint**: `POST /events/{eventId}/feedback`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string (event ID)
- **Request Body**: Feedback data
- **Response**: Feedback confirmation
- **Used in Components**:
  - `src/pages/ticket-detail.jsx` (line 203 - handleRating function)
  - `src/services/api-service.js` (feedback method - line 565)

### 4. Tickets Management

#### Get User Tickets
- **Endpoint**: `GET /users/mytickets/{zaloID}`
- **Authentication**: Required
- **Parameters**:
  - `zaloID`: string (user's Zalo ID)
- **Response**: List of user's tickets
- **Used in Components**:
  - `src/state.js` (listTicketState selector - line 149)
  - `src/state.js` (listEventTicketState selector - line 159)
  - `src/state.js` (userTicketsAndEventsState selector - line 433)
  - `src/pages/ticket.jsx` (via listTicketState recoil selector)
  - `src/services/api-service.js` (getMyTickets method - line 295)

#### Get Ticket Details
- **Endpoint**: `GET /tickets/{ticketId}`
- **Authentication**: Required
- **Parameters**:
  - `ticketId`: string (ticket ID)
- **Response**: Ticket details
- **Used in Components**:
  - `src/pages/ticket-detail.jsx` (line 30 - direct API call)
  - `src/pages/ticket-qr.jsx` (via ticketInfoState recoil selector)
  - `src/state.js` (ticketInfoState selector family)
  - `src/services/api-service.js` (getTicketInfo method - line 442)

#### Get Ticket by Code
- **Endpoint**: `GET /users/tickets/{code}`
- **Authentication**: Required
- **Parameters**:
  - `code`: string (ticket code)
- **Response**: Ticket information
- **Used in Components**:
  - `src/services/api-service.js` (getTicketInfoByCode method - line 463)
  - Internal method for ticket code validation

#### Update Ticket
- **Endpoint**: `PUT /tickets/{ticketId}`
- **Authentication**: Required
- **Parameters**:
  - `ticketId`: string (ticket ID)
- **Request Body**:
```json
{
  "zaloIdByOA": "string"
}
```
- **Response**: Updated ticket information
- **Used in Components**:
  - `src/services/api-service.js` (updateTicket method - line 449)
  - Internal method for ticket updates

### 5. Memberships

#### Get Memberships List
- **Endpoint**: `GET /memberships/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number (pagination offset)
  - `limit`: number (items per page)
- **Response**: List of memberships
- **Used in Components**:
  - `src/state.js` (listMembershipState selector - line 46)
  - `src/pages/membership.jsx` (via listMembershipState recoil selector)
  - `src/services/api-service.js` (getMemberships method - line 268)

#### Get Membership Details
- **Endpoint**: `GET /memberships/{membershipId}`
- **Authentication**: Required
- **Parameters**:
  - `membershipId`: string (membership ID)
- **Response**: Membership details
- **Used in Components**:
  - `src/state.js` (membershipInfoState selector family)
  - `src/pages/membership-detail.jsx` (via membershipInfoState recoil selector)
  - `src/services/api-service.js` (getMembershipInfo method - line 368)

### 6. Content Management

#### Get Posts (GraphQL)
- **Endpoint**: `POST /graphql`
- **Base URL**: `http://localhost:1337`
- **Authentication**: None
- **Request Body**:
```json
{
  "query": "query Posts {\n  posts {\n    hinh_anh_minh_hoa {\n      url\n      name\n      documentId\n    }\n    documentId\n    ngay_dang\n    ma_code\n    noi_dung\n    publishedAt\n    tac_gia\n    tieu_de\n    trang_thai\n    updatedAt\n    createdAt\n  }\n}",
  "variables": {}
}
```
- **Raw GraphQL Response**:
```json
{
  "data": {
    "posts": [
      {
        "hinh_anh_minh_hoa": [
          {
            "url": "string",
            "name": "string",
            "documentId": "string"
          }
        ],
        "documentId": "string",
        "ngay_dang": "string (ISO date)",
        "ma_code": "string",
        "noi_dung": "string (HTML content)",
        "publishedAt": "string (ISO date)",
        "tac_gia": "string",
        "tieu_de": "string",
        "trang_thai": "string",
        "updatedAt": "string (ISO date)",
        "createdAt": "string (ISO date)"
      }
    ]
  }
}
```
- **Transformed Response** (for backward compatibility):
```json
{
  "data": {
    "posts": [
      {
        "id": "string",
        "documentId": "string",
        "customFields": {
          "Tiêu đề": "string",
          "Nội dung": {
            "text": "string",
            "html": "string"
          },
          "Ảnh minh hoạ": [
            {
              "url": "string",
              "name": "string",
              "documentId": "string"
            }
          ],
          "Tạo lúc": "string (ISO date)",
          "Tác giả": "string",
          "Trạng thái": "string",
          "Ngày đăng": "string (ISO date)",
          "Mã code": "string"
        },
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)",
        "publishedAt": "string (ISO date)"
      }
    ]
  }
}
```
```json
{
  "data": {
    "posts": [
      {
        "id": "string",
        "customFields": {
          "Tiêu đề": "string",
          "Nội dung": {
            "text": "string",
            "html": "string"
          },
          "Ảnh minh hoạ": [
            {
              "url": "string",
              "id": "string"
            }
          ],
          "Danh mục": [
            {
              "id": "number",
              "data": "string"
            }
          ],
          "Tạo lúc": "string (ISO date)",
          "Tác giả": "string",
          "Trạng thái": "string",
          "Mô tả ngắn": "string",
          "Tags": ["string"],
          "Lượt xem": "number",
          "Nổi bật": "boolean",
          "SEO Title": "string",
          "SEO Description": "string",
          "Slug": "string"
        },
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "totalPages": "number"
    }
  }
}
```
- **Used in Components**:
  - `src/state.js` (listPostsState selector - line 288)
  - `src/pages/index.jsx` (via listPostsState recoil selector)
  - `src/pages/post.jsx` (via listPostsState recoil selector)
  - `src/services/api-service.js` (getPosts method - line 470)

#### Get Post Details (GraphQL)
- **Endpoint**: `POST /graphql`
- **Base URL**: `http://localhost:1337`
- **Authentication**: None
- **Request Body**:
```json
{
  "query": "query Post($documentId: ID!) {\n  post(documentId: $documentId) {\n    hinh_anh_minh_hoa {\n      url\n      name\n      documentId\n    }\n    documentId\n    ngay_dang\n    ma_code\n    noi_dung\n    publishedAt\n    tac_gia\n    tieu_de\n    trang_thai\n    updatedAt\n    createdAt\n  }\n}",
  "variables": {
    "documentId": "<id of post>"
  }
}
```
- **Raw GraphQL Response**:
```json
{
  "data": {
    "post": {
      "hinh_anh_minh_hoa": [
        {
          "url": "string",
          "name": "string",
          "documentId": "string"
        }
      ],
      "documentId": "string",
      "ngay_dang": "string (ISO date)",
      "ma_code": "string",
      "noi_dung": "string (HTML content)",
      "publishedAt": "string (ISO date)",
      "tac_gia": "string",
      "tieu_de": "string",
      "trang_thai": "string",
      "updatedAt": "string (ISO date)",
      "createdAt": "string (ISO date)"
    }
  }
}
```
- **Transformed Response** (for backward compatibility):
```json
{
  "data": {
    "id": "string",
    "documentId": "string",
    "customFields": {
      "Tiêu đề": "string",
      "Nội dung": {
        "text": "string (HTML content)",
        "html": "string (HTML content)"
      },
      "Ảnh minh hoạ": [
        {
          "url": "string",
          "name": "string",
          "documentId": "string"
        }
      ],
      "Tạo lúc": "string (ISO date)",
      "Tác giả": "string",
      "Trạng thái": "string",
      "Ngày đăng": "string (ISO date)",
      "Mã code": "string"
    },
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "publishedAt": "string (ISO date)"
  }
}
```
- **Used in Components**:
  - `src/state.js` (postInfoState selector family)
  - `src/pages/post-detail.jsx` (via postInfoState recoil selector)
  - `src/services/api-service.js` (getPostInfo method - line 487)

#### Get Categories
- **Endpoint**: `GET /categories`
- **Authentication**: None
- **Response**:
```json
{
  "data": {
    "categories": [
      {
        "id": "number",
        "name": "string",
        "slug": "string",
        "description": "string",
        "color": "string (hex color code)",
        "icon": "string (icon name or URL)",
        "parentId": "number (parent category ID, null for root)",
        "order": "number (display order)",
        "isActive": "boolean",
        "postCount": "number (number of posts in category)",
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)"
      }
    ],
    "total": "number"
  }
}
```
- **Used in Components**:
  - `src/state.js` (listCategoriesState selector - line 67)
  - `src/services/api-service.js` (getCategories method - line 494)

### 7. Layout & UI Configuration

#### Get Layout Configuration (GraphQL)
- **Endpoint**: `POST /graphql`
- **Base URL**: `http://localhost:1337`
- **Authentication**: None
- **Request Body**:
```json
{
  "query": "query LayoutConfig {\n  layoutConfig {\n    header_background_color\n    header_show_logo\n    header_show_title\n    header_text_color\n    header_type\n    navigation_items {\n      route\n      label\n      item_id\n      icon\n    }\n    navigation_type\n    theme_background_color\n    theme_primary_color\n    theme_secondary_color\n    theme_text_color\n  }\n}",
  "variables": {}
}
```
- **Raw GraphQL Response**:
```json
{
  "data": {
    "layoutConfig": {
      "header_background_color": "#ffffff",
      "header_show_logo": true,
      "header_show_title": true,
      "header_text_color": "#333333",
      "header_type": "default",
      "navigation_items": [
        {
          "route": "/",
          "label": "Trang chủ",
          "item_id": "home",
          "icon": "zi-home"
        },
        {
          "route": "/events",
          "label": "Sự kiện",
          "item_id": "events",
          "icon": "zi-calendar"
        },
        {
          "route": "/members",
          "label": "Hội viên",
          "item_id": "members",
          "icon": "zi-user"
        },
        {
          "route": "/users",
          "label": "Cá nhân",
          "item_id": "profile",
          "icon": "zi-user-circle"
        }
      ],
      "navigation_type": "bottom",
      "theme_background_color": "#ffffff",
      "theme_primary_color": "#1843EF",
      "theme_secondary_color": "#0E3D8A",
      "theme_text_color": "#333333"
    }
  }
}
```
- **Transformed Response** (for backward compatibility):
```json
{
  "data": [
    {
      "name": "Trang chủ",
      "customFields": {
        "Tên hiển thị": "Trang chủ",
        "Route": "/",
        "Item ID": "home",
        "Icon": "zi-home"
      }
    },
    {
      "name": "Sự kiện",
      "customFields": {
        "Tên hiển thị": "Sự kiện",
        "Route": "/events",
        "Item ID": "events",
        "Icon": "zi-calendar"
      }
    },
    {
      "name": "Theme Config",
      "customFields": {
        "Header Background": "#ffffff",
        "Header Text Color": "#333333",
        "Theme Primary": "#1843EF",
        "Theme Secondary": "#0E3D8A",
        "Theme Background": "#ffffff",
        "Theme Text": "#333333"
      }
    }
  ]
}
```
- **Used in Components**:
  - `src/components/navigation-bar.jsx` (line 93 - fetchNavbarData function)
  - `src/services/api-service.js` (getLayout method - line 601)
  - Cached for 5 minutes to improve performance

#### Get Mini App Configuration
- **Endpoint**: `GET /miniapp`
- **Authentication**: Required
- **Response**:
```json
{
  "data": [
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Banner Hình Ảnh",
        "Tập tin": [
          {
            "id": "string",
            "url": "string (full image URL)",
            "name": "string (file name)",
            "size": "number (file size in bytes)",
            "type": "string (MIME type)",
            "alt": "string (alt text)"
          }
        ],
        "Mô tả": "string (description)",
        "Thứ tự": "number (display order)",
        "Trạng thái": "string (active/inactive)"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Logo",
        "Tập tin": [
          {
            "id": "string",
            "url": "string (logo image URL)",
            "name": "string (logo file name)",
            "size": "number",
            "type": "string"
          }
        ],
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Slogan",
        "Văn bản": "string (slogan text)",
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Bài viết giới thiệu",
        "Đoạn văn bản": {
          "text": "string (plain text content)",
          "html": "string (HTML formatted content)"
        },
        "Tập tin": [
          {
            "id": "string",
            "url": "string (featured image URL)",
            "name": "string",
            "size": "number",
            "type": "string"
          }
        ],
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Hình ảnh giới thiệu",
        "Tập tin": [
          {
            "id": "string",
            "url": "string (intro image URL)",
            "name": "string",
            "size": "number",
            "type": "string",
            "alt": "string"
          }
        ],
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Thông tin liên hệ",
        "Văn bản": "string (contact information)",
        "Đoạn văn bản": {
          "text": "string (contact details)",
          "html": "string (formatted contact info)"
        },
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    {
      "id": "string",
      "customFields": {
        "Hạng mục": "Cấu hình ứng dụng",
        "Văn bản": "string (app configuration)",
        "Số": "number (numeric config value)",
        "Boolean": "boolean (feature flag)",
        "JSON": "object (complex configuration)",
        "Mô tả": "string",
        "Thứ tự": "number"
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```
- **Used in Components**:
  - `src/pages/index.jsx` (line 69 - fetchMiniappData function for banners and intro content)
  - `src/pages/about.jsx` (for logo and intro content)
  - `src/components/header.jsx` (line 23 - fetchHeaderData function for logo and slogan)
  - `src/services/api-service.js` (getMiniapp method - line 608)

**Common Hạng mục (Category) Types:**
- `"Banner Hình Ảnh"` - Banner images for homepage carousel
- `"Logo"` - Application logo files
- `"Slogan"` - Application slogan text
- `"Bài viết giới thiệu"` - Introduction article content
- `"Hình ảnh giới thiệu"` - Introduction images
- `"Thông tin liên hệ"` - Contact information
- `"Cấu hình ứng dụng"` - Application configuration settings

**Usage Examples:**
```javascript
// Get banner images
const bannerItem = res.data.find(item =>
  item.customFields?.["Hạng mục"] === "Banner Hình Ảnh"
);
const banners = bannerItem.customFields["Tập tin"].map(file => ({
  image: file.url,
  url: "#",
  id: file.id
}));

// Get logo
const logoItem = res.data.find(item =>
  item.customFields?.["Hạng mục"] === "Logo"
);
const logo = logoItem.customFields["Tập tin"][0];

// Get slogan
const sloganItem = res.data.find(item =>
  item.customFields?.["Hạng mục"] === "Slogan"
);
const slogan = sloganItem.customFields["Văn bản"];

// Get intro content
const introItem = res.data.find(item =>
  item.customFields?.["Hạng mục"] === "Bài viết giới thiệu"
);
const introText = introItem.customFields["Đoạn văn bản"].text;
```

### 8. Sponsors

#### Get All Sponsors
- **Endpoint**: `GET /sponsors`
- **Authentication**: Required
- **Response**: List of all sponsors
- **Used in Components**:
  - `src/state.js` (listSponsorState selector - line 58)
  - `src/services/api-service.js` (getSponsors method - line 423)

#### Get Sponsor Details
- **Endpoint**: `GET /sponsors/{id}`
- **Authentication**: Required
- **Parameters**:
  - `id`: string (sponsor ID)
- **Response**: Sponsor details
- **Used in Components**:
  - `src/pages/sponsor-detail.jsx` (line 17 - getSponsor function)
  - `src/state.js` (sponsorInfoState selector family)
  - `src/services/api-service.js` (getSponsorInfo method - line 361)

#### Get Sponsors Category A
- **Endpoint**: `GET /sponsors/a`
- **Authentication**: Required
- **Response**: Category A sponsors
- **Used in Components**:
  - `src/pages/index.jsx` (line 107 - setSponsorsA)
  - `src/services/api-service.js` (getSponsorsA method - line 430)

#### Get Sponsors Category B
- **Endpoint**: `GET /sponsors/b`
- **Authentication**: Required
- **Response**: Category B sponsors
- **Used in Components**:
  - `src/pages/index.jsx` (line 112 - setSponsorsB)
  - `src/services/api-service.js` (getSponsorsB method - line 436)

#### Get CBB Sponsor Info
- **Endpoint**: `GET /sponsors/cbb`
- **Authentication**: Required
- **Response**: CBB sponsor information
- **Used in Components**:
  - `src/components/powered-by-block.jsx` (line 14 - getCBBData function)
  - `src/services/api-service.js` (getCBBInfo method - line 401)

### 9. Chapters & Groups

#### Get Chapters List
- **Endpoint**: `GET /chapters/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number (pagination offset)
  - `limit`: number (items per page)
- **Response**: List of chapters
- **Used in Components**:
  - `src/state.js` (listChapterState selector - line 76)
  - `src/pages/index.jsx` (via listChapterState recoil selector)
  - `src/pages/event.jsx` (via listChapterState recoil selector)
  - `src/services/api-service.js` (getChapters method - line 281)

#### Get Group Information
- **Endpoint**: `GET /groups/{groupId}`
- **Authentication**: Required
- **Parameters**:
  - `groupId`: string (group ID)
- **Response**: Group details
- **Used in Components**:
  - `src/pages/register.jsx` (line 47 - initializeProfile function)
  - `src/services/api-service.js` (getGroupInfo method - line 375)

#### Get Group Events
- **Endpoint**: `GET /groups/{groupId}/events`
- **Authentication**: Required
- **Parameters**:
  - `groupId`: string (group ID)
- **Response**: List of events for specific group
- **Used in Components**:
  - `src/services/api-service.js` (getEventsOfGroup method - line 382)
  - Internal method for group-specific events

### 10. Member Management (Admin)

#### Get Members List
- **Endpoint**: `GET /members?page={page}`
- **Authentication**: Required (Admin)
- **Parameters**:
  - `page`: number (page number)
- **Response**: Paginated list of members
- **Used in Components**:
  - `src/state.js` (fetchMembers function - line 295)
  - `src/state.js` (listMemberState selector)
  - `src/services/api-service.js` (getMembers method - line 510)

#### Get Potential Members
- **Endpoint**: `GET /potentials?page={page}`
- **Authentication**: Required (Admin)
- **Parameters**:
  - `page`: number (page number)
- **Response**: Paginated list of potential members
- **Used in Components**:
  - `src/state.js` (fetchPotentialMembers function - line 300)
  - `src/state.js` (listPotentialState selector - line 318)
  - `src/state.js` (fetchAllPotentialMembers function - line 208)
  - `src/services/api-service.js` (getPotentialMembers method - line 517)

#### Get Member Details
- **Endpoint**: `GET /accounts/member/{id}`
- **Authentication**: Required
- **Parameters**:
  - `id`: string (member ID)
- **Response**: Member details
- **Used in Components**:
  - `src/state.js` (userByPhoneNumberState selector - line 451)
  - `src/services/api-service.js` (getMember method - line 576)

#### Verify Member Account
- **Endpoint**: `PATCH /accounts/verify-account`
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "zaloId": "string",
  "currentProfile": "object",
  "zaloIdByOA": "string",
  "name": "string"
}
```
- **Response**: Verification confirmation
- **Used in Components**:
  - `src/services/api-service.js` (verifyMember method - line 524)
  - Admin functionality for member verification
  - Automatically calls `saveJson(true)` after verification

#### Create New Account
- **Endpoint**: `POST /accounts/create-new-account/{id}`
- **Authentication**: Required (Admin)
- **Parameters**:
  - `id`: string (account ID)
- **Request Body**: Account creation data
- **Response**: Account creation confirmation
- **Used in Components**:
  - `src/services/api-service.js` (createAccount method - line 538)
  - Admin functionality for account creation
  - Automatically calls `saveJson(true)` after creation

### 11. Payment & VietQR

#### Generate VietQR Code
- **Endpoint**: `POST /vietqr`
- **Authentication**: Required
- **Request Body**: Payment information object
- **Response**:
```json
{
  "url": "string",
  "bankInfo": {
    "accountNumber": "string",
    "accountName": "string",
    "bankName": "string"
  }
}
```
- **Used in Components**:
  - `src/pages/ticket-detail.jsx` (line 138 - gotoPayment function)
  - `src/state.js` (vietQrState selector)
  - `src/pages/payment.jsx` (via vietQrState recoil selector)
  - `src/services/api-service.js` (getVietQR method - line 554)

### 12. External APIs

#### Get Phone Number (Zalo Graph API)
- **Endpoint**: `GET https://graph.zalo.me/v2.0/me/info`
- **Authentication**: Zalo access token
- **Headers**:
```
access_token: {zalo_access_token}
code: {phone_token}
secret_key: TEWc1SLNPD4WeMu0ZgYC
```
- **Response**: User phone number information
- **Used in Components**:
  - `src/services/api-service.js` (getPhone method - line 93)
  - Internal method for Zalo phone number retrieval during login

### 13. Utility Endpoints

#### Save JSON Data
- **Endpoint**: `POST /accounts/save-json?overwrite={overwrite}`
- **Authentication**: Required
- **Parameters**:
  - `overwrite`: boolean (whether to overwrite existing data)
- **Response**: Save confirmation
- **Used in Components**:
  - `src/services/api-service.js` (saveJson method - line 583)
  - `src/state.js` (modifiedSaveMemberInfo function - line 460)
  - Called automatically after `saveMemberInfo`, `verifyMember`, `createAccount`

#### Check Is Admin (Utility Method)
- **Internal Method**: Uses login response data
- **Returns**: boolean
- **Used in Components**:
  - `src/components/navigation-bar.jsx` (line 105 - admin status check)
  - `src/services/api-service.js` (checkIsAdmin method - line 408)

#### Check Is Member (Utility Method)
- **Internal Method**: Uses login response data
- **Returns**: boolean
- **Used in Components**:
  - `src/pages/index.jsx` (line 60 - checkMembership function)
  - `src/pages/user.jsx` (line 23 - checkMembership function)
  - `src/pages/register.jsx` (line 52 - checkMembership function)
  - `src/pages/register-member.jsx` (line 60 - checkMembership function)
  - `src/services/api-service.js` (checkIsMember method - line 418)

#### Get Auth Info (Utility Method)
- **Internal Method**: Uses localStorage + login
- **Returns**: Auth object with JWT and user info
- **Used in Components**:
  - `src/pages/event-detail.jsx` (line 231 - openContact function)
  - `src/pages/ticket-detail.jsx` (line 86 - openContact function)
  - `src/state.js` (userZaloProfileState selector - line 183)
  - `src/state.js` (userByPhoneNumberState selector - line 449)
  - `src/services/api-service.js` (getAuthInfo method - line 590)

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "data": "object|array",
  "message": "string (optional)"
}
```

### Error Response
```json
{
  "error": "number|string",
  "message": "string",
  "details": "object (optional)"
}
```

## Rate Limiting

- Authentication endpoints have debounce protection (5 seconds)
- Auth info is cached for 5 seconds to prevent excessive requests
- Layout data is cached for 5 minutes

## Environment Configuration

The API domains are configured in `app-config.json`:

```json
{
  "api": {
    "development": {
      "domain": "http://192.168.0.108:3038"
    },
    "production": {
      "domain": "https://yba.tsx.vn"
    },
    "strapi": {
      "domain": "http://localhost:1337"
    }
  }
}
```

## Notes

- Most endpoints require authentication via JWT token
- Admin-only endpoints require `isAdmin: true` in the auth token
- Phone number access requires Zalo Mini App permissions
- All timestamps are in milliseconds (Unix timestamp)
- File uploads and image URLs are handled through the respective endpoints
- The app maintains auth state in localStorage with expiry management
