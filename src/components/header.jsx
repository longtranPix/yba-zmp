import React, { useEffect, useState } from "react";
import { Icon, useNavigate } from "zmp-ui";
import { useRecoilState, useSetRecoilState } from "recoil";
import { bottomNavigationStatus } from "../state";
import APIServices from "../services/api-service";
import appLogo from "../assets/logo.jpg";

const AppHeader = () => {
  const [pageType, setPageType] = useState("HOME");
  const [pageTitle, setPageTitle] = useState("");
  const navigate = useNavigate();
  const [headerType, setHeaderType] = useState(0);
  const [logo, setLogo] = useState(null);
  const [slogan, setSlogan] = useState(
    "Dấn thân - Đổi mới - Đột phá - Vươn tầm"
  );

  const setShowNavigation = useSetRecoilState(bottomNavigationStatus);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const res = await APIServices.getMiniapp();
        if (res.data && Array.isArray(res.data)) {
          const logoItem = res.data.find(
            (item) => item.customFields?.["Hạng mục"] === "Logo"
          );
          if (logoItem && logoItem.customFields?.["Tập tin"]?.[0]) {
            setLogo(logoItem.customFields["Tập tin"][0]);
          }

          const sloganItem = res.data.find(
            (item) => item.customFields?.["Hạng mục"] === "Slogan"
          );
          if (sloganItem && sloganItem.customFields?.["Văn bản"]) {
            setSlogan(sloganItem.customFields["Văn bản"]);
          }
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    fetchHeaderData();
  }, []);

  useEffect(() => {
    let pathname = location.pathname || "";
    let newType = "HOME";
    let newTitle = "";
    let newStatusNavigation = true;
    let newHeaderType = 0;
    if (pathname.endsWith("tickets")) {
      newType = "TICKET";
      newTitle = "Quản lý vé";
      newHeaderType = 1;
    } else if (pathname.indexOf("tickets-management") >= 0) {
      newType = "TICKET_MANAGEMENT";
      newTitle = "Quản lý vé";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.indexOf("tickets/qrcode") >= 0) {
      newType = "TICKET_QRCODE";
      newTitle = "Checkin";
      newStatusNavigation = false;
      newHeaderType = 3;
    } else if (pathname.indexOf("tickets/detail") >= 0) {
      newType = "TICKET_DETAIL";
      newTitle = "Thông tin vé";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.indexOf("tickets/views") >= 0) {
      newType = "TICKET_DETAIL";
      newTitle = "Thông tin vé";
      newStatusNavigation = false;
      newHeaderType = 4;
    } else if (pathname.indexOf("sponsors/detail") >= 0) {
      newType = "SPONSOR_DETAIL";
      newTitle = "Thông tin nhà tài trợ";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.indexOf("posts/detail") >= 0) {
      newType = "POST_DETAIL";
      newTitle = "Thông tin - Sự kiện";
      newHeaderType = 2;
    } else if (pathname.indexOf("posts") >= 0) {
      newType = "POST";
      newTitle = "Thông tin - Sự kiện";
      newHeaderType = 1;
    } else if (pathname.indexOf("events/detail") >= 0) {
      newType = "EVENT_DETAIL";
      newTitle = "Sự kiện";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("events")) {
      newType = "EVENT";
      newTitle = "Sự kiện";
      newHeaderType = 1;
    } else if (pathname.endsWith("memberships")) {
      newType = "MEMBERSHIP";
      newTitle = "Ưu đãi hội viên YBA";
      newHeaderType = 2;
    } else if (pathname.indexOf("memberships/detail") >= 0) {
      newType = "MEMBERSHIP_DETAIL";
      newTitle = "Thông tin về YBA";
      newHeaderType = 2;
    } else if (pathname.indexOf("users") >= 0) {
      newType = "USER";
      newTitle = "Thông tin của bạn";
      newHeaderType = 5;
    } else if (pathname.indexOf("members/verify") >= 0) {
      newType = "USER_VERIFY";
      newTitle = "Xác thực hội viên";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("about")) {
      newType = "ABOUT";
      newTitle = "Thông tin về YBA";
      newHeaderType = 2;
    } else if (pathname.indexOf("invite-to-join-by-link") >= 0) {
      newType = "ABOUT";
      newTitle = "Mời tham gia bằng link";
      newHeaderType = 2;
    } else if (pathname.endsWith("checkout")) {
      newType = "CHECKOUT";
      newTitle = "Xác nhận thông tin vé";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("payment")) {
      newType = "PAYMENT";
      newTitle = "Thanh toán";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("members/register")) {
      newType = "MEMBER_REGISTER";
      newTitle = "Đăng ký thành viên";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("members/register-member")) {
      newType = "MEMBER_REGISTER_MEMBER";
      newTitle = "Xác nhận thông tin";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("members/info")) {
      newType = "MEMBER_INFO";
      newTitle = "Chỉnh sửa thông tin cá nhân";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.endsWith("qrscan")) {
      newType = "QR_SCAN";
      newTitle = "Xác nhận vé";
      newStatusNavigation = false;
      newHeaderType = 2;
    } else if (pathname.indexOf("admin/checkin") > 0) {
      newType = "CHECKIN";
      newTitle = "Xác nhận vé";
      newStatusNavigation = false;
      newHeaderType = 2;
    }
    setPageType(newType);
    setPageTitle(newTitle);
    setHeaderType(newHeaderType);
    setShowNavigation(newStatusNavigation);
  }, [location.pathname]);

  const goBack = () => {
    if (
      window.history.length > 1 &&
      !window.location.pathname.includes("register-member")
    ) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const goHome = () => {
    navigate("/");
  };

  if (headerType == 0) {
    return (
      <div className="flex px-4 bg-white border-b border-gray-150 custom-app-header">
        <img className="w-12 h-12" src={logo?.url || appLogo} alt="YBA Logo" />
        <div className="w-4/6 pl-2">
          <p className="text-base font-semibold">YBA HCM</p>
          <p className="w-5/6 text-xs line-clamp-1">{slogan}</p>
        </div>
      </div>
    );
  } else if (headerType == 1) {
    return (
      <div className="flex px-4 bg-white custom-app-header border-b border-[#E5E5E5]">
        <div className="flex items-center w-full pl-2">
          <p className="text-base font-semibold">{pageTitle}</p>
        </div>
      </div>
    );
  } else if (headerType == 2) {
    return (
      <div className="flex px-4 bg-white border-b border-gray-150 custom-app-header">
        <div className="flex items-center w-full">
          <Icon icon="zi-arrow-left" onClick={goBack} />
          <p className="pl-2 text-base font-semibold">{pageTitle}</p>
        </div>
      </div>
    );
  } else if (headerType == 3) {
    return (
      <div className="bg-[#0E3D8A] px-4 flex  custom-app-header">
        <div className="flex items-center w-full ml-2">
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
            <Icon icon="zi-arrow-left" onClick={goBack} />
          </div>
        </div>
      </div>
    );
  } else if (headerType == 4) {
    return (
      <div className="flex px-4 bg-white border-b border-gray-150 custom-app-header">
        <div className="flex items-center w-full">
          <Icon icon="zi-arrow-left" onClick={goHome} />
          <p className="pl-2 text-base font-semibold">{pageTitle}</p>
        </div>
      </div>
    );
  } else if (headerType == 5) {
    return (
      <div className="flex px-4 bg-[#E9EBED] custom-app-header border-b border-[#E5E5E5]">
        <div className="flex items-center w-full pl-2">
          <p className="text-base font-semibold">{pageTitle}</p>
        </div>
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default AppHeader;
