# Missing APIs for Strapi GraphQL Schema

## Overview
Based on your current API documentation and GraphQL schema analysis, here are all the missing APIs that need to be created in Strapi to fully replace your current REST API system.

## 1. Configuration Management APIs

### 1.1 App Configuration (CRITICAL MISSING)
**Current REST:** `GET /api/configs`
**Missing in Schema:** Complete AppConfig type

**Need to Create in Strapi:**
```graphql
type AppConfig {
  documentId: ID!
  oaInfo: JSON!                    # Organization App Info
  bankInfo: JSON!                  # Bank Information
  banners: [JSON!]!               # Banner configurations
  appInfo: JSON!                  # Application metadata
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

input AppConfigInput {
  oaInfo: JSON
  bankInfo: JSON
  banners: [JSON!]
  appInfo: JSON
  publishedAt: DateTime
}

# Queries
type Query {
  appConfig: AppConfig
  appConfigs: [AppConfig!]!
}

# Mutations
type Mutation {
  createAppConfig(data: AppConfigInput!): AppConfig!
  updateAppConfig(documentId: ID!, data: AppConfigInput!): AppConfig!
  deleteAppConfig(documentId: ID!): DeleteMutationResponse!
}
```

### 1.2 Layout Configuration (MISSING)
**Current REST:** `GET /layout`
**Missing in Schema:** LayoutConfig type

**Need to Create in Strapi:**
```graphql
type LayoutConfig {
  documentId: ID!
  header_background_color: String
  header_show_logo: Boolean
  header_show_title: Boolean
  header_text_color: String
  header_type: String
  navigation_items: [NavigationItem!]
  navigation_type: String
  nav_background: String
  theme_background_color: String
  theme_primary_color: String
  theme_secondary_color: String
  theme_text_color: String
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

type NavigationItem {
  route: String!
  label: String!
  item_id: String!
  icon: String!
  order: Int
}

input NavigationItemInput {
  route: String!
  label: String!
  item_id: String!
  icon: String!
  order: Int
}

input LayoutConfigInput {
  header_background_color: String
  header_show_logo: Boolean
  header_show_title: Boolean
  header_text_color: String
  header_type: String
  navigation_items: [NavigationItemInput!]
  navigation_type: String
  nav_background: String
  theme_background_color: String
  theme_primary_color: String
  theme_secondary_color: String
  theme_text_color: String
  publishedAt: DateTime
}

# Queries
type Query {
  layoutConfig: LayoutConfig
}

# Mutations
type Mutation {
  createLayoutConfig(data: LayoutConfigInput!): LayoutConfig!
  updateLayoutConfig(documentId: ID!, data: LayoutConfigInput!): LayoutConfig!
}
```

### 1.3 Miniapp Configuration (PARTIALLY MISSING)
**Current REST:** `GET /miniapp`
**Existing in Schema:** `MiniappManager` (but incomplete)

**Need to Enhance in Strapi:**
```graphql
# Add missing fields to existing MiniappManager
type MiniappManager {
  documentId: ID!
  category: String!                # Hạng mục (Banner, Logo, etc.)
  files: [UploadFile!]            # Tập tin
  description: String             # Mô tả
  display_order: Int              # Thứ tự hiển thị
  status: ENUM_MINIAPP_STATUS     # Trạng thái
  content_text: String           # Đoạn văn bản
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

enum ENUM_MINIAPP_STATUS {
  Active
  Inactive
}

input MiniappManagerInput {
  category: String
  files: [ID!]
  description: String
  display_order: Int
  status: ENUM_MINIAPP_STATUS
  content_text: String
  publishedAt: DateTime
}
```

## 2. Authentication & Zalo Integration APIs

### 2.1 Zalo Phone Number API (MISSING)
**Current REST:** `GET https://graph.zalo.me/v2.0/me/info`
**Missing in Schema:** Zalo integration

**Need to Create Custom Resolver:**
```graphql
type ZaloPhoneResponse {
  phone_number: String!
  success: Boolean!
  error_message: String
}

input ZaloPhoneInput {
  access_token: String!
  code: String!
  secret_key: String!
}

# Custom resolver (not standard Strapi)
type Query {
  getZaloPhoneNumber(input: ZaloPhoneInput!): ZaloPhoneResponse!
}
```

### 2.2 Custom Login with Zalo (MISSING)
**Current REST:** `POST /accounts/login`
**Missing in Schema:** Custom login with Zalo integration

**Need to Create Custom Mutation:**
```graphql
type CustomLoginResponse {
  jwt: String!
  isAdmin: Boolean!
  isMember: Boolean!
  user_info: JSON!
  zaloIDByOA: String
}

input CustomLoginInput {
  accessToken: String!
  phoneNumber: String
}

type Mutation {
  customLogin(input: CustomLoginInput!): CustomLoginResponse!
}
```

## 3. Event Management APIs (MISSING FEATURES)

### 3.1 Event Registration (MISSING)
**Current REST:** `POST /events/{eventId}/{ticketId}/register`
**Missing in Schema:** Event registration system

**Need to Create in Strapi:**
```graphql
type EventRegistrationResponse {
  documentId: ID!
  event: EventInformation!
  ticket: TicketPricesManage!
  user_data: JSON!
  zaloIdByOA: String!
  registration_status: ENUM_REGISTRATION_STATUS!
  registration_date: DateTime!
  createdAt: DateTime
  updatedAt: DateTime
}

enum ENUM_REGISTRATION_STATUS {
  Pending
  Confirmed
  Cancelled
  Attended
}

input EventRegistrationInput {
  event_id: ID!
  ticket_id: ID!
  user_data: JSON!
  zaloIdByOA: String!
}

type Mutation {
  registerForEvent(input: EventRegistrationInput!): EventRegistrationResponse!
}
```

### 3.2 Event Contact (MISSING)
**Current REST:** `POST /events/{eventId}/contact`
**Missing in Schema:** Event contact system

**Need to Create in Strapi:**
```graphql
type EventContactResponse {
  success: Boolean!
  message: String
}

input EventContactInput {
  event_id: ID!
  zaloIDByOA: String!
  event_name: String!
  message: String
}

type Mutation {
  sendEventContact(input: EventContactInput!): EventContactResponse!
}
```

### 3.3 Event Feedback (MISSING)
**Current REST:** `POST /events/{eventId}/feedback`
**Missing in Schema:** Feedback system

**Need to Create in Strapi:**
```graphql
type EventFeedback {
  documentId: ID!
  event: EventInformation!
  user_zalo_id: String!
  rating: Int!                    # 1-5 stars
  feedback_text: String
  feedback_date: DateTime!
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

input EventFeedbackInput {
  event_id: ID!
  user_zalo_id: String!
  rating: Int!
  feedback_text: String
  publishedAt: DateTime
}

type Mutation {
  submitEventFeedback(input: EventFeedbackInput!): EventFeedback!
}

type Query {
  eventFeedbacks(filters: EventFeedbackFiltersInput): [EventFeedback!]!
  eventFeedback(documentId: ID!): EventFeedback
}
```

## 4. Payment & Financial APIs (MISSING)

### 4.1 VietQR Generation (MISSING)
**Current REST:** `POST /vietqr`
**Missing in Schema:** Payment QR generation

**Need to Create Custom Resolver:**
```graphql
type VietQRResponse {
  qr_code: String!
  qr_data_url: String!
  bank_info: JSON!
  amount: Float!
  description: String!
  success: Boolean!
}

input VietQRInput {
  amount: Float!
  description: String!
  bank_code: String
}

type Mutation {
  generateVietQR(input: VietQRInput!): VietQRResponse!
}
```

### 4.2 Payment Tracking (MISSING)
**Need to Create in Strapi:**
```graphql
type PaymentTransaction {
  documentId: ID!
  transaction_id: String!
  user_zalo_id: String!
  amount: Float!
  description: String!
  payment_method: ENUM_PAYMENT_METHOD!
  status: ENUM_PAYMENT_STATUS!
  qr_code: String
  bank_info: JSON
  created_date: DateTime!
  completed_date: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

enum ENUM_PAYMENT_METHOD {
  VietQR
  BankTransfer
  Cash
}

enum ENUM_PAYMENT_STATUS {
  Pending
  Completed
  Failed
  Cancelled
}
```

## 5. User Management APIs (MISSING FEATURES)

### 5.1 Member Verification (MISSING)
**Current REST:** `PATCH /accounts/verify-account`
**Missing in Schema:** Member verification system

**Need to Create Custom Mutation:**
```graphql
type MemberVerificationResponse {
  success: Boolean!
  verified_member: MemberInformation
  message: String
}

input MemberVerificationInput {
  zalo_id: String!
  current_profile: JSON!
  zalo_id_by_oa: String!
  member_name: String!
}

type Mutation {
  verifyMember(input: MemberVerificationInput!): MemberVerificationResponse!
}
```

### 5.2 Account Creation (MISSING)
**Current REST:** `POST /accounts/create-new-account/{id}`
**Missing in Schema:** Account creation workflow

**Need to Create Custom Mutation:**
```graphql
type AccountCreationResponse {
  success: Boolean!
  created_account: Account
  message: String
}

input AccountCreationInput {
  member_id: ID!
  account_data: JSON!
}

type Mutation {
  createNewAccount(input: AccountCreationInput!): AccountCreationResponse!
}
```

### 5.3 JSON Data Backup (MISSING)
**Current REST:** `POST /accounts/save-json?overwrite={overwrite}`
**Missing in Schema:** Data backup system

**Need to Create Custom Mutation:**
```graphql
type SaveJsonResponse {
  success: Boolean!
  backup_id: String
  message: String
}

input SaveJsonInput {
  data: JSON!
  overwrite: Boolean! = false
}

type Mutation {
  saveJsonData(input: SaveJsonInput!): SaveJsonResponse!
}
```

## 6. Ticket Management APIs (MISSING FEATURES)

### 6.1 Ticket QR Code Generation (MISSING)
**Current Usage:** QR codes for tickets
**Missing in Schema:** QR code generation for tickets

**Need to Create in Strapi:**
```graphql
type TicketQRResponse {
  qr_code: String!
  qr_data_url: String!
  ticket_code: String!
  success: Boolean!
}

input TicketQRInput {
  ticket_id: ID!
  user_zalo_id: String!
}

type Mutation {
  generateTicketQR(input: TicketQRInput!): TicketQRResponse!
}
```

### 6.2 Ticket Validation (MISSING)
**Current REST:** `GET /users/tickets/{code}`
**Missing in Schema:** Ticket code validation

**Need to Create in Strapi:**
```graphql
type TicketValidationResponse {
  valid: Boolean!
  ticket: EventRegistration
  event: EventInformation
  message: String
}

type Query {
  validateTicketCode(code: String!): TicketValidationResponse!
}
```

### 6.3 My Tickets with Enhanced Data (MISSING)
**Current REST:** `GET /users/mytickets/{zaloID}`
**Missing in Schema:** Enhanced ticket queries

**Need to Enhance Existing EventRegistration:**
```graphql
type Query {
  myTickets(zalo_id: String!): [EventRegistration!]!
  myTicketsWithEvents(zalo_id: String!): [TicketWithEventInfo!]!
}

type TicketWithEventInfo {
  ticket: EventRegistration!
  event: EventInformation!
  ticket_price: TicketPricesManage!
  qr_code: String
  status: ENUM_REGISTRATION_STATUS!
}
```

## 7. Sponsor Management APIs (MISSING FEATURES)

### 7.1 Sponsor Categories (MISSING)
**Current REST:** `GET /sponsors/a`, `GET /sponsors/b`
**Missing in Schema:** Sponsor categorization

**Need to Enhance Existing Sponsor:**
```graphql
type Sponsor {
  documentId: ID!
  # ... existing fields ...
  category: ENUM_SPONSOR_CATEGORY!
  tier: ENUM_SPONSOR_TIER!
  display_order: Int
  is_featured: Boolean
}

enum ENUM_SPONSOR_CATEGORY {
  Category_A
  Category_B
  General
}

enum ENUM_SPONSOR_TIER {
  Platinum
  Gold
  Silver
  Bronze
}

type Query {
  sponsorsByCategory(category: ENUM_SPONSOR_CATEGORY!): [Sponsor!]!
  featuredSponsors: [Sponsor!]!
}
```

### 7.2 CBB Sponsor Info (MISSING)
**Current REST:** `GET /sponsors/cbb`
**Missing in Schema:** Special CBB sponsor

**Need to Create in Strapi:**
```graphql
type CBBSponsorInfo {
  documentId: ID!
  name: String!
  logo: UploadFile
  description: String
  website: String
  contact_info: JSON
  is_active: Boolean!
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

type Query {
  cbbSponsorInfo: CBBSponsorInfo
}
```

## 8. Group/Chapter Management APIs (MISSING FEATURES)

### 8.1 Group Events (MISSING)
**Current REST:** `GET /groups/{groupId}/events`
**Missing in Schema:** Group-specific events

**Need to Create Relationship:**
```graphql
type Chapter {
  # ... existing fields ...
  events_connection(filters: EventInformationFiltersInput): EventInformationRelationResponseCollection
  events(filters: EventInformationFiltersInput): [EventInformation!]!
}

type Query {
  chapterEvents(chapter_id: ID!): [EventInformation!]!
}
```

## 9. Admin Management APIs (MISSING)

### 9.1 Member Management (MISSING)
**Current REST:** `GET /members?page={page}`, `GET /potentials?page={page}`
**Missing in Schema:** Admin member management

**Need to Create Admin Queries:**
```graphql
type AdminMemberResponse {
  members: [MemberInformation!]!
  pagination: PaginationInfo!
  total_count: Int!
}

type AdminPotentialResponse {
  potentials: [PotentialMember!]!
  pagination: PaginationInfo!
  total_count: Int!
}

type Query {
  # Admin only queries
  adminMembers(page: Int!, limit: Int! = 20): AdminMemberResponse!
  adminPotentials(page: Int!, limit: Int! = 20): AdminPotentialResponse!
  adminMemberById(member_id: ID!): MemberInformation
}
```

### 9.2 System Statistics (MISSING)
**Need to Create for Admin Dashboard:**
```graphql
type SystemStatistics {
  total_members: Int!
  total_events: Int!
  total_registrations: Int!
  total_sponsors: Int!
  active_accounts: Int!
  pending_verifications: Int!
  recent_activities: [JSON!]!
}

type Query {
  systemStatistics: SystemStatistics!
}
```

## 10. File Upload Management (MISSING)

### 10.1 Enhanced File Upload (MISSING)
**Current Usage:** File uploads for various entities
**Missing in Schema:** File management system

**Need to Enhance UploadFile:**
```graphql
type UploadFile {
  # ... existing fields ...
  category: String
  uploaded_by: String
  file_purpose: ENUM_FILE_PURPOSE
  is_public: Boolean!
}

enum ENUM_FILE_PURPOSE {
  MemberPhoto
  EventBanner
  SponsorLogo
  PostImage
  BankQR
  TicketQR
  AppBanner
}
```

## 11. Notification System (COMPLETELY MISSING)

### 11.1 Notification Management
**Need to Create Completely New:**
```graphql
type Notification {
  documentId: ID!
  title: String!
  message: String!
  recipient_zalo_id: String!
  notification_type: ENUM_NOTIFICATION_TYPE!
  related_entity_id: String
  related_entity_type: String
  is_read: Boolean!
  sent_date: DateTime!
  read_date: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}

enum ENUM_NOTIFICATION_TYPE {
  EventRegistration
  EventReminder
  PaymentConfirmation
  MembershipUpdate
  SystemAlert
}

type Query {
  myNotifications(zalo_id: String!): [Notification!]!
  unreadNotifications(zalo_id: String!): [Notification!]!
}

type Mutation {
  markNotificationAsRead(notification_id: ID!): Notification!
  markAllNotificationsAsRead(zalo_id: String!): Boolean!
}
```

## 12. Search & Filter APIs (MISSING)

### 12.1 Global Search
**Need to Create:**
```graphql
type SearchResult {
  entity_type: String!
  entity_id: String!
  title: String!
  description: String
  url: String
  relevance_score: Float
}

type Query {
  globalSearch(query: String!, limit: Int! = 10): [SearchResult!]!
  searchMembers(query: String!): [MemberInformation!]!
  searchEvents(query: String!): [EventInformation!]!
  searchPosts(query: String!): [Post!]!
}
```

## Summary of Missing APIs

### Critical Missing (Must Implement):
1. **AppConfig** - App configuration management
2. **LayoutConfig** - Layout and theme configuration
3. **VietQR** - Payment QR generation
4. **Event Registration** - Event signup system
5. **Custom Login** - Zalo integration login

### Important Missing (Should Implement):
1. **Event Feedback** - Rating and feedback system
2. **Member Verification** - Admin verification workflow
3. **Ticket QR** - Ticket QR code generation
4. **Sponsor Categories** - A/B sponsor classification
5. **Notification System** - User notifications

### Nice to Have Missing (Can Implement Later):
1. **Search System** - Global search functionality
2. **System Statistics** - Admin dashboard data
3. **File Management** - Enhanced file handling
4. **Payment Tracking** - Transaction management

**Total Missing APIs: 35+ endpoints/features**

These missing APIs represent about 40% of your current REST API functionality that needs to be implemented in Strapi to achieve full feature parity.
```
