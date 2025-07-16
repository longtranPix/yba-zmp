import React, { useEffect, useState } from "react";
import { Page, useNavigate, DatePicker } from "zmp-ui";
import {
  configState,
  memberListRefreshTrigger,
  userByPhoneNumberState,
  userProfileState,
  userZaloProfileState,
} from "../state";
import {
  useRecoilValue,
  useRecoilRefresher_UNSTABLE,
  useSetRecoilState,
} from "recoil";
import APIServices from "../services/api-service";
import Helper from "../utils/helper";

const MemberInfoPage = () => {
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const navigate = useNavigate();
  const profile = useRecoilValue(userByPhoneNumberState);
  const refreshMembers = useSetRecoilState(memberListRefreshTrigger);
  const [isMember, setIsMember] = useState(false);

  // Check if user is a member based on auth info and profile data
  useEffect(() => {
    const checkMemberStatus = async () => {
      try {
        const authInfo = await APIServices.getAuthInfo();
        console.log('MemberInfoPage: Checking member status, authInfo:', authInfo);

        // User is a member if they have member data or member ID in auth info
        const isUserMember = (authInfo?.isMember && (authInfo?.memberData || authInfo?.memberId)) || profile !== null;
        console.log('MemberInfoPage: Setting isMember to:', isUserMember);
        setIsMember(isUserMember);
      } catch (error) {
        console.error('Error checking member status:', error);
        setIsMember(false);
      }
    };

    checkMemberStatus();
  }, [profile]); // Re-check when profile changes

  const configs = useRecoilValue(configState);
  const [currentProfile, setCurrentProfile] = useState({
    dateOfBirth: "",
  });
  const refresh = useRecoilRefresher_UNSTABLE(userProfileState);
  const refreshUserByPhone = useRecoilRefresher_UNSTABLE(
    userByPhoneNumberState
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChange, setIsChange] = useState(false);

  // Add a manual refresh function for debugging
  const handleRefreshMemberData = async () => {
    console.log('MemberInfoPage: Manual refresh triggered');
    refreshUserByPhone();

    // Also check auth info directly
    const authInfo = await APIServices.getAuthInfo();
    console.log('MemberInfoPage: Current authInfo after refresh:', authInfo);
  };

  // Don't automatically check membership - always start as guest
  // Only check membership when user takes explicit action (register/verify)
  // useEffect(() => {
  //   const checkMembership = async () => {
  //     const result = await APIServices.checkIsMember();
  //     setIsMember(result);
  //   };
  //   checkMembership();
  // }, []);

  useEffect(() => {
    console.log('MemberInfoPage: isMember:', isMember, 'profile:', profile);

    if (isMember && profile) {
      // Check if profile is from new verify member API (has direct fields)
      // or old API (has customFields structure)
      const isNewApiResponse = profile.full_name !== undefined;
      console.log('MemberInfoPage: isNewApiResponse:', isNewApiResponse);

      if (isNewApiResponse) {
        // New API response structure - comprehensive data from GraphQL
        console.log('MemberInfoPage: Processing comprehensive member data:', profile);

        setCurrentProfile({
          id: profile.documentId,
          name: zaloProfile.id,
          fullname: profile.full_name || "",
          lastName: profile.last_name || "",
          firstName: profile.first_name || "",
          gender: profile.salutation || "",
          academicDegree: profile.academic_degree || "",
          ethnicity: profile.ethnicity || "",
          phoneNumber: profile.phone_number_1 || profile.phone_number_2 || "",
          zalo: profile.zalo || "",
          email: profile.email_1 || profile.email_2 || "",
          homeAddress: profile.home_address || "",
          provinceCity: profile.province_city || "",
          district: profile.district || "",
          company: profile.company || "",
          companyAddress: profile.company_address || "",
          companyEstablishmentDate: profile.company_establishment_date || "",
          numberOfEmployees: profile.number_of_employees || "",
          businessIndustry: profile.business_industry || "",
          businessProductsServices: profile.business_products_services || "",
          position: profile.position || "",
          officePhone: profile.office_phone || "",
          website: profile.website || "",
          assistantName: profile.assistant_name || "",
          assistantPhone: profile.assistant_phone || "",
          assistantEmail: profile.assistant_email || "",
          memberType: profile.member_type || "",
          status: profile.status || "",
          joinDate: profile.join_date || "",
          inactiveDate: profile.inactive_date || "",
          notes: profile.notes || "",
          membershipFeeExpirationDate: profile.membership_fee_expiration_date || "",
          eventsAttended: profile.events_attended || "",
          numberOfPosts: profile.number_of_posts || "",
          secretaryInCharge: profile.secretary_in_charge || "",
          formerExecutiveCommitteeClub: profile.former_executive_committee_club || false,
          dateOfBirth: profile.date_of_birth
            ? parseApiDateString(profile.date_of_birth)
            : "",
          // Chapter information
          chapter: profile.chapter ? {
            id: profile.chapter.documentId,
            name: profile.chapter.ten_chi_hoi,
            secretary: profile.chapter.thu_ky_phu_trach,
            memberCount: profile.chapter.so_luong_hoi_vien,
            newMembersThisYear: profile.chapter.hoi_vien_moi_trong_nam,
            inactiveMembers: profile.chapter.hoi_vien_ngung_hoat_dong,
            eventsList: profile.chapter.danh_sach_su_kien,
            membersList: profile.chapter.danh_sach_hoi_vien,
            feesCollected: profile.chapter.hoi_phi_da_thu,
            assistantSecretary: profile.chapter.thu_ky_phu
          } : null,
          // Member image
          memberImage: profile.member_image ? {
            id: profile.member_image.documentId,
            url: profile.member_image.url,
            name: profile.member_image.name,
            size: profile.member_image.size,
            mime: profile.member_image.mime
          } : null,
          // Account information
          accounts: profile.tai_khoan || [],
          // Membership fees
          membershipFees: profile.hoi_phi || [],
          // Executive committee roles
          executiveRoles: profile.ban_chap_hanh || []
        });

        console.log('MemberInfoPage: Set comprehensive profile data with chapter:', profile.chapter?.ten_chi_hoi);
      } else {
        // Old API response structure (customFields)
        setCurrentProfile({
          id: profile.id,
          name: zaloProfile.id,
          fullname: profile.customFields?.["Họ và tên"] || "",
          gender: profile.customFields?.["Nhân xưng"]?.[0] || "",
          phoneNumber:
            profile.customFields?.["Số điện thoại 1"] ||
            profile.customFields?.["Số điện thoại 2"] ||
            "",
          email:
            profile.customFields?.["Email 1"] ||
            profile.customFields?.["Email 2"] ||
            "",
          company: profile.customFields?.["Công ty"] || "",
          position: profile.customFields?.["Chức vụ"] || "",
          dateOfBirth: profile.customFields?.["Ngày sinh"]
            ? parseApiDateString(profile.customFields?.["Ngày sinh"])
            : "",
        });
      }
    }
  }, [isMember, profile, zaloProfile.id]);

  const parseApiDateString = (dateStr) => {
    if (!dateStr) return "";

    try {
      // Convert API format (ISO string) to Date object for DatePicker
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      return date;
    } catch (error) {
      console.error("Error parsing API date:", error);
      return "";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (type === "checkbox") {
      if (checked) {
        finalValue = value;
      } else {
        finalValue = "";
      }
    }
    if (name === "dateOfBirth") {
      finalValue = value;
    }
    setCurrentProfile({
      ...currentProfile,
      [name]: finalValue?.replace?.('"', "") || "",
    });
    setIsChange(true);
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    // If it's already a Date object, just return it
    if (dateStr instanceof Date) return dateStr;

    try {
      if (typeof dateStr === "string" && dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return new Date(`${year}-${month}-${day}`);
        }
      }
      // Try to create a date from the string
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const verifyEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const verifyPhone = (phoneNumber) => {
    if (!phoneNumber) return false;
    const vnPhoneRegex = /^(0|\+84|84)[0-9]{9}$/;
    return vnPhoneRegex.test(phoneNumber);
  };

  const verifyInfo = () => {
    if (isProcessing) return false;
    if (
      currentProfile.phoneNumber &&
      !verifyPhone(currentProfile.phoneNumber)
    ) {
      return false;
    }

    if (currentProfile.email && !verifyEmail(currentProfile.email)) {
      return false;
    }

    return isChange;
  };

  const verifySuccess = () => {
    setPopupVerifySuccess(false);
    setTimeout(() => {
      refresh();
    }, 300);
  };

  const save = async () => {
    let isValid = true;
    let emailCheck = verifyEmail(currentProfile.email);
    if (!emailCheck) {
      isValid = false;
    }
    let phoneCheck = verifyPhone(currentProfile.phoneNumber);
    if (!phoneCheck) {
      isValid = false;
    }
    if (!isValid) {
      return;
    }
    setIsProcessing(true);

    if (profile.id) {
      const formattedProfile = {
        ...currentProfile,
        dateOfBirth: currentProfile.dateOfBirth
          ? formatDate(currentProfile.dateOfBirth)
          : "",
      };

      let res = await APIServices.saveMemberInfo(formattedProfile);
      if (res.error == 0) {
        let id = res.data.id;
        setCurrentProfile({
          id: id,
          ...currentProfile,
        });
        Helper.showAlertInfo("Cập nhật thông tin hội viên thành công", 2500);
        refreshUserByPhone();
      } else {
        Helper.showAlert(`${res?.message}`);
      }
    } else {
      const formattedProfile = {
        ...currentProfile,
        dateOfBirth: currentProfile.dateOfBirth
          ? formatDate(currentProfile.dateOfBirth)
          : "",
      };
      let res = await APIServices.registerMember(formattedProfile);
      if (res.error == 0) {
        let data = res.data || {};
        setCurrentProfile({
          ...data,
        });
        refreshMembers((prev) => prev + 1);
        await APIServices.login();
      } else {
        Helper.showAlert(`${res?.message}`);
      }
    }
    setIsProcessing(false);
    setIsChange(false);
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

  return (
    <Page className="bg-white page safe-page-content">
      <div className="">
        <div className="mt-2">
          <label className="text-base font-bold">Ảnh đại diện</label>
          <div className="mt-2">
            <img
              className="w-20 h-20 rounded-full"
              src={
                // Use member image if available, otherwise Zalo avatar, otherwise default
                currentProfile.memberImage?.url ||
                (zaloProfile && zaloProfile.avatar) ||
                "https://api.ybahcm.vn/public/yba/default-avatar.png"
              }
            />
          </div>
        </div>

        {/* Display comprehensive member information if available */}
        {isMember && currentProfile.memberType && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Thông Tin Hội Viên</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Loại hội viên:</label>
                <p className="text-sm text-gray-900">{currentProfile.memberType || "Chưa xác định"}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Trạng thái:</label>
                <p className="text-sm text-gray-900">{currentProfile.status || "Chưa xác định"}</p>
              </div>

              {currentProfile.joinDate && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Ngày gia nhập:</label>
                  <p className="text-sm text-gray-900">{new Date(currentProfile.joinDate).toLocaleDateString('vi-VN')}</p>
                </div>
              )}

              {currentProfile.chapter && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Chi hội:</label>
                  <p className="text-sm text-gray-900">{currentProfile.chapter.name}</p>
                  {currentProfile.chapter.secretary && (
                    <p className="text-xs text-gray-600">Thư ký phụ trách: {currentProfile.chapter.secretary}</p>
                  )}
                </div>
              )}

              {currentProfile.eventsAttended && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Sự kiện đã tham gia:</label>
                  <p className="text-sm text-gray-900">{currentProfile.eventsAttended}</p>
                </div>
              )}

              {currentProfile.numberOfPosts && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Số bài viết:</label>
                  <p className="text-sm text-gray-900">{currentProfile.numberOfPosts}</p>
                </div>
              )}
            </div>

            {currentProfile.accounts && currentProfile.accounts.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Tài khoản liên kết:</label>
                <div className="mt-2">
                  {currentProfile.accounts.map((account, index) => (
                    <div key={index} className="text-sm text-gray-900 bg-white p-2 rounded border">
                      <p><strong>Zalo ID:</strong> {account.ma_zalo}</p>
                      <p><strong>Tên đăng nhập:</strong> {account.ten_dang_nhap}</p>
                      <p><strong>Trạng thái:</strong> {account.trang_thai}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentProfile.executiveRoles && currentProfile.executiveRoles.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Vai trò ban chấp hành:</label>
                <div className="mt-2">
                  {currentProfile.executiveRoles.map((role, index) => (
                    <div key={index} className="text-sm text-gray-900 bg-white p-2 rounded border">
                      <p><strong>Mã code:</strong> {role.ma_code}</p>
                      <p><strong>Họ tên đầy đủ:</strong> {role.ho_ten_day_du}</p>
                      <p><strong>Chức vụ cấp hội:</strong> {role.chuc_vu_cap_hoi}</p>
                      <p><strong>Chức vụ cấp chi hội:</strong> {role.chuc_vu_cap_chi_hoi}</p>
                      <p><strong>Chi hội:</strong> {role.chi_hoi?.ten_chi_hoi}</p>
                      <p><strong>Tên công ty:</strong> {role.ten_cong_ty}</p>
                      <p><strong>Chức vụ trong công ty:</strong> {role.chuc_vu_trong_cong_ty}</p>
                      <p><strong>Nhiệm kỳ:</strong> {role.nhiem_ky}</p>
                      <p><strong>Nhiệm kỳ ban chấp hành:</strong> {role.nhiem_ky_ban_chap_hanh ? 'Có' : 'Không'}</p>
                      {role.hinh_anh && (
                        <div className="mt-2">
                          <img
                            src={role.hinh_anh.url}
                            alt={role.hinh_anh.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentProfile.membershipFees && currentProfile.membershipFees.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Lịch sử đóng hội phí:</label>
                <div className="mt-2">
                  {currentProfile.membershipFees.map((fee, index) => (
                    <div key={index} className="text-sm text-gray-900 bg-white p-2 rounded border">
                      <p><strong>Mã biên lai:</strong> {fee.ma_bien_lai}</p>
                      <p><strong>Chi hội:</strong> {fee.chi_hoi}</p>
                      <p><strong>Số tiền đã đóng:</strong> {fee.so_tien_da_dong?.toLocaleString('vi-VN')}đ</p>
                      <p><strong>Năm đóng phí:</strong> {fee.nam_dong_phi}</p>
                      <p><strong>Ngày đóng phí:</strong> {fee.ngay_dong_phi ? new Date(fee.ngay_dong_phi).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4">
          <label className="text-base font-bold">Nhân xưng</label>
          <div className="grid grid-cols-4 mt-2">
            {configs &&
              configs.genders.map((v, i) => {
                return (
                  <div className="flex items-center mb-2" key={i}>
                    <input
                      id={`gender_${i}`}
                      checked={currentProfile.gender === v}
                      type="radio"
                      name="gender"
                      value={v}
                      className="h-4 w-4 text-[#0E3D8A] border-gray-300 focus:ring-[#0E3D8A]"
                      onChange={handleChange}
                    />
                    <label htmlFor={`gender_${i}`} className="block ml-2 ">
                      {v}
                    </label>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-bold">
            Tên
            <span className="text-red-600"> *</span>
          </label>
          <div className="mt-2">
            <input
              disabled={isMember && !!currentProfile.fullname}
              type="text"
              className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
              value={currentProfile.fullname || ""}
              name="fullname"
              onChange={handleChange}
              placeholder="Họ và Tên đã đăng ký với YBA"
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
              disabled={
                isMember &&
                (!!profile.customFields?.["Số điện thoại 1"] ||
                  !!profile.customFields?.["Số điện thoại 2"])
              }
              className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
              placeholder="Nhập số điện thoại đã đăng ký với YBA"
              value={currentProfile.phoneNumber}
              name="phoneNumber"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-bold">
            Email
            <span className="text-red-600"> *</span>
          </label>
          <div className="mt-2">
            <input
              disabled={
                isMember &&
                (!!profile.customFields?.["Email 1"] ||
                  !!profile.customFields?.["Email 2"])
              }
              type="text"
              className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
              placeholder="Nhập email đã đăng ký với YBA"
              value={currentProfile.email}
              name="email"
              onChange={handleChange}
            />
          </div>
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
                setIsChange(true);
              }}
            />
          </div>
        </div>
        {isMember && (
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
        )}

        {isMember && (
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
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          disabled={!isChange || !verifyInfo()}
          className={`bg-blue-custom ${
            !isChange || !verifyInfo() ? "disabled:bg-blue-200" : ""
          } text-white font-bold py-2 rounded-lg text-normal w-full block h-10`}
          onClick={save}
        >
          Cập nhật
        </button>
      </div>
    </Page>
  );
};

export default MemberInfoPage;
