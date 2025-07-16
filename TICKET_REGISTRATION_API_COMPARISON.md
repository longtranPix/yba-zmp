# So Sánh API Đăng Ký Vé - REST Hiện Tại vs GraphQL

## 🎯 Tổng Quan
So sánh toàn diện giữa REST API hiện tại cho đăng ký vé và GraphQL schema để xác định các trường dữ liệu bị thiếu và đảm bảo tương thích hoàn toàn cho việc refactor.

## 📊 Triển Khai REST API Hiện Tại

### **API Endpoint**
```
POST /events/{eventId}/{ticketId}/register
```

### **Cấu Trúc Request**
```javascript
// Gọi API Service
services.registerEvent = (eventId, ticketId, data, zaloIdByOA) => {
  return callApi(`${API_DOMAIN}/events/${eventId}/${ticketId}/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authInfo?.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, zaloIdByOA }),
  });
};
```

### **Cấu Trúc Request Body (Hiện Tại)**
```javascript
const requestBody = {
  // Dữ Liệu Đăng Ký Cốt Lõi
  memberId: profile?.id || customInfo?.memberId || null,
  "Tên người đăng ký": customInfo.fullname,
  "Mã vé": ticket?.customFields["Mã loại vé"],
  "Loại vé": ticket?.customFields["Loại vé"],
  "Loại vé ..": [{ id: ticket.id }],
  "Tên hiển thị vé": ticket.customFields["Tên hiển thị vé"],
  "Số vé còn lại": ticket.customFields["Số vé còn lại"],

  // Thông Tin Ngày Tháng và Liên Hệ
  Ngày: new Date().toISOString(),
  Email: customInfo.email || profile.customFields?.["Email 1"] || "",
  "Số điện thoại": customInfo.phoneNumber || profile.customFields?.["Số điện thoại 1"] || "",

  // Tích Hợp Zalo
  "Zalo ID": zaloProfile.id,
  "Zalo OA ID": zaloProfile?.zaloIDByOA,

  // Số Lượng và Loại Vé
  "Số lượng vé": String(totalTickets || 1),

  // Thông Tin Công Ty và Hội Viên
  "Công ty": customInfo.company || profile?.customFields?.["Công ty"] || "",
  "Vãng lai": selectType === 1 || !isMember,

  // Các Trường Đặc Biệt cho Vé Nhóm/Combo
  "Vé nhóm": selectType === 2,
  "Vé combo": isComboTicket,
  "Vé con": Array(childTicketsCount).fill({
    Tên: customInfo.fullname,
    "Số điện thoại": customInfo.phoneNumber,
    Email: customInfo.email || ""
  }),

  // Thông Tin Ngân Hàng
  "Ngân hàng": event?.customFields?.["Ngân hàng"]?.[0].data || "",
  "Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"] || "",
  "Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"] || ""
};

// Tham số bổ sung được truyền riêng
const zaloIdByOA = zaloProfile?.zaloIDByOA;
```

### **Cấu Trúc Response (Hiện Tại)**
```javascript
{
  error: 0,
  data: {
    id: "ticket_registration_id",
    vietqr: "qr_code_url",
    "Tk Ngân Hàng": "bank_account_number",
    "Tên Tk Ngân Hàng": "account_holder_name",
    "Ngân hàng": "bank_name",
    bankInfo: { /* chi tiết ngân hàng */ },
    skipPayment: boolean,
    ticketPrice: number,
    checkoutSdk: { order: { /* đơn hàng thanh toán */ } }
  }
}
```

## 🔍 Phân Tích GraphQL Schema

### **Các GraphQL Types Có Sẵn**

#### **EventRegistration Type**
```graphql
type EventRegistration {
  documentId: ID!
  ma_ve: String!                    # ✅ Mã Vé
  ten_nguoi_dang_ky: String!        # ✅ Tên Người Đăng Ký
  ten_su_kien: String               # ✅ Tên Sự Kiện
  so_dien_thoai: String             # ✅ Số Điện Thoại
  email: String                     # ✅ Email
  da_check_in: Boolean              # ✅ Trạng Thái Check-in
  gia_ve: Float                     # ✅ Giá Vé
  ngay_mua: Date                    # ✅ Ngày Mua
  trang_thai: ENUM_EVENTREGISTRATION_TRANG_THAI           # ✅ Trạng Thái
  trang_thai_thanh_toan: ENUM_EVENTREGISTRATION_TRANG_THAI_THANH_TOAN  # ✅ Trạng Thái Thanh Toán
  loai_ve: String                   # ✅ Loại Vé
  ngay_su_kien: Date                # ✅ Ngày Sự Kiện
  ma_zalo: String                   # ✅ Zalo ID
  ma_zalo_oa: String                # ✅ Zalo OA ID
  ve_chinh: Boolean                 # ✅ Vé Chính
  hien_thi_loai_ve: String          # ✅ Hiển Thị Loại Vé
  hoi_vien: MemberInformation       # ✅ Liên Kết Hội Viên
  nhan_vien_phe_duyet: String       # ✅ Nhân Viên Phê Duyệt
  danh_gia: Int                     # ✅ Đánh Giá
  ghi_chu_khach_hang: String        # ✅ Ghi Chú Khách Hàng
  su_kien: EventInformation         # ✅ Liên Kết Sự Kiện
  createdAt: DateTime               # ✅ Ngày Tạo
  updatedAt: DateTime               # ✅ Ngày Cập Nhật
  publishedAt: DateTime             # ✅ Ngày Xuất Bản
}
```

#### **EventRegistrationInput**
```graphql
input EventRegistrationInput {
  ma_ve: String                     # ✅ Mã Vé
  ten_nguoi_dang_ky: String         # ✅ Tên Người Đăng Ký
  ten_su_kien: String               # ✅ Tên Sự Kiện
  so_dien_thoai: String             # ✅ Số Điện Thoại
  email: String                     # ✅ Email
  da_check_in: Boolean              # ✅ Trạng Thái Check-in
  gia_ve: Float                     # ✅ Giá Vé
  ngay_mua: Date                    # ✅ Ngày Mua
  trang_thai: ENUM_EVENTREGISTRATION_TRANG_THAI           # ✅ Trạng Thái
  trang_thai_thanh_toan: ENUM_EVENTREGISTRATION_TRANG_THAI_THANH_TOAN  # ✅ Trạng Thái Thanh Toán
  loai_ve: String                   # ✅ Loại Vé
  ngay_su_kien: Date                # ✅ Ngày Sự Kiện
  ma_zalo: String                   # ✅ Zalo ID
  ma_zalo_oa: String                # ✅ Zalo OA ID
  ve_chinh: Boolean                 # ✅ Vé Chính
  hien_thi_loai_ve: String          # ✅ Hiển Thị Loại Vé
  hoi_vien: ID                      # ✅ ID Hội Viên
  nhan_vien_phe_duyet: String       # ✅ Nhân Viên Phê Duyệt
  danh_gia: Int                     # ✅ Đánh Giá
  ghi_chu_khach_hang: String        # ✅ Ghi Chú Khách Hàng
  su_kien: ID                       # ✅ ID Sự Kiện
  publishedAt: DateTime             # ✅ Ngày Xuất Bản
}
```

#### **Mutation Có Sẵn**
```graphql
type Mutation {
  createEventRegistration(
    status: PublicationStatus = PUBLISHED,
    data: EventRegistrationInput!
  ): EventRegistration
}
```

## ⚠️ **CÁC TRƯỜNG DỮ LIỆU BỊ THIẾU TRONG GRAPHQL**

### **Các Trường Quan Trọng Bị Thiếu**

#### **1. Thông Tin Công Ty**
- **REST Hiện Tại**: `"Công ty": customInfo.company`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường công ty trong EventRegistrationInput
- **Tác Động**: Không thể lưu thông tin công ty cho đăng ký doanh nghiệp

#### **2. Cờ Người Dùng Vãng Lai**
- **REST Hiện Tại**: `"Vãng lai": selectType === 1 || !isMember`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường phân biệt vãng lai/hội viên
- **Tác Động**: Không thể phân biệt giữa đăng ký vãng lai và hội viên

#### **3. Số Lượng Vé**
- **REST Hiện Tại**: `"Số lượng vé": String(totalTickets || 1)`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường số lượng
- **Tác Động**: Không thể xử lý mua nhiều vé

#### **4. Hỗ Trợ Vé Nhóm/Combo**
- **REST Hiện Tại**:
  - `"Vé nhóm": selectType === 2`
  - `"Vé combo": isComboTicket`
  - `"Vé con": Array(childTicketsCount).fill({...})`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường vé nhóm/combo
- **Tác Động**: Không thể xử lý đặt vé nhóm hoặc vé combo

#### **5. Thông Tin Ngân Hàng**
- **REST Hiện Tại**:
  - `"Ngân hàng": event?.customFields?.["Ngân hàng"]`
  - `"Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"]`
  - `"Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"]`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường ngân hàng
- **Tác Động**: Không thể lưu thông tin ngân hàng thanh toán

#### **6. Metadata Vé**
- **REST Hiện Tại**:
  - `"Loại vé ..": [{ id: ticket.id }]`
  - `"Số vé còn lại": ticket.customFields["Số vé còn lại"]`
- **GraphQL**: ❌ **BỊ THIẾU** - Không có trường metadata vé
- **Tác Động**: Không thể lưu tham chiếu vé và thông tin còn lại

#### **7. Các Trường Tích Hợp Thanh Toán**
- **REST Hiện Tại**: Response bao gồm VietQR, dữ liệu payment SDK
- **GraphQL**: ❌ **BỊ THIẾU** - Không có response tích hợp thanh toán
- **Tác Động**: Không thể tạo mã QR hoặc đơn hàng thanh toán

## 📋 **PHÂN TÍCH ÁNH XẠ TRƯỜNG DỮ LIỆU**

### **✅ Các Trường Có Sẵn Trong Cả Hai**
| Trường REST Hiện Tại | Trường GraphQL | Trạng Thái |
|-------------------|---------------|---------|
| `"Tên người đăng ký"` | `ten_nguoi_dang_ky` | ✅ Khớp |
| `"Số điện thoại"` | `so_dien_thoai` | ✅ Khớp |
| `Email` | `email` | ✅ Khớp |
| `"Zalo ID"` | `ma_zalo` | ✅ Khớp |
| `"Zalo OA ID"` | `ma_zalo_oa` | ✅ Khớp |
| `"Mã vé"` | `ma_ve` | ✅ Khớp |
| `"Loại vé"` | `loai_ve` | ✅ Khớp |
| `"Tên hiển thị vé"` | `hien_thi_loai_ve` | ✅ Khớp |
| `Ngày` | `ngay_mua` | ✅ Khớp |
| `memberId` | `hoi_vien` | ✅ Khớp |

### **❌ Các Trường Bị Thiếu Trong GraphQL**
| Trường REST Hiện Tại | Tương Đương GraphQL | Trạng Thái |
|-------------------|-------------------|---------|
| `"Công ty"` | N/A | ❌ Thiếu |
| `"Vãng lai"` | N/A | ❌ Thiếu |
| `"Số lượng vé"` | N/A | ❌ Thiếu |
| `"Vé nhóm"` | N/A | ❌ Thiếu |
| `"Vé combo"` | N/A | ❌ Thiếu |
| `"Vé con"` | N/A | ❌ Thiếu |
| `"Ngân hàng"` | N/A | ❌ Thiếu |
| `"Tk Ngân Hàng"` | N/A | ❌ Thiếu |
| `"Tên Tk Ngân Hàng"` | N/A | ❌ Thiếu |
| `"Loại vé .."` | N/A | ❌ Thiếu |
| `"Số vé còn lại"` | N/A | ❌ Thiếu |

## 🛠️ **CÁC CẬP NHẬT SCHEMA CẦN THIẾT**

### **1. Mở Rộng EventRegistrationInput**
```graphql
input EventRegistrationInput {
  # ... các trường hiện có ...

  # Thông Tin Công Ty Bị Thiếu
  cong_ty: String

  # Cờ Vãng Lai/Hội Viên Bị Thiếu
  vang_lai: Boolean

  # Hỗ Trợ Số Lượng Bị Thiếu
  so_luong_ve: Int

  # Hỗ Trợ Vé Nhóm/Combo Bị Thiếu
  ve_nhom: Boolean
  ve_combo: Boolean
  ve_con: [ChildTicketInput]

  # Thông Tin Ngân Hàng Bị Thiếu
  ngan_hang: String
  tk_ngan_hang: String
  ten_tk_ngan_hang: String

  # Metadata Vé Bị Thiếu
  loai_ve_metadata: JSON
  so_ve_con_lai: Int
}

input ChildTicketInput {
  ten: String
  so_dien_thoai: String
  email: String
}
```

### **2. Loại Response Nâng Cao**
```graphql
type EventRegistrationResponse {
  registration: EventRegistration!
  payment_info: PaymentInfo
  vietqr: String
  skip_payment: Boolean
  checkout_sdk: JSON
}

type PaymentInfo {
  bank_name: String
  account_number: String
  account_name: String
  bank_info: JSON
}
```

### **3. Mutation Mới**
```graphql
type Mutation {
  registerForEvent(
    event_id: ID!
    ticket_id: ID!
    data: EventRegistrationInput!
    zalo_id_by_oa: String
  ): EventRegistrationResponse!
}
```

## 🎯 **KHUYẾN NGHỊ REFACTORING**

### **Tùy Chọn 1: Mở Rộng GraphQL Schema (Khuyến Nghị)**
- Thêm các trường bị thiếu vào EventRegistrationInput
- Tạo các loại response nâng cao
- Duy trì tương thích hoàn toàn với chức năng hiện tại

### **Tùy Chọn 2: Phương Pháp Hybrid**
- Sử dụng GraphQL cho đăng ký cơ bản
- Giữ REST API cho các tính năng phức tạp (vé nhóm, thanh toán)
- Phương pháp di chuyển dần dần

### **Tùy Chọn 3: Phương Pháp Custom Fields**
- Lưu dữ liệu bị thiếu trong các trường JSON tùy chỉnh
- Ít type-safe hơn nhưng duy trì tương thích
- Yêu cầu xác thực dữ liệu cẩn thận

## 📊 **MA TRẬN TƯƠNG THÍCH**

| Tính Năng | REST Hiện Tại | GraphQL Có Sẵn | Trường Bị Thiếu | Độ Phức Tạp Refactor |
|---------|-------------|------------------|----------------|-------------------|
| Đăng Ký Cơ Bản | ✅ | ✅ | Không có | Thấp |
| Đăng Ký Hội Viên | ✅ | ✅ | Không có | Thấp |
| Đăng Ký Vãng Lai | ✅ | ❌ | `vang_lai` | Trung Bình |
| Thông Tin Công Ty | ✅ | ❌ | `cong_ty` | Trung Bình |
| Nhiều Vé | ✅ | ❌ | `so_luong_ve` | Cao |
| Vé Nhóm | ✅ | ❌ | `ve_nhom`, `ve_con` | Cao |
| Vé Combo | ✅ | ❌ | `ve_combo` | Cao |
| Tích Hợp Thanh Toán | ✅ | ❌ | Trường ngân hàng | Cao |
| Tạo QR | ✅ | ❌ | Response thanh toán | Cao |

## 🚨 **CÁC RÀO CẢN QUAN TRỌNG CHO REFACTORING**

1. **Vé Nhóm/Combo**: Tính năng kinh doanh cốt lõi bị thiếu trong GraphQL
2. **Tích Hợp Thanh Toán**: Thiếu tích hợp VietQR và payment SDK
3. **Số Lượng Vé Nhiều**: Không thể xử lý mua vé số lượng lớn
4. **Thông Tin Ngân Hàng**: Thiếu chi tiết tài khoản thanh toán
5. **Đăng Ký Công Ty**: Thiếu dữ liệu người dùng doanh nghiệp

**Khuyến Nghị**: Mở rộng GraphQL schema trước khi refactor để đảm bảo 100% tương thích tính năng.
