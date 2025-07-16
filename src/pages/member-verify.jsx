import React, { useEffect, useState } from "react";
import { Page, useNavigate, Icon, Box, Modal } from "zmp-ui";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  refreshTrigger,
  userByPhoneNumberState,
  userZaloProfileState,
  zaloProfileRefreshTrigger,
  phoneNumberRefreshTrigger, // Add this import
} from "../state";
import APIService from "../services/api-service";
import FaceIcon from "../components/icons/face-icon";
import VerifySuccessIcon from "../components/icons/verify-success-icon";
import MemberVerifyLoading from "../components/skeletons/member-verify-loading";

const MemberVerifyPage = () => {
  const navigate = useNavigate();
  const profile = useRecoilValue(userByPhoneNumberState);
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useSetRecoilState(refreshTrigger);
  const refreshZaloProfile = useSetRecoilState(zaloProfileRefreshTrigger);
  const refreshPhoneNumber = useSetRecoilState(phoneNumberRefreshTrigger);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [popupVerifySuccess, setPopupVerifySuccess] = useState(false);
  const [currentProfile, setCurrentProfile] = useState({
    phoneNumber: profile?.phone || "",
    email: profile?.email || "",
  });

  const [popupError, setPopupError] = useState(false);
  const [popupErrorData, setPopupErrorData] = useState({
    title: "",
    description: "",
  });

  const goToRegister = () => {
    navigate("/members/register");
  };

  const verifyEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email);
  };

  const normalizePhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/^\+/, "").replace(/\D/g, "");
    if (digits.startsWith("840")) {
      return "84" + digits.slice(3);
    }
    if (digits.startsWith("84")) {
      return digits;
    }
    if (digits.startsWith("0")) {
      return "84" + digits.slice(1);
    }
    return "84" + digits;
  };

  const verifyPhone = (phone) => {
    const phoneRegex = /^(0|84|\+84)[0-9]{9}$/;
    return !phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const save = async () => {
    console.log("save/currentProfile", currentProfile);
    if (verifyPhone(currentProfile.phoneNumber)) {
      setPhoneInvalid(true);
      return;
    }
    if (verifyEmail(currentProfile.email)) {
      setEmailInvalid(true);
      return;
    }

    setIsProcessing(true);
    try {
      console.log("save/zaloProfile", zaloProfile);

      const result = await APIService.verifyMember(
        currentProfile,
        zaloProfile?.id,
        zaloProfile?.zaloIDByOA,
        profile?.customFields["Họ và tên"] || zaloProfile?.name || "no name"
      );
      console.log("save/verifyMember", result);

      if (result.message === "Success") {
        console.log("Member verification successful:", result.data);

        // New verify member API already handles:
        // 1. JWT authentication and storage
        // 2. Member data storage in authInfo
        // 3. Account linking (if available in response)
        // No need to create accounts or save JSON manually

        // Refresh state to reflect the new member status
        refresh((prev) => prev + 1);
        refreshZaloProfile((prev) => prev + 1);
        refreshPhoneNumber((prev) => prev + 1);

        // Small delay to ensure state updates
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Show success popup
        setPopupVerifySuccess(true);

        // Check if user is a member or guest
        if (result.data.isGuest || result.data.id === null) {
          console.log("User verified as guest - no member account found");
        } else {
          console.log("User verified as member:", {
            memberId: result.data.id,
            memberName: result.data.member?.full_name,
            chapter: result.data.member?.chapter?.ten_chi_hoi,
            memberType: result.data.member?.member_type
          });
        }
      } else {
        setPopupErrorData({
          title: result?.alert?.title || "Có lỗi xảy ra",
          description:
            result?.alert?.message || "Vui lòng lên hệ với YBA để được hỗ trợ",
        });
        setPopupError(true);
        refreshZaloProfile((prev) => prev + 1);
        refreshPhoneNumber((prev) => prev + 1);
        return;
      }
    } catch (error) {
      console.log("error in verify", error);
      setPopupErrorData({
        title: "Có lỗi xảy ra!!!",
        description: "Vui lòng lên hệ với YBA để được hỗ trợ",
      });
      setPopupError(true);
      refreshZaloProfile((prev) => prev + 1);
      refreshPhoneNumber((prev) => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const verifySuccess = async () => {
    try {
      console.log("verifySuccess: Processing successful verification");

      // Get the current auth info to check if user is a member
      const authInfo = await APIService.getAuthInfo();
      console.log("verifySuccess: Current auth info:", {
        hasJWT: !!authInfo?.jwt,
        isMember: authInfo?.isMember,
        memberId: authInfo?.memberId,
        hasComprehensiveData: !!authInfo?.memberData
      });

      if (authInfo?.isMember && authInfo?.memberId) {
        console.log("verifySuccess: Member verified, processing profile data");

        // Ensure we have the most up-to-date comprehensive member data
        let memberData = authInfo.memberData;

        // If we don't have comprehensive data cached, fetch it using documentId
        if (!memberData || !memberData.chapter) {
          try {
            console.log("verifySuccess: Fetching comprehensive member data using documentId:", authInfo.memberId);
            const memberResponse = await APIService.getMember(authInfo.memberId);
            if (memberResponse.error === 0 && memberResponse.member) {
              memberData = memberResponse.member;

              // Update authInfo with comprehensive data
              authInfo.memberData = memberData;

              console.log("verifySuccess: Updated member data with comprehensive info:", {
                hasChapter: !!memberData.chapter,
                hasAccounts: !!memberData.tai_khoan?.length,
                memberType: memberData.member_type,
                status: memberData.status
              });
            }
          } catch (error) {
            console.error("verifySuccess: Error fetching comprehensive member data:", error);
            // Continue with existing data
          }
        }

        // Update member with Zalo information if available and different
        const memberUpdateData = {};
        if (zaloProfile?.id && memberData?.zalo !== zaloProfile.id) {
          memberUpdateData.zalo = zaloProfile.id;
        }

        // Save profile updates if needed
        if (Object.keys(memberUpdateData).length > 0) {
          try {
            console.log("verifySuccess: Updating member profile with Zalo info:", memberUpdateData);
            const updateResponse = await APIService.updateRegisterMember(authInfo.memberId, memberUpdateData);
            if (updateResponse.data?.updateMemberInformation) {
              // Update cached member data with the response
              authInfo.memberData = updateResponse.data.updateMemberInformation;
              console.log("verifySuccess: Member profile updated and cached");
            }
          } catch (error) {
            console.error("verifySuccess: Error updating member profile:", error);
            // Continue anyway - this is not critical
          }
        }

        // Force refresh of all member-related state to switch to verified status
        console.log("verifySuccess: Refreshing state to switch to verified member status");
        refreshPhoneNumber((prev) => prev + 1);  // Refreshes userByPhoneNumberState
        refreshZaloProfile((prev) => prev + 1);  // Refreshes userZaloProfileState
        refresh((prev) => prev + 1);             // General refresh trigger

        // Small delay to ensure state updates propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("verifySuccess: Navigating to member profile with comprehensive data");
        setPopupVerifySuccess(false);
        navigate("/member-info"); // Navigate to member profile page

      } else {
        console.log("verifySuccess: Guest user verified, navigating to users page");
        setPopupVerifySuccess(false);
        navigate("/users"); // Navigate to users page for guest
      }

    } catch (error) {
      console.error("verifySuccess: Error processing verification success:", error);
      // Fallback navigation
      setPopupVerifySuccess(false);
      navigate("/users");
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <MemberVerifyLoading />;
  }

  return (
    <Page className="bg-white page safe-page-content">
      <div className="text-sm border rounded-lg px-4 py-2 bg-[#F3F9FF]">
        <p className="my-2 font-bold">Lưu ý:</p>
        <p className="text-[#6F7071]">
          Để xác thực thông tin, Hội Viên cần nhập số{" "}
          <strong>điện thoại</strong> và <strong>email</strong> đã đăng ký với
          Hội theo đúng định dạng được hướng dẫn. <br />
          Mọi thắc mắc hoặc hỗ trợ, vui lòng liên hệ với nhân sự Văn Phòng Hội
          hoặc Thư Ký Chi Hội để được trợ giúp.
        </p>
      </div>
      <div className="mt-4">
        <label className="text-sm font-bold">
          Số điện thoại
          <span className="text-red-600"> *</span>
        </label>
        <div className="mt-2">
          <input
            type="tel"
            className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
            placeholder="Nhập số điện thoại"
            value={currentProfile.phoneNumber}
            name="phoneNumber"
            onChange={handleChange}
            onFocus={() => setPhoneInvalid(false)}
          />
        </div>
        {!phoneInvalid && (
          <div className="text-sm py-1 flex items-center text-[#767A7F]">
            <Icon icon="zi-info-circle" size={16} />
            <span className="pl-1">Ví dụ: 09******** hoặc 849********</span>
          </div>
        )}
        {phoneInvalid && (
          <div className="flex items-center py-1 text-sm text-red-600">
            <Icon icon="zi-warning" size={16} />
            <span className="pl-1">
              Vui lòng kiểm tra và nhập lại số điện thoại theo đúng định dạng
              (ví dụ: 09******** hoặc 849*******).
            </span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <label className="text-sm font-bold">
          Email
          <span className="text-red-600"> *</span>
        </label>
        <div className="mt-2">
          <input
            invalid={verifyEmail(currentProfile?.email)}
            type="text"
            className="w-full h-12 p-4 border rounded-md invalid:border-pink-500 invalid:text-pink-600"
            placeholder="Nhập email"
            value={currentProfile.email}
            name="email"
            onChange={handleChange}
            onFocus={() => setEmailInvalid(false)}
          />
        </div>
        {!emailInvalid && (
          <div className="text-sm py-1 flex items-center text-[#767A7F]">
            <Icon icon="zi-info-circle" size={16} />
            <span className="pl-1">Ví dụ: example@something.com</span>
          </div>
        )}
        {emailInvalid && (
          <div className="flex items-center py-1 text-sm text-red-600">
            <Icon icon="zi-warning" size={16} />
            <span className="pl-1">
              Địa chỉ email bạn nhập không hợp lệ. Vui lòng kiểm tra và nhập lại
              theo đúng định dạng (ví dụ: example@domain.com).
            </span>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          disabled={isProcessing}
          className="block w-full h-10 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-200 text-normal"
          onClick={save}
        >
          Yêu cầu xác thực thông tin
        </button>
      </div>

      <Modal
        visible={popupError}
        title=""
        onClose={() => {
          setPopupError(false);
        }}
        verticalActions
      >
        <Box p={6}>
          <div className="flex justify-center mb-4 text-center">
            <FaceIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center">
            {popupErrorData?.title}
          </div>
          <div className="text-center text-[#222] my-4">
            {popupErrorData.description}
          </div>
          <div className="flex gap-2">
            <button
              className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
              onClick={() => setPopupError(false)}
            >
              Nhập lại
            </button>
            <button
              className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
              onClick={() => goToRegister()}
            >
              Đăng ký
            </button>
          </div>
        </Box>
      </Modal>

      <Modal
        visible={popupVerifySuccess}
        title=""
        onClose={() => {}}
        verticalActions
      >
        <Box p={6}>
          <div className="flex justify-center mb-4 text-center">
            <VerifySuccessIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center">
            Xác thực hợp lệ
          </div>
          <div className="text-center text-[#222] my-4">
            Chúc mừng bạn đã xác thực hội viên thành công!<br/>
            Thông tin hội viên đã được lưu vào hồ sơ của bạn.
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={verifySuccess}
          >
            Xem hồ sơ
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default MemberVerifyPage;
