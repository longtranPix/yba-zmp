import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate, Modal, Box } from "zmp-ui";
import CustomerInfoSheet from "../components/custom-info-sheet";
import IconMinus from "../components/icons/minus-icon";
import IconPlus from "../components/icons/plus-icon";
import {
  ticketEventInfoState,
  userByPhoneNumberState,
  userZaloProfileState,
} from "../state";
import {
  useRecoilValue,
  useSetRecoilState,
  useRecoilRefresher_UNSTABLE,
  useRecoilState,
} from "recoil";
import EditIcon from "../components/icons/edit-icon";
import { getRouteParams, events, EventName } from "zmp-sdk/apis";
import {
  eventInfoState,
  vietQrState,
  listTicketState,
  configState,
  suggestFollowState,
  listTicketOfEventState,
} from "../state";
import Helper from "../utils/helper";
import APIService from "../services/api-service";
import ZaloService from "../services/zalo-service";
import { getUserInfo, followOA } from "zmp-sdk/apis";
import APIServices from "../services/api-service";
import GroupTicketsSheet from "../components/group-tickets-sheet";
import WarningIcon from "../components/icons/warning-icon";

const RegisterMemberPage = () => {
  const navigate = useNavigate();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const profile = useRecoilValue(userByPhoneNumberState);
  const [selectType, setSelectType] = useState(profile ? 0 : 1);
  const [customInfo, setCustomInfo] = useState({});
  const { eventId, ticketId, ticketCount } = getRouteParams();
  const tickets = useRecoilValue(listTicketOfEventState(eventId));
  const [ticketCountt, setTicketCount] = useState(Number(ticketCount) || 1);
  const [tempTicketCount, setTempTicketCount] = useState("");
  const [childTickets, setChildTickets] = useState([]);
  const [showGroupTicketsSheet, setShowGroupTicketsSheet] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const showModal = (config) => {
    setIsProcessing(true);
    setModalConfig({ ...config, visible: true });
    setTimeout(() => {
      closeModal();
    }, 3000);
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
    if (tickets?.length > 0) {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket?.customFields?.["Vé combo"] === true) {
        setTicketCount(ticket.customFields?.["Số lượng mua"] || 1);
      } else {
        setTicketCount(Number(ticketCount) || 1);
      }
    }
  }, [ticketId, ticketCount, tickets]);

  const getTotalTickets = () => {
    if (ticket?.customFields?.["Vé combo"] === true) {
      const buyCount = ticket.customFields?.["Số lượng mua"] || 1;
      const bonusCount = ticket.customFields?.["Số lượng tặng"] || 0;
      const sets = Math.floor(ticketCountt / buyCount);
      return sets * (buyCount + bonusCount) + (ticketCountt % buyCount);
    }
    return ticketCountt;
  };

  const validateTicketCount = (count) => {
    if (!count) return false;

    const remainingTickets =
      parseInt(ticket?.customFields?.["Số vé còn lại"]) || 0;
    const maxEventTickets =
      parseInt(event?.customFields?.["Số lượng vé tối đa"]) || 0;
    const maxAllowed = Math.min(remainingTickets, maxEventTickets);

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
    const remainingTickets = ticket?.customFields?.["Số vé còn lại"] || 0;
    const maxEventTickets = event?.customFields?.["Số lượng vé tối đa"] || 0;
    const maxAllowed = Math.min(remainingTickets, maxEventTickets);
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

  const [avatar, setAvatar] = useState(
    "https://api.ybahcm.vn/public/yba/default-avatar.png"
  );
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
    if (profile && isMember) {
      setSelectType(0);
      setCustomInfo({
        memberId: profile.id,
        fullname: profile.customFields?.["Họ và tên"] || zaloProfile.name || "",
        phoneNumber: profile.customFields?.["Số điện thoại 1"] || "",
        company: profile?.customFields?.["Công ty"] || "",
        email:
          profile.customFields?.["Email 1"] ||
          profile.customFields?.["Email 2"] ||
          "",
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
  }, [profile, isMember]);

  const confirm = async () => {
    const remainingTickets =
      parseInt(ticket?.customFields?.["Số vé còn lại"]) || 0;
    const maxEventTickets =
      parseInt(event?.customFields?.["Số lượng vé tối đa"]) || 0;

    if (!validateTicketCount(ticketCountt)) {
      Helper.showAlert(
        `Số lượng vé không đủ. Chỉ còn ${Math.min(
          remainingTickets,
          maxEventTickets
        )} vé.`
      );
      return;
    }

    setIsProcessing(true);
    customInfo.guestTicket = selectType == 1;

    const isComboTicket = ticket?.customFields?.["Vé combo"] === true;
    const totalTickets = isComboTicket
      ? getTotalTicketsForCombo()
      : ticketCountt;

    const requestBody = {
      memberId: profile?.id || customInfo?.memberId || null,
      "Tên người đăng ký": customInfo.fullname,
      "Mã vé": ticket?.customFields["Mã loại vé"],
      "Loại vé": ticket?.customFields["Loại vé"],
      "Loại vé ..": [
        {
          id: ticket.id,
        },
      ],
      "Tên hiển thị vé": ticket.customFields["Tên hiển thị vé"],
      "Số vé còn lại": ticket.customFields["Số vé còn lại"],
      Ngày: new Date().toISOString(),
      Email: customInfo.guestTicket
        ? customInfo.email || ""
        : selectType == 2
        ? customInfo.email
        : profile.customFields?.["Email 1"] ||
          profile.customFields?.["Email 2"] ||
          "",
      "Số điện thoại": customInfo.guestTicket
        ? customInfo.phoneNumber
        : selectType == 2
        ? customInfo.phoneNumber
        : profile.customFields?.["Số điện thoại 1"] ||
          profile.customFields?.["Số điện thoại 2"] ||
          "",
      "Zalo ID": zaloProfile.id,
      "Zalo OA ID": zaloProfile?.zaloIDByOA,
      "Số lượng vé": String(totalTickets || 1),
      "Công ty": customInfo.guestTicket
        ? ""
        : profile?.customFields?.["Công ty"] || "",
      "Vãng lai": selectType === 1 || !isMember,
      "Giá vé": ticket?.customFields?.["Giá vé"],
      "Vé combo": isComboTicket,
      "Ngân hàng": event?.customFields?.["Ngân hàng"]?.[0].data || "",
      "Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"] || "",
      "Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"] || "",
    };

    if (isComboTicket || selectType === 2) {
      const childTicketsCount = totalTickets - 1;
      requestBody["Vé nhóm"] = selectType === 2;
      requestBody["Vé con"] = Array(childTicketsCount).fill({
        Tên: customInfo.fullname,
        "Số điện thoại": customInfo.guestTicket
          ? customInfo.phoneNumber
          : selectType == 2
          ? customInfo.phoneNumber
          : profile.customFields?.["Số điện thoại 1"] ||
            profile.customFields?.["Số điện thoại 2"] ||
            "",
        Email: customInfo.guestTicket
          ? customInfo.email || ""
          : selectType == 2
          ? customInfo.email
          : profile.customFields?.["Email 1"] ||
            profile.customFields?.["Email 2"] ||
            "",
      });
    }

    let result = await APIService.registerEvent(
      eventId,
      ticketId,
      requestBody,
      zaloProfile?.zaloIDByOA
    );

    if (result.message == "No id returned from middleware") {
      return showModal({
        type: "error",
        title: result.alert.title || "Có lỗi xảy ra",
        message: result.alert.message || "Vui lòng thử lại sau ít phút",
      });
    }
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
        setTimeout(() => {
          navigate("/");
          if (result.data.id) {
            navigate(`/tickets/detail/${result.data.id}`);
          }
        }, 2000);
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
    if (
      isProcessing ||
      !customInfo ||
      !customInfo.fullname ||
      !customInfo.phoneNumber
    ) {
      return false;
    }
    return true;
  };

  const selectProfile = (type) => {
    if (type === 2 && ticket?.customFields?.["Chỉ hội viên"] === true) {
      Helper.showAlert("Vé này không áp dụng cho vé nhóm");
      return;
    }

    if (type === 1 && ticket?.customFields?.["Chỉ hội viên"] === true) {
      Helper.showAlert("Vé này không áp dụng cho khách vãng lai");
      return;
    }

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
        memberId: profile?.id,
        fullname: profile.customFields?.["Họ và tên"] || zaloProfile.name || "",
        phoneNumber: profile.customFields?.["Số điện thoại 1"] || "",
        company: profile.customFields?.["Công ty"] || "",
        email:
          profile.customFields?.["Email 1"] ||
          profile.customFields?.["Email 2"] ||
          "",
      });
    }
  };

  useEffect(() => {
    setChildTickets([]);
  }, [selectType]);

  useEffect(() => {
    if (selectType !== 2) {
      if (ticket?.customFields?.["Vé combo"] === true) {
        setTicketCount(ticket.customFields?.["Số lượng mua"] || 1);
        setTempTicketCount(String(ticket.customFields?.["Số lượng mua"] || 1));
      } else {
        setTicketCount(1);
        setTempTicketCount("1");
      }
    }
  }, [selectType, ticket]);

  const handleGroupTicketsSubmit = async (tickets) => {
    try {
      const isComboTicket = ticket?.customFields?.["Vé combo"] === true;
      const requestBody = {
        memberId: customInfo.memberId || null,
        "Mã vé": ticket?.customFields["Mã loại vé"],
        "Tên người đăng ký": customInfo.fullname,
        Ngày: new Date().toISOString(),
        Email: customInfo.email || "",
        "Số điện thoại": customInfo.phoneNumber || "",
        "Zalo ID": zaloProfile.id,
        "Zalo OA ID": zaloProfile?.zaloIDByOA,
        "Số lượng vé": String(ticketCountt || 1),
        "Công ty": customInfo.company || "",
        "Vé con": isComboTicket
          ? Array(getTotalTicketsForCombo() - 1).fill({
              Tên: customInfo.fullname,
              "Số điện thoại": customInfo.phoneNumber,
              Email: customInfo.email || "",
            })
          : tickets,
        "Tên hiển thị vé": ticket?.customFields?.["Tên hiển thị vé"],
        "Vé nhóm": !isComboTicket,
        "Vé combo": isComboTicket,
        "Ngân hàng": event?.customFields?.["Ngân hàng"]?.[0].data || "",
        "Tk Ngân Hàng": event?.customFields?.["Tk Ngân Hàng"] || "",
        "Tên Tk Ngân Hàng": event?.customFields?.["Tên Tk Ngân Hàng"] || "",
      };
      setIsProcessing(true);
      let result = await APIService.registerEvent(
        eventId,
        ticketId,
        requestBody,
        zaloProfile?.zaloIDByOA
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
    if (ticket?.customFields?.["Vé combo"] === true) {
      const buyCount = ticket.customFields?.["Số lượng mua"] || 1;
      const bonusCount = ticket.customFields?.["Số lượng tặng"] || 0;
      const sets = Math.floor(ticketCountt / buyCount);
      return sets * (buyCount + bonusCount);
    }
    return ticketCountt;
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

  const getComboText = () => {
    if (ticket?.customFields?.["Vé combo"] === true) {
      const buy = ticket.customFields?.["Số lượng mua"];
      const free = ticket.customFields?.["Số lượng tặng"];
      if (buy && free) {
        return `Mua ${buy} tặng ${free}`;
      }
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
            {profile && isMember && (
              <div
                className={`flex py-2 px-3 border ${
                  selectType == 0 ? "border-blue-500" : ""
                } basis-1/2 rounded-md items-center`}
                onClick={() => selectProfile(0)}
              >
                <div className="">
                  <img
                    className="w-10 h-auto rounded-full"
                    src={
                      zaloProfile && zaloProfile.avatar
                        ? zaloProfile.avatar
                        : "https://api.ybahcm.vn/public/yba/default-avatar.png"
                    }
                  />
                </div>
                <div className="items-center pl-2">
                  <p className="font-bold text-normal line-clamp-1">
                    {(profile && profile.customFields?.["Họ và tên"]) ||
                      (zaloProfile && zaloProfile.name) ||
                      ""}
                  </p>
                  <p className="text-sm text-[#767A7F]">
                    {profile && profile.customFields?.["Số điện thoại 1"]}
                  </p>
                </div>
              </div>
            )}
            <div
              className={`flex py-2 px-3 border basis-1/2 rounded-md items-center ${
                selectType == 1 ? "border-blue-500" : ""
              } ${ticket?.customFields?.["Chỉ hội viên"] ? "opacity-50" : ""}`}
              onClick={() => selectProfile(1)}
            >
              <div className="">
                <img
                  className="w-10 h-auto"
                  src="https://api.ybahcm.vn/public/yba/default-avatar.png"
                />
              </div>
              <div className="pl-2">
                <p className="text-normal">Khách vãng lai</p>
                {ticket?.customFields?.["Chỉ hội viên"] && (
                  <p className="text-xs text-red-500">
                    Không áp dụng cho loại vé này
                  </p>
                )}
              </div>
              <div className="pl-2">
                {!ticket?.customFields?.["Chỉ hội viên"] && <EditIcon />}
              </div>
            </div>
            {/* Group ticket option - hide if it's a combo ticket */}
            {ticket?.customFields?.["Vé combo"] !== true && (
              <div
                className={`flex py-2 px-3 border basis-1/2 rounded-md items-center ${
                  selectType == 2 ? "border-blue-500" : ""
                } ${
                  ticket?.customFields?.["Chỉ hội viên"] ? "opacity-50" : ""
                }`}
                onClick={() => selectProfile(2)}
              >
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full">
                  <IconPlus color="#999999" />
                </div>
                <div className="pl-2">
                  <p className="text-normal">Vé nhóm</p>
                  {ticket?.customFields?.["Chỉ hội viên"] && (
                    <p className="text-xs text-red-500">
                      Không áp dụng cho loại vé này
                    </p>
                  )}
                </div>
                {!ticket?.customFields?.["Chỉ hội viên"] && (
                  <div className="pl-2">
                    <EditIcon />
                  </div>
                )}
              </div>
            )}
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
                {event?.customFields?.["Sự kiện"] || event?.name}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Thời gian</label>
              <label className="block font-bold text-right basis-2/3">
                {Helper.formatTime(event?.customFields?.["Thời gian tổ chức"])}
              </label>
            </div>
            <div className="flex py-3 font-normal border-b gap-x-2">
              <label className="block basis-1/3">Địa điểm</label>
              <label className="block font-bold text-right basis-2/3">
                {event?.customFields?.["Địa điểm"]}
              </label>
            </div>
            <div className="flex py-3 font-normal gap-x-2">
              <label className="block basis-1/3">Phí tham dự</label>
              <label className="block font-bold text-right basis-2/3">
                {Helper.formatCurrency(ticket?.customFields?.["Giá vé"])}
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
              {ticket?.customFields?.["Vé combo"] === true && (
                <p className="text-xs text-blue-600">
                  {`Mua ${ticket.customFields?.["Số lượng mua"]} tặng ${
                    ticket.customFields?.["Số lượng tặng"]
                  } (${ticketCountt} + ${
                    Math.floor(
                      ticketCountt / ticket.customFields?.["Số lượng mua"]
                    ) * ticket.customFields?.["Số lượng tặng"]
                  } tặng)`}
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
              ticket?.customFields?.["Vé combo"] === true
                ? ticket?.customFields?.["Giá vé"]
                : ticket?.customFields?.["Giá vé"] * ticketCountt
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
        onClose={closeModal}
        verticalActions
      >
        <Box p={6}>
          <div className="flex justify-center mb-4 text-center">
            <WarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center">
            {modalConfig.title}
          </div>
          <div className="text-center text-[#222] my-4">
            {modalConfig.message}
          </div>
          <button
            className={`${
              modalConfig.type === "success" ? "bg-green-600" : "bg-blue-custom"
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

export default RegisterMemberPage;
