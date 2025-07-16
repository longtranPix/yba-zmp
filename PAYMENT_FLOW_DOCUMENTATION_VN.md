# Tài Liệu Chi Tiết Luồng Thanh Toán - YBA HCM App

## 🎯 Tổng Quan
Tài liệu này mô tả chi tiết cách thức hoạt động của hệ thống thanh toán trong ứng dụng YBA HCM, bao gồm VietQR, tích hợp Zalo Payment, và quản lý trạng thái thanh toán.

## 📊 Kiến Trúc Hệ Thống Thanh Toán

### **1. Các Phương Thức Thanh Toán Hỗ Trợ**

#### **A. VietQR (Chính)**
- **Mô tả**: Tạo mã QR để thanh toán qua ngân hàng
- **Ưu điểm**: Nhanh chóng, tiện lợi, tự động xác nhận
- **Sử dụng**: Cho tất cả các loại vé có phí

#### **B. Zalo Payment SDK (Phụ)**
- **Mô tả**: Tích hợp thanh toán qua Zalo
- **Ưu điểm**: Tích hợp sâu với nền tảng Zalo
- **Sử dụng**: Khi có checkoutSdk từ server

#### **C. Chuyển Khoản Thủ Công**
- **Mô tả**: Sao chép thông tin ngân hàng để chuyển khoản
- **Ưu điểm**: Linh hoạt, không phụ thuộc công nghệ
- **Sử dụng**: Khi VietQR không khả dụng

## 🔄 Luồng Thanh Toán Chi Tiết

### **Bước 1: Đăng Ký Vé**
```javascript
// Trong register-member.jsx
const confirm = async () => {
  // Xác thực số lượng vé
  const remainingTickets = parseInt(ticket?.customFields?.["Số vé còn lại"]) || 0;
  const maxEventTickets = parseInt(event?.customFields?.["Số lượng vé tối đa"]) || 0;
  
  // Tạo request body với thông tin thanh toán
  const requestBody = {
    "Tên người đăng ký": customInfo.fullname,
    "Mã vé": ticket?.customFields["Mã loại vé"],
    "Số lượng vé": String(totalTickets || 1),
    "Ngân hàng": event?.customFields?.["Ngân hàng"]?.[0].data || "",
    "Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"] || "",
    "Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"] || "",
    // ... các trường khác
  };
  
  // Gọi API đăng ký sự kiện
  let result = await APIService.registerEvent(eventId, ticketId, requestBody, zaloProfile?.zaloIDByOA);
};
```

### **Bước 2: Xử Lý Response Thanh Toán**
```javascript
if (result.error == 0) {
  // Lưu thông tin VietQR
  setVietQr({
    url: result.data.vietqr,
    bankInfo: {
      accountNumber: result.data["Tk Ngân Hàng"],
      accountName: result.data["Tên Tk Ngân Hàng"],
      bankName: result.data["Ngân hàng"],
      bankInfo: result.data.bankInfo,
    },
  });
  
  // Xử lý các trường hợp thanh toán
  if (result?.data?.skipPayment) {
    // Vé miễn phí hoặc đã được phê duyệt bỏ qua thanh toán
    Helper.showAlertInfo("Đăng ký thành công, vé sẽ được gửi đến Quý Anh/Chị sớm nhất");
    navigate(`/tickets/detail/${result.data.id}`);
  } else if (result.data.ticketPrice == 0) {
    // Vé miễn phí - chuyển đến trang thanh toán để xác nhận
    navigate(`/payment?ticketId=${result.data.id}&eventId=${eventId}`);
  } else if (result.data.checkoutSdk) {
    // Sử dụng Zalo Payment SDK
    ZaloService.createOrder(result.data.checkoutSdk.order);
  }
}
```

### **Bước 3: Trang Thanh Toán VietQR**
```javascript
// Trong payment.jsx
const PaymentPage = () => {
  const vietqr = useRecoilValue(vietQrState);
  const configs = useRecoilValue(configState);
  const bankInfo = vietqr?.bankInfo || configs?.bankInfo || {};
  
  // Hiển thị mã QR và thông tin ngân hàng
  return (
    <Page>
      {/* Hiển thị mã QR */}
      <img src={vietqr?.url} />
      
      {/* Nút tải xuống QR */}
      <button onClick={saveQR}>Tải xuống mã QR</button>
      
      {/* Thông tin ngân hàng để sao chép */}
      <div>
        <p>Số tài khoản: {bankInfo.accountNumber}</p>
        <p>Tên tài khoản: {bankInfo.accountName}</p>
        <p>Ngân hàng: {bankInfo.bankName}</p>
        <p>Nội dung: {getPaymentContent()}</p>
      </div>
    </Page>
  );
};
```

## 🏦 API Thanh Toán

### **1. API Tạo VietQR**
```javascript
// services/api-service.js
services.getVietQR = (obj) => {
  return callApi(`${API_DOMAIN}/vietqr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  });
};

// Cách sử dụng
const vietQRData = {
  code: ticket.customFields["Mã thanh toán"],
  salePrice: ticket.customFields["Giá vé"],
  "Ngân hàng": event.customFields["Ngân hàng"]?.[0]?.data || "",
  "Tk Ngân Hàng": event.customFields["Tk Ngân Hàng"] || "",
  "Tên Tk Ngân Hàng": event.customFields["Tên Tk Ngân Hàng"] || "",
};

const response = await APIService.getVietQR(vietQRData);
```

### **2. Response Structure**
```javascript
{
  error: 0,
  data: {
    vietqr: "https://api.vietqr.io/image/...", // URL mã QR
    "Tk Ngân Hàng": "1234567890",              // Số tài khoản
    "Tên Tk Ngân Hàng": "NGUYEN VAN A",        // Tên chủ tài khoản
    "Ngân hàng": "Vietcombank",                // Tên ngân hàng
    bankInfo: { /* chi tiết ngân hàng */ },
    skipPayment: false,                        // Có bỏ qua thanh toán không
    ticketPrice: 100000,                       // Giá vé
    checkoutSdk: {                            // Dữ liệu Zalo Payment (nếu có)
      order: { /* thông tin đơn hàng */ }
    }
  }
}
```

## 💳 Tích Hợp Zalo Payment

### **1. Tạo Đơn Hàng Zalo**
```javascript
// services/zalo-service.js
services.createOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    const { orderId } = await Payment.createOrder({
      ...data,
      fail: (error) => reject(error),
    });
    return resolve({ orderId });
  });
};
```

### **2. Xử Lý Callback Thanh Toán**
```javascript
// Trong register-member.jsx
const handlePaymentCallback = () => {
  events.on(EventName.OnDataCallback, (resp) => {
    const { eventType, data } = resp;
    
    // Chuyển đến trang thanh toán sau khi hoàn tất
    const next = () => {
      return navigate(`/payment?ticketId=${ticketId}&eventId=${eventId}`);
    };
    
    // Xử lý follow OA nếu cần
    if (suggestFollowOA) {
      // Logic follow OA
    } else {
      next();
    }
  });
};
```

## 📱 Tính Năng Thanh Toán

### **1. Lưu Mã QR Vào Thư Viện**
```javascript
const saveQR = () => {
  if (vietqr) {
    setIsSavingQR(true);
    ZaloService.saveImageToGallery(vietqr)
      .then(() => {
        Helper.showAlertInfo("Lưu mã thanh toán thành công.");
      })
      .catch(() => {
        Helper.showAlert("Lưu mã thanh toán không thành công. Vui lòng cấp quyền truy cập bộ nhớ cho Zalo và thử lại.");
      });
  }
};
```

### **2. Sao Chép Thông Tin Thanh Toán**
```javascript
const handleCopy = (content) => {
  copy(content, { debug: true });
  Helper.showAlertInfo(`Copy to clipboard: ${content}`);
};

// Sao chép số tài khoản
<Icon icon="zi-copy" onClick={() => handleCopy(bankInfo.accountNumber)} />

// Sao chép nội dung thanh toán
<Icon icon="zi-copy" onClick={() => handleCopy(getPaymentContent())} />
```

### **3. Tạo Nội Dung Thanh Toán**
```javascript
const getPaymentContent = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get("ticketId");
  const eventId = urlParams.get("eventId");
  
  return `YBA ${eventId} ${ticketId}`;
};
```

## 🔍 Quản Lý Trạng Thái Thanh Toán

### **1. Kiểm Tra Trạng Thái Vé**
```javascript
// Trong ticket-detail.jsx
{ticket?.paymentStatus !== "Đã Thanh Toán" && 
 !isTicketFree() && 
 ticket?.ticketPrice > 0 && (
  <div onClick={gotoPayment}>
    <p>Thanh toán</p>
    <p>Bỏ qua nếu bạn đã thực hiện thanh toán</p>
  </div>
)}
```

### **2. Chuyển Đến Thanh Toán Từ Chi Tiết Vé**
```javascript
const gotoPayment = async () => {
  try {
    // Tạo VietQR cho vé đã đăng ký
    let res = await APIService.getVietQR({
      code: ticket.customFields["Mã thanh toán"],
      salePrice: ticket.customFields["Giá vé"],
      "Ngân hàng": event.customFields["Ngân hàng"]?.[0]?.data || "",
      "Tk Ngân Hàng": event.customFields["Tk Ngân Hàng"] || "",
      "Tên Tk Ngân Hàng": event.customFields["Tên Tk Ngân Hàng"] || "",
    });

    // Lưu thông tin VietQR
    setVietQr({
      url: res.data.qr,
      bankInfo: {
        accountNumber: event.customFields["Tk Ngân Hàng"] || "",
        accountName: event.customFields["Tên Tk Ngân Hàng"] || "",
        bankName: event.customFields["Ngân hàng"]?.[0]?.data || "",
        bankInfo: event.customFields["Ngân hàng"]?.[0] || null,
      },
    });

    // Chuyển đến trang thanh toán
    navigate(`/payment?ticketId=${ticket.id}&eventId=${ticket?.event?.id}`);
  } catch (error) {
    Helper.showAlert("Không thể tạo mã thanh toán. Vui lòng thử lại sau.");
  }
};
```

## 💰 Xử Lý Các Loại Vé

### **1. Vé Miễn Phí**
```javascript
const isTicketFree = () => {
  return ticket?.ticketPrice === 0 || ticket?.customFields?.["Giá vé"] === 0;
};

// Hiển thị giá vé
const formatPrice = (price) => {
  if (price === 0) return "Miễn phí";
  if (!price) return "Liên hệ";
  return price.toLocaleString("vi-VN") + "đ";
};
```

### **2. Vé Có Phí**
- Hiển thị nút thanh toán
- Tạo mã VietQR
- Cho phép sao chép thông tin ngân hàng
- Hỗ trợ Zalo Payment nếu có

### **3. Vé Bỏ Qua Thanh Toán**
```javascript
if (result?.data?.skipPayment) {
  Helper.showAlertInfo("Đăng ký thành công, vé sẽ được gửi đến Quý Anh/Chị sớm nhất");
  setTimeout(() => {
    navigate("/");
    if (result.data.id) {
      navigate(`/tickets/detail/${result.data.id}`);
    }
  }, 2000);
}
```

## 🎯 Điểm Mạnh Của Hệ Thống

### **✅ Ưu Điểm**
1. **Đa Dạng Phương Thức**: VietQR, Zalo Payment, chuyển khoản thủ công
2. **Tự Động Hóa**: Tạo mã QR tự động với thông tin chính xác
3. **Tiện Lợi**: Sao chép thông tin, lưu QR vào thư viện
4. **Linh Hoạt**: Hỗ trợ vé miễn phí, có phí, bỏ qua thanh toán
5. **Tích Hợp Sâu**: Kết hợp với Zalo ecosystem

### **⚠️ Hạn Chế**
1. **Xác Nhận Thủ Công**: Cần BTC xác nhận thanh toán
2. **Không Tự Động**: Không tự động cập nhật trạng thái thanh toán
3. **Phụ Thuộc Mạng**: Cần kết nối internet để tạo VietQR
4. **Thiếu Tracking**: Không theo dõi chi tiết giao dịch

## 🔮 Khuyến Nghị Cải Tiến

### **1. Tự Động Xác Nhận Thanh Toán**
- Tích hợp webhook từ ngân hàng
- Tự động cập nhật trạng thái vé sau thanh toán

### **2. Theo Dõi Giao Dịch**
- Lưu lịch sử thanh toán
- Báo cáo doanh thu chi tiết

### **3. Thông Báo Real-time**
- Thông báo khi thanh toán thành công
- Gửi vé điện tử qua Zalo OA

Hệ thống thanh toán hiện tại đã đáp ứng tốt nhu cầu cơ bản với VietQR làm phương thức chính và Zalo Payment làm phương thức phụ trợ! 🎉
