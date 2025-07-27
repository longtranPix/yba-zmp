import React, { useState, useEffect } from "react";
import { Page, useNavigate, Icon, Box, Modal } from "zmp-ui";
import APIService from "../services/api-service";
import FaceIcon from "../components/icons/face-icon";
import VerifySuccessIcon from "../components/icons/verify-success-icon";
import MemberVerifyLoading from "../components/skeletons/member-verify-loading";
import { useAuth } from "../contexts/AuthContext";

const MemberVerifyPage = () => {
  const navigate = useNavigate();

  // ===== FIXED: Use complete AuthContext instead of Recoil states =====
  const {
    userInfo,           // Replaces zaloProfile
    member,             // Member data
    isMember,           // Member status
    isAuthenticated,
    isLoading: authLoading,
    userType,
    createAccount,
    getMemberInfoById,
    getAllZaloDataWithPermissions,
    activateGuestAuthentication,
    checkZaloPermissions,
    updateAccount,
    getAccountByZaloId  // Added for account update functionality
  } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [popupVerifySuccess, setPopupVerifySuccess] = useState(false);
  const [isVerifiedMember, setIsVerifiedMember] = useState(false); // Track if user is member or guest

  // ===== FIXED: Initialize profile from AuthContext data =====
  const [currentProfile, setCurrentProfile] = useState({
    phoneNumber: userInfo?.phoneNumber || member?.phone_number_1 || "",
    email: member?.email_1 || "",
  });

  // ===== FIXED: useEffect to reload component when member data changes =====
  // useEffect(() => {
  //   console.log('MemberVerify: Member data changed, updating profile form', {
  //     hasUserInfo: !!userInfo,
  //     hasMember: !!member,
  //     isMember,
  //     userType,
  //     memberName: member?.full_name,
  //     memberEmail: member?.email_1,
  //     memberPhone: member?.phone_number_1
  //   });
  
  //   // Update profile form when member data changes
  //   setCurrentProfile(prev => ({
    //     phoneNumber: userInfo?.phoneNumber || member?.phone_number_1 || prev.phoneNumber || "",
    //     email: member?.email_1 || prev.email || "",
    //   }));
    
    //   // Reset verification states when member data changes
    //   setIsVerifiedMember(isMember);
    //   setPopupVerifySuccess(false);
    //   setPopupError(false);
    
    // }, [userInfo, member, isMember, userType]); // Reload when member data changes
    
    const [popupError, setPopupError] = useState(false);
    const [popupErrorData, setPopupErrorData] = useState({
      title: "",
      description: "",
    });
    
    // ===== FIXED: Add useEffect to check permissions using AuthContext functions =====
    useEffect(() => {
      const checkPermissionsAndInitialize = async () => {
        // console.log('MemberVerify: Checking permissions and initializing', {
        //   isAuthenticated,
        //   hasUserInfo: !!userInfo,
        //   hasMember: !!member,
        //   isMember,
        //   authLoading
        // });
  
        try {
          // If still loading authentication, wait
          if (authLoading) {
            console.log('MemberVerify: Authentication still loading, waiting...');
            return;
          }
  
          // Check if we have basic authentication
          if (!isAuthenticated) {
            console.log('MemberVerify: Not authenticated, activating guest authentication');
            const result = await activateGuestAuthentication();
            if (!result.success) {
              console.log('MemberVerify: Failed to activate guest authentication:', result.error);
              navigate(-1);
            }
          }
  
          if (member) {
            navigate(-1);
          }
  
          // Check Zalo permissions
          // const hasPermissions = await checkZaloPermissions();
          // console.log('MemberVerify: Zalo permissions check result:', hasPermissions);
  
          // If we don't have user info, try to get it
          // if (!userInfo?.id) {
          //   console.log('MemberVerify: No user info available, getting user data with permissions');
          //   const result = await getAllZaloDataWithPermissions();
  
          //   if (!result.success) {
          //     console.log('MemberVerify: Failed to get user data:', result.message);
          //     // Don't show error immediately, let user try verification
          //   } else {
          //     console.log('MemberVerify: Successfully got user data');
          //   }
          // }
  
          // // Update profile form with latest data
          // setCurrentProfile(prev => ({
          //   phoneNumber: prev.phoneNumber || userInfo?.phoneNumber || member?.phone_number_1 || "",
          //   email: prev.email || member?.email_1 || "",
          // }));
  
          setIsLoading(false);
        } catch (error) {
          navigate(-1);
          console.error('MemberVerify: Error during initialization:', error);
          setIsLoading(false);
        }
      };

    checkPermissionsAndInitialize();
  }, [authLoading, userInfo, checkZaloPermissions]);

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
    console.log("Member verification: Starting verification process", {
      currentProfile,
      hasUserInfo: !!userInfo,
      hasMember: !!member,
      isMember,
      isAuthenticated
    });

    try {
      setIsProcessing(true);

      // ===== FIXED: Use AuthContext data and functions =====
      console.log("Member verification: Using AuthContext for user info: ", userInfo);

      let zaloUserInfo = userInfo; // Use existing userInfo from AuthContext

      // If no userInfo available, get it using AuthContext function
      if (!zaloUserInfo?.id) {
        console.log("Member verification: No userInfo available, getting user data with permissions");

        const zaloDataResult = await getAllZaloDataWithPermissions();

        if (!zaloDataResult.success) {
          console.log("Member verification: Failed to get Zalo data:", zaloDataResult.message);
          setPopupErrorData({
            title: "Lỗi quyền truy cập",
            description: zaloDataResult.message || "Không thể lấy thông tin từ Zalo. Vui lòng cấp quyền và thử lại."
          });
          setPopupError(true);
          setIsProcessing(false);
          return;
        }

        zaloUserInfo = zaloDataResult.userInfo;
      }

      console.log("Member verification: Got userInfo:", {
        hasId: !!zaloUserInfo?.id,
        hasName: !!zaloUserInfo?.name,
        hasPhone: !!zaloUserInfo?.phoneNumber
      });

      if (!zaloUserInfo?.id) {
        console.log("Member verification: No Zalo ID available");
        setPopupErrorData({
          title: "Thiếu thông tin Zalo",
          description: "Không thể lấy ID Zalo. Vui lòng đảm bảo bạn đã đăng nhập Zalo."
        });
        setPopupError(true);
        setIsProcessing(false);
        return;
      }

      // Validate form data
      if (verifyPhone(currentProfile.phoneNumber)) {
        setPhoneInvalid(true);
        setIsProcessing(false);
        return;
      }
      if (verifyEmail(currentProfile.email)) {
        setEmailInvalid(true);
        setIsProcessing(false);
        return;
      }

      console.log("Member verification: Proceeding with verification", {
        phoneNumber: currentProfile.phoneNumber,
        email: currentProfile.email,
        zaloId: zaloUserInfo.id
      });

      // ===== NEW FLOW: Search member with phoneNumber and email from form =====
      console.log("Member verification: Searching member by phoneNumber and email from form");

      const memberResponse = await APIService.getMemberByPhoneAndEmail(
        currentProfile.phoneNumber,
        currentProfile.email
      );

      console.log("Member verification: Member search result:", memberResponse);

      if (memberResponse.error === 0 && memberResponse.data && !isAuthenticated) {
        // Member found - save member and create account
        const memberData = memberResponse.data;
        console.log("Member verification: Member found:", {
          documentId: memberData.documentId,
          fullName: memberData.full_name,
          hasChapter: !!memberData.chapter
        });

        // Save member info to AuthContext
        console.log("Member verification: Saving member info to AuthContext");
        await getMemberInfoById(memberData.documentId);

        // Create account with userInfo and phoneNumber, "hoi_vien" is member search id
        console.log("Member verification: Creating account with userInfo and member ID");

        const accountData = {
          ma_zalo: zaloUserInfo.id,
          ten_dang_nhap: zaloUserInfo.name || memberData.full_name || `User_${zaloUserInfo.id}`,
          loai_tai_khoan: "Hoi_vien",
          trang_thai: "Kich_hoat",
          so_dien_thoai_zalo: zaloUserInfo.phoneNumber || currentProfile.phoneNumber || zaloUserInfo.id,
          chi_hoi: memberData.chapter?.ten_chi_hoi || "",
          hoi_vien: memberData.documentId // Member search ID
        };

        const accountResult = await createAccount(accountData);

        if (accountResult) {
          console.log("Member verification: Account created successfully:", accountResult.documentId);

          // Set as verified member
          setIsVerifiedMember(true);

          // ===== FIXED: Removed Recoil refresh calls, AuthContext handles updates automatically =====

          // Show success popup
          setPopupVerifySuccess(true);

        } else {
          throw new Error("Failed to create account");
        }

      } else if (memberResponse.error === 0 && memberResponse.data && isAuthenticated) {
        // ===== FIXED: Member found but user already has account - update existing account =====
        const memberData = memberResponse.data;
        console.log("Member verification: Member found with existing account, updating account with member info:", {
          documentId: memberData.documentId,
          fullName: memberData.full_name,
          hasChapter: !!memberData.chapter,
          currentAccountExists: isAuthenticated
        });

        // ===== FIXED: Update existing account with member information =====
        console.log("Member verification: Updating existing account with member ID");

        // Get current account from AuthContext
        const currentAccount = await getAccountByZaloId(zaloUserInfo.id);

        if (currentAccount?.documentId) {
          // Update account with member information
          const updateAccountData = {
            hoi_vien: memberData.documentId, // Link member to account
            loai_tai_khoan: "Hoi_vien",      // Update account type to member
            chi_hoi: memberData.chapter?.ten_chi_hoi || currentAccount.chi_hoi || ""
          };

          console.log("Member verification: Updating account with member data:", updateAccountData);

          // Call API to update account
          const updateResult = await updateAccount(currentAccount.documentId, updateAccountData);

          if (updateResult.error === 0) {
            console.log("Member verification: Account updated successfully with member info");
            // Save member info to AuthContext
            console.log("Member verification: Saving member info to AuthContext");
            await getMemberInfoById(memberData.documentId);

            // Set as verified member
            setIsVerifiedMember(true);

            // Show success popup
            setPopupVerifySuccess(true);
          } else {
            throw new Error("Failed to update account with member information");
          }
        } else {
          throw new Error("Current account not found for update");
        }

      } else {
        // No member found - treat as guest
        console.log("Member verification: No member found with provided phone and email - treating as guest");

        setIsVerifiedMember(false);
        setPopupErrorData({
          title: "Không tìm thấy hội viên",
          description: "Không thể tìm thấy thông tin hội viên với số điện thoại và email đã cung cấp. Vui lòng kiểm tra lại thông tin hoặc liên hệ YBA để được hỗ trợ."
        });

        // Show success popup for guest
        setPopupError(true);
      }
    } catch (error) {
      console.error("Member verification: Error during verification process:", error);
      setPopupErrorData({
        title: "Xác thực thất bại",
        description: "Không thể xác thực thông tin hội viên. Vui lòng kiểm tra lại thông tin hoặc liên hệ YBA để được hỗ trợ.",
      });
      setPopupError(true);

      // ===== FIXED: Removed Recoil refresh calls, AuthContext handles updates automatically =====
    } finally {
      setIsProcessing(false);
    }
  };

  const verifySuccess = async () => {
    try {
      console.log("verifySuccess: Processing successful verification using AuthContext");

      // ===== FIXED: Use AuthContext data instead of manual API calls =====
      console.log("verifySuccess: Current auth status:", {
        isAuthenticated,
        isMember,
        hasUserInfo: !!userInfo,
        hasMember: !!member,
        userType,
        memberId: member?.documentId
      });

      if (isMember && member?.documentId) {
        console.log("verifySuccess: Member verified, processing profile data");

        // ===== FIXED: Use AuthContext member data directly =====
        let memberData = member;

        // If we need more comprehensive data, fetch it using AuthContext function
        if (!memberData.chi_hoi || !memberData.ban_chap_hanh) {
          try {
            console.log("verifySuccess: Fetching comprehensive member data using AuthContext:", member.documentId);
            await getMemberInfoById(member.documentId);

            // The AuthContext will automatically update the member data
            memberData = member; // Use updated member data from AuthContext

            console.log("verifySuccess: Updated member data with comprehensive info:", {
              hasChapter: !!memberData.chi_hoi,
              hasExecutiveCommittee: !!memberData.ban_chap_hanh,
              hasCompany: !!memberData.company,
              memberType: memberData.member_type,
              status: memberData.trang_thai_hoi_vien
            });
          } catch (error) {
            console.error("verifySuccess: Error fetching comprehensive member data:", error);
            // Continue with existing data
          }
        }

        // ===== FIXED: Update member with Zalo information using AuthContext data =====
        const memberUpdateData = {};
        if (userInfo?.id && memberData?.zalo !== userInfo.id) {
          memberUpdateData.zalo = userInfo.id;
        }

        // Save profile updates if needed
        if (Object.keys(memberUpdateData).length > 0) {
          try {
            console.log("verifySuccess: Updating member profile with Zalo info:", memberUpdateData);
            const updateResponse = await APIService.updateRegisterMember(member.documentId, memberUpdateData);
            if (updateResponse.data?.updateMemberInformation) {
              console.log("verifySuccess: Member profile updated successfully");

              // ===== FIXED: Refresh member data using AuthContext =====
              await getMemberInfoById(member.documentId);
            }
          } catch (error) {
            console.error("verifySuccess: Error updating member profile:", error);
            // Continue anyway - this is not critical
          }
        }

        // ===== FIXED: AuthContext automatically handles state updates, no manual refresh needed =====
        console.log("verifySuccess: AuthContext will automatically update member status");

        // Small delay to ensure AuthContext updates propagate
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
      // Fallback navigation based on member status
      setPopupVerifySuccess(false);
      if (isVerifiedMember) {
        navigate("/member-info");
      } else {
        navigate("/users");
      }
    }
  };

  // Alternative verifySuccess function that uses the tracked member status
  const verifySuccessAlternative = async () => {
    try {
      console.log("verifySuccess: Processing based on tracked member status:", isVerifiedMember);

      setPopupVerifySuccess(false);

      if (isVerifiedMember) {
        console.log("verifySuccess: Verified member - navigating to profile");
        navigate("/users"); // Navigate to member profile page
      } else {
        console.log("verifySuccess: Guest user - navigating to users page");
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
        onClose={() => { }}
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
            {isVerifiedMember ? (
              <>
                Chúc mừng bạn đã xác thực hội viên thành công!<br />
                Thông tin hội viên đã được tải và lưu vào hồ sơ của bạn.
              </>
            ) : (
              <>
                Xác thực thành công!<br />
                Bạn hiện đang sử dụng với tư cách khách. Có thể đăng ký thành hội viên để trải nghiệm đầy đủ tính năng.
              </>
            )}
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={verifySuccessAlternative}
          >
            {isVerifiedMember ? "Xem hồ sơ hội viên" : "Tiếp tục"}
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default MemberVerifyPage;
