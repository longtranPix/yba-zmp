import React, { useEffect, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import { sponsorInfoState } from "../state";
import { useRecoilValue } from "recoil";
import { followOA } from "zmp-sdk/apis";
import ZaloService from "../services/zalo-service";
import APIServices from "../services/api-service";

const SponsorDetailPage = () => {
  const [isFollower, setIsFollower] = useState(false);
  const { id } = useParams();
  const [sponsor, setSponsor] = useState(null);

  useEffect(() => {
    const getSponsor = async () => {
      const result = await APIServices.getSponsorInfo(id);
      setSponsor(result.data);
    };
    getSponsor();

    console.log("sponsor", sponsor);
  }, []);

  const handleClickFollow = () => {
    console.log('handleClickFollow', sponsor?.customFields["Link Zalo OA"]);
    if (sponsor?.customFields["Link Zalo OA"]) {
      let zaloOAID = "";
      if(sponsor.customFields["Link Zalo OA"].link){
        // https://zalo.me/4082136522598975631
        zaloOAID = sponsor?.customFields["Link Zalo OA"].link?.split("/")?.reverse()[0];
      }else{
        zaloOAID = sponsor?.customFields["Link Zalo OA"];
      }
      followOA({
        id: zaloOAID,
        success: (res) => {
          setIsFollower(true);
        },
        fail: (err) => {},
      });
    }
  };

  const handleOpenChat = () => {
    if (sponsor?.customFields["Link Zalo OA"]) {
      ZaloService.openOfficialAccount(sponsor?.customFields["Link Zalo OA"]);
    }
  };

  if (!sponsor)
    return (
      <Page className="page bg-white safe-page-content">
        <div className="mx-auto text-center mt-10 mb-44">
          <img
            className="w-24 h-auto block m-auto"
            src="https://api.ybahcm.vn/public/yba/icon-empty.png"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy nhà tài trợ hoặc đã bị xóa
          </p>
        </div>
      </Page>
    );

  return (
    <Page className="page bg-white safe-page-content">
      <img
        className="w-[72px] mx-auto pb-4"
        src={
          sponsor?.customFields?.["Logo"]?.[0]?.url ||
          "https://api.ybahcm.vn/public/yba/yba-01.png"
        }
      />
      <div className="py-2.5 grid gap-2.5">
        <p className="text-lg font-bold pb-2 text-[#333333]">
          Giới thiệu về {sponsor?.name}
        </p>
        <div className="text-normal text-gray-700">
          <div className="ql-snow">
            <div
              className={`ql-editor`}
              dangerouslySetInnerHTML={{
                __html: sponsor?.customFields?.["Bài Viết"]?.html,
              }}
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
          {sponsor?.customFields?.["Số điện thoại"] && (
            <button
              className={` bg-slate-200 text-black font-bold py-3 rounded-lg text-normal ${
                sponsor?.customFields["Link Zalo OA"] ? "w-1/4" : "w-full"
              } mr-6`}
            >
              <a href={`tel:${sponsor?.customFields["Số điện thoại"]}`}>
                Liên hệ
              </a>
            </button>
          )}
          {sponsor?.customFields["Link Zalo OA"] &&
            (isFollower ? (
              <button
                onClick={() => handleOpenChat()}
                className={`${
                  sponsor?.customFields["Số điện thoại"] ? "w-3/4" : "w-full"
                } bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal disabled:bg-blue-200`}
              >
                Nhắn tin
              </button>
            ) : (
              <button
                onClick={() => handleClickFollow()}
                className={`${
                  sponsor?.customFields["Số điện thoại"] ? "w-3/4" : "w-full"
                } bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal w-3/4 disabled:bg-blue-200`}
              >
                Quan tâm OA
              </button>
            ))}
        </div>
      </div>
    </Page>
  );
};

export default SponsorDetailPage;
