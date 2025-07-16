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

const sponsorRankPriority = {
  "Đồng hành chiến lược": 6,
  "Kim Cương": 5,
  "Bạch Kim": 4,
  Vàng: 3,
  Bạc: 2,
  Đồng: 1,
};

services.sortEventSponsers = (sponsors) => {
  console.log('helper-services.sortEventSponsers');
  if (!sponsors) return [];

  return sponsors
    .sort((a, b) => {
      const rankA = a?.customFields?.["Hạng"]?.[0] || "";
      const rankB = b?.customFields?.["Hạng"]?.[0] || "";

      const priorityA = sponsorRankPriority[rankA] || 0;
      const priorityB = sponsorRankPriority[rankB] || 0;

      return priorityB - priorityA;
    })
    .filter((sponsor) => sponsor?.customFields?.["Logo"]?.[0]?.url);
};

services.truncateText = (text, maxLength) => {
  console.log('helper-services.truncateText');
  if (!text) return "";
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
};

export default services;
