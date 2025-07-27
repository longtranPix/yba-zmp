import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import { ticketInfoState } from "../state";
import { useRecoilValue } from "recoil";
import TicketDetailCard from "../components/ticket-detail-card";
import APIService from "../services/api-service";
import { openShareSheet } from "zmp-sdk/apis";
import Helper from "../utils/helper";

const TicketQRPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const ticket = useRecoilValue(ticketInfoState(id));
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.log("TicketQRPage: Sharing ticket with event data:", {
        eventName: event?.ten_su_kien || event?.name,
        ticketEventName: ticket?.eventName || ticket?.ten_su_kien,
        hasEvent: !!event,
        hasTicket: !!ticket
      });

      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${
              // ✅ FIXED: Use correct data structure from GraphQL response
              event?.ten_su_kien ||
              event?.name ||
              ticket?.eventName ||
              ticket?.ten_su_kien ||
              "Sự kiện YBA"
            }`,
            100
          ),
          description:
            "Truy cập để xem thông tin chi tiết vé điện tử. Hội doanh nhân trẻ TP.HCM (YBA HCM)",
          thumbnail:
            // ✅ FIXED: Use correct image structure from GraphQL response
            event?.hinh_anh?.[0]?.url ||
            event?.customFields?.["Hình ảnh"]?.[0]?.url ||
            ticket?.su_kien?.hinh_anh?.[0]?.url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/qrcode/${id}`,
        },
      });
    } catch (error) {
      console.log("TicketQRPage: Error sharing ticket:", error);
    }
  };

  useEffect(() => {
    var load = async () => {
      setLoading(true);
      console.log("TicketQRPage: Loading event info for ticket:", {
        ticketId: ticket?.id,
        eventId: ticket?.eventId,
        suKienId: ticket?.su_kien?.documentId,
        hasTicket: !!ticket
      });

      // ✅ FIXED: Use correct data structure from GraphQL response
      // Try multiple possible event ID sources for compatibility
      const eventId = ticket?.eventId || ticket?.su_kien?.documentId;

      if (eventId) {
        console.log("TicketQRPage: Fetching event info for ID:", eventId);
        let response = await APIService.getEventInfo(eventId);
        if (response.data) {
          console.log("TicketQRPage: Event info loaded:", response.data);
          setEvent(response.data);
        } else {
          console.log("TicketQRPage: No event data in response:", response);
        }
      } else {
        console.log("TicketQRPage: No event ID found in ticket data:", ticket);
      }
      setLoading(false);
    };
    if (ticket) {
      load();
    }
  }, [ticket]);

  if (loading) {
    return (
      <Page className="page bg-[#0E3D8A] safe-page-content">
        <div className="m-3 p-4 bg-white rounded-2xl h-full">
          <div className="h-1/4 w-full rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 my-4 w-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="mt-4">
            <div className="h-4 mt-1 w-32 bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 mt-1 w-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
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

export default TicketQRPage;
