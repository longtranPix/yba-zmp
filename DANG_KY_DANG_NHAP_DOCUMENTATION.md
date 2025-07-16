# Tài Liệu Hệ Thống Đăng Ký và Đăng Nhập - YBA HCM

## Tổng Quan Hệ Thống
Hệ thống YBA HCM sử dụng GraphQL với Strapi để quản lý đăng ký và đăng nhập người dùng. Hệ thống hỗ trợ hai loại tài khoản chính:

1. **Tài khoản Strapi** (`UsersPermissionsUser`) - Hệ thống xác thực cơ bản
2. **Tài khoản YBA** (`Account`) - Tài khoản tùy chỉnh với tích hợp Zalo

## 1. Hệ Thống Tài Khoản Strapi (UsersPermissionsUser)

### 1.1 Cấu Trúc Tài Khoản
```graphql
type UsersPermissionsUser {
  documentId: ID!
  username: String!           # Tên đăng nhập
  email: String!              # Email
  provider: String            # Nhà cung cấp (local, google, facebook...)
  confirmed: Boolean          # Đã xác nhận email
  blocked: Boolean            # Tài khoản bị khóa
  role: UsersPermissionsRole  # Vai trò người dùng
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}
```

### 1.2 Đăng Ký Tài Khoản Mới
**Mutation:** `register`
```graphql
mutation DangKyTaiKhoan($input: UsersPermissionsRegisterInput!) {
  register(input: $input) {
    jwt                    # Token xác thực
    user {                 # Thông tin người dùng
      id
      documentId
      username
      email
      confirmed
      role {
        id
        name
        type
      }
    }
  }
}
```

**Input:**
```graphql
input UsersPermissionsRegisterInput {
  username: String!        # Tên đăng nhập (bắt buộc)
  email: String!          # Email (bắt buộc)
  password: String!       # Mật khẩu (bắt buộc)
}
```

**Ví dụ sử dụng:**
```javascript
const variables = {
  input: {
    username: "nguyenvana",
    email: "nguyenvana@example.com",
    password: "matkhau123"
  }
};
```

### 1.3 Đăng Nhập
**Mutation:** `login`
```graphql
mutation DangNhap($input: UsersPermissionsLoginInput!) {
  login(input: $input) {
    jwt                    # Token xác thực
    user {                 # Thông tin người dùng
      id
      documentId
      username
      email
      confirmed
      blocked
      role {
        id
        name
        description
        type
      }
    }
  }
}
```

**Input:**
```graphql
input UsersPermissionsLoginInput {
  identifier: String!      # Email hoặc username
  password: String!        # Mật khẩu
  provider: String! = "local"  # Nhà cung cấp (mặc định: local)
}
```

**Ví dụ sử dụng:**
```javascript
const variables = {
  input: {
    identifier: "nguyenvana@example.com",  // hoặc "nguyenvana"
    password: "matkhau123",
    provider: "local"
  }
};
```

### 1.4 Lấy Thông Tin Người Dùng Hiện Tại
**Query:** `me`
```graphql
query ThongTinCaNhan {
  me {
    id
    documentId
    username
    email
    confirmed
    blocked
    role {
      id
      name
      description
      type
    }
  }
}
```

### 1.5 Quản Lý Mật Khẩu

#### Quên Mật Khẩu
```graphql
mutation QuenMatKhau($email: String!) {
  forgotPassword(email: $email) {
    ok
  }
}
```

#### Đặt Lại Mật Khẩu
```graphql
mutation DatLaiMatKhau($password: String!, $passwordConfirmation: String!, $code: String!) {
  resetPassword(
    password: $password
    passwordConfirmation: $passwordConfirmation
    code: $code
  ) {
    jwt
    user {
      id
      username
      email
    }
  }
}
```

#### Đổi Mật Khẩu
```graphql
mutation DoiMatKhau($currentPassword: String!, $password: String!, $passwordConfirmation: String!) {
  changePassword(
    currentPassword: $currentPassword
    password: $password
    passwordConfirmation: $passwordConfirmation
  ) {
    jwt
    user {
      id
      username
      email
    }
  }
}
```

#### Xác Nhận Email
```graphql
mutation XacNhanEmail($confirmation: String!) {
  emailConfirmation(confirmation: $confirmation) {
    jwt
    user {
      id
      username
      email
      confirmed
    }
  }
}
```

## 2. Hệ Thống Tài Khoản YBA (Account)

### 2.1 Cấu Trúc Tài Khoản YBA
```graphql
type Account {
  documentId: ID!
  ma_zalo: String!                           # Mã Zalo (bắt buộc)
  ten_dang_nhap: String                      # Tên đăng nhập
  loai_tai_khoan: ENUM_ACCOUNT_LOAI_TAI_KHOAN # Loại tài khoản
  ma_zalo_oa: String                         # Mã Zalo OA
  trang_thai: ENUM_ACCOUNT_TRANG_THAI        # Trạng thái tài khoản
  hoi_vien: MemberInformation                # Thông tin hội viên
  so_dien_thoai_zalo: String                 # Số điện thoại Zalo
  chi_hoi: String                            # Chi hội
  ngay_tao: DateTime                         # Ngày tạo
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}
```

### 2.2 Enum Loại Tài Khoản
```graphql
enum ENUM_ACCOUNT_LOAI_TAI_KHOAN {
  Quan_tri_vien    # Quản trị viên
  Hoi_vien         # Hội viên
  Khach            # Khách
}
```

### 2.3 Enum Trạng Thái Tài Khoản
```graphql
enum ENUM_ACCOUNT_TRANG_THAI {
  Kich_hoat        # Kích hoạt
  Khoa_tai_khoan   # Khóa tài khoản
}
```

### 2.4 Tạo Tài Khoản YBA
**Mutation:** `createAccount`
```graphql
mutation TaoTaiKhoanYBA($data: AccountInput!) {
  createAccount(data: $data) {
    documentId
    ma_zalo
    ten_dang_nhap
    loai_tai_khoan
    ma_zalo_oa
    trang_thai
    so_dien_thoai_zalo
    chi_hoi
    ngay_tao
    hoi_vien {
      documentId
      full_name
      email_1
      phone_number_1
    }
  }
}
```

**Input:**
```graphql
input AccountInput {
  ma_zalo: String                            # Mã Zalo
  ten_dang_nhap: String                      # Tên đăng nhập
  loai_tai_khoan: ENUM_ACCOUNT_LOAI_TAI_KHOAN # Loại tài khoản
  ma_zalo_oa: String                         # Mã Zalo OA
  trang_thai: ENUM_ACCOUNT_TRANG_THAI        # Trạng thái
  hoi_vien: ID                               # ID hội viên
  so_dien_thoai_zalo: String                 # Số điện thoại Zalo
  chi_hoi: String                            # Chi hội
  ngay_tao: DateTime                         # Ngày tạo
  publishedAt: DateTime
}
```

**Ví dụ sử dụng:**
```javascript
const variables = {
  data: {
    ma_zalo: "1234567890",
    ten_dang_nhap: "nguyenvana_yba",
    loai_tai_khoan: "Hoi_vien",
    ma_zalo_oa: "oa_yba_hcm",
    trang_thai: "Kich_hoat",
    so_dien_thoai_zalo: "0901234567",
    chi_hoi: "Chi hội Quận 1",
    ngay_tao: new Date().toISOString()
  }
};
```

### 2.5 Truy Vấn Tài Khoản YBA

#### Lấy Danh Sách Tài Khoản
```graphql
query DanhSachTaiKhoan($filters: AccountFiltersInput, $pagination: PaginationArg, $sort: [String]) {
  accounts(filters: $filters, pagination: $pagination, sort: $sort) {
    documentId
    ma_zalo
    ten_dang_nhap
    loai_tai_khoan
    trang_thai
    so_dien_thoai_zalo
    chi_hoi
    hoi_vien {
      documentId
      full_name
      email_1
      phone_number_1
    }
    createdAt
    updatedAt
  }
}
```

#### Lấy Tài Khoản Theo ID
```graphql
query TaiKhoanTheoID($documentId: ID!) {
  account(documentId: $documentId) {
    documentId
    ma_zalo
    ten_dang_nhap
    loai_tai_khoan
    ma_zalo_oa
    trang_thai
    so_dien_thoai_zalo
    chi_hoi
    ngay_tao
    hoi_vien {
      documentId
      full_name
      email_1
      phone_number_1
      member_image {
        url
        name
      }
    }
    createdAt
    updatedAt
  }
}
```

#### Tìm Kiếm Tài Khoản Theo Zalo
```graphql
query TimTaiKhoanTheoZalo($maZalo: String!) {
  accounts(filters: { ma_zalo: { eq: $maZalo } }) {
    documentId
    ma_zalo
    ten_dang_nhap
    loai_tai_khoan
    trang_thai
    so_dien_thoai_zalo
    hoi_vien {
      documentId
      full_name
      email_1
    }
  }
}
```

### 2.6 Cập Nhật Tài Khoản YBA
```graphql
mutation CapNhatTaiKhoanYBA($documentId: ID!, $data: AccountInput!) {
  updateAccount(documentId: $documentId, data: $data) {
    documentId
    ma_zalo
    ten_dang_nhap
    loai_tai_khoan
    trang_thai
    so_dien_thoai_zalo
    chi_hoi
    updatedAt
  }
}
```

### 2.7 Xóa Tài Khoản YBA
```graphql
mutation XoaTaiKhoanYBA($documentId: ID!) {
  deleteAccount(documentId: $documentId) {
    documentId
  }
}
```

## 3. Hệ Thống Ngân Hàng (Bank)

### 3.1 Cấu Trúc Thông Tin Ngân Hàng
```graphql
type Bank {
  documentId: ID!
  ten_chu_tai_khoan: String!    # Tên chủ tài khoản
  ten_ngan_hang: String!        # Tên ngân hàng
  so_tai_khoan: String!         # Số tài khoản
  nguoi_phu_trach: String       # Người phụ trách
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt: DateTime
}
```

### 3.2 Tạo Thông Tin Ngân Hàng
```graphql
mutation TaoThongTinNganHang($data: BankInput!) {
  createBank(data: $data) {
    documentId
    ten_chu_tai_khoan
    ten_ngan_hang
    so_tai_khoan
    nguoi_phu_trach
    createdAt
  }
}
```

**Input:**
```graphql
input BankInput {
  ten_chu_tai_khoan: String!    # Tên chủ tài khoản (bắt buộc)
  ten_ngan_hang: String!        # Tên ngân hàng (bắt buộc)
  so_tai_khoan: String!         # Số tài khoản (bắt buộc)
  nguoi_phu_trach: String       # Người phụ trách
  publishedAt: DateTime
}
```

**Ví dụ sử dụng:**
```javascript
const variables = {
  data: {
    ten_chu_tai_khoan: "Hiệp hội Doanh nhân trẻ TP.HCM",
    ten_ngan_hang: "Ngân hàng TMCP Ngoại thương Việt Nam",
    so_tai_khoan: "0123456789",
    nguoi_phu_trach: "Nguyễn Văn A"
  }
};
```
