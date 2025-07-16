import React, { useState } from "react";
import { Page } from "zmp-ui";
import APIService from "../services/api-service";
import { useNavigate } from "react-router-dom";
import { listMembershipState } from "../state";
import { useRecoilValue } from "recoil";

const MembershipPage = () => {
  const navigate = useNavigate();
  const memberships = useRecoilValue(listMembershipState);

  const sortedMemberships = [...memberships].sort((a, b) => {
    const isPriorityA = a.customFields["Ưu tiên hiển thị"] || false;
    const isPriorityB = b.customFields["Ưu tiên hiển thị"] || false;

    if (isPriorityA !== isPriorityB) {
      return isPriorityB ? 1 : -1;
    }

    const dateA = new Date(a.customFields["Tạo lúc"]);
    const dateB = new Date(b.customFields["Tạo lúc"]);

    if (dateA.getTime() === dateB.getTime()) {
      return (a.customFields["Tên Công Ty"] || "").localeCompare(
        b.customFields["Tên Công Ty"] || ""
      );
    }

    return dateB - dateA;
  });

  const membershipIds = memberships.map((membership) => membership.id);
  return (
    <Page className="bg-white page safe-page-content">
      <div className="flex flex-col space-y-3">
        {sortedMemberships.map((membership) => (
          <div
            className="py-2 px-3 border border-[#E5E5E5] rounded-[6px] flex space-x-4"
            onClick={() => {
              navigate(`/users/memberships/detail/${membership.id}`);
            }}
          >
            <div className="aspect-[1/1] w-[99px] overflow-hidden rounded flex items-center justify-center">
              <img
                src={
                  membership.customFields["Hình Ảnh"]?.[0].url ||
                  "https://api.ybahcm.vn/public/yba/yba-01.png"
                }
                alt={membership.customFields["Tên Công Ty"]}
                className="object-contain "
              />
            </div>
            <div className="flex-1 flex flex-col space-y-1 justify-center text-[#333333]">
              <div className="font-bold text-[15px] leading-[18px]">
                {membership.customFields["Tên Công Ty"]}
              </div>
              {membership.customFields["Mô tả"] &&
                membership.customFields["Mô tả"].length > 0 && (
                  <div className="text-[#F40000] text-[16px] leading-[19.2px] font-semibold">
                    {membership.customFields["Mô tả"]}
                  </div>
                )}
              <div className="text-[12px] leading-[14.4px]">
                {membership.customFields["Tên Ưu Đãi"]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
};

export default MembershipPage;
