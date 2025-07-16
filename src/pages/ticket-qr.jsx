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
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText(
            `Vé điện tử sự kiện ${
              event?.customFields["Sự kiện"] || event?.name
            }`,
            100
          ),
          description:
            "Truy cập để xem thông tin chi tiết vé điện tử. Hội doanh nhân trẻ TP.HCM (YBA HCM)",
          thumbnail:
            event?.customFields?.["Hình ảnh"]?.[0]?.url ||
            "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `tickets/qrcode/${id}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    var load = async () => {
      setLoading(true);
      let response = await APIService.getEventInfo(
        ticket?.customFields?.["Sự kiện"]?.[0].id
      );
      if (response.data) {
        setEvent(response.data);
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
