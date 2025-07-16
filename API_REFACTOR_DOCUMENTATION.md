# API Refactor Documentation

## Current API Configuration
- **Development Domain**: `http://192.168.0.108:3038`
- **Production Domain**: `https://yba.tsx.vn`
- **Authentication**: Bearer JWT Token
- **Response Format**: JSON with `error` and `data` fields

## Authentication APIs

### 1. Login
- **Method**: `POST`
- **Endpoint**: `/accounts/login`
- **Authentication**: None (generates token)
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
  "error": 0,
  "data": {
    "jwt": "string",
    "isAdmin": boolean,
    "isMember": boolean,
    "info": {
      "customFields": {
        "Số điện thoại": ["string"]
      }
    },
    "zaloIDByOA": "string"
  }
}
```
- **Used in Components**: 
  - `src/services/api-service.js` (performLogin function)
  - `src/pages/register.jsx` (after registration)
  - `src/pages/member-info.jsx` (after profile update)

### 2. Get Phone Number (Zalo API)
- **Method**: `GET`
- **Endpoint**: `https://graph.zalo.me/v2.0/me/info`
- **Authentication**: Zalo access token
- **Headers**:
```json
{
  "access_token": "string",
  "code": "string",
  "secret_key": "TEWc1SLNPD4WeMu0ZgYC"
}
```
- **Response**:
```json
{
  "data": {
    "number": "string"
  }
}
```
- **Used in Components**: 
  - `src/services/api-service.js` (getPhone method)

## Configuration APIs

### 3. Get Configurations
- **Method**: `GET`
- **Endpoint**: `/configs`
- **Authentication**: None
- **Response**:
```json
{
  "error": 0,
  "data": {
    "oaInfo": {
      "id": "string"
    },
    "bankInfo": {},
    "banners": [],
    "appInfo": {}
  }
}
```
- **Used in Components**: 
  - Recoil state `configState`
  - `src/pages/index.jsx`
  - `src/pages/ticket-detail.jsx`
  - `src/pages/event-detail.jsx`

### 4. Get Layout Configuration
- **Method**: `GET`
- **Endpoint**: `/layout`
- **Authentication**: Optional
- **Response**:
```json
{
  "error": 0,
  "data": {
    "header": {},
    "navigation": {},
    "theme": {}
  }
}
```
- **Used in Components**: 
  - `src/services/api-service.js` (getLayout method)

### 5. Get Miniapp Configuration
- **Method**: `GET`
- **Endpoint**: `/miniapp`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "customFields": {
        "Hạng mục": "string",
        "Tập tin": [
          {
            "url": "string",
            "id": "string",
            "name": "string"
          }
        ],
        "Đoạn văn bản": {
          "text": "string"
        }
      }
    }
  ]
}
```
- **Used in Components**: 
  - `src/pages/index.jsx` (fetchMiniappData)
  - `src/pages/about.jsx`

## Event APIs

### 6. Get Events List
- **Method**: `GET`
- **Endpoint**: `/events/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number (pagination offset)
  - `limit`: number (items per page)
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "customFields": {
        "Sự kiện": "string",
        "Thời gian tổ chức": "string",
        "Nội Dung Sự Kiện": {
          "html": "string"
        }
      }
    }
  ]
}
```
- **Used in Components**: 
  - Recoil state `listEventState`
  - `src/pages/index.jsx`
  - `src/pages/event.jsx`

### 7. Get Event Details
- **Method**: `GET`
- **Endpoint**: `/events/{eventId}`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "customFields": {
      "Sự kiện": "string",
      "Thời gian tổ chức": "string",
      "Nội Dung Sự Kiện": {
        "html": "string"
      }
    }
  }
}
```
- **Used in Components**: 
  - `src/pages/event-detail.jsx`
  - `src/pages/ticket-detail.jsx`
  - Recoil state `eventInfoState`

### 8. Get Event Tickets
- **Method**: `GET`
- **Endpoint**: `/events/{eventId}/tickets`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "eventId": "string",
      "price": number,
      "remainingTickets": number
    }
  ]
}
```
- **Used in Components**: 
  - Recoil state `listTicketOfEventState`
  - `src/pages/event-detail.jsx`

### 9. Register for Event
- **Method**: `POST`
- **Endpoint**: `/events/{eventId}/{ticketId}/register`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string
  - `ticketId`: string
- **Request Body**:
```json
{
  "data": "object",
  "zaloIdByOA": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "ticketId": "string",
    "status": "string"
  }
}
```
- **Used in Components**: 
  - `src/pages/register-member.jsx`

### 10. Get Event Sponsors
- **Method**: `GET`
- **Endpoint**: `/events/{eventId}/sponsors`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "sponsors": [
      {
        "id": "string",
        "name": "string",
        "logo": "string"
      }
    ]
  }
}
```
- **Used in Components**: 
  - `src/pages/ticket-detail.jsx`

### 11. Send Event Contact
- **Method**: `POST`
- **Endpoint**: `/events/{eventId}/contact`
- **Authentication**: Required
- **Parameters**:
  - `eventId`: string
- **Request Body**:
```json
{
  "zaloIDByOA": "string",
  "eventName": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {}
}
```
- **Used in Components**: 
  - `src/pages/event-detail.jsx` (openContact)
  - `src/pages/ticket-detail.jsx` (openContact)

### 12. Event Feedback
- **Method**: `POST`
- **Endpoint**: `/events/{id}/feedback`
- **Authentication**: Required
- **Parameters**:
  - `id`: string (event ID)
- **Request Body**:
```json
{
  "feedback": "string",
  "rating": number
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {}
}
```
- **Used in Components**:
  - `src/services/api-service.js` (feedback method)

## User & Member APIs

### 13. Get My Profile
- **Method**: `GET`
- **Endpoint**: `/users/me`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "customFields": {
      "Số điện thoại": ["string"],
      "Chi hội": [{"id": "string", "name": "string"}]
    }
  }
}
```
- **Used in Components**:
  - Recoil state `userByPhoneNumberState`
  - `src/pages/user.jsx`
  - `src/pages/member-info.jsx`

### 14. Save Member Info
- **Method**: `PUT`
- **Endpoint**: `/users/me`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "updated": true
  }
}
```
- **Used in Components**:
  - `src/pages/member-info.jsx` (handleSave)

### 15. Register Member
- **Method**: `POST`
- **Endpoint**: `/users/register`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "subAssociation": "string",
  "referral": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "status": "registered"
  }
}
```
- **Used in Components**:
  - `src/pages/register.jsx` (handleSubmit)
  - `src/pages/member-info.jsx` (handleSave)

### 16. Update Register Member
- **Method**: `PUT`
- **Endpoint**: `/users/register`
- **Authentication**: Required
- **Request Body**:
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "updated": true
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (updateRegisterMember method)

### 17. Get My Tickets
- **Method**: `GET`
- **Endpoint**: `/users/mytickets/{zaloID}`
- **Authentication**: Required
- **Parameters**:
  - `zaloID`: string
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "eventId": "string",
      "status": "string",
      "customFields": {
        "Trạng thái": ["string"],
        "Sự kiện": [{"id": "string", "name": "string"}]
      }
    }
  ]
}
```
- **Used in Components**:
  - Recoil state `listTicketState`
  - `src/pages/ticket.jsx`

## Ticket APIs

### 18. Get Ticket Info
- **Method**: `GET`
- **Endpoint**: `/tickets/{ticketId}`
- **Authentication**: Required
- **Parameters**:
  - `ticketId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "customFields": {
      "Trạng thái": ["string"],
      "Sự kiện": [{"id": "string", "name": "string"}]
    }
  }
}
```
- **Used in Components**:
  - `src/pages/ticket-detail.jsx`
  - `src/pages/ticket-qr.jsx`
  - Recoil state `ticketInfoState`

### 19. Update Ticket
- **Method**: `PUT`
- **Endpoint**: `/tickets/{ticketId}`
- **Authentication**: Required
- **Parameters**:
  - `ticketId`: string
- **Request Body**:
```json
{
  "zaloIdByOA": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "updated": true
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (updateTicket method)

### 20. Get Ticket Info by Code
- **Method**: `GET`
- **Endpoint**: `/users/tickets/{code}`
- **Authentication**: Required
- **Parameters**:
  - `code`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "code": "string",
    "status": "string"
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getTicketInfoByCode method)

## Membership APIs

### 21. Get Memberships
- **Method**: `GET`
- **Endpoint**: `/memberships/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number
  - `limit`: number
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": number
    }
  ]
}
```
- **Used in Components**:
  - Recoil state `listMembershipState`
  - `src/pages/membership.jsx`

### 22. Get Membership Info
- **Method**: `GET`
- **Endpoint**: `/memberships/{membershipId}`
- **Authentication**: Required
- **Parameters**:
  - `membershipId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": number,
    "benefits": ["string"]
  }
}
```
- **Used in Components**:
  - Recoil state `membershipInfoState`
  - `src/pages/membership-detail.jsx`

### 23. Get Chapters
- **Method**: `GET`
- **Endpoint**: `/chapters/?offset={offset}&limit={limit}`
- **Authentication**: Required
- **Parameters**:
  - `offset`: number
  - `limit`: number
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "location": "string"
    }
  ]
}
```
- **Used in Components**:
  - Recoil state `listChapterState`
  - `src/pages/index.jsx`

## Sponsor APIs

### 24. Get Sponsors
- **Method**: `GET`
- **Endpoint**: `/sponsors`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": {
    "sponsors": [
      {
        "id": "string",
        "name": "string",
        "logo": "string",
        "website": "string"
      }
    ]
  }
}
```
- **Used in Components**:
  - Recoil state `listSponsorState`

### 25. Get Sponsors A
- **Method**: `GET`
- **Endpoint**: `/sponsors/a`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": {
    "sponsors": [
      {
        "id": "string",
        "name": "string",
        "logo": "string"
      }
    ]
  }
}
```
- **Used in Components**:
  - `src/pages/index.jsx` (setSponsorsA)

### 26. Get Sponsors B
- **Method**: `GET`
- **Endpoint**: `/sponsors/b`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": {
    "sponsors": [
      {
        "id": "string",
        "name": "string",
        "logo": "string"
      }
    ]
  }
}
```
- **Used in Components**:
  - `src/pages/index.jsx` (setSponsorsB)

### 27. Get Sponsor Info
- **Method**: `GET`
- **Endpoint**: `/sponsors/{id}`
- **Authentication**: Required
- **Parameters**:
  - `id`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "name": "string",
    "logo": "string",
    "description": "string",
    "website": "string"
  }
}
```
- **Used in Components**:
  - `src/pages/sponsor-detail.jsx`
  - Recoil state `sponsorInfoState`

### 28. Get CBB Info
- **Method**: `GET`
- **Endpoint**: `/sponsors/cbb`
- **Authentication**: Required
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "name": "string",
    "info": "string"
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getCBBInfo method)

## Post/Content APIs

### 29. Get Posts
- **Method**: `GET`
- **Endpoint**: `/posts`
- **Authentication**: None
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "author": "string",
      "publishedAt": "string"
    }
  ]
}
```
- **Used in Components**:
  - Recoil state `listPostsState`
  - `src/pages/index.jsx`
  - `src/pages/post.jsx`

### 30. Get Post Info
- **Method**: `GET`
- **Endpoint**: `/posts/{postId}`
- **Authentication**: Required
- **Parameters**:
  - `postId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "author": "string",
    "publishedAt": "string",
    "images": ["string"]
  }
}
```
- **Used in Components**:
  - Recoil state `postInfoState`
  - `src/pages/post-detail.jsx`

### 31. Get Categories
- **Method**: `GET`
- **Endpoint**: `/categories`
- **Authentication**: None
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```
- **Used in Components**:
  - Recoil state `listCategoriesState`

## Group APIs

### 32. Get Group Info
- **Method**: `GET`
- **Endpoint**: `/groups/{groupId}`
- **Authentication**: Required
- **Parameters**:
  - `groupId`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "location": "string"
  }
}
```
- **Used in Components**:
  - `src/pages/register.jsx` (initializeProfile)

### 33. Get Events of Group
- **Method**: `GET`
- **Endpoint**: `/groups/{groupId}/events`
- **Authentication**: Required
- **Parameters**:
  - `groupId`: string
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "date": "string",
      "location": "string"
    }
  ]
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getEventsOfGroup method)

## Account Management APIs

### 34. Get Members
- **Method**: `GET`
- **Endpoint**: `/members?page={page}`
- **Authentication**: Required
- **Parameters**:
  - `page`: number
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "status": "string"
    }
  ]
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getMembers method)

### 35. Get Potential Members
- **Method**: `GET`
- **Endpoint**: `/potentials?page={page}`
- **Authentication**: Required
- **Parameters**:
  - `page`: number
- **Response**:
```json
{
  "error": 0,
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "status": "pending"
    }
  ]
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getPotentialMembers method)

### 36. Verify Member
- **Method**: `PATCH`
- **Endpoint**: `/accounts/verify-account`
- **Authentication**: Required
- **Request Body**:
```json
{
  "zaloId": "string",
  "currentProfile": "object",
  "zaloIdByOA": "string",
  "name": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "verified": true
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (verifyMember method)

### 37. Create Account
- **Method**: `POST`
- **Endpoint**: `/accounts/create-new-account/{id}`
- **Authentication**: Required
- **Parameters**:
  - `id`: string
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "created": true
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (createAccount method)

### 38. Get Member
- **Method**: `GET`
- **Endpoint**: `/accounts/member/{id}`
- **Authentication**: Required
- **Parameters**:
  - `id`: string
- **Response**:
```json
{
  "error": 0,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "customFields": {}
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (getMember method)

### 39. Save JSON
- **Method**: `POST`
- **Endpoint**: `/accounts/save-json?overwrite={overwrite}`
- **Authentication**: Required
- **Parameters**:
  - `overwrite`: boolean
- **Response**:
```json
{
  "error": 0,
  "data": {
    "saved": true
  }
}
```
- **Used in Components**:
  - `src/services/api-service.js` (saveJson method)
  - Called after `saveMemberInfo`, `verifyMember`, `createAccount`

## Payment APIs

### 40. Get VietQR
- **Method**: `POST`
- **Endpoint**: `/vietqr`
- **Authentication**: Required
- **Request Body**:
```json
{
  "amount": number,
  "description": "string",
  "bankCode": "string"
}
```
- **Response**:
```json
{
  "error": 0,
  "data": {
    "qrCode": "string",
    "qrDataURL": "string"
  }
}
```
- **Used in Components**:
  - Recoil state `vietQrState`
  - `src/pages/payment.jsx`

## Utility Methods

### 41. Check Is Admin
- **Method**: Internal method (uses login response)
- **Returns**: boolean
- **Used in Components**:
  - `src/services/api-service.js` (checkIsAdmin method)

### 42. Check Is Member
- **Method**: Internal method (uses login response)
- **Returns**: boolean
- **Used in Components**:
  - `src/pages/index.jsx`
  - `src/pages/user.jsx`
  - `src/pages/register.jsx`

### 43. Get Auth Info
- **Method**: Internal method (uses localStorage + login)
- **Returns**: Auth object with JWT and user info
- **Used in Components**:
  - `src/pages/event-detail.jsx`
  - `src/pages/ticket-detail.jsx`

## API Summary

**Total APIs**: 43 endpoints
- **Authentication APIs**: 2
- **Configuration APIs**: 3
- **Event APIs**: 7
- **User & Member APIs**: 5
- **Ticket APIs**: 3
- **Membership APIs**: 3
- **Sponsor APIs**: 5
- **Post/Content APIs**: 3
- **Group APIs**: 2
- **Account Management APIs**: 6
- **Payment APIs**: 1
- **Utility Methods**: 3

## Key Integration Points

1. **Recoil State Management**: Most APIs are integrated through Recoil selectors
2. **Authentication Flow**: JWT-based with localStorage caching
3. **Error Handling**: Consistent `{error: 0, data: {}}` response format
4. **Zalo Integration**: Phone number and access token from Zalo SDK
5. **File Uploads**: Handled through customFields with file objects

## Migration Recommendations

1. **Replace Recoil with React Query**: Use TanStack Query for API state management
2. **Implement Axios**: Replace fetch with Axios for better error handling
3. **Add TypeScript**: Define interfaces for all request/response types
4. **Centralize Error Handling**: Create consistent error handling patterns
5. **Add Request/Response Interceptors**: For authentication and logging
6. **Implement Caching Strategy**: Use React Query's caching for better performance
