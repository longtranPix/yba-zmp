import React, { useEffect, useState } from "react";
import { followOA } from "zmp-sdk/apis";
import APIServices from "../services/api-service";
import ZaloService from "../services/zalo-service";

// Tạo cache cho trạng thái follower
const followerCache = {
  isFollower: null,
  expiry: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

const WidgetOA = ({ data }) => {
  const [isFollower, setIsFollower] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Kiểm tra cache
        const now = Date.now();
        if (followerCache.isFollower !== null && now < followerCache.expiry) {
          setIsFollower(followerCache.isFollower);
          return;
        }

        // Nếu không có cache hoặc đã hết hạn
        let userInfo = await APIServices.getAuthInfo();
        const followerStatus = Boolean(userInfo?.isFollower);

        // Cập nhật state và cache
        setIsFollower(followerStatus);
        followerCache.isFollower = followerStatus;
        followerCache.expiry = now + CACHE_DURATION;
      } catch (error) {
        console.error("Error loading follower status:", error);
      }
    };

    load();
  }, []);

  const handleClickFollow = () => {
    console.log('========handleClickFollow========');
    if (data.id) {
      followOA({
        id: data.id,
        success: (res) => {
          setIsFollower(true);
          // Cập nhật cache khi follow thành công
          followerCache.isFollower = true;
          followerCache.expiry = Date.now() + CACHE_DURATION;
        },
        fail: (err) => {},
      });
    }
  };

  const handleOpenChat = () => {
    console.log('========handleOpenChat========');
    if (data.id) {
      ZaloService.openOfficialAccount(data.id);
    }
  };

  return (
    <div className="flex items-center h-24 px-3 m-4 mt-0 rounded-md oa-widget">
      <img className="w-12 rounded-full" src={data?.logo} />
      <p className="px-3 text-sm font-medium text-white line-clamp-3">
        {isFollower
          ? `Nhắn tin với OA ${data.name}`
          : "Quan tâm OA để nhận thông báo khi có sự kiện"}
      </p>
      <div className="ml-auto">
        {!isFollower && (
          <button
            className="whitespace-nowrap bg-white h-10 flex items-center rounded-lg px-2 py-4 text-[#0E3D8A] font-medium text-sm"
            onClick={handleClickFollow}
          >
            Quan tâm
          </button>
        )}
        {isFollower && (
          <button
            className="whitespace-nowrap bg-white h-10 flex items-center rounded-lg px-2 py-4 text-[#0E3D8A] font-medium text-sm"
            onClick={handleOpenChat}
          >
            Nhắn tin
          </button>
        )}
      </div>
    </div>
  );
};

export default WidgetOA;
