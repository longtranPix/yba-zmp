import { useState, useEffect } from "react";
import { Page, Icon, useNavigate, Box, Modal } from "zmp-ui";
import {
  configState,
} from "../state";
import { useRecoilValue } from "recoil";
import APIServices from "../services/api-service";
import WidgetOA from "../components/widget-oa";
import PoweredByBlock from "../components/powered-by-block";
import AuthSuccessIcon from "../components/icons/authenticate-success";
import SuccessIcon from "../components/icons/success-icon";
import WarningIcon from "../components/icons/warning-icon";
import { useAuth } from "../contexts/AuthContext";
import { getImageProps } from "../utils/imageHelper";

const UserPage = () => {
  const navigate = useNavigate();
  const configs = useRecoilValue(configState);

  // ===== NEW: Use AuthContext instead of old authentication =====
  const {
    userInfo,
    member,
    accountInfo,
    getMemberInfoById,
    isAuthenticated,
    isMember
  } = useAuth();

  // Determine if user is member from AuthContext
  // const isMember = userType === 'member';

  const [membershipFeeStatus, setMembershipFeeStatus] = useState(null);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [hasExistingFeeRequest, setHasExistingFeeRequest] = useState(false);
  const [isCreatingFeeRequest, setIsCreatingFeeRequest] = useState(false);

  // ✅ REFACTORED: Member benefits now loaded via Recoil state in membership pages

  // ===== NEW: Modal configuration for membership fee requests =====
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "", // 'success', 'error'
    title: "",
    message: "",
  });

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
        // ✅ REMOVED: setMemberBenefits([]) - now handled by Recoil state
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

        // ✅ REMOVED: Member benefits now loaded via Recoil state
        // Member benefits are now handled by listMemberBenefitsState in Recoil

      } catch (error) {
        console.error('UserPage: Error loading member data:', error);
        setMembershipFeeStatus(null);
        // ✅ REMOVED: setMemberBenefits([]) - now handled by Recoil state
      }
    };

    loadMemberData();
  }, [isMember, member?.documentId, accountInfo?.hoi_vien?.documentId]); // Re-run when member status or member ID changes

  // ===== NEW: Check detailed membership fee request status =====
  useEffect(() => {
    const checkMembershipFeeRequestStatus = async () => {
      if (!member?.documentId) return;

      try {
        console.log('Checking detailed membership fee request status for member:', member.documentId);

        const response = await APIServices.getMembershipFeeRequestStatus(member.documentId);
        if (response.error === 0) {
          const { hasExistingRequest, status, latestRequest } = response.data;

          setHasExistingFeeRequest(hasExistingRequest);

          console.log('Detailed membership fee request status:', {
            hasExistingRequest,
            totalRequests: response.data.totalRequests,
            latestRequestDate: latestRequest?.createdAt,
            memberName: status?.memberName,
            phoneNumber: status?.phoneNumber
          });
        }
      } catch (error) {
        console.error('Error checking membership fee request status:', error);
      }
    };

    checkMembershipFeeRequestStatus();
  }, [member?.documentId]);

  // ===== NEW: Modal helper functions =====
  const showModal = (config) => {
    setModalConfig({ ...config, visible: true });
    // Auto dismiss after 3 seconds for success, keep error modals open
    if (config.type === "success") {
      setTimeout(() => {
        closeModal();
      }, 3000);
    }
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // ===== NEW: Create membership fee request with modal =====
  const handleCreateMembershipFeeRequest = async () => {
    if (!member?.documentId || !userInfo?.id) {
      console.error('Missing member ID or phone number');
      showModal({
        type: "error",
        title: "Lỗi thông tin",
        message: "Không tìm thấy thông tin hội viên hoặc số điện thoại. Vui lòng thử lại sau.",
      });
      return;
    }

    try {
      setIsCreatingFeeRequest(true);
      console.log('Creating membership fee request:', {
        memberId: member.documentId,
        phoneNumber: userInfo.id
      });

      const response = await APIServices.createRequestMembershipFee(
        member.documentId,
        userInfo.phoneNumber
      );

      if (response.error === 0) {
        console.log('Membership fee request created successfully:', response.data);
        setHasExistingFeeRequest(true);

        // Show success modal
        showModal({
          type: "success",
          title: "Gửi yêu cầu thành công",
          message: "Yêu cầu đóng hội phí đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất để hướng dẫn thanh toán.",
        });
      } else {
        console.error('Failed to create membership fee request:', response.message);
        showModal({
          type: "error",
          title: "Gửi yêu cầu thất bại",
          message: response.message || "Không thể tạo yêu cầu đóng hội phí. Vui lòng thử lại sau.",
        });
      }
    } catch (error) {
      console.error('Error creating membership fee request:', error);
      showModal({
        type: "error",
        title: "Có lỗi xảy ra",
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
      });
    } finally {
      setIsCreatingFeeRequest(false);
    }
  };

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
                userInfo?.avatar,
                "https://api.ybahcm.vn/public/yba/default-avatar.png",
                {
                  alt: userInfo?.name || "User avatar",
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
          <div className="flex items-center px-3 py-2 mx-4 mt-3 bg-white rounded-lg shadow-sm" onClick={() => navigate("/members/info")}>
            <img
              className="rounded-full w-14 h-14"
              {...getImageProps(
                // ✅ UPDATED: Show member image if isMember and has member_image, otherwise show userInfo avatar
                isMember && member?.member_image?.url
                  ? member.member_image.url
                  : userInfo?.avatar,
                "https://api.ybahcm.vn/public/yba/default-avatar.png",
                {
                  alt: isMember ? (member?.full_name || "Member avatar") : (userInfo?.name || "User avatar"),
                  className: "rounded-full w-14 h-14"
                }
              )}
            />
            <div className="pl-4">
              <p className="text-[16px] text-[#333333] font-semibold mb-1">
                {getMemberName()}
              </p>
              {getStatus()}
              <div className="mt-2">
                {isMember && (
                  hasChapterInfo() && (
                    <button
                      className="whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
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
                )}
              </div>
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

              {/* Membership fee request button - Show for verified members who haven't paid and don't have existing request */}
              {membershipFeeStatus &&
                !membershipFeeStatus.hasPaidFee &&
                !hasExistingFeeRequest &&
                member?.status !== "Ngung_hoat_dong" &&
                accountInfo?.trang_thai !== "Khoa_tai_khoan" && (
                  <div className="mt-2">
                    <button
                      onClick={handleCreateMembershipFeeRequest}
                      disabled={isCreatingFeeRequest}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                      {isCreatingFeeRequest ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Đang gửi...
                        </div>
                      ) : (
                        'Yêu cầu đóng hội phí'
                      )}
                    </button>
                  </div>
                )}

              {/* Show message if request already exists */}
              {hasExistingFeeRequest && !membershipFeeStatus?.hasPaidFee && (
                <div className="mt-1">
                  <p className="text-xs px-2 py-1 rounded-md font-medium text-blue-700 bg-blue-100 border border-blue-300">
                    Đã gửi yêu cầu đóng hội phí
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center ml-auto space-x-2">
              {!isMember &&
              // (
              //   hasChapterInfo() && (
              //     <button
              //       className="mx-auto whitespace-nowrap block py-1 px-4 h-8 bg-[#0E3D8A] text-white font-medium text-sm leading-4 rounded-lg"
              //       onClick={() =>
              //         navigate(
              //           `/invite-to-join-by-link/${groupId}/${encodeURIComponent(
              //             getMemberName()
              //           )}`
              //         )
              //       }
              //     >
              //       Mời hội viên
              //     </button>
              //   )
              // ) : 
              (
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

      {/* Share Modal */}
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

      {/* ===== NEW: Membership Fee Request Modal ===== */}
      <Modal
        visible={modalConfig.visible}
        title=""
        onClose={closeModal}
        verticalActions
      >
        <Box p={6}>
          <div className="text-center flex justify-center mb-4">
            {modalConfig.type === "success" ? <SuccessIcon /> : <WarningIcon />}
          </div>
          <div className="text-center font-bold text-lg my-4">
            {modalConfig.title}
          </div>
          <div className="text-center text-[#222] my-4">
            {modalConfig.message}
          </div>
          <button
            className={`${modalConfig.type === "success" ? "bg-green-600" : "bg-blue-custom"
              } disabled:bg-blue-50 text-white font-bold py-2 rounded-lg text-normal w-full block h-12`}
            onClick={closeModal}
          >
            Đóng
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default UserPage;
