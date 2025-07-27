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
import { useAuth } from "../contexts/AuthContext";
import { getNavBackgroundUrl, getImageProps } from "../utils/imageHelper";

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

  // ===== NEW: Use AuthContext for user type and admin status =====
  const { userType, isAdmin, accountInfo, isAuthenticated } = useAuth();

  // ===== FIXED: Base navigation items matching GraphQL layoutConfig structure =====
  const getNavigationItems = useMemo(() => {
    const baseItems = [
      {
        icon: <HomeIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <HomeIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "Trang chủ",
        path: "/",
        name: "Trang chủ", // Match with GraphQL data name field
      },
      {
        icon: <PostIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <PostIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "Tin tức",
        path: "/posts",
        name: "Tin tức", // Match with GraphQL data name field
      },
      {
        icon: <TicketIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <TicketIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "Vé",
        path: "/tickets",
        name: "Vé", // Match with GraphQL data name field
      },
      {
        icon: <CalendarIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <CalendarIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "Sự kiện",
        path: "/events",
        name: "Sự kiện", // Match with GraphQL data name field
      },
      {
        icon: <UserIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <UserIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "Cá nhân",
        path: "/users",
        name: "Cá nhân", // Match with GraphQL data name field
      },
      {
        icon: <ScanQRIcon customClass="-w-6 h-6 block m-auto" />,
        iconActive: <ScanQRIcon customClass="-w-6 h-6 block m-auto" active={true} />,
        label: "QR",
        path: "/admin/qrscan",
        name: "QR", // Match with GraphQL data name field
      },
    ];

    // ===== FIXED: Return all items, let GraphQL layoutConfig determine what's shown =====
    return baseItems;
  }, []);

  const defaultItems = getNavigationItems;

  useEffect(() => {
    const fetchNavbarData = async () => {
      console.log('========fetchNavbarData========');
      console.log('Navigation: User type:', userType, 'Is admin:', isAdmin);

      try {
        const now = Date.now();
        let layoutData;

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

        // ===== REMOVED: Admin checking - now handled by AuthContext =====

        if (layoutData) {
          // ===== FIXED: Process GraphQL layoutConfig data structure =====
          const navItems = layoutData.filter(
            (item) => item.name !== "Hình nền"
          );
          const background = layoutData.find(
            (item) => item.name === "Hình nền"
          );
          setNavBackground(getNavBackgroundUrl(background));

          // ===== FIXED: Create navigation items based on GraphQL layoutConfig order =====
          const updatedItems = navItems.map((layoutItem) => {
            // Find matching default item by name
            const defaultItem = defaultItems.find(
              (item) => item.name === layoutItem.name
            );

            // If no default item found, skip this layout item
            if (!defaultItem) {
              console.log('NavigationBar: No default item found for layout item:', layoutItem.name);
              return null;
            }

            // Create navigation item with layout configuration
            const navItem = {
              ...defaultItem,
              // Use display name from customFields if available
              label: layoutItem.customFields?.["Tên hiển thị"] || layoutItem.customFields?.["Văn bản"] || layoutItem.name,
              // Use custom icons if available
              icon: layoutItem.customFields?.["Hình ảnh"]?.[0]?.url ? (
                <img
                  {...getImageProps(layoutItem.customFields?.["Hình ảnh"]?.[0]?.url)}
                  className="block h-6 m-auto -w-6"
                  alt={layoutItem.name}
                />
              ) : (
                defaultItem.icon
              ),
              // Use active icon from customFields if available
              iconActive: layoutItem.customFields?.["Hình ảnh active"]?.[0]?.url ? (
                <img
                  {...getImageProps(layoutItem.customFields?.["Hình ảnh active"]?.[0]?.url)}
                  className="block h-6 m-auto -w-6"
                  alt={layoutItem.name}
                />
              ) : layoutItem.customFields?.["Hình ảnh"]?.[0]?.url ? (
                <img
                  {...getImageProps(layoutItem.customFields?.["Hình ảnh"]?.[0]?.url)}
                  className="block h-6 m-auto -w-6"
                  alt={layoutItem.name}
                />
              ) : (
                defaultItem.iconActive
              ),
              // Style properties from customFields
              backgroundColor: layoutItem.customFields?.["Màu nền active"]?.[0],
              textColor: layoutItem.customFields?.["Màu chữ"]?.[0],
              textColorActive: layoutItem.customFields?.["Màu chữ active"]?.[0],
              fillActive: layoutItem.customFields?.["Fill active"],
            };

            // Return navigation item with active state
            return {
              ...navItem,
              active:
                navItem.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.includes(navItem.path),
            };
          }).filter(Boolean); // Remove null items

          setItems(updatedItems);
        }
      } catch (error) {
        console.error("Error fetching navbar data:", error);
      }
    };

    fetchNavbarData();
  }, [location.pathname, defaultItems, userType, isAdmin]); // Added userType dependency

  // ===== REMOVED: getPathFromName function - paths are now defined in base items =====

  const handleClick = (path) => {
    navigate(path);
  };

  if (!showNavigation) return null;

  // ===== NEW: Get user type display info =====
  const getUserTypeInfo = () => {
    switch (userType) {
      case 'admin':
        return { label: 'Admin', color: '#dc2626', emoji: '👑' }; // Red for admin
      case 'member':
        return { label: 'Hội viên', color: '#059669', emoji: '⭐' }; // Green for member
      case 'guest':
      default:
        return { label: 'Khách', color: '#6b7280', emoji: '👤' }; // Gray for guest
    }
  };

  const userTypeInfo = getUserTypeInfo();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full">
      {/* ===== FIXED: User type indicator bar - uncommented ===== */}
      {/* <div
        className="flex items-center justify-center py-1 text-xs font-medium text-white"
        style={{ backgroundColor: userTypeInfo.color }}
      >
        <span className="mr-1">{userTypeInfo.emoji}</span>
        <span>{userTypeInfo.label}</span>
        {accountInfo?.loai_tai_khoan && (
          <span className="ml-2 text-xs opacity-75">
            ({accountInfo.loai_tai_khoan})
          </span>
        )}
      </div> */}

      {/* ===== Navigation items ===== */}
      <div
        className="flex items-center justify-center w-full gap-6 px-8 gap-x-2"
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
      {/* ===== NEW: Items already filtered by user type in getNavigationItems ===== */}
      {items
      .filter((i) => i.name !== "QR" || isAdmin)
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
    </div>
  );
};

export default NavigationBar;
