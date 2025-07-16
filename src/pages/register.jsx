import React, { useEffect, useState } from "react";
import { Page, Icon, Box, Modal, DatePicker } from "zmp-ui";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  refreshTrigger,
  userByPhoneNumberState,
  userZaloProfileState,
} from "../state";
import APIServices from "../services/api-service";
import FaceIcon from "../components/icons/face-icon";
import RegisterSuccess from "../assets/register-success.png";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const profile = useRecoilValue(userByPhoneNumberState);
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const [isMember, setIsMember] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);
  const refresh = useSetRecoilState(refreshTrigger);
  const [currentProfile, setCurrentProfile] = useState({
    fullname: "",
    phoneNumber: "",
    email: "",
    company: "",
    position: "",
    subAssociation: "",
    referral: "",
    dateOfBirth: "",
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [popupVerifyError, setPopupVerifyError] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const branchCode = urlParams.get("branch");
  const name = urlParams.get("name");

  useEffect(() => {
    const initializeProfile = async () => {
      let groupData = null;

      if (branchCode) {
        setHasReferral(true);
        const groupResponse = await APIServices.getGroupInfo(branchCode);
        groupData = groupResponse;
      }

      const checkMembership = async () => {
        const result = await APIServices.checkIsMember();
        setIsMember(result);
      };
      checkMembership();

      let newProfile = { ...currentProfile };

      if (groupData) {
        newProfile.subAssociation = groupData.data?.name;
      }

      if (name) {
        newProfile.referral = name;
      }

      setCurrentProfile(newProfile);
    };

    initializeProfile();
  }, [isMember, profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProfile({
      ...currentProfile,
      [name]: value.replace('"', "") || "",
    });
  };

  const verifyEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const verifyPhone = (phoneNumber) => {
    if (!phoneNumber) return false;
    if (phoneNumber.startsWith('+84') || phoneNumber.startsWith('84')) phoneNumber = phoneNumber.replace('+', '').replace('84', '0');
    // const vnPhoneRegex = /^(0|\+84|84)[0-9]{9}$/;
    // const vnPhoneRegex = /^(0|84|\\+84)?(9[0-9]{8}|8[1-9][0-9]{7}|7[0|6-9][0-9]{7})$/;
    const vnPhoneRegex = /^0(90[0-9]{7}|91[0-9]{7}|92[0-9]{7}|93[0-9]{7}|94[0-9]{7}|96[0-9]{7}|97[0-9]{7}|98[0-9]{7}|99[0-9]{7}|81[0-9]{7}|82[0-9]{7}|83[0-9]{7}|84[0-9]{7}|85[0-9]{7}|86[0-9]{7}|87[0-9]{7}|88[0-9]{7}|89[0-9]{7}|70[0-9]{7}|76[0-9]{7}|77[0-9]{7}|78[0-9]{7}|79[0-9]{7})$/;
    return vnPhoneRegex.test(phoneNumber);
  };

  const verifyInfo = () => {
    const baseConditions =
      !isProcessing &&
      currentProfile.fullname &&
      currentProfile.phoneNumber &&
      verifyPhone(currentProfile.phoneNumber) &&
      verifyEmail(currentProfile.email);
    console.log("verifyInfo", {
      isProcessing,
      fullname: currentProfile.fullname,
      phoneNumber: currentProfile.phoneNumber,
      verifyPhone: verifyPhone(currentProfile.phoneNumber),
      verifyEmail: verifyEmail(currentProfile.email),
      baseConditions
    });
    if (hasReferral) {
      return baseConditions && currentProfile.subAssociation;
    }
    return baseConditions;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    try {
      // If it's already a string in ISO format, just return it
      if (typeof dateValue === "string" && dateValue.includes("T")) {
        return dateValue;
      }

      // Handle Date object from DatePicker
      if (dateValue instanceof Date) {
        // Create a new date in the local timezone
        const date = new Date(dateValue);

        // Set to noon in local time to avoid timezone issues
        date.setHours(12, 0, 0, 0);

        // Format as YYYY-MM-DDT12:00:00.000Z
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}T00:00:00.000Z`;
      }

      // Handle string date input
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";

      // Same handling as above
      date.setHours(12, 0, 0, 0);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}T00:00:00.000Z`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const register = async () => {
    console.log('register.jsx/register');
    let isValid = true;
    if (!verifyEmail(currentProfile.email)) {
      console.log('register.jsx/verifyEmail/false');
      setEmailInvalid(true);
      isValid = false;
    }
    if (!verifyPhone(currentProfile.phoneNumber)) {
      console.log('register.jsx/verifyPhone/false');
      setPhoneInvalid(true);
      isValid = false;
    }
    if (!isValid) return;

    console.log('register.jsx/setIsProcessing');
    setIsProcessing(true);

    // Prepare form data for GraphQL-based registration - Always allow registration
    let requestBody = {
      // Required fields
      full_name: currentProfile.fullname,
      phone_number_1: currentProfile.phoneNumber,
      email_1: currentProfile.email.toLowerCase(),

      // Optional fields from form
      company: currentProfile.company || "",
      position: currentProfile.position || "",
      date_of_birth: currentProfile.dateOfBirth ? formatDate(currentProfile.dateOfBirth) : null,

      // Zalo information
      zalo: zaloProfile?.id || "",

      // Member type and status
      member_type: "Hội viên chính thức",
      status: "Dang_hoat_dong",
      join_date: new Date().toISOString().split('T')[0],

      // Chapter information if provided
      ...(currentProfile.subAssociation && {
        chapter: {
          // This would need to be mapped to actual chapter documentId
          // For now, store as string in a custom field or handle in backend
          ten_chi_hoi: currentProfile.subAssociation
        }
      })
    };

    // Add referral information if provided
    if (currentProfile.referral) {
      requestBody.referral_info = currentProfile.referral;
    }

    console.log('register.jsx/potentialProfile', currentProfile?.id);
    const res = await APIServices.registerMember(requestBody);
    console.log('register.jsx/res', res);

    if (res.error === 0) {
      refresh((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
      await APIServices.login();
    } else {
      setPopupVerifyError(true);
    }
    setIsProcessing(false);
  };

  if (isSuccess) {
    return (
      <Page className="bg-white page safe-page-content">
        <div className="h-screen flex flex-col items-center justify-start pt-[112px] p-4">
          <div className="my-6 text-lg font-bold text-center">
            Đăng ký thành công
          </div>
          <div className="flex justify-center mb-6 text-center">
            <img src={RegisterSuccess} />
          </div>
          <div className="text-center font-medium text-[#222] my-6">
            Tài khoản đang được xác thực. <br />
            Vui lòng chờ nhận thông tin từ YBA
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
            <button
              className="mx-auto min-w-[179px] whitespace-nowrap block py-1 px-4 h-10 bg-blue-custom text-white font-medium text-sm leading-4 rounded-lg"
              onClick={() => navigate("/")}
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-white page safe-page-content">
      <div className="">
        <div className="mt-4">
          <label className="text-sm font-bold">
            Tên
            <span className="text-red-600"> *</span>
          </label>
          <div className="mt-2">
            <input
              type="text"
              className="w-full h-12 p-4 border rounded-md"
              value={currentProfile.fullname}
              name="fullname"
              onChange={handleChange}
              placeholder="Nhập họ và tên"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold">
            Số điện thoại
            <span className="text-red-600"> *</span>
          </label>
          <div className="mt-2">
            <input
              type="tel"
              className="w-full h-12 p-4 border rounded-md"
              placeholder="Nhập số điện thoại"
              value={currentProfile.phoneNumber}
              name="phoneNumber"
              onChange={handleChange}
              onFocus={() => setPhoneInvalid(false)}
            />
          </div>
          {phoneInvalid && (
            <div className="flex items-center py-1 text-sm text-red-600">
              <Icon icon="zi-warning" size={16} />
              <span className="pl-1">
                Số điện thoại bạn nhập không hợp lệ. Vui lòng kiểm tra và nhập
                lại theo đúng định dạng 09******** hoặc 849********
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
              type="text"
              className="w-full h-12 p-4 border rounded-md"
              placeholder="Nhập email"
              value={currentProfile.email}
              name="email"
              onChange={handleChange}
              onFocus={() => setEmailInvalid(false)}
            />
          </div>
          {emailInvalid && (
            <div className="flex items-center py-1 text-sm text-red-600">
              <Icon icon="zi-warning" size={16} />
              <span className="pl-1">
                Địa chỉ email bạn nhập không hợp lệ. Vui lòng kiểm tra và nhập
                lại theo đúng định dạng (ví dụ: example@domain.com).
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold">Ngày/Tháng/Năm sinh</label>
          <div className="w-full mt-2">
            <DatePicker
              mask
              maskClosable
              dateFormat="dd/mm/yyyy"
              title="Ngày/Tháng/Năm sinh"
              name="dateOfBirth"
              value={currentProfile.dateOfBirth}
              onChange={(date) => {
                setCurrentProfile({
                  ...currentProfile,
                  dateOfBirth: date,
                });
              }}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold">Doanh nghiệp</label>
          <div className="mt-2">
            <input
              type="text"
              className="w-full h-12 p-4 border rounded-md"
              placeholder="Nhập tên doanh nghiệp"
              value={currentProfile.company}
              name="company"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold">Chức vụ</label>
          <div className="mt-2">
            <input
              type="text"
              className="w-full h-12 p-4 border rounded-md"
              placeholder="Nhập chức vụ"
              value={currentProfile.position}
              name="position"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-bold">
          Chi hội tham gia
          {hasReferral && <span className="text-red-600"> *</span>}
        </label>
        <div className="mt-2">
          <input
            type="text"
            disabled={branchCode && currentProfile.subAssociation}
            className="w-full h-12 p-4 border rounded-md"
            placeholder="Nhập chi hội tham gia"
            value={currentProfile.subAssociation}
            name="subAssociation"
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="text-sm font-bold">Thông tin người giới thiệu</label>
        <div className="mt-2">
          <input
            type="text"
            className="w-full h-12 p-4 border rounded-md"
            placeholder="Tên người giới thiệu"
            value={currentProfile.referral}
            name="referral"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          disabled={!verifyInfo()}
          className="mx-auto min-w-[179px] whitespace-nowrap block py-1 px-4 h-10 bg-blue-custom text-white font-medium text-sm leading-4 rounded-lg disabled:bg-blue-200"
          onClick={register}
        >
          Đăng ký
        </button>
      </div>

      <Modal
        visible={popupVerifyError}
        title=""
        onClose={() => {
          setPopupVerifyError(false);
        }}
        verticalActions
      >
        <Box p={6}>
          <div className="flex justify-center mb-4 text-center">
            <FaceIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Số điện thoại hoặc email không khả dụng. Vui lòng kiểm tra lại.
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-lg bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={() => setPopupVerifyError(false)}
          >
            Nhập lại
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default RegisterPage;
