# Data Models: AppConfig và LayoutConfig - YBA HCM (Based on Actual Source Code)

## Tổng Quan
Tài liệu này định nghĩa cấu trúc dữ liệu cho AppConfig và LayoutConfig dựa trên phân tích source code thực tế của ứng dụng YBA HCM.

## 1. AppConfig Data Model (Actual Usage)

### 1.1 Cấu Trúc Hiện Tại (từ API `/configs`)
```graphql
type AppConfig {
  documentId: ID!
  oaInfo: OAInfo!                   # Thông tin Official Account
  bankInfo: BankInfo!               # Thông tin ngân hàng
  banners: [BannerConfig!]!         # Danh sách banner
  appInfo: AppInfo                  # Thông tin ứng dụng (optional)
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}
```

### 1.2 OAInfo (Official Account - Actual Usage)
```graphql
type OAInfo {
  id: String!                       # ID Official Account Zalo
  name: String                      # Tên Official Account (optional)
}

input OAInfoInput {
  id: String!
  name: String
}
```

### 1.3 BankInfo (Bank Information - Actual Usage)
```graphql
type BankInfo {
  accountNumber: String!            # Số tài khoản
  accountName: String!              # Tên chủ tài khoản
  bankName: String!                 # Tên ngân hàng
  bankInfo: BankInfoData            # Thông tin bổ sung
}

type BankInfoData {
  data: String                      # Dữ liệu bổ sung
  id: String                        # ID thông tin
}

input BankInfoInput {
  accountNumber: String!
  accountName: String!
  bankName: String!
  bankInfo: BankInfoDataInput
}

input BankInfoDataInput {
  data: String
  id: String
}
```

### 1.4 BannerConfig (Banner Configuration - Actual Usage)
```graphql
type BannerConfig {
  image: String!                    # URL hình ảnh banner
  url: String                       # URL liên kết (có thể là "#")
  id: String!                       # ID banner
}

input BannerConfigInput {
  image: String!
  url: String
  id: String!
}
```

### 1.5 AppInfo (Application Info - Actual Usage)
```graphql
type AppInfo {
  version: String                   # Phiên bản ứng dụng
  environment: String               # Môi trường (development/production)
}

input AppInfoInput {
  version: String
  environment: String
}
```

### 1.6 AppConfig Queries và Mutations
```graphql
input AppConfigInput {
  oaInfo: OAInfoInput!
  bankInfo: BankInfoInput!
  banners: [BannerConfigInput!]!
  appInfo: AppInfoInput
  publishedAt: DateTime
}

type Query {
  appConfig: AppConfig              # Lấy cấu hình ứng dụng
}

type Mutation {
  createAppConfig(data: AppConfigInput!): AppConfig!
  updateAppConfig(documentId: ID!, data: AppConfigInput!): AppConfig!
  deleteAppConfig(documentId: ID!): DeleteMutationResponse!
}
```

## 2. LayoutConfig Data Model (Actual Usage)

### 2.1 Cấu Trúc Hiện Tại (từ API `/layout` và navigation-bar.jsx)
```graphql
type LayoutConfig {
  documentId: ID!
  header_background_color: String   # Màu nền header
  header_show_logo: Boolean         # Hiển thị logo
  header_show_title: Boolean        # Hiển thị tiêu đề
  header_text_color: String         # Màu chữ header
  header_type: String               # Loại header
  navigation_items: [NavigationItem!] # Các mục navigation
  navigation_type: String           # Loại navigation
  nav_background: String            # Nền navigation (URL ảnh)
  theme_background_color: String    # Màu nền theme
  theme_primary_color: String       # Màu chính theme
  theme_secondary_color: String     # Màu phụ theme
  theme_text_color: String          # Màu chữ theme
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}
```

### 2.2 NavigationItem (Actual Usage)
```graphql
type NavigationItem {
  route: String!                    # Đường dẫn (VD: "/", "/events")
  label: String!                    # Nhãn hiển thị (VD: "Trang chủ")
  item_id: String!                  # ID mục (VD: "home", "events")
  icon: String!                     # Icon (VD: "zi-home", "zi-calendar")

  # Các trường tùy chỉnh từ customFields
  display_name: String              # Tên hiển thị tùy chỉnh
  background_color: String          # Màu nền active
  text_color: String                # Màu chữ
  text_color_active: String         # Màu chữ khi active
  fill_active: Boolean              # Fill màu khi active
}

input NavigationItemInput {
  route: String!
  label: String!
  item_id: String!
  icon: String!
  display_name: String
  background_color: String
  text_color: String
  text_color_active: String
  fill_active: Boolean
}
```

### 2.3 LayoutConfig Input và Mutations
```graphql
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

type Query {
  layoutConfig: LayoutConfig        # Lấy cấu hình layout
}

type Mutation {
  createLayoutConfig(data: LayoutConfigInput!): LayoutConfig!
  updateLayoutConfig(documentId: ID!, data: LayoutConfigInput!): LayoutConfig!
  deleteLayoutConfig(documentId: ID!): DeleteMutationResponse!
}
```

## 3. MiniappConfig Data Model (Actual Usage)

### 3.1 Cấu Trúc Hiện Tại (từ API `/miniapp`)
```graphql
type MiniappConfig {
  documentId: ID!
  customFields: MiniappCustomFields!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}

type MiniappCustomFields {
  category: String!                 # Hạng mục (VD: "Logo", "Slogan", "Banner Hình Ảnh")
  files: [MiniappFile!]            # Tập tin
  text_content: String              # Văn bản (cho Slogan)
  description: String               # Mô tả
  display_order: Int                # Thứ tự hiển thị
  status: String                    # Trạng thái
}

type MiniappFile {
  id: String!                       # ID file
  url: String!                      # URL file
  name: String!                     # Tên file
  size: Int                         # Kích thước file
  type: String                      # Loại file
  alt: String                       # Alt text
}

input MiniappConfigInput {
  customFields: MiniappCustomFieldsInput!
  publishedAt: DateTime
}

input MiniappCustomFieldsInput {
  category: String!
  files: [MiniappFileInput!]
  text_content: String
  description: String
  display_order: Int
  status: String
}

input MiniappFileInput {
  id: String!
  url: String!
  name: String!
  size: Int
  type: String
  alt: String
}

type Query {
  miniappConfigs: [MiniappConfig!]! # Lấy tất cả cấu hình miniapp
  miniappConfig(documentId: ID!): MiniappConfig # Lấy cấu hình theo ID
}

type Mutation {
  createMiniappConfig(data: MiniappConfigInput!): MiniappConfig!
  updateMiniappConfig(documentId: ID!, data: MiniappConfigInput!): MiniappConfig!
  deleteMiniappConfig(documentId: ID!): DeleteMutationResponse!
}
```
```

## 4. App-Config.json Structure (ZMP Configuration)

### 4.1 Cấu Trúc Hiện Tại (app-config.json)
```json
{
  "app": {
    "title": "YBA HCM",
    "headerTitle": "zmp-blank-templates",
    "headerColor": "#ffffff",
    "textColor": "#333333",
    "textAlign": "left",
    "statusBarColor": "#1843EF",
    "leftButton": "back",
    "statusBarType": "normal",
    "actionBarHidden": true,
    "hideAndroidBottomNavigationBar": false,
    "hideIOSSafeAreaBottom": false
  },
  "debug": false,
  "pages": [],
  "listCSS": [],
  "listSyncJS": [],
  "listAsyncJS": [],
  "api": {
    "development": {
      "domain": "http://192.168.0.108:3038"
    },
    "production": {
      "domain": "https://yba.tsx.vn"
    }
  }
}
```

### 4.2 ZMP App Configuration Type
```graphql
type ZMPAppConfig {
  app: ZMPAppSettings!
  debug: Boolean!
  pages: [String!]!
  listCSS: [String!]!
  listSyncJS: [String!]!
  listAsyncJS: [String!]!
  api: ZMPApiConfig!
}

type ZMPAppSettings {
  title: String!                    # Tiêu đề ứng dụng
  headerTitle: String!              # Tiêu đề header
  headerColor: String!              # Màu header
  textColor: String!                # Màu chữ
  textAlign: String!                # Căn chỉnh chữ
  statusBarColor: String!           # Màu status bar
  leftButton: String!               # Nút bên trái
  statusBarType: String!            # Loại status bar
  actionBarHidden: Boolean!         # Ẩn action bar
  hideAndroidBottomNavigationBar: Boolean! # Ẩn nav bar Android
  hideIOSSafeAreaBottom: Boolean!   # Ẩn safe area iOS
}

type ZMPApiConfig {
  development: ZMPEnvironment!
  production: ZMPEnvironment!
}

type ZMPEnvironment {
  domain: String!                   # Domain API
}
```

## 5. Summary - Actual Data Models Used

### 5.1 AppConfig (API: `/configs`)
- **oaInfo**: `{ id, name }`
- **bankInfo**: `{ accountNumber, accountName, bankName, bankInfo: { data, id } }`
- **banners**: `[{ image, url, id }]`
- **appInfo**: `{ version, environment }` (optional)

### 5.2 LayoutConfig (API: `/layout`)
- **Header**: `header_background_color, header_show_logo, header_show_title, header_text_color, header_type`
- **Navigation**: `navigation_items[], navigation_type, nav_background`
- **Theme**: `theme_background_color, theme_primary_color, theme_secondary_color, theme_text_color`

### 5.3 MiniappConfig (API: `/miniapp`)
- **customFields**: `{ category, files[], text_content, description, display_order, status }`
- **Categories**: "Logo", "Slogan", "Banner Hình Ảnh", etc.

### 5.4 Navigation Items (Used in navigation-bar.jsx)
- **Core**: `route, label, item_id, icon`
- **Styling**: `display_name, background_color, text_color, text_color_active, fill_active`

### 5.5 ZMP Config (app-config.json)
- **App Settings**: Title, colors, status bar, navigation settings
- **API Endpoints**: Development and production domains
- **Resources**: CSS, JS files, pages

---

## Kết Luận

Tài liệu này cung cấp cấu trúc dữ liệu chính xác dựa trên source code thực tế của ứng dụng YBA HCM. Các data model này đã được tối ưu hóa để phù hợp với cách sử dụng hiện tại và có thể được triển khai trực tiếp trong Strapi GraphQL schema.




