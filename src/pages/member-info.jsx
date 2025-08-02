import { useEffect, useState, useRef } from "react";
import { Page, DatePicker, Icon } from "zmp-ui";
import APIServices from "../services/api-service";
import { getImageProps } from "../utils/imageHelper";
import Helper from "../utils/helper";
import { useAuth } from "../contexts/AuthContext";

const configs = ['Anh', 'Chị']

const MemberInfoPage = () => {
  // ✅ REFACTORED: Use only AuthContext and direct API calls
  const { member, userInfo, isMember } = useAuth();

  // ✅ OPTIMIZED: Initialize with basic data from useAuth() if available
  const [currentProfile, setCurrentProfile] = useState(() => ({
    id: member?.documentId || "",
    name: userInfo?.id || "",
    fullname: member?.full_name || userInfo?.name || "",
    lastName: member?.last_name || "",
    firstName: member?.first_name || "",
    gender: member?.salutation || "",
    phoneNumber: member?.phone_number_1 || member?.phone_number_2 || "",
    email: member?.email_1 || member?.email_2 || "",
    company: member?.company || "",
    position: member?.position || "",
    dateOfBirth: member?.date_of_birth ? new Date(member.date_of_birth) : "",
    memberType: member?.member_type || "",
    status: member?.trang_thai_hoi_vien || member?.status || "",
    joinDate: member?.join_date || "",
    chapter: member?.chapter || null,
    memberImage: member?.member_image || null,
    accounts: member?.tai_khoan || [],
    membershipFees: member?.hoi_phi || [],
    executiveRoles: member?.ban_chap_hanh || [],
    eventsAttended: Number(member?.events_attended) || 0,
    numberOfPosts: Number(member?.number_of_posts) || 0
  }));
  // ✅ REMOVED: All Recoil state refreshers
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChange, setIsChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // File input ref for image upload
  const fileInputRef = useRef(null);

  // ✅ REFACTORED: Load member information directly from API using member ID from useAuth
  useEffect(() => {
    const loadMemberInfo = async () => {
      if (!member?.documentId) {
        console.log('MemberInfoPage: No member ID available, showing guest profile');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('MemberInfoPage: Loading member information for ID:', member.documentId);

        // Direct API call to get member information
        const freshMemberData = await APIServices.getMember(member.documentId);

        if (freshMemberData.error === 0) {
          console.log('MemberInfoPage: Member information loaded successfully');
          // Process the fresh member data
          processAuthContextMemberData(freshMemberData.member);
        } else {
          console.log('MemberInfoPage: No member information found');
          // Use existing member data from AuthContext as fallback
          if (member) {
            processAuthContextMemberData(member);
          }
        }
      } catch (error) {
        console.error('MemberInfoPage: Error loading member information:', error);
        // Use existing member data from AuthContext as fallback
        if (member) {
          processAuthContextMemberData(member);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isMember && member) {
      loadMemberInfo();
    } else {
      setIsLoading(false);
    }
  }, [member?.documentId, isMember]); // ✅ OPTIMIZED: Re-load only when member ID or member status changes

  // ✅ REFACTORED: Helper function to process member data from AuthContext or API
  const processAuthContextMemberData = (memberData) => {
    console.log('MemberInfoPage: Processing member data:', memberData, member);

    if (memberData) {
      // Check if data is from AuthContext (has documentId) or old API (has customFields)
      const isAuthContextMember = memberData.documentId !== undefined;
      const isNewApiResponse = memberData.full_name !== undefined;

      console.log('MemberInfoPage: Data source:', {
        isAuthContextMember,
        isNewApiResponse,
        hasCustomFields: !!memberData.customFields,
        memberDataKeys: Object.keys(memberData || {})
      });

      if (isAuthContextMember || isNewApiResponse) {
        // AuthContext member data or new API response structure
        console.log('MemberInfoPage: Processing AuthContext/GraphQL member data:', memberData);

        setCurrentProfile({
          id: memberData.documentId || memberData.id,
          name: userInfo?.id,
          fullname: memberData.full_name || "",
          lastName: memberData.last_name || "",
          firstName: memberData.first_name || "",
          gender: memberData.salutation || "", // Schema enum: Anh, Chi
          academicDegree: memberData.academic_degree || "",
          ethnicity: memberData.ethnicity || "",
          phoneNumber: String(memberData.phone_number_1 || memberData.phone_number_2 || ""),
          zalo: String(memberData.zalo || ""),
          email: String(memberData.email_1 || memberData.email_2 || ""),
          homeAddress: memberData.home_address || "",
          provinceCity: memberData.province_city || "",
          district: memberData.district || "",
          company: memberData.company || "",
          companyAddress: memberData.company_address || "",
          companyEstablishmentDate: memberData.company_establishment_date || "",
          numberOfEmployees: String(memberData.number_of_employees || ""),
          businessIndustry: String(memberData.business_industry || ""),
          businessProductsServices: String(memberData.business_products_services || ""),
          position: memberData.position || "",
          officePhone: memberData.office_phone || "",
          website: memberData.website || "",
          assistantName: memberData.assistant_name || "",
          assistantPhone: memberData.assistant_phone || "",
          assistantEmail: memberData.assistant_email || "",
          memberType: memberData.member_type || "",
          status: memberData.trang_thai_hoi_vien || memberData.status || "Dang_hoat_dong", // ✅ FIXED: Use correct field name
          joinDate: memberData.join_date || "",
          inactiveDate: memberData.inactive_date || "",
          notes: String(memberData.notes || ""),
          membershipFeeExpirationDate: memberData.membership_fee_expiration_date || "",
          eventsAttended: Number(memberData.events_attended) || 0, // ✅ FIXED: Convert to number
          numberOfPosts: Number(memberData.number_of_posts) || 0, // ✅ FIXED: Convert to number
          secretaryInCharge: memberData.secretary_in_charge || "",
          formerExecutiveCommitteeClub: memberData.former_executive_committee_club || false,
          dateOfBirth: memberData?.date_of_birth
            ? parseApiDateString(memberData?.date_of_birth)
            : "",
          // Chapter information
          chapter: memberData?.chapter ? {
            id: memberData.chapter.documentId,
            name: memberData.chapter.ten_chi_hoi,
            secretary: memberData.chapter.thu_ky_chinh ? {
              documentId: memberData.chapter.thu_ky_chinh.documentId,
              full_name: memberData.chapter.thu_ky_chinh.full_name,
              phone_number_1: memberData.chapter.thu_ky_chinh.phone_number_1,
              email_1: memberData.chapter.thu_ky_chinh.email_1,
              position: memberData.chapter.thu_ky_chinh.position
            } : null,
            assistantSecretary: memberData.chapter.thu_ky_phu ? {
              documentId: memberData.chapter.thu_ky_phu.documentId,
              full_name: memberData.chapter.thu_ky_phu.full_name,
              phone_number_1: memberData.chapter.thu_ky_phu.phone_number_1,
              email_1: memberData.chapter.thu_ky_phu.email_1,
              position: memberData.chapter.thu_ky_phu.position
            } : null,
            memberCount: Number(memberData.chapter.so_luong_hoi_vien) || 0, // ✅ FIXED: Convert to number
            newMembersThisYear: Number(memberData.chapter.hoi_vien_moi_trong_nam) || 0, // ✅ FIXED: Convert to number
            inactiveMembers: Number(memberData.chapter.hoi_vien_ngung_hoat_dong) || 0, // ✅ FIXED: Convert to number
            eventsList: memberData.chapter.danh_sach_su_kien,
            membersList: memberData.chapter.danh_sach_hoi_vien,
            feesCollected: memberData.chapter.hoi_phi_da_thu
          } : null,
          // Member image
          memberImage: memberData?.member_image ? {
            id: String(memberData.member_image.documentId || ""),
            url: String(memberData.member_image.url || ""),
            name: String(memberData.member_image.name || ""),
            size: Number(memberData.member_image.size) || 0, // ✅ FIXED: Convert to number
            mime: String(memberData.member_image.mime || "")
          } : null,
          // Account information
          accounts: memberData?.tai_khoan || [],
          // Membership fees
          membershipFees: memberData?.hoi_phi || [],
          // Executive committee roles
          executiveRoles: memberData?.ban_chap_hanh || []
        });

        console.log('MemberInfoPage: Set comprehensive profile data with chapter:', memberData?.chapter?.ten_chi_hoi);
      } else if (memberData.customFields) {
        // Old API response structure (customFields) - only process if customFields exists
        console.log('MemberInfoPage: Processing old customFields member data:', memberData);

        setCurrentProfile({
          id: memberData.id,
          name: userInfo?.id,
          fullname: memberData.customFields?.["Họ và tên"] || "",
          gender: memberData.customFields?.["Nhân xưng"]?.[0] || "",
          phoneNumber: String(),
          email: String(
            memberData.customFields?.["Email 1"] ||
            memberData.customFields?.["Email 2"] ||
            ""
          ),
          company: memberData.customFields?.["Công ty"] || "",
          position: memberData.customFields?.["Chức vụ"] || "",
          dateOfBirth: memberData.customFields?.["Ngày sinh"]
            ? parseApiDateString(memberData.customFields?.["Ngày sinh"])
            : "",
        });
      } else {
        // ===== NEW: Handle case where member data exists but has no customFields =====
        console.log('MemberInfoPage: Member data exists but no customFields - setting basic profile');

        // Set basic profile with available data from AuthContext member
        setCurrentProfile({
          id: memberData.documentId || memberData.id,
          name: userInfo?.id,
          fullname: memberData.full_name || userInfo?.name || "Chưa cập nhật",
          lastName: memberData.last_name || "",
          firstName: memberData.first_name || "",
          gender: memberData.salutation || "",
          phoneNumber: String(memberData.phone_number_1 || memberData.phone_number_2 || ""),
          email: String(memberData.email_1 || memberData.email_2 || ""),
          company: memberData.company || "",
          position: memberData.position || "",
          dateOfBirth: memberData?.date_of_birth ? parseApiDateString(memberData?.date_of_birth) : "",
        });
      }
    }
  };

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

  // ===== IMAGE UPLOAD FUNCTIONS =====
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ===== NEW FLOW: Upload media immediately, save to member on confirm =====
  const [uploadedMediaId, setUploadedMediaId] = useState(null); // Store uploaded media ID
  const [previewImageUrl, setPreviewImageUrl] = useState(null); // Store preview URL

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Helper.showAlert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Helper.showAlert('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      console.log('Uploading media:', { file, basic: event.target, name: file.name, size: file.size, type: file.type });

      // ✅ NEW FLOW: Upload media to public endpoint
      const uploadResponse = await APIServices.uploadMedia(file, file.name);

      if (uploadResponse.error === 0) {
        console.log('Media uploaded successfully:', uploadResponse.data);

        // ✅ Store uploaded media ID for later use when "Xác nhận" is clicked
        setUploadedMediaId(uploadResponse.data.documentId);
        setPreviewImageUrl(uploadResponse.data.url);

        // ✅ Update local state for immediate preview
        setCurrentProfile(prev => ({
          ...prev,
          memberImage: {
            id: uploadResponse.data.documentId,
            url: uploadResponse.data.url,
            name: uploadResponse.data.name,
            size: uploadResponse.data.size,
            mime: uploadResponse.data.mime,
            width: uploadResponse.data.width,
            height: uploadResponse.data.height,
            ext: uploadResponse.data.ext,
            hash: uploadResponse.data.hash,
            createdAt: uploadResponse.data.createdAt,
            updatedAt: uploadResponse.data.updatedAt
          }
        }));

        Helper.showAlertInfo('Ảnh đã được tải lên. Nhấn "Xác nhận" để lưu thay đổi.', 3000);
        setIsChange(true); // Mark as changed to enable confirm button

      } else {
        Helper.showAlert(`Lỗi tải ảnh: ${uploadResponse.message}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Helper.showAlert('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ REMOVED: Unused helper functions

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

  // ✅ REMOVED: Unused helper functions

  const verifyEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const verifyPhone = (phoneNumber) => {
    if (!phoneNumber) return false;
    // ✅ FIXED: Ensure phone number is string and clean it
    const cleanPhone = String(phoneNumber).trim().replace(/\s+/g, '');
    const vnPhoneRegex = /^(0|\+84|84)[0-9]{9}$/;
    return vnPhoneRegex.test(cleanPhone);
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

    if (currentProfile.id) {
      // ✅ FIX: Only include fields with valid values (not empty strings or undefined)
      const changedFields = {};

      // Helper function to check if a value is valid for GraphQL
      const isValidValue = (value) => {
        return value !== undefined && value !== null && value !== "";
      };

      // Helper function to check if a date value is valid
      const isValidDate = (value) => {
        if (!value || value === "") return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      };

      // Helper function to check if a numeric value is valid
      const isValidNumber = (value) => {
        return value !== undefined && value !== null && value !== "" && !isNaN(value);
      };

      // Map frontend field names to GraphQL field names - only include valid values
      if (isValidValue(currentProfile.fullname)) changedFields.full_name = currentProfile.fullname;
      if (isValidValue(currentProfile.lastName)) changedFields.last_name = currentProfile.lastName;
      if (isValidValue(currentProfile.firstName)) changedFields.first_name = currentProfile.firstName;
      if (isValidValue(currentProfile.gender)) changedFields.salutation = currentProfile.gender;
      if (isValidValue(currentProfile.academicDegree)) changedFields.academic_degree = currentProfile.academicDegree;
      if (isValidValue(currentProfile.ethnicity)) changedFields.ethnicity = currentProfile.ethnicity;
      if (isValidValue(currentProfile.phoneNumber)) changedFields.phone_number_1 = currentProfile.phoneNumber;
      if (isValidValue(currentProfile.zalo)) changedFields.zalo = currentProfile.zalo;
      if (isValidValue(currentProfile.email)) changedFields.email_1 = currentProfile.email;
      if (isValidValue(currentProfile.homeAddress)) changedFields.home_address = currentProfile.homeAddress;
      if (isValidValue(currentProfile.provinceCity)) changedFields.province_city = currentProfile.provinceCity;
      if (isValidValue(currentProfile.district)) changedFields.district = currentProfile.district;
      if (isValidValue(currentProfile.company)) changedFields.company = currentProfile.company;
      if (isValidValue(currentProfile.companyAddress)) changedFields.company_address = currentProfile.companyAddress;

      // ✅ SPECIAL HANDLING FOR DATE FIELDS - only include if valid date
      if (isValidDate(currentProfile.companyEstablishmentDate)) {
        changedFields.company_establishment_date = currentProfile.companyEstablishmentDate;
      }

      if (isValidNumber(currentProfile.numberOfEmployees)) changedFields.number_of_employees = parseInt(currentProfile.numberOfEmployees);
      if (isValidValue(currentProfile.businessIndustry)) changedFields.business_industry = currentProfile.businessIndustry;
      if (isValidValue(currentProfile.businessProductsServices)) changedFields.business_products_services = currentProfile.businessProductsServices;
      if (isValidValue(currentProfile.position)) changedFields.position = currentProfile.position;
      if (isValidValue(currentProfile.officePhone)) changedFields.office_phone = currentProfile.officePhone;
      if (isValidValue(currentProfile.website)) changedFields.website = currentProfile.website;
      if (isValidValue(currentProfile.assistantName)) changedFields.assistant_name = currentProfile.assistantName;
      if (isValidValue(currentProfile.assistantPhone)) changedFields.assistant_phone = currentProfile.assistantPhone;
      if (isValidValue(currentProfile.assistantEmail)) changedFields.assistant_email = currentProfile.assistantEmail;
      if (isValidValue(currentProfile.memberType)) changedFields.member_type = currentProfile.memberType;
      if (isValidValue(currentProfile.status)) changedFields.status = currentProfile.status;

      // ✅ SPECIAL HANDLING FOR DATE FIELDS
      if (isValidDate(currentProfile.joinDate)) {
        changedFields.join_date = currentProfile.joinDate;
      }
      if (isValidDate(currentProfile.inactiveDate)) {
        changedFields.inactive_date = currentProfile.inactiveDate;
      }

      if (isValidValue(currentProfile.notes)) changedFields.notes = currentProfile.notes;

      // ✅ SPECIAL HANDLING FOR DATE OF BIRTH
      if (currentProfile.dateOfBirth && isValidDate(currentProfile.dateOfBirth)) {
        changedFields.date_of_birth = formatDate(currentProfile.dateOfBirth);
      }

      console.log('Updating member with changed fields:', {
        documentId: currentProfile.id,
        fieldsCount: Object.keys(changedFields).length,
        fields: changedFields
      });

      // ✅ Only proceed if there are actual changes to save
      if (Object.keys(changedFields).length === 0) {
        Helper.showAlertInfo("Không có thay đổi nào để lưu", 2000);
        setIsProcessing(false);
        setIsChange(false);
        return;
      }

      let res = await APIServices.saveMemberInfo(currentProfile.id, changedFields);
      if (res?.data?.updateMemberInformation) {
        // ✅ FIX: Use documentId from GraphQL response
        let documentId = res.data?.updateMemberInformation?.documentId || currentProfile.id;
        setCurrentProfile({
          id: documentId,
          ...currentProfile,
        });

        // ✅ NEW FLOW: Update member image if there's an uploaded media ID
        if (member?.documentId && uploadedMediaId) {
          console.log('Updating member image with uploaded media ID:', uploadedMediaId);

          const updateImageResponse = await APIServices.updateMemberImage(
            member.documentId,
            uploadedMediaId
          );

          if (updateImageResponse.error === 0) {
            console.log('Member image updated successfully');

            // ✅ Refresh member data in AuthContext to update user profile screen
            if (typeof getMemberInfoById === 'function') {
              try {
                await getMemberInfoById(member.documentId);
                console.log('Member data refreshed after image update');
              } catch (error) {
                console.error('Error refreshing member data:', error);
              }
            }

            // Clear the uploaded media ID since it's now saved
            setUploadedMediaId(null);
            setPreviewImageUrl(null);

            Helper.showAlertInfo("Cập nhật thông tin và ảnh đại diện thành công", 2500);
          } else {
            console.error('Failed to update member image:', updateImageResponse.message);
            Helper.showAlertInfo("Cập nhật thông tin thành công, nhưng có lỗi khi cập nhật ảnh đại diện", 3000);
          }
        } else {
          Helper.showAlertInfo("Cập nhật thông tin hội viên thành công", 2500);
        }

        // ✅ REMOVED: refreshUserByPhone() - no longer needed with useAuth()
      } else {
        Helper.showAlert(`${res?.data?.error}`);
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
        // ✅ REMOVED: refreshMembers() - no longer needed with useAuth()
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

  // ✅ ADDED: Loading state display
  if (isLoading) {
    return (
      <Page className="bg-white page safe-page-content">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin hội viên...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-white page safe-page-content">
      <div className="">
        <div className="mt-2">
          <label className="text-base font-bold">Ảnh đại diện</label>
          <div className="mt-2 relative">
            <img
              {...getImageProps(
                currentProfile.memberImage?.url || userInfo?.avatar,
                "https://api.ybahcm.vn/public/yba/default-avatar.png",
                {
                  alt: currentProfile.fullname || "Member avatar",
                  className: "w-20 h-20 rounded-full object-cover"
                }
              )}
            />

            {/* Edit button overlay */}
            {/* <button
              onClick={handleImageUploadClick}
              disabled={isUploadingImage}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Thay đổi ảnh đại diện"
            >
              {isUploadingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="zi-edit" size={14} />
              )}
            </button> */}

            {/* Hidden file input */}
            {/* <input
              ref={fileInputRef}
              type="file"
              name="files"
              multiple={false}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            /> */}
          </div>

          {isUploadingImage && (
            <p className="text-sm text-blue-600 mt-2">Đang tải ảnh lên...</p>
          )}
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
                  {currentProfile.chapter.memberCount > 0 && (
                    <p className="text-xs text-gray-600">Số hội viên: {currentProfile.chapter.memberCount.toLocaleString('vi-VN')}</p>
                  )}
                  {currentProfile.chapter.secretary && (
                    <p className="text-xs text-gray-600">Thư ký: {currentProfile.chapter.secretary.full_name}</p>
                  )}
                </div>
              )}

              {currentProfile.eventsAttended > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Sự kiện đã tham gia:</label>
                  <p className="text-sm text-gray-900">{currentProfile.eventsAttended.toLocaleString('vi-VN')}</p>
                </div>
              )}

              {currentProfile.numberOfPosts > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Số bài viết:</label>
                  <p className="text-sm text-gray-900">{currentProfile.numberOfPosts.toLocaleString('vi-VN')}</p>
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
              configs.map((v, i) => {
                return (
                  <div className="flex items-center mb-2" key={i}>
                    <input
                      id={`gender_${i}`}
                      checked={currentProfile?.gender === v}
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
              value={currentProfile?.fullname || ""}
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
                (!!member?.phone_number_1 ||
                  !!member?.phone_number_2)
              }
              className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
              placeholder="Nhập số điện thoại đã đăng ký với YBA"
              value={currentProfile?.phoneNumber || ""}
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
                (
                  !!member?.email_1 ||
                  !!member?.email_2)
              }
              type="text"
              className="border disabled:bg-[#E5E5E5] w-full h-12 p-4 rounded-md"
              placeholder="Nhập email đã đăng ký với YBA"
              value={currentProfile?.email || ""}
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
              value={currentProfile?.dateOfBirth || ""}
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
                value={currentProfile?.company || ""}
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
                value={currentProfile?.position || ""}
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
