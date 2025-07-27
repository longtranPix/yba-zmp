const services = {};
import toast from "react-hot-toast";

services.formatTime = (dateAsString) => {
  console.log('helper-services.formatTime');
  const date = new Date(dateAsString);
  const padZero = (num) => {
    return num < 10 ? `0${num}` : num;
  };
  const formattedTime = `${padZero(date.getHours())}:${padZero(
    date.getMinutes()
  )} ngày ${padZero(date.getDate())}/${padZero(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
  return formattedTime;
};

services.formatDate = (dateAsString) => {
  console.log('helper-services.formatDate');
  const date = new Date(dateAsString);
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  return `${padZero(date.getDate())}/${padZero(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
};

services.formatTimeOnly = (dateAsString) => {
  console.log('helper-services.formatTimeOnly');
  const date = new Date(dateAsString);
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
};

services.formatDateWithDay = (dateAsString) => {
  console.log('helper-services.formatDateWithDay');
  const date = new Date(dateAsString);
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  const days = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const dayOfWeek = days[date.getDay()];
  return `${dayOfWeek} ${padZero(date.getHours())}:${padZero(
    date.getMinutes()
  )} ${padZero(date.getDate())}/${padZero(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
};

services.formatCurrency = (amount) => {
  console.log('helper-services.formatCurrency');
  if (amount == 0) return "Miễn phí";
  if (!amount) return "Liên hệ";
  const formattedAmount = amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  return formattedAmount.replace("₫", "đ");
};

services.showAlert = (message) => {
  console.log('helper-services.showAlert');
  toast.error(message, {
    duration: 6000,
    style: {
      background: "#333",
      color: "#fff",
    },
  });
};

services.showAlertInfo = (message, delay) => {
  console.log('helper-services.showAlertInfo');
  if (delay && delay > 0) {
    setTimeout(() => {
      toast.success(message);
    }, delay);
  } else {
    toast.success(message);
  }
};

// ===== FIXED: Updated to match GraphQL schema enum values =====
const sponsorRankPriority = {
  "Dong_hanh": 5,    // Đồng hành (highest priority)
  "Bach_kim": 4,     // Bạch kim
  "Vang": 3,         // Vàng
  "Bac": 2,          // Bạc
  "Dong": 1,         // Đồng (lowest priority)
};

// ===== FIXED: Updated to match GraphQL schema structure =====
services.sortEventSponsers = (sponsors) => {
  console.log('helper-services.sortEventSponsers - Input sponsors:', sponsors);

  if (!sponsors || !Array.isArray(sponsors)) {
    console.log('helper-services.sortEventSponsers - No sponsors or invalid input');
    return [];
  }

  const sortedAndFiltered = sponsors
    .filter((sponsor) => {
      // ===== FIXED: Filter sponsors with valid data =====
      const hasLogo = sponsor?.logo?.url;
      const hasCompanyName = sponsor?.ten_cong_ty;
      const isValid = hasLogo && hasCompanyName;

      if (!isValid) {
        console.log('helper-services.sortEventSponsers - Filtered out sponsor:', {
          id: sponsor?.documentId,
          hasLogo,
          hasCompanyName,
          companyName: sponsor?.ten_cong_ty
        });
      }

      return isValid;
    })
    .sort((a, b) => {
      // ===== FIXED: Use schema-compliant hang field =====
      const rankA = a?.hang || "";
      const rankB = b?.hang || "";

      const priorityA = sponsorRankPriority[rankA] || 0;
      const priorityB = sponsorRankPriority[rankB] || 0;

      console.log('helper-services.sortEventSponsers - Sorting:', {
        sponsorA: { name: a?.ten_cong_ty, rank: rankA, priority: priorityA },
        sponsorB: { name: b?.ten_cong_ty, rank: rankB, priority: priorityB }
      });

      // Sort by priority (higher priority first)
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // ===== NEW: Secondary sort by company name for consistent ordering =====
      const nameA = a?.ten_cong_ty || "";
      const nameB = b?.ten_cong_ty || "";
      return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
    });

  console.log('helper-services.sortEventSponsers - Final result:', sortedAndFiltered);
  return sortedAndFiltered;
};

// ===== NEW: Helper function to get sponsor rank display name =====
services.getSponsorRankDisplay = (rank) => {
  const rankDisplayMap = {
    'Dong_hanh': 'Đồng hành',
    'Bach_kim': 'Bạch kim',
    'Vang': 'Vàng',
    'Bac': 'Bạc',
    'Dong': 'Đồng'
  };
  return rankDisplayMap[rank] || rank;
};

// ===== NEW: Helper function to get sponsor rank priority =====
services.getSponsorRankPriority = (rank) => {
  return sponsorRankPriority[rank] || 0;
};

services.truncateText = (text, maxLength) => {
  console.log('helper-services.truncateText');
  if (!text) return "";
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
};

export default services;
