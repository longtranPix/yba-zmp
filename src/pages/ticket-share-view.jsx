import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import TicketDetailCard from "../components/ticket-detail-card";
import APIService from "../services/api-service";
import Helper from "../utils/helper";

const TicketShareViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    var load = async () => {
      try {
        let ticketResponse = await APIService.getTicketInfo(id);
        if (ticketResponse.data) {
          setTicket(ticketResponse.data);
          const eventId =
            ticketResponse.data.customFields?.["Sự kiện"]?.[0]?.id;
          if (eventId) {
            let response = await APIService.getEventInfo(eventId);
            if (response.data) {
              setEvent(response.data);
            }
          }
        }
      } catch (error) {
        console.error("Error loading ticket details:", error);
      }
      setLoading(false);
    };

    if (id) {
      load();
    }
  }, [id]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const shareLink = `tickets/detail/${ticket?.id}`;

  const shareTicket = async () => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        url: `/tickets/detail/${ticket.id}`,
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${
              event?.customFields["Sự kiện"] || event?.name
            }`,
            100
          ),
          description: `Truy cập để xem thông tin chi tiết vé điện tử sự kiện ${
            event?.customFields["Sự kiện"] || event?.name
          }. Hội doanh nhân trẻ TP.HCM (YBA HCM)`,
          thumbnail:
            event?.customFields["Hình ảnh"]?.[0].url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: shareLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <Page className="page bg-[#0E3D8A] safe-page-content">
        <div className="h-full p-4 m-3 bg-white rounded-2xl">
          <div className="w-full bg-gray-200 rounded-lg h-1/4 dark:bg-gray-700"></div>
          <div className="w-full h-4 my-4 bg-gray-200 dark:bg-gray-700"></div>
          <div className="mt-4">
            <div className="w-32 h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mt-4">
            <div className="w-32 h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mt-4">
            <div className="w-32 h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mt-4">
            <div className="w-32 h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mt-4">
            <div className="w-32 h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </Page>
    );
  }
  if (!ticket) {
    return (
      <Page className="bg-white page safe-page-content">
        <div className="mx-auto mt-10 text-center  mb-44">
          <img
            className="block w-24 h-auto m-auto"
            src="https://api.ybahcm.vn/public/yba/icon-empty.png"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy thông tin vé, vui lòng liên hệ YBA để được hỗ trợ
          </p>
        </div>
      </Page>
    );
  }
  return (
    <Page className="page bg-[#0E3D8A] safe-page-content">
      <TicketDetailCard
        event={event}
        ticket={ticket}
        goBack={goBack}
        shareTicket={shareTicket}
        isShareView={true}
      />
    </Page>
  );
};

export default TicketShareViewPage;
