import React, { useState } from "react";
import { Page } from "zmp-ui";
import APIService from "../services/api-service";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { membershipInfoState } from "../state";
import IconShareBlog from "../components/icons/share-icon-blog";
import { openShareSheet } from "zmp-sdk/apis";
import Helper from "../utils/helper";

const MembershipDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const membership = useRecoilValue(membershipInfoState(id));
  console.log("membership", membership);

  const shareLink = `users/memberships/detail/${membership?.id}`;

  const shareMembership = async () => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            membership?.customFields["Tên Công Ty"] ||
              "Hội doanh nhân trẻ TP.HCM (YBA HCM)",
            100
          ),
          description: `${membership?.customFields["Tên Ưu Đãi"]}`,
          thumbnail:
            (membership?.customFields["Banner"] &&
              membership?.customFields["Banner"][0]?.url) ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: shareLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Page className="bg-white safe-page-content">
      <img
        className="block w-full -mt-2 mb-2.5"
        src={`${
          membership?.customFields?.["Banner"]?.[0].url ||
          "https://api.ybahcm.vn/public/yba/yba-01.png"
        }`}
      />
      <div className="flex px-4 flex-col space-y-2.5">
        {membership?.customFields?.["Hình Ảnh"]?.[0] && (
          <div className="aspect-[1/1] mx-auto overflow-hidden w-[92px]">
            <img
              className="block w-full object-contain -mt-2 mb-2.5"
              alt={membership?.customFields?.["Tên Công Ty"]}
              src={`${membership?.customFields?.["Hình Ảnh"]?.[0].url}`}
            />
          </div>
        )}
        <div className="text-center mb-2">
          <h1 className="font-semibold text-[18px] text-[#333333] leading-[23.4px] mb-4">
            {membership?.customFields?.["Tên Công Ty"]}
          </h1>
          <span className="rounded-[99px] border border-[#E5E5E5] px-4 py-2 text-[#0E3D8A] text-[16px] leading-[20.8px] font-semibold">
            {membership?.customFields?.["Tên Ưu Đãi"]}
          </span>
        </div>
        <div className="text-normal py-2.5">
          <div className="ql-snow">
            <div
              className={`ql-editor`}
              dangerouslySetInnerHTML={{
                __html: membership.customFields["Nội Dung Ưu Đãi"].html,
              }}
            />
          </div>
        </div>
        <div className="mt-5 pb-10 flex space-x-[10px] text-[15px] leading-[18px]">
          <button
            onClick={shareMembership}
            className="bg-blue-custom w-full flex items-center justify-center space-x-1 text-white font-medium h-10 rounded-lg mx-auto block"
          >
            <span>Chia sẻ</span>
            <IconShareBlog />
          </button>
        </div>
      </div>
    </Page>
  );
};

export default MembershipDetailPage;
