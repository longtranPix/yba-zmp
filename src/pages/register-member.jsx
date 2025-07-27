import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate, Modal, Box } from "zmp-ui";
import CustomerInfoSheet from "../components/custom-info-sheet";
import IconMinus from "../components/icons/minus-icon";
import IconPlus from "../components/icons/plus-icon";
import {
  ticketEventInfoState,
} from "../state";
import {
  useRecoilValue,
  useSetRecoilState,
  useRecoilRefresher_UNSTABLE,
  useRecoilState,
} from "recoil";
import EditIcon from "../components/icons/edit-icon";
import { events, EventName } from "zmp-sdk/apis";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  eventInfoState,
  vietQrState,
  listTicketState,
  configState,
  suggestFollowState,
  listTicketOfEventState,
} from "../state";
import Helper from "../utils/helper";
import { getMemberAvatarUrl, getDefaultAvatar } from "../utils/imageHelper";
import APIService from "../services/api-service";
import ZaloService from "../services/zalo-service";
import { getUserInfo, followOA } from "zmp-sdk/apis";
// ✅ REMOVED: APIServices - using only AuthContext data
import { useAuth } from "../contexts/AuthContext";
import { useAuthGuard } from "../hooks/useAuthGuard";
import GroupTicketsSheet from "../components/group-tickets-sheet";
import WarningIcon from "../components/icons/warning-icon";

const RegisterMemberPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // ✅ OPTIMIZED: Authentication is checked before navigation to this page
  const { member, userInfo, isMember, isAuthenticated, getEventRegistrationUserInfo } = useAuth();

  const [selectType, setSelectType] = useState(member ? 0 : 1);
  const [customInfo, setCustomInfo] = useState({});

  // Extract URL parameters using React Router
  const eventId = searchParams.get('eventId');
  const ticketId = searchParams.get('ticketId');
  const ticketCount = searchParams.get('ticketCount');

  // Add validation for required parameters
  if (!eventId) {
    console.error('RegisterMemberPage: No eventId provided in URL parameters');
    navigate('/');
    return null;
  }

  if (!ticketId) {
    console.error('RegisterMemberPage: No ticketId provided in URL parameters');
    navigate('/');
    return null;
  }

  console.log('RegisterMemberPage: URL params:', { eventId, ticketId, ticketCount });

  // Load tickets with error handling
  let tickets = [];
  try {
    tickets = useRecoilValue(listTicketOfEventState(eventId));
  } catch (error) {
    console.error('RegisterMemberPage: Error loading tickets:', error);
    // Return error state or redirect
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Lỗi tải thông tin vé</p>
          <p className="text-sm text-gray-500 mt-2">Event ID: {eventId}</p>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Quay về sự kiện
          </button>
        </div>
      </Page>
    );
  }

  // Validate that the ticketId exists in the tickets array
  const selectedTicket = tickets?.find(t => t.documentId === ticketId);
  if (tickets && tickets.length > 0 && !selectedTicket) {
    console.error('RegisterMemberPage: Ticket not found in event tickets:', { ticketId, availableTickets: tickets.map(t => t.documentId) });
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Không tìm thấy thông tin vé</p>
          <p className="text-sm text-gray-500 mt-2">Ticket ID: {ticketId}</p>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Quay về sự kiện
          </button>
        </div>
      </Page>
    );
  }

  const [ticketCountt, setTicketCount] = useState(Number(ticketCount) || 1);
  const [tempTicketCount, setTempTicketCount] = useState("");
  const [childTickets, setChildTickets] = useState([]);

  // ✅ REFACTORED: Helper functions using only useAuth() data
  // All profile data now comes from AuthContext (member, userInfo) - no external API calls needed
  const getMemberName = () => {
    // Priority: AuthContext member -> userInfo
    if (member?.full_name) return member.full_name;
    if (member?.last_name && member?.first_name) return `${member.last_name} ${member.first_name}`;
    return userInfo?.name || "";
  };

  const getMemberPhone = () => {
    // Priority: AuthContext member -> userInfo
    if (member?.phone_number_1) return member.phone_number_1;
    if (member?.phone_number_2) return member.phone_number_2;
    return userInfo?.phoneNumber || "";
  };

  const getMemberEmail = () => {
    // Priority: AuthContext member -> userInfo
    if (member?.email_1) return member.email_1;
    if (member?.email_2) return member.email_2;
    return userInfo?.email || "";
  };

  const getMemberCompany = () => {
    // Use AuthContext member data only
    return member?.company || "";
  };

  // ✅ REMOVED: Unused helper functions - using AuthContext member data directly

  const getMemberId = () => {
    // Use AuthContext member data only
    return member?.documentId || member?.id || null;
  };

  const showModal = (config) => {
    setIsProcessing(true);
    setModalConfig({ ...config, visible: true });

    // ✅ ENHANCED: Don't auto-close if showing guest option (persistent modal)
    if (!config.showGuestOption) {
      setTimeout(() => {
        closeModal();
      }, 3000);
    }
  };

  // // ✅ REFACTORED: Use only AuthContext member status - no API fallback needed
  // useEffect(() => {
  //   console.log('RegisterMemberPage: Syncing member status from AuthContext:', {
  //     isMember,
  //     hasMember: !!member,
  //     memberDocumentId: member?.documentId
  //   });

  //   // Use AuthContext member status directly
  //   setLocalIsMember(isMember);
  // }, [member, isMember]); // Re-check when AuthContext member changes

  // ✅ REMOVED: Visibility change handler - AuthContext handles state updates automatically

  useEffect(() => {
    if (tickets?.length > 0) {
      const ticket = tickets.find((t) => t.documentId === ticketId);
      // Use so_luong_ve_xuat for quantity exported per purchase (replaces combo logic)
      const exportQuantity = ticket?.so_luong_ve_xuat || 1;
      setTicketCount(exportQuantity);
    }
  }, [ticketId, ticketCount, tickets]);

  const getTotalTickets = () => {
    // Total tickets = purchase count * export quantity per purchase
    const exportQuantity = ticket?.so_luong_ve_xuat || 1;
    return ticketCountt * exportQuantity;
  };

  const validateTicketCount = (count) => {
    if (!count) return false;

    // Available tickets = tickets issued for this type
    const availableTickets = parseInt(ticket?.so_luong_ve_phat_hanh) || 0;
    const maxEventTickets = parseInt(event?.so_ve_toi_da) || 0;
    const maxAllowed = Math.min(availableTickets, maxEventTickets);

    return count <= maxAllowed;
  };

  const handleTicketCountChange = (e) => {
    if (typeof e === "object") {
      const value = e.target.value;
      setTempTicketCount(value === "" ? "" : value);
      setTicketCount(parseInt(value) || 0);
    } else {
      const numValue = parseInt(e);
      if (!isNaN(numValue)) {
        setTicketCount(numValue);
        setTempTicketCount(String(numValue));
      }
    }
  };

  const handleTicketBlur = () => {
    if (tempTicketCount === "") {
      setTicketCount(1);
      setTempTicketCount("1");
      return;
    }
    const numValue = parseInt(tempTicketCount);
    if (!numValue || numValue < 1) {
      setTicketCount(1);
      setTempTicketCount("1");
    } else {
      setTicketCount(numValue);
      setTempTicketCount(String(numValue));
    }
  };

  const canDecrement = () => ticketCountt > 1;
  const canIncrement = () => {
    const availableTickets = ticket?.so_luong_ve_phat_hanh || 0;
    const maxEventTickets = event?.so_ve_toi_da || 0;
    const maxAllowed = Math.min(availableTickets, maxEventTickets);
    return ticketCountt < maxAllowed;
  };

  const event = useRecoilValue(eventInfoState(eventId));
  const ticket = useRecoilValue(ticketEventInfoState({ eventId, ticketId }));

  const [isProcessing, setIsProcessing] = useState(false);
  const setVietQr = useSetRecoilState(vietQrState);
  const refreshMyTickets = useRecoilRefresher_UNSTABLE(listTicketState);
  const configs = useRecoilValue(configState);

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "",
    title: "",
    message: "",
  });

  // ✅ REMOVED: Unused avatar state
  const [suggestFollowOA, setSuggestFollowOA] =
    useRecoilState(suggestFollowState);

  const handlePaymentCallback = () => {
    events.on(EventName.OnDataCallback, (resp) => {
      const { eventType, data } = resp;
      const next = () => {
        return navigate(`/payment?ticketId=${ticketId}&eventId=${eventId}`);
      };
      if (!suggestFollowOA) {
        return next();
      }
      getUserInfo({
        success: (data) => {
          const { userInfo } = data;
          if (userInfo.followedOA) {
            setSuggestFollowOA(false);
            return next();
          }
          setTimeout(() => {
            followOA({
              id: configs?.oaInfo?.id,
              success: (res) => {
                return next();
              },
              fail: (err) => {
                console.log("err", err);
                return next();
              },
            });
          }, 500);
          setSuggestFollowOA(false);
        },
        fail: (error) => {
          console.log(error);
          next();
        },
      });
    });
  };

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  useEffect(() => {
    if (member && isMember) {
      setSelectType(0);
      setCustomInfo({
        memberId: getMemberId(),
        fullname: getMemberName(),
        phoneNumber: getMemberPhone(),
        company: getMemberCompany(),
        email: getMemberEmail(),
      });
      setShowCustomerForm(false);
      getUserInfo({
        success: (data) => {
          const { userInfo } = data;
          if (userInfo && userInfo.avatar) {
            setAvatar(userInfo.avatar);
          }
        },
        fail: (error) => {
          console.log(error);
        },
      });
    } else {
      setShowCustomerForm(true);
      setSelectType(1);
    }
  }, [member, isMember]);

  // ✅ AUTO-SELECT and DISABLE options based on ve_nhom field
  useEffect(() => {
    if (ticket) {
      console.log('Checking ticket ve_nhom field:', {
        ticketId: ticket.documentId,
        ve_nhom: ticket.ve_nhom,
        currentSelectType: selectType
      });

      if (ticket.ve_nhom === true) {
        // If ticket has ve_nhom = true, auto-select group ticket option (type 2)
        console.log('Auto-selecting group ticket option due to ve_nhom = true');
        setSelectType(2);
        setShowCustomerForm(true);
      } else if (ticket.ve_nhom === false) {
        // If ticket has ve_nhom = false, ensure group option is not selected
        console.log('Ticket has ve_nhom = false, ensuring individual options are available');
        if (selectType === 2) {
          // If currently on group option, switch to appropriate individual option
          if (member && isMember) {
            setSelectType(0); // Member option
          } else {
            setSelectType(1); // Guest option
          }
        }
      }
    }
  }, [ticket, member, isMember, selectType]);

  const confirm = async () => {
    const availableTickets = parseInt(ticket?.so_luong_ve_phat_hanh) || 0;
    const maxEventTickets = parseInt(event?.so_ve_toi_da) || 0;

    if (!validateTicketCount(ticketCountt)) {
      Helper.showAlert(
        `Số lượng vé không đủ. Chỉ còn ${Math.min(
          availableTickets,
          maxEventTickets
        )} vé.`
      );
      return;
    }

    // ✅ FIXED: Validate group ticket requirements
    if (selectType === 2) {
      const exportQuantity = ticket?.so_luong_ve_xuat || 1;
      const totalTicketsSelected = ticketCountt * exportQuantity;

      if (totalTicketsSelected <= 1) {
        Helper.showAlert(
          `Vé nhóm phải có tổng số lượng vé lớn hơn 1. Hiện tại: ${totalTicketsSelected} vé.`
        );
        return;
      }

      console.log('Group ticket validation passed:', {
        ticketCount: ticketCountt,
        exportQuantity,
        totalTicketsSelected,
        isValid: totalTicketsSelected > 1
      });
    }

    setIsProcessing(true);
    customInfo.guestTicket = selectType == 1;

    // ✅ FIXED: Use AuthContext to get user info for event registration
    let eventUserInfo = null;
    try {
      console.log('Event registration: Getting user info via AuthContext...', {
        isAuthenticated,
        isMember,
        hasUserInfo: !!userInfo,
        hasMember: !!member
      });

      const userInfoResult = await getEventRegistrationUserInfo();

      if (!userInfoResult.success) {
        setIsProcessing(false);

        if (userInfoResult.needsPermissions) {
          Helper.showAlert(
            "Cần quyền truy cập",
            "Để đăng ký vé, ứng dụng cần quyền truy cập thông tin Zalo và số điện thoại của bạn."
          );
        } else {
          Helper.showAlert(
            "Lỗi đăng ký",
            userInfoResult.message || "Không thể lấy thông tin người dùng. Vui lòng thử lại."
          );
        }
        return;
      }

      eventUserInfo = userInfoResult.userInfo;
      console.log('Event registration: Got user info successfully:', {
        zaloId: eventUserInfo?.id,
        phoneNumber: eventUserInfo?.phoneNumber ? '***' + eventUserInfo.phoneNumber.slice(-4) : 'N/A',
        isMember: userInfoResult.isMember,
        hasMemberInfo: !!userInfoResult.memberInfo
      });

    } catch (error) {
      console.error('Event registration: Error getting user info:', error);
      setIsProcessing(false);
      Helper.showAlert(
        "Lỗi đăng ký",
        "Có lỗi xảy ra khi lấy thông tin người dùng. Vui lòng thử lại."
      );
      return;
    }

    const isComboTicket = ticket?.customFields?.["Vé combo"] === true;
    const totalTickets = isComboTicket
      ? getTotalTicketsForCombo()
      : ticketCountt;

    // Check if this is a group ticket (ve_nhom = true)
    const isGroupTicket = ticket?.ve_nhom === true;

    // ✅ REFACTORED: Use only AuthContext member data for member ID
    // If user is member (even registering as guest), always include memberId
    const effectiveMemberId = isMember && member?.documentId
      ? member.documentId
      : customInfo?.memberId || null;

    console.log('Event registration: Member ID assignment:', {
      isMember,
      memberDocumentId: member?.documentId,
      customInfoMemberId: customInfo?.memberId,
      effectiveMemberId,
      selectType,
      isGuestRegistration: selectType === 1
    });

    // ✅ REMOVED: Existing ticket check moved to selectProfile function
    // This ensures the check only happens when user actively chooses member option
    // and allows free access to register-member screen

    const requestBody = {
      memberId: effectiveMemberId, // ✅ FIXED: Always set memberId if user is member
      "Tên người đăng ký": customInfo.fullname, // ten_nguoi_dang_ky: String
      "Tên sự kiện": event?.ten_su_kien || "", // ten_su_kien: String
      "Mã vé": ticket?.ma_loai_ve || `REG_${Date.now()}`, // ma_ve: String
      "Loại vé": ticket?.loai_ve || "Tra_phi", // loai_ve: String
      "Tên hiển thị vé": ticket?.ten_hien_thi_ve || "", // hien_thi_loai_ve: String
      "Ngày sự kiện": event?.thoi_gian_to_chuc, // ngay_su_kien: Date
      "Email": customInfo.guestTicket // email: String
        ? customInfo.email || ""
        : selectType == 2
        ? customInfo.email
        : getMemberEmail(),
      "Số điện thoại": customInfo.guestTicket // so_dien_thoai: String
        ? customInfo.phoneNumber
        : selectType == 2
        ? customInfo.phoneNumber
        : getMemberPhone(),
      "Zalo ID": eventUserInfo?.id || userInfo?.id, // ✅ REFACTORED: Use userInfo from useAuth()
      "Zalo OA ID": userInfo?.zaloIDByOA, // ma_zalo_oa: String
      "Số lượng vé": String(totalTickets || 1), // For processing, not a direct GraphQL field
      "Công ty": customInfo.guestTicket // Not direct GraphQL field, might be in member info
        ? ""
        : getMemberCompany(),
      "Vãng lai": selectType === 1 || !isMember, // Not direct GraphQL field
      "Giá vé": ticket?.gia || null, // gia_ve: Float
      "Vé miễn phí": ticket?.loai_ve === "Mien_phi", // For processing logic
      "Vé nhóm": isGroupTicket || selectType === 2, // For processing - determines ve_chinh: Boolean
      "Ghi chú": customInfo.note || "", // ghi_chu_khach_hang: String
      "Vé chính": true, // ve_chinh: Boolean, main ticket in a group
      // Payment info - not direct GraphQL fields, handled separately via Bank relation
      "Ngân hàng": event?.bank?.ten_ngan_hang || event?.customFields?.["Ngân hàng"]?.[0].data || "",
      "Tk Ngân Hàng": event?.bank?.so_tai_khoan || event?.customFields?.["Tk Ngân Hàng"] || "",
      "Tên Tk Ngân Hàng": event?.bank?.ten_chu_tai_khoan || event?.customFields?.["Tên Tk Ngân Hàng"] || "",
    };

    // ✅ FIXED: Handle child tickets for group registration
    if (isGroupTicket || selectType === 2) {
      const exportQuantity = ticket?.so_luong_ve_xuat || 1;

      // ✅ FIXED: For group tickets, calculate child tickets correctly
      // Total tickets to register = ticketCount * exportQuantity
      // Main ticket = 1 (with ve_chinh = true)
      // Child tickets = (ticketCount * exportQuantity) - 1 (with ve_chinh = false)
      const totalTicketsToRegister = totalTickets * exportQuantity;
      const childTicketsCount = totalTicketsToRegister - 1;

      console.log('Group ticket calculation:', {
        ticketCount: totalTickets,
        exportQuantity,
        totalTicketsToRegister,
        childTicketsCount,
        selectType,
        isGroupTicket
      });

      // For group tickets (ve_nhom = true), create child tickets for different people
      if (selectType === 2 && childTickets && childTickets.length > 0) {
        // Use actual group member data entered by user
        requestBody["Vé con"] = childTickets.map(child => ({
          "Tên": child.name || child["Tên"],
          "Số điện thoại": child.phone || child["Số điện thoại"],
          "Email": child.email || child["Email"],
          "Giá vé": null, // ✅ FIXED: Set price for child tickets
          "Vé chinh": false // ✅ FIXED: Set ve_chinh to false for child tickets
        }));
      } else if (childTicketsCount > 0) {
        // Default group tickets with same person info (for multiple ticket export)
        requestBody["Vé con"] = Array(childTicketsCount).fill({
          "Tên": customInfo.fullname,
          "Số điện thoại": customInfo.guestTicket
            ? customInfo.phoneNumber
            : selectType == 2
            ? customInfo.phoneNumber
            : getMemberPhone(),
          "Email": customInfo.guestTicket
            ? customInfo.email || ""
            : selectType == 2
            ? customInfo.email
            : getMemberEmail(),
            "Giá vé": null, // ✅ FIXED: Set price for child tickets
            "Vé chính": false // ✅ FIXED: Set ve_chinh to false for child tickets
        });
      }

      // ✅ FIXED: Set total price for main ticket (includes all tickets in the group)
      if (ticket?.gia && totalTicketsToRegister > 1) {
        requestBody["Giá vé"] = ticket.gia * totalTicketsToRegister;
        console.log('Group ticket total price:', {
          unitPrice: ticket.gia,
          totalTickets: totalTicketsToRegister,
          totalPrice: requestBody["Giá vé"]
        });
      }
    }

    let result = await APIService.registerEvent(
      eventId,
      ticketId,
      requestBody,
      eventUserInfo?.zaloIDByOA || userInfo?.zaloIDByOA
    );

    if (result.message == "No id returned from middleware") {
      return showModal({
        type: "error",
        title: result.alert.title || "Có lỗi xảy ra",
        message: result.alert.message || "Vui lòng thử lại sau ít phút",
      });
    }
    if (result.error == 0) {
      console.log('check result', result);
      setVietQr({
        url: result.data.vietqr,
        bankInfo: {
          accountNumber: result.data["Tk Ngân Hàng"],
          accountName: result.data["Tên Tk Ngân Hàng"],
          bankName: result.data["Ngân hàng"],
          bankInfo: result.data.bankInfo,
        },
      });
      if (result?.data?.skipPayment) {
        Helper.showAlertInfo(
          "Đăng ký thành công, vé sẽ được gửi đến Quý Anh/Chị sớm nhất"
        );
        setTimeout(() => {
          navigate("/");
          if (result.data.id) {
            navigate(`/tickets/detail/${result.data.id}`);
          }
        }, 2000);
      } else if (
        window.location.origin.startsWith("http://localhost") ||
        result.data.ticketPrice !== 0
      ) {
        navigate(`/payment?ticketId=${result.data.id}&eventId=${eventId}`);
      } else if (result.data.checkoutSdk) {
        ZaloService.createOrder(result.data.checkoutSdk.order);
      }
      refreshMyTickets();
    } else {
      Helper.showAlert(`${result.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    setIsProcessing(false);
  };

  const handleFormClick = (data) => {
    if (data) {
      setCustomInfo(data);
    }
    setShowCustomerForm(false);
  };

  const verifyInfo = () => {
    console.log("customInfo", customInfo);
    if (
      isProcessing ||
      !customInfo ||
      !customInfo.fullname ||
      !customInfo.phoneNumber
    ) {
      console.log("verifyInfo", isProcessing);
      return false;
    }
    return true;
  };

  const selectProfile = async (type) => {
    if (type === 2 && ticket?.chi_danh_cho_hoi_vien === true) {
      Helper.showAlert("Vé này không áp dụng cho vé nhóm");
      return;
    }

    if (type === 1 && ticket?.chi_danh_cho_hoi_vien === true) {
      Helper.showAlert("Vé này không áp dụng cho khách vãng lai");
      return;
    }

    // ✅ SIMPLIFIED: Authentication is handled before navigation, just check existing tickets for members
    if (type === 0 && isMember && member?.documentId) {
      console.log('selectProfile: Member option selected - checking for existing tickets...');

      try {
        const anyTicketCheck = await APIService.checkMemberHasAnyTicketForEvent(
          member.documentId,
          eventId
        );

        console.log('selectProfile: Any ticket check result:', anyTicketCheck);

        if (anyTicketCheck.error === 0 && anyTicketCheck.hasAnyTicket) {
          // Show alreadyBuyPopup with guest option
          const existingTicket = anyTicketCheck.existingTickets[0];
          const existingTicketType = existingTicket.hien_thi_loai_ve || 'vé đã đăng ký';

          return showModal({
            type: "warning",
            title: "Hội viên đã có vé đăng ký",
            message: `Bạn đã đăng ký "${existingTicketType}" cho sự kiện này rồi. Mỗi hội viên chỉ được đăng ký một vé cho mỗi sự kiện.\n\nBạn có muốn đăng ký với tư cách khách mời không?`,
            showGuestOption: true,
            onGuestRegister: () => {
              // Switch to guest registration mode
              setSelectType(1);
              setIsProcessing(false);
              setModalConfig(prev => ({ ...prev, visible: false }));
              if (type !== 2) {
                setTicketCount(1);
                setTempTicketCount("1");
                setChildTickets([]);
              }
            },
            onCancel: () => {
              setModalConfig(prev => ({ ...prev, visible: false }));
              // Don't change selectType, stay on current selection
            }
          });
        }
      } catch (error) {
        console.error('selectProfile: Error checking existing tickets:', error);
        Helper.showAlert("Có lỗi xảy ra khi kiểm tra vé hiện có. Vui lòng thử lại.");
        return;
      }
    }

    // If no existing tickets or not member option, proceed with selection
    setSelectType(type);
    if (type !== 2) {
      setTicketCount(1);
      setTempTicketCount("1");
      setChildTickets([]);
    }

    if (type === 1 || type === 2) {
      setCustomInfo({});
      setShowCustomerForm(true);
    } else {
      setCustomInfo({
        memberId: getMemberId(),
        fullname: getMemberName(),
        phoneNumber: getMemberPhone(),
        company: getMemberCompany(),
        email: getMemberEmail(),
      });
    }
  };

  useEffect(() => {
    setChildTickets([]);
  }, [selectType]);

  useEffect(() => {
    if (selectType !== 2) {
      // Initialize with 1 purchase (which may export multiple tickets based on so_luong_ve_xuat)
      setTicketCount(1);
      setTempTicketCount("1");
    }
  }, [selectType, ticket]);

  const handleGroupTicketsSubmit = async (tickets) => {
    try {
      const isGroupTicket = ticket?.ve_nhom === true;

      // ✅ FIXED: Validate group ticket requirements
      const groupExportQuantity = ticket?.so_luong_ve_xuat || 1;
      const totalTicketsSelected = (ticketCountt || 1) * groupExportQuantity;

      if (totalTicketsSelected <= 1) {
        Helper.showAlert(
          `Vé nhóm phải có tổng số lượng vé lớn hơn 1. Hiện tại: ${totalTicketsSelected} vé.`
        );
        return;
      }

      // ✅ FIXED: Use AuthContext to get user info for group registration
      let groupUserInfo = null;
      try {
        console.log('Group registration: Getting user info via AuthContext...');
        const userInfoResult = await getEventRegistrationUserInfo();

        if (!userInfoResult.success) {
          if (userInfoResult.needsPermissions) {
            Helper.showAlert(
              "Cần quyền truy cập",
              "Để đăng ký vé, ứng dụng cần quyền truy cập thông tin Zalo và số điện thoại của bạn."
            );
          } else {
            Helper.showAlert(
              "Lỗi đăng ký",
              userInfoResult.message || "Không thể lấy thông tin người dùng. Vui lòng thử lại."
            );
          }
          return;
        }

        groupUserInfo = userInfoResult.userInfo;
        console.log('Group registration: Got user info successfully');

      } catch (error) {
        console.error('Group registration: Error getting user info:', error);
        Helper.showAlert('Không thể lấy thông tin người dùng. Vui lòng thử lại.');
        return;
      }

      // ===== FIXED: Prepare request body with proper member ID handling for group registration =====
      const effectiveGroupMemberId = isMember && member?.documentId
        ? member.documentId
        : customInfo.memberId || null;

      console.log('Group registration: Member ID assignment:', {
        isMember,
        memberDocumentId: member?.documentId,
        customInfoMemberId: customInfo?.memberId,
        effectiveGroupMemberId
      });

      // ✅ CHECK FOR EXISTING TICKET - Only for members in group registration
      if (effectiveGroupMemberId && isMember) {
        console.log('Group registration: Checking for existing member ticket...');

        try {
          const ticketTypeName = ticket?.ten_hien_thi_ve || ticket?.ma_loai_ve || 'Unknown';

          const existingTicketCheck = await APIService.checkMemberExistingTicket(
            effectiveGroupMemberId,
            eventId,
            ticketTypeName
          );

          console.log('Group registration: Existing ticket check result:', existingTicketCheck);

          if (existingTicketCheck.error === 0 && existingTicketCheck.hasExistingTicket) {
            // Show dialog notification about existing ticket
            const existingTicket = existingTicketCheck.existingTickets[0];
            const displayTicketTypeName = existingTicket.hien_thi_loai_ve || ticketTypeName;

            Helper.showAlert(
              "Đã có vé đăng ký",
              `Bạn đã đăng ký vé "${displayTicketTypeName}" cho sự kiện này rồi. Mỗi hội viên chỉ được đăng ký một vé cho mỗi loại vé.`
            );
            return;
          }
        } catch (error) {
          console.error('Group registration: Error checking existing ticket:', error);
          // Continue with registration if check fails to avoid blocking legitimate registrations
        }
      }

      // ✅ FIXED: Calculate total tickets and price for group registration
      const groupTicketExportQuantity = ticket?.so_luong_ve_xuat || 1;
      const totalTicketsToRegister = (ticketCountt || 1) * groupTicketExportQuantity;
      const totalPrice = ticket?.gia ? ticket.gia * totalTicketsToRegister : 0;

      console.log('Group ticket registration calculation:', {
        ticketCount: ticketCountt,
        exportQuantity: groupTicketExportQuantity,
        totalTicketsToRegister,
        unitPrice: ticket?.gia,
        totalPrice,
        childTicketsCount: tickets?.length || 0
      });

      const requestBody = {
        memberId: effectiveGroupMemberId, // ✅ FIXED: Always set memberId if user is member
        "Tên người đăng ký": customInfo.fullname, // ten_nguoi_dang_ky: String
        "Tên sự kiện": event?.ten_su_kien || "", // ten_su_kien: String
        "Mã vé": ticket?.ma_loai_ve || `REG_${Date.now()}`, // ma_ve: String
        "Loại vé": ticket?.loai_ve || "Tra_phi", // loai_ve: String
        "Tên hiển thị vé": ticket?.ten_hien_thi_ve || "", // hien_thi_loai_ve: String
        "Ngày sự kiện": event?.thoi_gian_to_chuc, // ngay_su_kien: Date
        "Email": customInfo.email || "", // email: String
        "Số điện thoại": customInfo.phoneNumber || "", // so_dien_thoai: String
        "Zalo ID": groupUserInfo?.id || userInfo?.id, // ✅ REFACTORED: Use userInfo from useAuth()
        "Zalo OA ID": userInfo?.zaloIDByOA, // ma_zalo_oa: String
        "Số lượng vé": String(totalTicketsToRegister), // ✅ FIXED: Total tickets including export quantity
        "Công ty": customInfo.company || "", // Not direct GraphQL field
        "Giá vé": totalPrice, // ✅ FIXED: Total price for all tickets in group
        "Vé miễn phí": ticket?.loai_ve === "Mien_phi", // For processing logic
        "Vé nhóm": isGroupTicket, // For processing - determines ve_chinh: Boolean
        "Ghi chú": customInfo.note || "", // ghi_chu_khach_hang: String
        "Vé con": isGroupTicket && tickets && tickets.length > 0
          ? tickets.map(ticket => ({
              "Tên": ticket.name || ticket["Tên"],
              "Số điện thoại": ticket.phone || ticket["Số điện thoại"],
              "Email": ticket.email || ticket["Email"]
            }))
          : [],
        "Ngân hàng": event?.customFields?.["Ngân hàng"]?.[0].data || "",
        "Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"] || "",
        "Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"] || "",
      };
      setIsProcessing(true);
      let result = await APIService.registerEvent(
        eventId,
        ticketId,
        requestBody,
        groupUserInfo?.zaloIDByOA || userInfo?.zaloIDByOA
      );

      if (result.error == 0) {
        setVietQr({
          url: result.data.vietqr,
          bankInfo: {
            accountNumber: result.data["Tk Ngân Hàng"],
            accountName: result.data["Tên Tk Ngân Hàng"],
            bankName: result.data["Ngân hàng"],
            bankInfo: result.data.bankInfo,
          },
        });
        if (result?.data?.skipPayment) {
          Helper.showAlertInfo(
            "Đăng ký thành công, vé sẽ được gửi đến Quý Anh/Chị sớm nhất"
          );
          if (result.data.id) {
            navigate(`/tickets/detail/${result.data.id}`);
          }
        } else if (
          window.location.origin.startsWith("http://localhost") ||
          result.data.ticketPrice == 0
        ) {
          navigate(`/payment?ticketId=${result.data.id}&eventId=${eventId}`);
        } else if (result.data.checkoutSdk) {
          ZaloService.createOrder(result.data.checkoutSdk.order);
        }
        refreshMyTickets();
      } else {
        Helper.showAlert(`${result.message}`);
      }
    } catch (error) {
      console.error("Error during group ticket registration:", error);
      Helper.showAlert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalTicketsForCombo = () => {
    // Total tickets = purchase count * export quantity per purchase
    const exportQuantity = ticket?.so_luong_ve_xuat || 1;
    return ticketCountt * exportQuantity;
  };

  const handleConfirmClick = () => {
    if (!verifyInfo()) return;
    confirm();
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  // ✅ REMOVED: handleGuestRegistration function - guest registration now goes through normal flow

  const getComboText = () => {
    const exportQuantity = ticket?.so_luong_ve_xuat || 1;
    if (exportQuantity > 1) {
      return `${exportQuantity} vé/lần mua`;
    }
    return null;
  };

  return (
    <Page className="bg-white page safe-page-content">
      {/* Change mb-10 to mb-32 to ensure enough space for bottom fixed content */}
      <div className="mb-32">
        <div className="mt-2">
          <label className="text-base font-bold">Người đăng ký</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* ✅ REFACTORED: Show member option if has member data in AuthContext */}
            {member && isMember && (
              <div
                className={`flex py-2 px-3 border ${
                  selectType == 0 ? "border-blue-500" : ""
                } basis-1/2 rounded-md items-center ${
                  ticket?.ve_nhom === true ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => ticket?.ve_nhom !== true && selectProfile(0)}
              >
                <div className="">
                  <img
                    className="w-10 h-auto rounded-full"
                    src={getMemberAvatarUrl(member, userInfo)}
                  />
                </div>
                <div className="items-center pl-2">
                  <p className="font-bold text-normal line-clamp-1">
                    {getMemberName()}
                  </p>
                  <p className="text-sm text-[#767A7F]">
                    {getMemberPhone()}
                  </p>
                  {/* ===== NEW: Show member type and chapter if available ===== */}
                  {member?.member_type && (
                    <p className="text-xs text-green-600">
                      {member.member_type} - {member.chapter?.ten_chi_hoi || "Chưa có chi hội"}
                    </p>
                  )}
                  {ticket?.ve_nhom === true && (
                    <p className="text-xs text-red-500 mt-1">
                      Vé nhóm - chỉ đăng ký theo nhóm
                    </p>
                  )}
                </div>
              </div>
            )}
            <div
              className={`flex py-2 px-3 border basis-1/2 rounded-md items-center ${
                selectType == 1 ? "border-blue-500" : ""
              } ${
                ticket?.chi_danh_cho_hoi_vien || ticket?.ve_nhom === true
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={() => !ticket?.chi_danh_cho_hoi_vien && ticket?.ve_nhom !== true && selectProfile(1)}
            >
              <div className="">
                <img
                  className="w-10 h-auto"
                  src={getDefaultAvatar()}
                  alt="Guest avatar"
                />
              </div>
              <div className="pl-2">
                <p className="text-normal">Khách vãng lai</p>
                {ticket?.chi_danh_cho_hoi_vien && (
                  <p className="text-xs text-red-500">
                    Không áp dụng cho loại vé này
                  </p>
                )}
                {ticket?.ve_nhom === true && (
                  <p className="text-xs text-red-500">
                    Vé nhóm - chỉ đăng ký theo nhóm
                  </p>
                )}
              </div>
              <div className="pl-2">
                {!ticket?.chi_danh_cho_hoi_vien && <EditIcon />}
              </div>
            </div>
            {/* Group ticket option */}
            <div
              className={`flex py-2 px-3 border basis-1/2 rounded-md items-center ${
                selectType == 2 ? "border-blue-500" : ""
              } ${
                ticket?.chi_danh_cho_hoi_vien || ticket?.ve_nhom === false
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={() => !ticket?.chi_danh_cho_hoi_vien && ticket?.ve_nhom !== false && selectProfile(2)}
            >
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full">
                <IconPlus color="#999999" />
              </div>
              <div className="pl-2">
                <p className="text-normal">Vé nhóm</p>
                {ticket?.chi_danh_cho_hoi_vien && (
                  <p className="text-xs text-red-500">
                    Không áp dụng cho loại vé này
                  </p>
                )}
                {ticket?.ve_nhom === false && (
                  <p className="text-xs text-red-500">
                    Vé cá nhân - không hỗ trợ đăng ký nhóm
                  </p>
                )}
              </div>
              {!ticket?.chi_danh_cho_hoi_vien && ticket?.ve_nhom !== false && (
                <div className="pl-2">
                  <EditIcon />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-base font-bold">Thông tin đăng ký</label>
          {/* Add relative positioning to ensure content stays within view */}
          <div className="relative px-3 py-3 mt-2 border rounded-md">
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Người đăng ký</label>
              <label className="block font-bold text-right basis-2/3">
                {customInfo.fullname || "..."}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Số điện thoại</label>
              <label className="block font-bold text-right basis-2/3">
                {customInfo.phoneNumber || "..."}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Doanh nghiệp</label>
              <label className="block font-bold text-right basis-2/3">
                {customInfo.company || "..."}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Sự kiện</label>
              <label className="block font-bold text-right basis-2/3">
                {event?.ten_su_kien || event?.name}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Thời gian</label>
              <label className="block font-bold text-right basis-2/3">
                {Helper.formatTime(event?.thoi_gian_to_chuc)}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Địa điểm</label>
              <label className="block font-bold text-right basis-2/3">
                {event?.dia_diem}
              </label>
            </div>
            <div className="flex py-3 font-normal gap-x-2">
              <label className="block basis-1/3">Phí tham dự</label>
              <label className="block font-bold text-right basis-2/3">
                {Helper.formatCurrency(ticket?.gia)}
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        {selectType == 2 && (
          <div className="flex items-center justify-between pb-4">
            <div>
              <p className="text-base">Số lượng vé</p>
              {(ticket?.so_luong_ve_xuat || 1) > 1 && (
                <p className="text-xs text-blue-600">
                  {`${ticket?.so_luong_ve_xuat || 1} vé/lần mua (${ticketCountt} lần = ${getTotalTickets()} vé)`}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <button
                className="bg-transparent text-[#0E3D8A] font-bold pr-2 rounded-lg text-normal"
                onClick={() =>
                  handleTicketCountChange(Number(ticketCountt) - 1)
                }
                disabled={!canDecrement()}
              >
                <IconMinus color={canDecrement() ? "#0E3D8A" : "#999999"} />
              </button>
              <input
                type="number"
                className="w-16 px-2 font-bold text-center border-none focus:outline-none"
                value={tempTicketCount}
                onChange={handleTicketCountChange}
                onBlur={handleTicketBlur}
                min="1"
              />
              <button
                className="bg-transparent text-[#0E3D8A] font-bold pl-2 rounded-lg text-normal"
                onClick={() =>
                  handleTicketCountChange(Number(ticketCountt) + 1)
                }
                disabled={!canIncrement()}
              >
                <IconPlus color={canIncrement() ? "#0E3D8A" : "#999999"} />
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-between mb-3">
          <div className="">Tổng tiền</div>
          <div className="text-[#0E3D8A] font-bold">
            {Helper.formatCurrency(
              (ticket?.gia || 0) * ticketCountt
            )}
          </div>
        </div>
        <button
          disabled={!verifyInfo()}
          className="block w-full h-10 py-2 font-bold text-white rounded-lg bg-blue-custom text-normal disabled:bg-blue-200"
          onClick={handleConfirmClick}
        >
          Xác nhận
        </button>
      </div>
      <CustomerInfoSheet
        show={showCustomerForm}
        handleClick={handleFormClick}
        isGroupTicket={selectType === 2}
      />
      <Modal
        visible={modalConfig.visible}
        title=""
        onClose={modalConfig.showGuestOption ? modalConfig.onCancel : closeModal}
        verticalActions
      >
        <Box p={6}>
          <div className="flex justify-center mb-4 text-center">
            <WarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center">
            {modalConfig.title}
          </div>
          <div className="text-center text-[#222] my-4 whitespace-pre-line">
            {modalConfig.message}
          </div>

          {/* ✅ ENHANCED: Show guest option buttons when showGuestOption is true */}
          {modalConfig.showGuestOption ? (
            <div className="flex gap-3">
              <button
                className="bg-gray-400 text-white font-bold py-2 rounded-lg text-normal w-full h-12"
                onClick={modalConfig.onCancel}
              >
                Hủy
              </button>
              <button
                className="bg-blue-custom text-white font-bold py-2 rounded-lg text-normal w-full h-12"
                onClick={modalConfig.onGuestRegister}
              >
                Đăng ký khách mời
              </button>
            </div>
          ) : (
            <button
              className={`${
                modalConfig.type === "success" ? "bg-green-600" : "bg-blue-custom"
              } disabled:bg-blue-50 text-white font-bold py-2 rounded-lg text-normal w-full block h-12`}
              onClick={closeModal}
            >
              Đóng
            </button>
          )}
        </Box>
      </Modal>
    </Page>
  );
};

export default RegisterMemberPage;
