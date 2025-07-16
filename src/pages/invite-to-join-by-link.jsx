import React, { use, useEffect, useState } from "react";
import { Page, Box, Modal } from "zmp-ui";
import { QRCode } from "zmp-qrcode";
import { useParams } from "react-router-dom";
import { openShareSheet } from "zmp-sdk/apis";
import { useRecoilValue } from "recoil";
import { userByPhoneNumberState } from "../state";
import RegisterSuccess from "../assets/register-success.png";
import APIService from "../services/api-service";
import Helper from "../utils/helper";

const InviteToJoinByLinkPage = () => {
  const { id, name } = useParams();
  const shareLink = `https://zalo.me/s/2455593897446338281/members/register?branch=${id}&name=${encodeURIComponent(
    name
  )}`;
  const profile = useRecoilValue(userByPhoneNumberState);
  const [copied, setCopied] = useState(false);

  const share = async (link) => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: Helper.truncateText("Hội Doanh Nhân Trẻ TP.HCM (YBA)", 100),
          description: "Tham gia hội doanh nhân trẻ TP.HCM (YBA HCM)",
          thumbnail: "https://api.ybahcm.vn/public/yba/yba-01.png",
          path: `members/register?branch=${id}&name=${encodeURIComponent(
            name
          )}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };
  const copyURL = (link) => {
    const url = link
      ? "https://zalo.me/s/2455593897446338281/" + link
      : window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {},
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
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }
  }, [copied]);

  return (
    <Page
      className="bg-[#0E3D8A] page safe-page-content"
      restoreScrollOnBack={true}
    >
      <div className="my-4 text-base bg-white rounded-[20px] p-4 space-y-2.5">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg aspect-w-2 aspect-h-1">
            <img src="https://api.ybahcm.vn/public/yba/banner.30.07.jpg" />
          </div>
          <div className="space-y-2">
            <p className="text-[#333333] text-[18px] leading-[120%] font-semibold">
              Hội Doanh Nhân Trẻ TP.HCM (YBA)
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[12px] leading-[120%] font-medium text-[#999999]">
                  Mô tả
                </p>
                <p className="text-[14px] leading-[120%] font-medium text-[#333333]">
                  Hội Doanh Nhân Trẻ TP.HCM (YBA) là tổ chức Hội đầu tiên của
                  các Doanh Nhân Trẻ cả nước, là nơi quy tụ của hàng trăm doanh
                  nhân trẻ có chất lượng, năng động, nhiều hoài bão, khát khao
                  vươn ra khu vực và toàn cầu
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[12px] leading-[120%] font-medium text-[#999999]">
                  Đơn vị tổ chức
                </p>
                <p className="text-[14px] leading-[120%] font-medium text-[#333333]">
                  {profile?.customFields?.["Chi hội"]?.[0]?.data || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-dotted border-[#E5E5E5]"></div>
        <div className="flex flex-col items-center">
          <QRCode value={shareLink} className="w-[196px]" />
          <p className="text-center mt-4 text-[12px] leading-[120%] text-[#999999]">
            Quét QR để đăng ký gia nhập hội
          </p>
        </div>
        <div className="w-[calc(100%-32px)] mx-auto rounded-lg bg-[#F3F9FF] py-3 px-4 text-[#0068FF] text-[16px] leading-[120%] font-semibold">
          <p className="line-clamp-1">
            https://zalo.me/s/2455593897446338281/{shareLink}
          </p>
        </div>
        <div className="border-b border-[#E5E5E5]"></div>
        <p
          onClick={() => copyURL(shareLink)}
          className="py-2 px-4 space-x-1 w-max mx-auto rounded-lg bg-[#F4F4F5] text-[#333333] text-[15px] leading-[120%] font-bold flex items-center"
        >
          <p>Sao chép link</p>
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.5 17.8809C8.91421 17.8809 9.25 17.5451 9.25 17.1309C9.25 16.7166 8.91421 16.3809 8.5 16.3809V17.8809ZM16.5 16.3809C16.0858 16.3809 15.75 16.7166 15.75 17.1309C15.75 17.5451 16.0858 17.8809 16.5 17.8809V16.3809ZM16.5 6.38086C16.0858 6.38086 15.75 6.71665 15.75 7.13086C15.75 7.54507 16.0858 7.88086 16.5 7.88086V6.38086ZM8.5 7.88086C8.91421 7.88086 9.25 7.54507 9.25 7.13086C9.25 6.71665 8.91421 6.38086 8.5 6.38086V7.88086ZM8.5 11.3809C8.08579 11.3809 7.75 11.7166 7.75 12.1309C7.75 12.5451 8.08579 12.8809 8.5 12.8809V11.3809ZM16.5 12.8809C16.9142 12.8809 17.25 12.5451 17.25 12.1309C17.25 11.7166 16.9142 11.3809 16.5 11.3809V12.8809ZM8.5 16.3809C6.15279 16.3809 4.25 14.4781 4.25 12.1309H2.75C2.75 15.3065 5.32436 17.8809 8.5 17.8809V16.3809ZM20.75 12.1309C20.75 14.4781 18.8472 16.3809 16.5 16.3809V17.8809C19.6756 17.8809 22.25 15.3065 22.25 12.1309H20.75ZM16.5 7.88086C18.8472 7.88086 20.75 9.78365 20.75 12.1309H22.25C22.25 8.95522 19.6756 6.38086 16.5 6.38086V7.88086ZM8.5 6.38086C5.32436 6.38086 2.75 8.95522 2.75 12.1309H4.25C4.25 9.78365 6.15279 7.88086 8.5 7.88086V6.38086ZM8.5 12.8809H16.5V11.3809H8.5V12.8809Z"
              fill="#2D264B"
            />
          </svg>
        </p>
      </div>
      <button
        onClick={() => share(shareLink)}
        className="flex items-center space-x-2 py-2 bg-[#F4F4F5] rounded-lg w-full justify-center text-[15px] leading-[120%] font-bold mt-7 mb-2"
      >
        <p>Chia sẻ</p>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.2297 1.94543C12.3005 1.97471 12.3668 2.01811 12.4243 2.07564L15.9243 5.57564C16.1586 5.80995 16.1586 6.18985 15.9243 6.42417C15.69 6.65848 15.3101 6.65848 15.0758 6.42417L12.6 3.94843V13.4999C12.6 13.8313 12.3314 14.0999 12 14.0999C11.6687 14.0999 11.4 13.8313 11.4 13.4999V3.94843L8.92429 6.42417C8.68997 6.65848 8.31007 6.65848 8.07576 6.42417C7.84145 6.18985 7.84145 5.80995 8.07576 5.57564L11.5758 2.07564C11.6843 1.96706 11.8343 1.8999 12 1.8999M7.50002 9.5999C6.1314 9.5999 5.10002 10.6313 5.10002 11.9999V17.4999C5.10002 18.8685 6.1314 19.8999 7.50002 19.8999H16.5C17.8687 19.8999 18.9 18.8685 18.9 17.4999V11.9999C18.9 10.6313 17.8687 9.5999 16.5 9.5999H16C15.6687 9.5999 15.4 9.33127 15.4 8.9999C15.4 8.66853 15.6687 8.3999 16 8.3999H16.5C18.5314 8.3999 20.1 9.96853 20.1 11.9999V17.4999C20.1 19.5313 18.5314 21.0999 16.5 21.0999H7.50002C5.46865 21.0999 3.90002 19.5313 3.90002 17.4999V11.9999C3.90002 9.96853 5.46865 8.3999 7.50002 8.3999H8.00002C8.3314 8.3999 8.60002 8.66853 8.60002 8.9999C8.60002 9.33127 8.3314 9.5999 8.00002 9.5999H7.50002Z"
            fill="#141415"
          />
        </svg>
      </button>
      <Modal visible={copied} title="" onClose={() => {}} verticalActions>
        <Box p={6}>
          <div className="text-center flex justify-center mb-4">
            <img src={RegisterSuccess} className="w-6 h-6" />
          </div>
          <div className="text-center font-bold text-lg my-4">
            Sao chép thành công
          </div>
        </Box>
      </Modal>
    </Page>
  );
};

export default InviteToJoinByLinkPage;
