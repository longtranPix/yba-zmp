import { Suspense } from "react";
import { Page } from "zmp-ui";
import { useRecoilValue } from "recoil";
import { listMemberBenefitsState } from "../state";
import { getImageProps } from "../utils/imageHelper";
import { useNavigate } from "react-router-dom";

const MembershipPage = () => {
  const navigate = useNavigate();

  const MemberBenefitsContent = () => {
    const memberBenefits = useRecoilValue(listMemberBenefitsState);

    console.log('MembershipPage: Using Recoil state, benefits count:', memberBenefits.length);

    return (
      <div className="flex flex-col space-y-3">
        {/* Member Benefits Section */}
        {memberBenefits.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#333333] mb-3 px-3">
              Ưu đãi hội viên
            </h2>
            {memberBenefits.map((benefit) => (
              <div
                key={benefit.documentId || benefit.id}
                className="py-3 px-3 border border-[#E5E5E5] rounded-[6px] flex space-x-4 mb-3"
                onClick={() => {
                  navigate(`/users/memberships/detail/${benefit.documentId || benefit.id}`);
                }}
              >
                <div className="aspect-[1/1] w-[99px] overflow-hidden rounded flex items-center justify-center">
                  <img
                    {...getImageProps(
                      benefit.logo_image?.url ||
                      benefit.logoImage?.url ||
                      benefit.image?.url ||
                      benefit.company?.logo?.url
                    )}
                    alt={benefit.title || benefit.ten_uu_dai || "Member benefit"}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[16px] font-semibold text-[#333333] mb-1">
                    {benefit.title || benefit.ten_uu_dai}
                  </p>
                  <p className="text-[14px] text-[#666666] mb-2">
                    {benefit.description || benefit.mo_ta || `${benefit.company?.ten_cong_ty || 'Đối tác'} - ${benefit.loai_uu_dai || 'Ưu đãi'}`}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#E6F4FF] text-[#0E3D8A] text-[12px] font-medium px-2 py-1 rounded">
                      {benefit.loai_uu_dai || benefit.benefitType || 'Ưu đãi'}
                    </div>
                    {(benefit.value || benefit.gia_tri) && (
                      <div className="bg-[#FFF2E6] text-[#D46B08] text-[12px] font-medium px-2 py-1 rounded">
                        {benefit.value || benefit.gia_tri} {benefit.don_vi_gia_tri || benefit.valueUnit || ''}
                      </div>
                    )}
                    {(benefit.status || benefit.trang_thai) && (
                      <div className="bg-[#F6FFED] text-[#52C41A] text-[12px] font-medium px-2 py-1 rounded">
                        {benefit.status || benefit.trang_thai}
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
      </div>
    );
  };

  return (
    <Page className="bg-white page safe-page-content">
      <Suspense fallback={
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">Đang tải ưu đãi hội viên...</p>
        </div>
      }>
        <MemberBenefitsContent />
      </Suspense>
    </Page>
  );
};

export default MembershipPage;
