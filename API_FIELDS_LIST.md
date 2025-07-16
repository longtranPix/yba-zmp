# API Fields List - YBA HCM

## AppConfig API (`/configs`)
```json
{
  "oaInfo": {
    "id": "String (required)",
    "name": "String (optional)",
    "logo": "String (optional)"
  },
  "bankInfo": {
    "accountNumber": "String (required)",
    "accountName": "String (required)",
    "bankName": "String (required)",
    "bankInfo": {
      "data": "String (optional)",
      "id": "String (optional)"
    }
  },
  "banners": [
    {
      "image": "String (required)",
      "url": "String (optional)",
      "id": "String (required)"
    }
  ],
  "appInfo": {
    "version": "String (optional)",
    "environment": "String (optional)"
  }
}
```

## LayoutConfig API (GraphQL: `http://localhost:3000/graphql`)

### Query
```graphql
query LayoutConfig {
  layoutConfig {
    config
  }
}
```

### Response Structure
```json
{
  "data": {
    "layoutConfig": {
      "config": [
        {
          "id": "String (required)",
          "name": "String (required) - Navigation item name",
          "createdAt": "DateTime",
          "updatedAt": "DateTime",
          "customFields": {
            "Màu chữ": ["String (hex color array)"],
            "Văn bản": "String (display text)",
            "Fill active": "Boolean",
            "Hình ảnh": [
              {
                "id": "String (required)",
                "url": "String (required)",
                "name": "String (required)",
                "size": "Integer",
                "mime": "String"
              }
            ],
            "Màu chữ active": ["String (hex color array)"],
            "Màu nền active": ["String (hex color array)"],
            "Tên hiển thị": "String (display name)",
            "Hình ảnh active": [
              {
                "id": "String (required)",
                "url": "String (required)",
                "name": "String (required)",
                "size": "Integer",
                "mime": "String"
              }
            ]
          }
        }
      ]
    }
  }
}
```

### Navigation Categories
- **Trang chủ** (Home)
- **Tin tức** (News)
- **Vé** (Tickets)
- **Sự kiện** (Events)
- **Cá nhân** (Profile)
- **QR** (QR Code)
- **Hình nền** (Background) - Special category for navigation background

## Posts API (GraphQL: `http://localhost:1337/graphql`)

### Query - Get All Posts
```graphql
query Posts($pagination: PaginationArg) {
  posts(pagination: $pagination) {
    documentId
    ma_code
    tieu_de
    noi_dung
    tac_gia
    hinh_anh_minh_hoa {
      documentId
      url
      name
      size
      mime
    }
    ngay_dang
    trang_thai
    hoi_vien {
      documentId
      full_name
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Query - Get Single Post
```graphql
query Post($documentId: ID!) {
  post(documentId: $documentId) {
    documentId
    ma_code
    tieu_de
    noi_dung
    tac_gia
    hinh_anh_minh_hoa {
      documentId
      url
      name
      size
      mime
    }
    ngay_dang
    trang_thai
    hoi_vien {
      documentId
      full_name
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Response Structure
```json
{
  "data": {
    "posts": [
      {
        "documentId": "String (required)",
        "ma_code": "String (required)",
        "tieu_de": "String (required) - Post title",
        "noi_dung": "String (optional) - Post content HTML",
        "tac_gia": "String (optional) - Author name",
        "hinh_anh_minh_hoa": {
          "documentId": "String",
          "url": "String",
          "name": "String",
          "size": "Integer",
          "mime": "String"
        },
        "ngay_dang": "DateTime (optional) - Publication date",
        "trang_thai": "ENUM_POST_TRANG_THAI (Da_Duyet, Can_Duyet, Khong_Duyet)",
        "hoi_vien": {
          "documentId": "String",
          "full_name": "String"
        },
        "createdAt": "DateTime",
        "updatedAt": "DateTime",
        "publishedAt": "DateTime"
      }
    ]
  }
}
```

### Field Mapping (Old vs New)
| Old Field (customFields) | New GraphQL Field | Description |
|---------------------------|-------------------|-------------|
| `["Tiêu đề"]` | `tieu_de` | Post title |
| `["Nội dung"].html` | `noi_dung` | Post content (HTML) |
| `["Tác giả"]` | `tac_gia` or `hoi_vien.full_name` | Author name |
| `["Ảnh minh hoạ"][0].url` | `hinh_anh_minh_hoa.url` | Featured image |
| `["Tạo lúc"]` | `ngay_dang` or `createdAt` | Publication date |
| `id` | `documentId` | Unique identifier |

## Events API (GraphQL: `https://yba-zma-strapi.appmkt.vn/graphql`)

### Query - Get All Events
```graphql
query EventInformations($pagination: PaginationArg) {
  eventInformations(pagination: $pagination) {
    documentId
    ma_su_kien
    ten_su_kien
    nguoi_phu_trach
    chi_hoi
    noi_dung_su_kien
    hinh_anh {
      documentId
      url
      name
      size
      mime
    }
    thoi_gian_to_chuc
    dia_diem
    trang_thai
    chi_danh_cho_hoi_vien
    so_ve_toi_da
    doanh_thu
    tong_so_ve
    so_ve_da_check_in
    so_ve_da_thanh_toan
    nhan_vien_phe_duyet
    ma_duy_nhat
    trang_thai_phe_duyet_1
    trang_thai_phe_duyet_2
    tong_so_tien_tai_tro
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Query - Get Single Event
```graphql
query EventInformation($documentId: ID!) {
  eventInformation(documentId: $documentId) {
    documentId
    ma_su_kien
    ten_su_kien
    nguoi_phu_trach
    chi_hoi
    noi_dung_su_kien
    hinh_anh {
      documentId
      url
      name
      size
      mime
    }
    thoi_gian_to_chuc
    dia_diem
    trang_thai
    loai_ve {
      documentId
      ten_loai_ve
      gia_ve
      so_luong_ve
      mo_ta
      chi_danh_cho_hoi_vien
      thoi_gian_bat_dau_ban
      thoi_gian_ket_thuc_ban
      createdAt
      updatedAt
    }
    chi_danh_cho_hoi_vien
    so_ve_toi_da
    doanh_thu
    tong_so_ve
    so_ve_da_check_in
    so_ve_da_thanh_toan
    nhan_vien_phe_duyet
    ma_duy_nhat
    nha_tai_tro {
      documentId
      ten_nha_tai_tro
      logo {
        documentId
        url
        name
      }
      website
      mo_ta
    }
    trang_thai_phe_duyet_1
    trang_thai_phe_duyet_2
    tong_so_tien_tai_tro
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Response Structure
```json
{
  "data": {
    "eventInformations": [
      {
        "documentId": "String (required)",
        "ma_su_kien": "String (required)",
        "ten_su_kien": "String (required) - Event name",
        "nguoi_phu_trach": "String (optional) - Person in charge",
        "chi_hoi": "String (optional) - Chapter/Branch",
        "noi_dung_su_kien": "String (optional) - Event content",
        "hinh_anh": {
          "documentId": "String",
          "url": "String",
          "name": "String",
          "size": "Integer",
          "mime": "String"
        },
        "thoi_gian_to_chuc": "DateTime (required) - Event date/time",
        "dia_diem": "String (optional) - Event location",
        "trang_thai": "ENUM_EVENTINFORMATION_TRANG_THAI (Nhap, Sap_dien_ra, Dang_dien_ra, Huy)",
        "chi_danh_cho_hoi_vien": "Boolean - Members only",
        "so_ve_toi_da": "Integer - Maximum tickets",
        "doanh_thu": "Float - Revenue",
        "tong_so_ve": "Integer - Total tickets",
        "so_ve_da_check_in": "Integer - Checked in tickets",
        "so_ve_da_thanh_toan": "Integer - Paid tickets",
        "nhan_vien_phe_duyet": "String - Approving staff",
        "ma_duy_nhat": "String - Unique code",
        "trang_thai_phe_duyet_1": "String - Approval status 1",
        "trang_thai_phe_duyet_2": "String - Approval status 2",
        "tong_so_tien_tai_tro": "Float - Total sponsorship amount",
        "createdAt": "DateTime",
        "updatedAt": "DateTime",
        "publishedAt": "DateTime"
      }
    ]
  }
}
```

### Field Mapping (Old vs New)
| Old Field (customFields) | New GraphQL Field | Description |
|---------------------------|-------------------|-------------|
| `["Sự kiện"]` | `ten_su_kien` | Event name |
| `["Hình ảnh"][0].url` | `hinh_anh.url` | Event image |
| `["Thời gian tổ chức"]` | `thoi_gian_to_chuc` | Event date/time |
| `["Địa điểm"]` | `dia_diem` | Event location |
| `["Chi Hội"][0].data` | `chi_hoi` | Chapter/Branch |
| `["Trạng thái"][0]` | `trang_thai` | Event status |
| `["Chỉ dành cho hội viên"]` | `chi_danh_cho_hoi_vien` | Members only |
| `["Số lượng vé tối đa"]` | `so_ve_toi_da` | Maximum tickets |
| `id` | `documentId` | Unique identifier |

### Event Status Enum
- **`Nhap`**: Draft
- **`Sap_dien_ra`**: Upcoming
- **`Dang_dien_ra`**: Ongoing
- **`Huy`**: Cancelled

## MiniappConfig API (`/miniapp`)
```json
{
  "customFields": {
    "category": "String (required) - Values: Logo, Slogan, Banner Hình Ảnh",
    "files": [
      {
        "id": "String (required)",
        "url": "String (required)",
        "name": "String (required)",
        "size": "Integer (optional)",
        "type": "String (optional)",
        "alt": "String (optional)"
      }
    ],
    "text_content": "String (optional) - For Slogan category",
    "description": "String (optional)",
    "display_order": "Integer (optional)",
    "status": "String (optional)"
  }
}
```
