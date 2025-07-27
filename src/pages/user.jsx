import React, { useState, useEffect } from "react";
import { Page, Icon, useNavigate, Box, Modal } from "zmp-ui";
import {
  configState,
} from "../state";
import { useRecoilValue } from "recoil";
import APIServices from "../services/api-service";
import WidgetOA from "../components/widget-oa";
import PoweredByBlock from "../components/powered-by-block";
import AuthSuccessIcon from "../components/icons/authenticate-success";
import { useAuth } from "../contexts/AuthContext";
import { getImageProps } from "../utils/imageHelper";

const UserPage = () => {
  const navigate = useNavigate();
  const configs = useRecoilValue(configState);

  // ===== NEW: Use AuthContext instead of old authentication =====
  const {
    userInfo,
    member,
    userType,
    accountInfo,
    getMemberInfoById,
    isAuthenticated,
    isMember
  } = useAuth();

  // Determine if user is member from AuthContext
  // const isMember = userType === 'member';

  const [membershipFeeStatus, setMembershipFeeStatus] = useState(null);
  const [memberBenefits, setMemberBenefits] = useState([]);
  const [isLoadingMember, setIsLoadingMember] = useState(false);

  // ===== NEW: Ensure member data is loaded when account has member reference =====
  useEffect(() => {
    const ensureMemberDataLoaded = async () => {
      // Check if account has member reference but member data is not loaded
      if (accountInfo?.hoi_vien?.documentId && !member && !isLoadingMember) {
        console.log('UserPage: Account has member reference but no member data, loading member info');
        setIsLoadingMember(true);

        try {
          await getMemberInfoById(accountInfo.hoi_vien.documentId);
          console.log('UserPage: Successfully loaded member data from account reference');
        } catch (error) {
          console.error('UserPage: Error loading member data from account reference:', error);
        } finally {
          setIsLoadingMember(false);
        }
      }
    };

    ensureMemberDataLoaded();
  }, [accountInfo, member, getMemberInfoById, isAuthenticated, isMember, isLoadingMember]);

  // ===== NEW: Load member-specific data when user is a member =====
  useEffect(() => {
    const loadMemberData = async () => {
      // Check if we should load member data
      const shouldLoadMemberData = isMember && (member?.documentId || accountInfo?.hoi_vien?.documentId);

      if (!shouldLoadMemberData) {
        console.log('UserPage: Not a member or no member ID available, skipping member data load');
        setMembershipFeeStatus(null);
        setMemberBenefits([]);
        return;
      }

      // Get member ID from either member data or account reference
      const memberId = member?.documentId || accountInfo?.hoi_vien?.documentId;
      console.log('UserPage: Loading member data for member ID:', memberId);

      try {
        console.log('UserPage: Loading member data for member ID:', memberId);

        // Check membership fee status using the member ID
        try {
          const feeStatus = await APIServices.checkMembershipFeeStatus(memberId);
          console.log('UserPage: Membership fee status for member ID', memberId, ':', feeStatus);
          setMembershipFeeStatus(feeStatus.data);
        } catch (error) {
          console.error('UserPage: Error checking membership fee status:', error);
          setMembershipFeeStatus({ status: "Chưa đóng hội phí", hasPaidFee: false });
        }

        // Load member benefits
        try {
          const benefits = await APIServices.getMemberBenefits({
            hien_thi: { eq: true }
          });
          console.log('UserPage: Member benefits:', benefits);
          if (benefits.error === 0) {
            setMemberBenefits(benefits.data);
          }
        } catch (error) {
          console.error('UserPage: Error loading member benefits:', error);
          setMemberBenefits([]);
        }

      } catch (error) {
        console.error('UserPage: Error loading member data:', error);
        setMembershipFeeStatus(null);
        setMemberBenefits([]);
      }
    };

    loadMemberData();
  }, [isMember, member?.documentId, accountInfo?.hoi_vien?.documentId]); // Re-run when member status or member ID changes

  // ===== REMOVED: Old refresh logic - AuthContext handles this automatically =====

  // ===== NEW: Get group ID from AuthContext member data =====
  const groupId = (isMember && member?.chapter?.documentId) || "";

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const goToRegister = () => {
    if (!isMember) {
      navigate("/members/register");
    } else {
      navigate("/members/info");
    }
  };

  const copyURL = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => { },
      (err) => {
        if (err.name === "NotAllowedError") {
          const tempInput = document.createElement("input");
          tempInput.value = url;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand("copy");
          document.body.removeChild(tempInput);
        } else {
          console.error("Failed to copy URL: ", err);
        }
      }
    );
  };

  // ✅ FIXED: Status display using correct AuthContext data types
  const getStatus = () => {
    if (isMember && member) {
      // ✅ FIXED: Use correct field name and handle enum values
      const memberStatus = member.trang_thai_hoi_vien || member.status || "Dang_hoat_dong";
      const accountStatus = member.trang_thai || "Hoat_dong";

      // Handle locked account status with correct enum values
      if (memberStatus === "Ngung_hoat_dong" || accountStatus === "Khoa_tai_khoan") {
        return (
          <p className="w-fit text-[13px] text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-1 py-0.5 rounded-md">
            {accountStatus === "Khoa_tai_khoan" ? "Khóa tài khoản" : "Ngừng hoạt động"}
          </p>
        );
      } else {
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1 w-fit text-[13px] text-[#333333] bg-[#E5E5E5] px-1 py-0.5 rounded-md">
              <AuthSuccessIcon />
              <p className="text-center">Đã xác thực</p>
            </div>
            <div className="flex flex-col text-xs text-gray-600">
              <span>{getMemberType()}</span>
              <span>{getMemberChapter()}</span>
            </div>
          </div>
        );
      }
    } else {
      return (
        <p className="w-fit text-[13px] text-[#333333] bg-[#E5E5E5] px-1 py-0.5 rounded-md">
          Chưa xác thực
        </p>
      );
    }
  };

  const handleVerifyMember = async () => {
    navigate("/members/verify");
  };

  // ===== NEW: Helper functions using AuthContext member data =====
  const getMemberName = () => {
    if (isMember && member) {
      // Use member data from AuthContext
      return member.full_name ||
        member.last_name ||
        member.first_name ||
        (userInfo && userInfo.name) ||
        "Thành viên";
    } else if (isMember && accountInfo?.hoi_vien?.documentId && !member) {
      // Member account but member data not loaded yet
      return (userInfo && userInfo.name) || "Đang tải thông tin hội viên...";
    } else {
      // Guest user - use Zalo profile name
      return (userInfo && userInfo.name) || "Vãng lai";
    }
  };

  const getMemberChapter = () => {
    if (isMember && member) {
      return member.chapter?.ten_chi_hoi || "Chưa có chi hội";
    } else if (isMember && accountInfo?.hoi_vien?.documentId && !member) {
      return "Đang tải...";
    }
    return "Chưa có chi hội";
  };

  const getMemberType = () => {
    if (isMember && member) {
      return member.member_type || "Hội viên";
    } else if (isMember && accountInfo?.hoi_vien?.documentId && !member) {
      return "Đang tải...";
    }
    return "Khách";
  };

  const getMemberStatus = () => {
    if (isMember && member) {
      // ✅ FIXED: Use correct field names and convert enum to Vietnamese
      const memberStatus = member.trang_thai_hoi_vien || member.status || "Dang_hoat_dong";
      const accountStatus = member.trang_thai || "Hoat_dong";

      if (accountStatus === "Khoa_tai_khoan") {
        return "Khóa tài khoản";
      } else if (memberStatus === "Ngung_hoat_dong") {
        return "Ngừng hoạt động";
      } else if (memberStatus === "Roi_hoi") {
        return "Rời hội";
      } else {
        return "Đang hoạt động";
      }
    } else if (isMember && accountInfo?.hoi_vien?.documentId && !member) {
      return "Đang tải thông tin...";
    }
    return "Chưa xác thực";
  };

  const hasChapterInfo = () => {
    if (isMember && member) {
      return member.chapter?.ten_chi_hoi;
    }
    return false;
  };

  return (
    <Page className="safe-page-content">
      {/* ===== NEW: Loading indicator when member data is being loaded ===== */}
      {isLoadingMember && (
        <div className="flex items-center justify-center py-4 mx-4 mt-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Đang tải thông tin hội viên...</span>
          </div>
        </div>
      )}

      {!isMember && (
        <div className="gap-2.5 grid">
          <div className="flex items-center px-3 py-2 mx-4 mt-3 bg-white rounded-lg shadow-sm">
            <img
              className="rounded-full w-14 h-14"
              {...getImageProps(
                null,
                "https://api.ybahcm.vn/public/yba/default-avatar.png",
                {
                  alt: "Default avatar",
                  className: "rounded-full w-14 h-14"
                }
              )}
            />
            <div className="pl-4">
              <p className="text-[16px] leading-[120%] font-semibold mb-0.5 text-[#333333]">
                {getMemberName()}
              </p>
              <p className="text-[14px] leading-[120%] text-[#333333] py-0.5 px-1 rounded bg-[#E5E5E5]">
                {getMemberStatus()}
              </p>
            </div>
            <div className="flex items-center justify-end flex-1 space-x-2">
              <button
                className="whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
                onClick={() => handleVerifyMember()}
              >
                Xác thực
              </button>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
          </div>

          <div className="px-4 mx-4 bg-white rounded-lg shadow-sm">
            <div
              className="flex items-center justify-between py-3 text-[#0E3D8A]"
              onClick={() => goToRegister()}
            >
              <p className="text-base">Đăng ký hội viên</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
            <div
              className="flex items-center justify-between py-3"
              onClick={() => navigate("/about")}
            >
              <p className="text-base">Thông tin về YBA</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
          </div>
          <WidgetOA data={configs?.oaInfo || {}} />
        </div>
      )}
      {isMember && (
        <div className="gap-2.5 grid">
          <div className="flex items-center px-3 py-2 mx-4 mt-3 bg-white rounded-lg shadow-sm">
            <img
              className="rounded-full w-14 h-14"
              {...getImageProps(
                member?.member_image?.url || userInfo?.avatar ||
                "https://api.ybahcm.vn/public/yba/default-avatar.png"
              )}
            />
            <div className="pl-4">
              <p className="text-[16px] text-[#333333] font-semibold mb-1">
                {getMemberName()}
              </p>
              {getStatus()}
              {/* Membership fee status display */}
              {membershipFeeStatus && (
                <div className="mt-1">
                  <p className={`text-xs px-2 py-1 rounded-md font-medium ${membershipFeeStatus.hasPaidFee
                    ? 'text-green-700 bg-green-100 border border-green-300'
                    : 'text-orange-700 bg-orange-100 border border-orange-300'
                    }`}>
                    {membershipFeeStatus.status}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center ml-auto space-x-2">
              {isMember ? (
                hasChapterInfo() && (
                  <button
                    className="mx-auto whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
                    onClick={() =>
                      navigate(
                        `/invite-to-join-by-link/${groupId}/${encodeURIComponent(
                          getMemberName()
                        )}`
                      )
                    }
                  >
                    Mời hội viên
                  </button>
                )
              ) : (
                <button
                  className="mx-auto whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
                  onClick={() => handleVerifyMember()}
                >
                  Xác thực
                </button>
              )}
              <Icon
                onClick={() => navigate("/members/info")}
                icon="zi-chevron-right"
                size={16}
              />
            </div>
          </div>
          <div className="mx-4 bg-white rounded-lg overflow-hidden shadow-sm py">
            {/* <div
							className="flex items-center justify-between py-3 border-b border-gray-100"
							onClick={() => navigate("/members/info")}
						>
							<p className="text-base">Thông tin cá nhân</p>
							<Icon icon="zi-chevron-right" size={16} />
						</div> */}
            <div
              className="flex px-3  items-center justify-between py-3 border-b border-gray-100"
              onClick={() => navigate("/tickets-management?tabId=1")}
            >
              <p className="text-base">Sự kiện sắp tham gia</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
            <div
              className="flex px-3  items-center justify-between py-3 border-b border-gray-100"
              onClick={() => navigate("/tickets-management?tabId=2")}
            >
              <p className="text-base">Sự kiện đã tham gia</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
            <div
              className="flex px-3  items-center justify-between py-3"
              onClick={() => navigate("/about")}
            >
              <p className="text-base">Thông tin về YBA</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
            <div
              className="flex px-3  items-center justify-between py-3 bg-[#E6F4FF]"
              onClick={() => navigate("/users/memberships")}
            >
              <p className="text-[#0E3D8A] font-bold">Ưu đãi hội viên YBA</p>
              <Icon icon="zi-chevron-right" size={16} />
            </div>
          </div>
          <WidgetOA data={configs?.oaInfo || {}} />
        </div>
      )}
      <PoweredByBlock customClass="fixed bottom-24 left-0 right-0" />
      <Modal
        visible={isShareModalOpen}
        title=""
        onClose={() => { }}
        verticalActions
      >
        <Box p={6}>
          <div className="w-[170px] mx-auto">
            <img
              src={"https://api.ybahcm.vn/public/yba/qr-demo.png"}
              alt="qr"
              className="w-full"
            />
          </div>
          <p
            onClick={() => copyURL()}
            className="w-full p-4 text-sm text-center"
          >
            Sao chép URL
          </p>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={() => setIsShareModalOpen(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default UserPage;
