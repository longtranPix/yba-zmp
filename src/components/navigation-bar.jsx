import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import HomeIcon from "./icons/home-icon";
import TicketIcon from "./icons/ticket-icon";
import PostIcon from "./icons/post-icon";
import CalendarIcon from "./icons/calendar-icon";
import UserIcon from "./icons/user-icon";
import ScanQRIcon from "./icons/scanqr-icon";
import { useNavigate } from "zmp-ui";
import { useRecoilValue } from "recoil";
import { bottomNavigationStatus } from "../state";
import APIService from "../services/api-service";

const layoutCache = {
  data: null,
  expiry: 0,
};
const CACHE_DURATION = 5 * 60 * 1000;

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showNavigation = useRecoilValue(bottomNavigationStatus);
  const [navBackground, setNavBackground] = useState(null);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const defaultItems = useMemo(
    () => [
      {
        icon: <HomeIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <HomeIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "Trang chủ",
        path: "/",
      },
      {
        icon: <PostIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <PostIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "Tin tức",
        path: "/posts",
      },
      {
        icon: <TicketIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <TicketIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "Vé",
        path: "/tickets",
      },
      {
        icon: <ScanQRIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <ScanQRIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "QR",
        path: "/admin/qrscan",
      },
      {
        icon: <CalendarIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <CalendarIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "Sự kiện",
        path: "/events",
      },
      {
        icon: <UserIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: (
          <UserIcon customClass="-w-6 h-6 block m-auto" active={true} />
        ),
        label: "Cá nhân",
        path: "/users",
      },
    ],
    []
  );

  useEffect(() => {
    const fetchNavbarData = async () => {
      console.log('========fetchNavbarData========');
      try {
        const now = Date.now();
        let layoutData;
        let adminStatus;

        if (layoutCache.data && now < layoutCache.expiry) {
          layoutData = layoutCache.data;
        } else {
          const response = await APIService.getLayout();
          // GraphQL response structure: { data: { layoutConfig: { config: [...] } } }
          if (response?.data?.layoutConfig?.config) {
            layoutData = response.data.layoutConfig.config;
            layoutCache.data = layoutData;
            layoutCache.expiry = now + CACHE_DURATION;
          }
        }

        const pathname = location.pathname;
        const needAdminCheck = pathname === "/admin/qrscan" || !isAdmin;

        if (needAdminCheck) {
          adminStatus = await APIService.checkIsAdmin();
          setIsAdmin(adminStatus);
        }

        if (layoutData) {
          const navItems = layoutData.filter(
            (item) => item.name !== "Hình nền"
          );
          const background = layoutData.find(
            (item) => item.name === "Hình nền"
          );
          setNavBackground(background?.customFields?.["Hình ảnh"]?.[0]?.url);

          const updatedItems = defaultItems.map((defaultItem) => {
            const matchedItem = navItems.find(
              (item) => item.name === defaultItem.label
            );

            const baseItem = !matchedItem
              ? defaultItem
              : {
                  ...defaultItem,
                  icon: matchedItem.customFields?.["Hình ảnh"]?.[0]?.url ? (
                    <img
                      src={matchedItem.customFields?.["Hình ảnh"]?.[0]?.url}
                      className="block h-6 m-auto -w-6"
                      alt={matchedItem.name}
                    />
                  ) : (
                    defaultItem.icon
                  ),
                  iconActive: matchedItem.customFields?.["Hình ảnh active"]?.[0]
                    ?.url ? (
                    <img
                      src={
                        matchedItem.customFields?.["Hình ảnh active"]?.[0]?.url
                      }
                      className="block h-6 m-auto -w-6"
                      alt={matchedItem.name}
                    />
                  ) : matchedItem.customFields?.["Hình ảnh"]?.[0]?.url ? (
                    <img
                      src={matchedItem.customFields?.["Hình ảnh"]?.[0]?.url}
                      className="block h-6 m-auto -w-6"
                      alt={matchedItem.name}
                    />
                  ) : (
                    defaultItem.iconActive
                  ),
                  label:
                    matchedItem.customFields?.["Tên hiển thị"] ||
                    matchedItem.name ||
                    defaultItem.label,
                  backgroundColor:
                    matchedItem.customFields?.["Màu nền active"]?.[0],
                  textColor: matchedItem.customFields?.["Màu chữ"]?.[0],
                  textColorActive:
                    matchedItem.customFields?.["Màu chữ active"]?.[0],
                  fillActive: matchedItem.customFields?.["Fill active"],
                };

            return {
              ...baseItem,
              active:
                baseItem.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.includes(baseItem.path),
            };
          });

          setItems(updatedItems);
        }
      } catch (error) {
        console.error("Error fetching navbar data:", error);
      }
    };

    fetchNavbarData();
  }, [location.pathname, defaultItems, isAdmin]);

  const getPathFromName = (name) => {
    const pathMap = {
      "Trang chủ": "/",
      "Tin tức": "/posts",
      QR: "/admin/qrscan",
      Vé: "/tickets",
      "Sự kiện": "/events",
      "Cá nhân": "/users",
    };
    return pathMap[name] || "/";
  };

  const handleClick = (path) => {
    navigate(path);
  };

  if (!showNavigation) return null;

  return (
    <div
      className="fixed bottom-0 left-0 z-50 flex items-center justify-center w-full gap-6 px-8 gap-x-2"
      style={
        navBackground
          ? {
              backgroundImage: `url(${navBackground})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }
          : { backgroundColor: "#fff" }
      }
    >
      {items
        .filter((item) => item.label !== "QR" || isAdmin)
        .map((item, i) => (
          <div
            key={i}
            className={`py-4 pb-3 basis-1/4 nav-item ${
              item.active ? "border-t-[3px]" : ""
            }`}
            onClick={() => handleClick(item.path)}
            style={{
              backgroundColor: item.active
                ? item.fillActive
                  ? item.backgroundColor
                  : `${item.backgroundColor}0D`
                : "transparent",
              color: item.active
                ? item.textColorActive
                : item.textColor || "#999999",
              borderColor: item.active ? item.backgroundColor : "transparent",
            }}
          >
            {item.active ? item.iconActive : item.icon}
            <p
              className="pt-1 text-xs font-medium text-center line-clamp-1"
              style={{
                color: item.active
                  ? item.textColorActive
                  : item.textColor || "#999999",
              }}
            >
              {item.label}
            </p>
          </div>
        ))}
    </div>
  );
};

export default NavigationBar;
