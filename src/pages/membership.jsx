import React, { useState, useEffect } from "react";
import { Page } from "zmp-ui";
import APIService from "../services/api-service";
import { getMemberBenefitImageUrl, getImageProps } from "../utils/imageHelper";
import { useNavigate } from "react-router-dom";

const MembershipPage = () => {
  const navigate = useNavigate();
  const [memberBenefits, setMemberBenefits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load member benefits using GraphQL API
  useEffect(() => {
    const loadMemberBenefits = async () => {
      try {
        setLoading(true);
        console.log('MembershipPage: Loading member benefits via GraphQL');

        const response = await APIService.getMemberBenefits({
          hien_thi: { eq: true }
        });

        if (response.error === 0) {
          console.log('MembershipPage: Loaded member benefits:', response.data);
          setMemberBenefits(response.data);
        } else {
          console.error('MembershipPage: Error loading member benefits:', response.message);
          setMemberBenefits([]);
        }
      } catch (error) {
        console.error('MembershipPage: Error loading member benefits:', error);
        setMemberBenefits([]);
      } finally {
        setLoading(false);
      }
    };

    loadMemberBenefits();
  }, []);



  return (
    <Page className="bg-white page safe-page-content">
      <div className="flex flex-col space-y-3">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Đang tải ưu đãi hội viên...</p>
          </div>
        ) : (
          <>
            {/* Member Benefits Section */}
            {memberBenefits.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#333333] mb-3 px-3">
                  Ưu đãi hội viên
                </h2>
                {memberBenefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="py-3 px-3 border border-[#E5E5E5] rounded-[6px] flex space-x-4 mb-3"
                    onClick={() => {
                      navigate(`/users/memberships/detail/${benefit.id}`);
                    }}
                  >
                    <div className="aspect-[1/1] w-[99px] overflow-hidden rounded flex items-center justify-center">
                      <img
                        {...getImageProps(benefit.logoImage?.url || benefit.image?.url)}
                        alt={benefit.title || "Member benefit"}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-[16px] font-semibold text-[#333333] mb-1">
                        {benefit.title}
                      </p>
                      <p className="text-[14px] text-[#666666] mb-2">
                        {benefit.description || `${benefit.company?.ten_cong_ty || 'Đối tác'} - ${APIService.getMemberBenefitTypeDisplay(benefit.benefitType)}`}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="bg-[#E6F4FF] text-[#0E3D8A] text-[12px] font-medium px-2 py-1 rounded">
                          {APIService.getMemberBenefitTypeDisplay(benefit.benefitType)}
                        </div>
                        {benefit.value && (
                          <div className="bg-[#FFF2E6] text-[#D46B08] text-[12px] font-medium px-2 py-1 rounded">
                            {benefit.value} {APIService.getMemberBenefitValueUnitDisplay(benefit.valueUnit)}
                          </div>
                        )}
                        {benefit.status && (
                          <div className="bg-[#F6FFED] text-[#52C41A] text-[12px] font-medium px-2 py-1 rounded">
                            {APIService.getMemberBenefitStatusDisplay(benefit.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}



            {/* Empty state */}
            {memberBenefits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <img
                  src="https://api.ybahcm.vn/public/yba/yba-01.png"
                  alt="No benefits"
                  className="w-24 h-24 opacity-50 mb-4"
                />
                <p className="text-gray-500 text-center">
                  Chưa có ưu đãi hội viên nào
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
};

export default MembershipPage;
