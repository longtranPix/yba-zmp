import React, { useState, useEffect } from "react";
import { Icon, Page, useNavigate } from "zmp-ui";
import {
  listTicketState,
  userZaloProfileState,
  ticketEventState,
  refreshTrigger,
} from "../state";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Helper from "../utils/helper";
import Tags from "../components/tags";
import { getRouteParams, openShareSheet } from "zmp-sdk/apis";
import IconShare from "../components/icons/share-icon";

const TicketPage = () => {
  const navigate = useNavigate();
  const setRefreshTrigger = useSetRecoilState(refreshTrigger);

  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const { tabId = 0 } = getRouteParams();
  const [selectTab, setSelectTab] = useState(tabId);
  const listTicket = useRecoilValue(listTicketState);
  const zaloProfile = useRecoilValue(userZaloProfileState);
  const tickets =
    listTicket?.filter(
      (t) => t?.customFields?.["Zalo ID"] == zaloProfile?.id
    ) || [];

  const [filter, setFilters] = useState([
    {
      name: "Tất cả",
    },
    {
      name: "Sắp tham gia",
    },
    {
      name: "Đã tham gia",
    },
  ]);

  const handleClick = (t) => {
    if (
      t.customFields?.["Check in"] !== true &&
      t.customFields?.["Trạng thái thanh toán"]?.[0] == "Thanh toán"
    ) {
      checkin(t.id);
      return;
    }
    navigate(`/tickets/detail/${t.id}`);
  };

  const changeTags = (index) => {
    setSelectTab(index);
  };

  const checkin = (id) => {
    navigate(`/tickets/qrcode/${id}`);
  };

  const shareTicket = async (eventName, eventPhoto, id) => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(`Vé điện tử sự kiện ${eventName}`, 100),
          description: `Truy cập để xem thông tin chi tiết vé điện tử sự kiện ${eventName}. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            eventPhoto || "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/detail/${id}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getTickets = () => {
    if (!tickets) return [];

    let filteredTickets = [];
    if (selectTab == 0) {
      filteredTickets = tickets;
    } else if (selectTab == 1) {
      let currentTime = new Date().getTime();
      filteredTickets = tickets.filter((v) => {
        const eventId = v?.customFields?.["Sự kiện"]?.[0]?.id;
        const event = eventMap[eventId];
        const eventDate = event?.customFields?.["Thời gian tổ chức"]
          ? new Date(event.customFields["Thời gian tổ chức"]).getTime()
          : null;
        const isCheckin = v.customFields?.["Check in"] === true;
        return eventDate && eventDate >= currentTime && !isCheckin;
      });
    } else if (selectTab == 2) {
      filteredTickets = tickets.filter(
        (v) => v.customFields?.["Check in"] === true
      );
    }

    // Sort tickets by createdAt timestamp (newest first)
    return filteredTickets.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Reverse order to show newest first
    });
  };

  const eventIds = [
    ...new Set(
      tickets
        ?.map((ticket) => ticket?.customFields?.["Sự kiện"]?.[0]?.id)
        .filter(Boolean)
    ),
  ];
  const events = eventIds.map((id) => useRecoilValue(ticketEventState(id)));
  const eventMap = Object.fromEntries(
    eventIds.map((id, index) => [id, events[index]])
  );

  return (
    <Page className="page bg-white safe-page-content">
      {tickets && tickets.length > 0 && (
        <Tags items={filter} onClick={changeTags} active={selectTab} />
      )}
      {getTickets().length == 0 && (
        <div className="flex items-center justify-center h-full -translate-y-8">
          <div className="mx-auto text-center">
            <img
              className="w-24 h-auto block m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
            />
            <p className="text-normal text-[#6F7071] my-2 px-16">
              Hiện tại bạn chưa có vé tham dự sự kiện nào
            </p>
          </div>
        </div>
      )}
      {getTickets() &&
        getTickets().map((ticket, i) => {
          const eventId = ticket?.customFields?.["Sự kiện"]?.[0]?.id;
          const event = eventMap[eventId];

          return (
            <div
              onClick={() => handleClick(ticket)}
              className="my-4 border px-4 py-3 rounded-lg flex items-center shadow-sm "
              key={i}
            >
              <img
                className="block w-20 h-20 mr-3 object-cover rounded-lg"
                src={
                  event?.customFields?.["Hình ảnh"]?.[0]?.url ||
                  "https://api.ybahcm.vn/public/yba/yba-01.png"
                }
              />
              <div className="pl-3 ">
                <p className="font-bold line-clamp-2 text-sm">
                  {event?.customFields?.["Sự kiện"] ||
                    event?.name ||
                    "Chưa có tên sự kiện"}
                </p>
                <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                  <Icon icon="zi-clock-1" size={16} />
                  <span className="px-2">
                    {ticket?.customFields?.["Ngày tổ chức"]?.[0]
                      ? Helper.formatTime(
                          new Date(
                            ticket.customFields["Ngày tổ chức"][0]
                          ).getTime()
                        )
                      : "Chưa có ngày"}
                  </span>
                </p>
                <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                  <Icon icon="zi-calendar" size={16} />
                  <span className="px-2">
                    Mã vé: {ticket?.customFields?.["Mã vé"] || "N/A"}
                  </span>
                </p>
                <p className="text-xs text-[##6F7071] pt-1 items-center flex">
                  <Icon icon="zi-user" size={16} />
                  <span className="px-2 line-clamp-1">
                    {ticket?.customFields?.["Tên người đăng ký"] ||
                      "Chưa có tên"}
                  </span>
                </p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={(e) =>
                    shareTicket(
                      event?.customFields["Sự kiện"] || event?.name,
                      event?.customFields?.["Hình ảnh"]?.[0]?.url,
                      ticket.id
                    )
                  }
                  className="flex flex-col items-center text-[#999999] text-xs text-center rounded-lg whitespace-nowrap"
                >
                  <IconShare />
                  <span className="mt-1">Chia sẻ</span>
                </button>
              </div>
            </div>
          );
        })}
    </Page>
  );
};

export default TicketPage;
