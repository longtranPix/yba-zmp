import React, { useState } from "react";
import { Page } from "zmp-ui";
import APIService from "../services/api-service";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { membershipInfoState } from "../state";
import IconShareBlog from "../components/icons/share-icon-blog";
import { openShareSheet } from "zmp-sdk/apis";
import Helper from "../utils/helper";
import { getMemberBenefitImageUrl, getImageProps } from "../utils/imageHelper";

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
            membership?.company?.ten_cong_ty ||
            membership?.customFields?.["Tên Công Ty"] ||
              "Hội doanh nhân trẻ TP.HCM (YBA HCM)",
            100
          ),
          description: `${membership?.title || membership?.customFields?.["Tên Ưu Đãi"] || ''}`,
          thumbnail: getMemberBenefitImageUrl(membership, 'banner') ||
            (membership?.customFields?.["Banner"] &&
              getImageProps(membership?.customFields?.["Banner"][0]?.url).src) ||
            getImageProps(null).src,
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
        {...getImageProps(
          membership?.bannerImage?.url ||
          membership?.customFields?.["Banner"]?.[0]?.url
        )}
        alt={membership?.title || "Member benefit banner"}
      />
      <div className="flex px-4 flex-col space-y-2.5">
        {/* ===== NEW: Use schema-compliant logo image with fallback ===== */}
        {(membership?.logoImage || membership?.customFields?.["Hình Ảnh"]?.[0]) && (
          <div className="aspect-[1/1] mx-auto overflow-hidden w-[92px]">
            <img
              className="block w-full object-contain -mt-2 mb-2.5"
              {...getImageProps(
                membership?.logoImage?.url ||
                membership?.customFields?.["Hình Ảnh"]?.[0]?.url
              )}
              alt={membership?.company?.ten_cong_ty || membership?.customFields?.["Tên Công Ty"] || "Logo"}
            />
          </div>
        )}
        <div className="text-center mb-2">
          <h1 className="font-semibold text-[18px] text-[#333333] leading-[23.4px] mb-4">
            {membership?.company?.ten_cong_ty || membership?.customFields?.["Tên Công Ty"] || "Đối tác"}
          </h1>
          <span className="rounded-[99px] border border-[#E5E5E5] px-4 py-2 text-[#0E3D8A] text-[16px] leading-[20.8px] font-semibold">
            {membership?.title || membership?.customFields?.["Tên Ưu Đãi"] || "Ưu đãi"}
          </span>
          {/* ===== NEW: Show benefit type and value from schema ===== */}
          {membership?.benefitType && (
            <div className="mt-2 flex justify-center space-x-2">
              <span className="bg-[#E6F4FF] text-[#0E3D8A] text-[12px] font-medium px-2 py-1 rounded">
                {APIService.getMemberBenefitTypeDisplay(membership.benefitType)}
              </span>
              {membership?.value && (
                <span className="bg-[#FFF2E6] text-[#D46B08] text-[12px] font-medium px-2 py-1 rounded">
                  {membership.value} {APIService.getMemberBenefitValueUnitDisplay(membership.valueUnit)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-normal py-2.5">
          <div className="ql-snow">
            <div
              className={`ql-editor`}
              dangerouslySetInnerHTML={{
                __html: membership?.description ||
                        membership?.customFields?.["Nội Dung Ưu Đãi"]?.html ||
                        "Thông tin chi tiết sẽ được cập nhật sớm."
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
