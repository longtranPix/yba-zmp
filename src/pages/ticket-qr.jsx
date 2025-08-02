import { useEffect, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
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
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Removed unused shareLink variable

  const shareTicket = async () => {
    try {
      console.log("TicketQRPage: Sharing ticket with detail data:", {
        eventName: ticketDetail?.event?.ten_su_kien,
        ticketEventName: ticketDetail?.eventName,
        hasTicketDetail: !!ticketDetail,
        hasEvent: !!ticketDetail?.event
      });

      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${
              // ✅ NEW: Use ticketDetail from GraphQL response
              ticketDetail?.event?.ten_su_kien ||
              ticketDetail?.eventName ||
              ticketDetail?.ten_su_kien ||
              "Sự kiện YBA"
            }`,
            100
          ),
          description:
            "Truy cập để xem thông tin chi tiết vé điện tử. Hội doanh nhân trẻ TP.HCM (YBA HCM)",
          thumbnail:
            // ✅ NEW: Use event image from ticketDetail
            ticketDetail?.event?.hinh_anh?.[0]?.url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/qrcode/${id}`,
        },
      });
    } catch (error) {
      console.log("TicketQRPage: Error sharing ticket:", error);
    }
  };

  useEffect(() => {
    const loadTicketDetail = async () => {
      setLoading(true);
      console.log("TicketQRPage: Loading ticket detail by documentId:", {
        ticketId: id,
        hasTicket: !!ticket
      });

      // ✅ NEW: Use GraphQL API to get event-registration by documentId
      if (id) {
        console.log("TicketQRPage: Fetching ticket detail for documentId:", id);
        try {
          const response = await APIService.getTicketInfo(id);
          if (response.error === 0 && response.data) {
            console.log("TicketQRPage: Ticket detail loaded:", response.data);
            setTicketDetail(response.data);
          } else {
            console.log("TicketQRPage: No ticket data in response:", response);
          }
        } catch (error) {
          console.error("TicketQRPage: Error fetching ticket detail:", error);
        }
      } else {
        console.log("TicketQRPage: No ticket ID provided");
      }
      setLoading(false);
    };

    // Load ticket detail directly by ID, don't depend on ticket state
    loadTicketDetail();
  }, [id]);

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
        event={ticketDetail?.event}
        ticket={ticketDetail || ticket}
        goBack={goBack}
        shareTicket={shareTicket}
        isShareView={true}
      />
    </Page>
  );
};

export default TicketQRPage;
