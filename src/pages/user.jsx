import React, { useState, useEffect } from "react";
import { Page, Icon, useNavigate, Box, Modal } from "zmp-ui";
import {
  configState,
  userZaloProfileState,
  userByPhoneNumberState,
} from "../state";
import { useRecoilValue } from "recoil";
import APIServices from "../services/api-service";
import WidgetOA from "../components/widget-oa";
import PoweredByBlock from "../components/powered-by-block";
import AuthSuccessIcon from "../components/icons/authenticate-success";

const UserPage = () => {
  const navigate = useNavigate();
  const configs = useRecoilValue(configState);
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const profile = useRecoilValue(userByPhoneNumberState);
  const [isMember, setIsMember] = useState(false);

  // Check member status based on auth info and profile data
  useEffect(() => {
    const checkMemberStatus = async () => {
      try {
        console.log('UserPage: Checking member status');

        // Get current auth info
        const authInfo = await APIServices.getAuthInfo();
        console.log('UserPage: Auth info:', {
          hasJWT: !!authInfo?.jwt,
          isMember: authInfo?.isMember,
          memberId: authInfo?.memberId,
          hasProfile: !!profile
        });

        // User is a member if they have auth info indicating membership OR profile data
        const isUserMember = (authInfo?.isMember && authInfo?.memberId) || profile !== null;

        console.log('UserPage: Setting isMember to:', isUserMember);
        setIsMember(isUserMember);

      } catch (error) {
        console.error('UserPage: Error checking member status:', error);
        setIsMember(false);
      }
    };

    checkMemberStatus();
  }, [profile]); // Re-check when profile changes

  // Also check member status on component mount and when returning from verification
  useEffect(() => {
    const handleMemberStatusRefresh = async () => {
      // Check if we just returned from verification (has auth info but no profile yet)
      const authInfo = await APIServices.getAuthInfo();
      if (authInfo?.isMember && authInfo?.memberId && !profile) {
        console.log('UserPage: Detected verified member without profile, refreshing...');
        await refreshMemberInfo();
      }
    };

    handleMemberStatusRefresh();
  }, []); // Run once on mount

  // Function to refresh member info and update layout
  const refreshMemberInfo = async () => {
    try {
      console.log('UserPage: Refreshing member info');

      // Get current auth info
      const authInfo = await APIServices.getAuthInfo();

      if (authInfo?.isMember && authInfo?.memberId) {
        console.log('UserPage: Fetching fresh member data using documentId:', authInfo.memberId);

        // Call GraphQL getMember to get fresh comprehensive data
        const memberResponse = await APIServices.getMember(authInfo.memberId);

        if (memberResponse.error === 0 && memberResponse.member) {
          console.log('UserPage: Got fresh member data:', memberResponse.member);

          // Update cached member data in authInfo
          authInfo.memberData = memberResponse.member;

          // Update member status to verified
          setIsMember(true);

          console.log('UserPage: Updated to verified member status with fresh data');

          return memberResponse.member;
        } else {
          console.warn('UserPage: Failed to fetch member data:', memberResponse);
          return null;
        }
      } else {
        console.log('UserPage: No member ID available, user remains as guest');
        setIsMember(false);
        return null;
      }

    } catch (error) {
      console.error('UserPage: Error refreshing member info:', error);
      setIsMember(false);
      return null;
    }
  };

  const groupId = profile?.customFields?.["Chi hội"]?.[0]?.id || "";

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
      () => {},
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

  const getStatus = () => {
    if (
      profile?.customFields["(Tạm) Trạng Thái Xác Thực"] == "Khóa tài khoản"
    ) {
      return (
        <p className="w-fit text-[13px] text-[#FF3333] bg-red-100 font-bold border border-[#FF3333] px-1 py-0.5 rounded-md">
          Khóa tài khoản
        </p>
      );
    } else if (isMember) {
      return (
        <div className="flex items-center space-x-1 w-fit text-[13px] text-[#333333] bg-[#E5E5E5] px-1 py-0.5 rounded-md">
          <AuthSuccessIcon />
          <p className="text-center">Đã xác thực</p>
        </div>
      );
    } else {
      return (
        <p className="w-fit text-[13px] text-[#333333] bg-[#E5E5E5] px-1 py-0.5 rounded-md">
          {profile?.customFields?.["(Tạm) Trạng Thái Xác Thực"] ||
            "Chưa xác thực"}
        </p>
      );
    }
  };

  const handleVerifyMember = async () => {
    navigate("/members/verify");
  };

  return (
    <Page className="safe-page-content">
      {!isMember && (
        <div className="gap-2.5 grid">
          <div className="flex items-center px-3 py-2 mx-4 mt-3 bg-white rounded-lg shadow-sm">
            <img
              className="rounded-full w-14 h-14"
              src="https://api.ybahcm.vn/public/yba/default-avatar.png"
            />
            <div className="pl-4">
              <p className="text-[16px] leading-[120%] font-semibold mb-0.5 text-[#333333]">
                Vãng lai
              </p>
              <p className="text-[14px] leading-[120%] text-[#333333] py-0.5 px-1 rounded bg-[#E5E5E5]">
                Chưa xác thực
              </p>
            </div>
            <div className="flex items-center justify-end flex-1 space-x-2">
              <button
                className="whitespace-nowrap block py-1 px-3 h-8 bg-gray-500 text-white font-medium text-sm leading-4 rounded-lg"
                onClick={refreshMemberInfo}
                title="Refresh member status"
              >
                ↻
              </button>
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
              src={
                zaloProfile && zaloProfile.avatar
                  ? zaloProfile.avatar
                  : "https://api.ybahcm.vn/public/yba/default-avatar.png"
              }
            />
            <div className="pl-4">
              <p className="text-[16px] text-[#333333] font-semibold mb-1">
                {(profile && profile.customFields?.["Họ và tên"]) ||
                  (zaloProfile && zaloProfile.name) ||
                  ""}
              </p>
              {getStatus()}
            </div>
            <div className="flex items-center ml-auto space-x-2">
              {isMember ? (
                profile?.customFields["Chi hội"]?.[0] && (
                  <button
                    className="mx-auto whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
                    onClick={() =>
                      navigate(
                        `/invite-to-join-by-link/${groupId}/${encodeURIComponent(
                          profile.name
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
        onClose={() => {}}
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
