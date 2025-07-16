import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate, Box, Modal } from "zmp-ui";
import {
  eventInfoState,
  configState,
  listTicketOfEventState,
  userZaloProfileState,
  listTicketState,
  userByPhoneNumberState,
  eventRefreshTrigger,
  zaloProfileRefreshTrigger,
  phoneNumberRefreshTrigger,
} from "../state";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useParams } from "react-router-dom";
import Helper from "../utils/helper";
import APIService from "../services/api-service";
import ZaloService from "../services/zalo-service";
import { openShareSheet } from "zmp-sdk/apis";
import EventSponsors from "../components/event-sponsor";
import IWarningIcon from "../components/icons/i-warning-icon";
import CountdownTimer from "../components/CountdownTimer";

const EventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This is now documentId from the URL
  const event = useRecoilValue(eventInfoState(id)); // Use Recoil state with documentId
  const tickets = useRecoilValue(listTicketOfEventState(id));
  const listTicket = useRecoilValue(listTicketState);
  const zaloProfile = useRecoilValue(userZaloProfileState);

  // Safely filter tickets with null checks
  const myTickets = (listTicket && Array.isArray(listTicket) && zaloProfile?.id)
    ? listTicket
        .filter((t) => t?.customFields?.["Zalo ID"] === zaloProfile.id)
        .filter((t) => t?.customFields?.["Sự kiện"]?.[0]?.documentId === id)
    : [];

  // Early return if event is not loaded yet
  if (!event) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Đang tải thông tin sự kiện...</Text>
        </div>
      </Page>
    );
  }

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showViewButton, setShowViewMoreButton] = useState(true);
  const [alreadyBuyPopup, setAlreadyBuyPopup] = useState(false);
  const [nonMemberPopup, setNonMemberPopup] = useState(false);
  const [inActiveMember, setInActiveMember] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const configs = useRecoilValue(configState);
  const [ticketCounts, setTicketCounts] = useState({});
  const refreshEvent = useSetRecoilState(eventRefreshTrigger);
  const refreshZaloProfile = useSetRecoilState(zaloProfileRefreshTrigger);
  const refreshPhoneNumber = useSetRecoilState(phoneNumberRefreshTrigger);

  const isComboTicket = (ticket) => {
    return ticket?.ve_nhom === true;
  };

  const getComboText = (ticket) => {
    if (isComboTicket(ticket)) {
      // Note: Combo ticket details need to be added to GraphQL schema
      // For now, return a generic message
      return "Vé nhóm";
    }
    return null;
  };

  const totalSoldTickets =
    listTicket?.reduce(
      (sum, ticket) =>
        sum +
        (ticket.customFields?.["Trạng thái thanh toán"]?.[0] === "Thanh toán" &&
          ticket.customFields?.["Trạng thái"]?.[0] === "Đã Phát Hành" &&
          ticket.customFields?.["Sự kiện"]?.[0]?.documentId === id
          ? 1
          : 0),
      0
    ) || 0;

  const maxEventTickets = event?.so_ve_toi_da || 0;

  const getEventStatusDisplay = (event, tickets) => {
    const currentTime = new Date().getTime();
    // Note: End registration date field needs to be added to GraphQL schema
    const eventEndRegistration = new Date(
      event.thoi_gian_to_chuc // Using event time as fallback
    ).getTime();

    const totalRemainingTickets = tickets.reduce(
      (sum, ticket) => sum + (ticket.so_luong_ve_phat_hanh || 0),
      0
    );
    const hasAvailableTickets = totalRemainingTickets > 0;

    if (totalSoldTickets >= maxEventTickets) {
      return {
        message: "Đã hết vé",
        showTimer: false,
      };
    }

    if (!hasAvailableTickets) {
      return {
        message: "Đã hết vé",
        showTimer: false,
      };
    }

    if (currentTime > eventEndRegistration) {
      return {
        message: "Đã hết thời gian mua vé",
        showTimer: false,
      };
    }

    return {
      message: null,
      showTimer: true,
    };
  };

  const getTicketButtonText = (
    isTicketAvailable,
    currentTime,
    ticketEndTime,
    remainingTickets
  ) => {
    if (remainingTickets === 0) {
      return "Đã hết vé";
    }
    if (currentTime > ticketEndTime) {
      return "Đã hết hạn";
    }
    if (!isTicketAvailable) {
      return "Chưa mở bán";
    }
    return "Đăng ký";
  };

  // Event data is now loaded via Recoil state (eventInfoState) using documentId

  useEffect(() => {
    if (!event) return;
    var load = async () => {
      let res = await APIService.getSponsorsOfEvents(event.documentId);
      if (res.data) {
        let sorted = Helper.sortEventSponsers(res.data.sponsors);
        setSponsors(sorted);
      }
    };
    const content = event?.noi_dung_su_kien || "";
    if (content.length < 300) {
      setShowViewMoreButton(false);
    }
    load();
  }, [event]);

  useEffect(() => {
    const initialCounts = {};
    tickets.forEach((ticket) => {
      if (isComboTicket(ticket)) {
        initialCounts[ticket.documentId] = 1; // Default to 1 for group tickets
      }
    });
    setTicketCounts(initialCounts);
  }, [tickets]);

  useEffect(() => {
    const initPage = async () => {
      // Gọi login khi vào trang chi tiết sự kiện
      await APIService.login();
      refreshEvent((prev) => prev + 1);
      refreshZaloProfile((prev) => prev + 1);
      refreshPhoneNumber((prev) => prev + 1);
    };

    initPage();
  }, []);

  const goBack = () => {
    navigate(-1);
  };

  const isMemberOfEventOrg = (profile, event) => {
    // Member organization checking will need to be implemented when relationships are available
    // For now, return false
    return false;
  };

  const register = (ticket) => {
    console.log("register", ticket);

    if (totalSoldTickets >= maxEventTickets) {
      return;
    }

    if (myTickets && myTickets.length > 0) {
      setAlreadyBuyPopup(true);
      return;
    }

    if (ticket.chi_danh_cho_hoi_vien === true) {
      console.log("register/zaloProfile", zaloProfile);
      if (
        zaloProfile.info?.customFields["Trạng thái hội viên"]?.[0] ==
        "Ngừng hoạt động" ||
        zaloProfile.info?.customFields["Trạng thái"]?.[0] == "Khóa tài khoản"
      ) {
        setInActiveMember(true);
        return;
      }
      if (zaloProfile.isMember == false) {
        setNonMemberPopup(true);
        return;
      }
    }

    navigate(
      `/members/register-member?eventId=${id}&ticketId=${ticket.documentId
      }&ticketCount=${ticketCounts[ticket.documentId] || 1}`
    );
  };

  const viewMore = () => {
    setShowFullDescription(true);
    setShowViewMoreButton(false);
  };

  const openContact = async () => {
    let userInfo = await APIService.getAuthInfo();
    await APIService.sendEventContact(
      userInfo?.zaloIDByOA,
      event.documentId,
      event.ten_su_kien
    );
    let oaId = configs?.oaInfo?.id || 0;
    if (oaId > 0) {
      ZaloService.openOfficialAccount(oaId);
    }
  };

  const handleClickDescription = (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
    }
  };

  const canRegister = () => {
    let currentTime = new Date().getTime();
    let eventTime = new Date(
      event.thoi_gian_to_chuc
    ).getTime();
    return currentTime <= eventTime;
  };

  const share = async () => {
    console.log('pages.event-detail', event);
    try {
      const title = Helper.truncateText(
        event?.ten_su_kien || "",
        100
      );
      const photoUrl = event.hinh_anh?.url || "https://api.ybahcm.vn/public/yba/yba-01.png";
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: title,
          description:
            "Truy cập (link) để cập nhật tất cả thông tin sự kiện của YBA HCM.",
          thumbnail: photoUrl || "https://api.ybahcm.vn/public/yba/yba-01.png",
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleTicketCountChange = (ticketId, value) => {
    const ticket = tickets.find((t) => t.documentId === ticketId);
    const remainingTickets = ticket?.so_luong_ve_phat_hanh || 0;
    const maxEventTickets = event?.so_ve_toi_da || 0;
    const maxAllowed = Math.min(remainingTickets, maxEventTickets);

    let numValue = parseInt(value) || 1;

    if (isComboTicket(ticket)) {
      numValue = 1; // Default for group tickets
    } else {
      numValue = Math.min(Math.max(1, numValue), maxAllowed);
    }

    setTicketCounts({
      ...ticketCounts,
      [ticketId]: numValue,
    });
  };

  if (!event)
    return (
      <Page className="bg-white page safe-page-content">
        <div className="mx-auto mt-10 text-center mb-44">
          <img
            className="block w-24 h-auto m-auto"
            src="https://api.ybahcm.vn/public/yba/icon-empty.png"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy thông tin sự kiện hoặc sự kiện đã kết thúc, vui lòng
            quay lại sau
          </p>
        </div>
      </Page>
    );
  return (
    <Page className="bg-white page safe-page-content">
      <img
        className="block w-full rounded-lg"
        src={
          event.hinh_anh?.url ||
          "https://api.ybahcm.vn/public/yba/yba-01.png"
        }
        onError={(e) => {
          e.target.src = "https://api.ybahcm.vn/public/yba/yba-01.png";
        }}
      />
      <div className="py-4">
        <p className="text-lg font-bold">{event?.ten_su_kien}</p>
        <div className="py-2 text-gray-700 text-normal">
          <div className="ql-snow">
            <div
              className={`ql-editor ${!showFullDescription ? "max-h-32 overflow-hidden" : ""
                }`}
              dangerouslySetInnerHTML={{
                __html:
                  event?.customFields?.["Nội Dung Sự Kiện"]?.html ||
                  event?.customFields?.["Nội Dung Sự Kiện"]?.text,
              }}
              onClick={handleClickDescription}
            />
            {showViewButton && (
              <p
                className="block w-full m-auto text-center text-blue-700"
                onClick={viewMore}
              >
                {" "}
                Xem thêm
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4 px-3 py-3 my-2 text-sm border rounded-lg">
          <div className="text-[#6F7071] col-span-2">Ngày diễn ra</div>
          <div className="col-span-3 ">
            {Helper.formatDateWithDay(
              event.thoi_gian_to_chuc
            )}
          </div>
          <div className="text-[#6F7071] col-span-2">Người phụ trách</div>
          <div className="col-span-3 font-bold">
            {event.nguoi_phu_trach || "Chưa cập nhật"}
          </div>
          <div className="text-[#6F7071] col-span-2">Địa điểm tổ chức</div>
          <div className="col-span-3 ">{event.dia_diem}</div>
          <div className="text-[#6F7071] col-span-2">Chi hội</div>
          <div className="col-span-3 ">
            {event.chi_hoi || "Chưa cập nhật"}
          </div>
          <div className="text-[#6F7071] col-span-2">Trạng thái</div>
          <div className="col-span-3 ">
            {event.trang_thai === "Sap_dien_ra" ? "Sắp diễn ra" :
             event.trang_thai === "Dang_dien_ra" ? "Đang diễn ra" :
             event.trang_thai === "Huy" ? "Đã hủy" :
             event.trang_thai === "Nhap" ? "Bản nháp" : event.trang_thai}
          </div>
        </div>
        {tickets && tickets.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-5 mb-3 text-base font-bold">
              <div>Giá vé</div>
              {(() => {
                const status = getEventStatusDisplay(event, tickets);
                if (status.message) {
                  return (
                    <div className="text-sm font-medium text-[#F50000]">
                      {status.message}
                    </div>
                  );
                }
                if (status.showTimer) {
                  return (
                    <CountdownTimer
                      endDate={event.thoi_gian_to_chuc}
                    />
                  );
                }
                return null;
              })()}
            </div>
            <div className="grid gap-4 px-3 py-3 border rounded-lg my-2 text-sm bg-[#F3F9FF]">
              {tickets.map((ticket, i) => {
                // GraphQL fields: thoi_gian_bat_dau, thoi_gian_ket_thuc
                const ticketStartTime = new Date(
                  ticket.thoi_gian_bat_dau || event.createdAt
                ).getTime();
                const ticketEndTime = new Date(
                  ticket.thoi_gian_ket_thuc || event.thoi_gian_to_chuc
                ).getTime();
                const currentTime = new Date().getTime();
                const eventEndRegistration = new Date(
                  event.thoi_gian_to_chuc
                ).getTime();
                const isTicketAvailable =
                  currentTime >= ticketStartTime &&
                  currentTime <= ticketEndTime &&
                  currentTime <= eventEndRegistration;

                return (
                  <div
                    key={ticket.documentId}
                    className="grid grid-cols-3 gap-4 text-[#333333] text-sm font-bold"
                  >
                    <div className="content-center ">
                      <div>
                        {ticket.ten_hien_thi_ve}
                        {isComboTicket(ticket) && (
                          <div className="mt-1 text-xs text-blue-600">
                            {getComboText(ticket)}
                          </div>
                        )}
                      </div>
                      {ticket.so_luong_ve_phat_hanh === 0 && (
                        <div className="text-sm text-[#F50000] font-normal">
                          Đã hết vé
                        </div>
                      )}
                    </div>
                    <div className="content-center text-left">
                      {!isComboTicket(ticket) &&
                        ticket.ve_nhom === true ? (
                        <input
                          type="number"
                          min="1"
                          max={ticket.so_luong_ve_phat_hanh}
                          value={ticketCounts[ticket.documentId] || ""}
                          onChange={(e) =>
                            handleTicketCountChange(ticket.documentId, e.target.value)
                          }
                          className="w-32 py-1 bg-transparent outline-none"
                          placeholder="Nhập số vé"
                        />
                      ) : (
                        Helper.formatCurrency(ticket.gia)
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      {ticket.loai_ve === "Lien_He" ? (
                        <button
                          onClick={openContact}
                          disabled={
                            !isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0
                          }
                          className={`${!isTicketAvailable ||
                              ticket.so_luong_ve_phat_hanh === 0
                              ? "!bg-gray-400"
                              : "bg-[#0E3D8A]"
                            } text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap`}
                        >
                          Liên hệ
                        </button>
                      ) : (
                        <button
                          onClick={() => register(ticket)}
                          disabled={
                            !isTicketAvailable ||
                            ticket.so_luong_ve_phat_hanh === 0 ||
                            (ticket.ve_nhom &&
                              (!ticketCounts[ticket.documentId] ||
                                ticketCounts[ticket.documentId] <= 0)) ||
                            totalSoldTickets >= maxEventTickets ||
                            (ticket.so_luong_ve_phat_hanh || 0) === 0 ||
                            (ticket.chi_danh_cho_hoi_vien &&
                              zaloProfile.isMember == false)
                          }
                          className={`${!isTicketAvailable ||
                              ticket.so_luong_ve_phat_hanh === 0 ||
                              (ticket.ve_nhom &&
                                (!ticketCounts[ticket.documentId] ||
                                  ticketCounts[ticket.documentId] <= 0)) ||
                              totalSoldTickets >= maxEventTickets ||
                              (ticket.so_luong_ve_phat_hanh || 0) === 0 ||
                              (ticket.chi_danh_cho_hoi_vien &&
                                zaloProfile.isMember == false)
                              ? "!bg-gray-400"
                              : "bg-[#0E3D8A]"
                            } text-white text-xs font-bold px-4 py-2 h-8 rounded-lg whitespace-nowrap`}
                        >
                          {getTicketButtonText(
                            isTicketAvailable,
                            currentTime,
                            ticketEndTime,
                            ticket.so_luong_ve_phat_hanh || 0
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <EventSponsors sponsors={sponsors} />
        <div
          onClick={openContact}
          className="flex items-center justify-between p-3 my-4 border rounded-lg"
        >
          <p>
            <Icon icon="zi-chat" size={24} />
            <span className="px-4">Liên hệ với chúng tôi</span>
          </p>
          <Icon icon="zi-chevron-right" />
        </div>
      </div>
      {myTickets &&
        myTickets.length > 0 &&
        event.trang_thai === "Huy" ? (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <div className="w-full">
            <button
              className="w-full h-10 py-2 font-bold text-black rounded-lg bg-slate-200 text-normal mx"
              onClick={goBack}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-white border-t">
          <div className="w-1/4 mr-2">
            <button
              className="w-full h-10 py-2 font-bold text-black rounded-lg bg-slate-200 text-normal mx"
              onClick={goBack}
            >
              Trở lại
            </button>
          </div>
          <div className="w-3/4 ml-2">
            <button
              className="w-full h-10 py-2 font-bold text-white rounded-lg bg-blue-custom text-normal disabled:bg-slate-300 mx"
              onClick={share}
            >
              Chia sẻ
            </button>
          </div>
        </div>
      )}
      <Modal
        visible={nonMemberPopup}
        title=""
        onClose={() => {
          setNonMemberPopup(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Vé này chỉ áp dụng cho hội viên. Vui lòng chọn loại vé khác hoặc
            liên hệ ban tổ chức.
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={openContact}
          >
            Liên hệ ban tổ chức
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setNonMemberPopup(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
      <Modal
        visible={inActiveMember}
        title=""
        onClose={() => {
          setInActiveMember(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Tài khoản của ban đã ngừng hoạt động
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={openContact}
          >
            Liên hệ ban tổ chức
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setInActiveMember(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
      <Modal
        visible={alreadyBuyPopup}
        title=""
        onClose={() => {
          setAlreadyBuyPopup(false);
        }}
        verticalActions
      >
        <Box>
          <div className="flex justify-center mb-4 text-center">
            <IWarningIcon />
          </div>
          <div className="my-4 text-lg font-bold text-center whitespace-nowrap">
            Đăng ký không thành công
          </div>
          <div className="text-center text-[#222] my-4">
            Mỗi hội viên chỉ được đăng ký một vé. Bạn đã mua vé với tư cách hội
            viên trước đó
          </div>
          <button
            className="block w-full h-12 py-2 font-bold text-white rounded-full bg-blue-custom disabled:bg-blue-50 text-normal"
            onClick={() => setAlreadyBuyPopup(false)}
          >
            Xem vé đã mua
          </button>
          <button
            className="bg-[#F4F4F5] rounded-full mt-2 disabled:bg-blue-50 text-[#0D0D0D] font-bold py-2 text-normal w-full block h-12"
            onClick={() => setAlreadyBuyPopup(false)}
          >
            Đóng
          </button>
        </Box>
      </Modal>
    </Page>
  );
};

export default EventDetailPage;
