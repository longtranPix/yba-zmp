import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import PoweredByBlock from "../components/powered-by-block";
import APIServices from "../services/api-service";
import appLogo from "../assets/logo.jpg";

const AboutPage = () => {
  const [logo, setLogo] = useState(null);
  const [introContent, setIntroContent] = useState(null);
  const [introImage, setIntroImage] = useState(null);

  useEffect(() => {
    APIServices.getMiniapp().then((res) => {
      if (res.data && Array.isArray(res.data)) {
        const logoItem = res.data.find(
          (item) => item.customFields?.["Hạng mục"] === "Logo"
        );
        if (logoItem && logoItem.customFields?.["Tập tin"]?.[0]) {
          setLogo(logoItem.customFields["Tập tin"][0]);
        }

        const introContentItem = res.data.find(
          (item) => item.customFields?.["Hạng mục"] === "Bài viết giới thiệu"
        );
        if (
          introContentItem &&
          introContentItem.customFields?.["Đoạn văn bản"]
        ) {
          setIntroContent(introContentItem.customFields["Đoạn văn bản"]);
        }

        const introImageItem = res.data.find(
          (item) => item.customFields?.["Hạng mục"] === "Hình ảnh giới thiệu"
        );
        if (introImageItem && introImageItem.customFields?.["Tập tin"]?.[0]) {
          setIntroImage(introImageItem.customFields["Tập tin"][0]);
        }
      }
    });
  }, []);

  return (
    <Page className="bg-white safe-page-content">
      <div className="">
        <img
          className="block w-full -mt-2"
          src={
            introImage?.url || "https://api.ybahcm.vn/public/yba/banner-06.png"
          }
          alt="YBA Banner"
        />
      </div>
      <div className="my-2 text-center">
        <img
          className="block w-24 h-24 m-auto"
          src={logo?.url || appLogo}
          alt="YBA Logo"
        />
        <p className="text-lg font-bold">GIỚI THIỆU VỀ YBA</p>
      </div>
      <div className="p-4 text-normal">
        {introContent ? (
          <div className="ql-snow">
            <div
              className="ql-editor"
              dangerouslySetInnerHTML={{ __html: introContent.html }}
            />
          </div>
        ) : (
          <>
            <p className="mb-4">
              Hội Doanh Nhân Trẻ TP.HCM (YBA) là tổ chức Hội đầu tiên của các
              Doanh nhân Trẻ cả nước. Hội được thành lập từ năm 1994 với 30
              thành viên sáng lập. Tính đến nay YBA đang là nơi quy tụ của hàng
              trăm doanh nhân trẻ có chất lượng, năng động, nhiều hoài bão, khát
              khao vươn ra khu vực và toàn cầu.
            </p>
            <h2 className="my-4 text-xl font-semibold">
              Lịch sử hình thành và phát triển
            </h2>
            <ul className="mb-4 list-disc list-inside">
              <li className="my-2">
                Tháng 9/1994: Thành lập Hội Doanh Nghiệp Trẻ TP.HCM với 30 thành
                viên (Quyết định số 01/QĐTLH-94 ngày 16/9/1994 của Ủy ban Hội
                Liên hiệp Thanh niên Việt Nam TP. Hồ Chí Minh)
              </li>
              <li className="my-2">
                Tháng 7/2003: Hội Doanh Nghiệp Trẻ TP.HCM được công nhận là
                thành viên của Hội Liên hiệp Thanh niên Việt Nam TP. Hồ Chí Minh
                và chính thức ra Quyết định của Nhà Nước, của Sở Công nghiệp
                Thành phố; "Hội Doanh Nghiệp Trẻ TP.HCM là tổ chức có tư cách
                pháp nhân, độc lập sử dụng con dấu và tài khoản tại ngân hàng."
                (Quyết định số 2900/QĐ-UB ngày 30/7/2003 của UBND TP.HCM).
              </li>
              <li className="my-2">
                Năm 2007: Đổi tên thành Hội Doanh Nhân Trẻ TP. Hồ Chí Minh
              </li>
            </ul>

            <h2 className="mt-6 mb-4 text-xl font-semibold">
              Tầm nhìn và sứ mệnh
            </h2>
            <p className="mb-4">
              <strong>Tầm nhìn: </strong>Đoàn kết, tập hợp và liên kết sức mạnh
              các doanh nhân trẻ trên địa bàn TP. HCM, đại diện tiếng nói và bảo
              vệ quyền lợi chính đáng của Hội viên.
            </p>

            <p className="mb-4">
              <strong>Sứ mệnh: </strong>Tạo điều kiện giao lưu, giao thương và
              hỗ trợ cho sự phát triển hoạt động sản xuất kinh doanh của các Hội
              viên, cung phần đầu tư và sự thành đạt của Hội viên, vì mục tiêu
              chung của TP. HCM và sự phát triển của doanh nhân trẻ Việt Nam và
              góp phần tích cực vào sự nghiệp xây dựng đất nước.
            </p>

            <h2 className="mt-6 mb-4 text-xl font-semibold">
              Mục tiêu hoạt động
            </h2>
            <ul className="mb-4 list-disc list-inside">
              <li className="my-2">
                Đại diện cho giới Doanh Nhân Trẻ Việt Nam trên địa bàn TP. Hồ
                Chí Minh nhằm bảo vệ quyền lợi chính đáng và hợp pháp của Hội
                viên trước các cơ quan công luận.
              </li>
              <li className="my-2">
                Tạo điều kiện hỗ trợ các doanh nhân trẻ nâng cao ý thức quản lý,
                năng lực nghề nghiệp, tiếp cận công nghệ và kỹ thuật hiện đại,
                khuyến khích động viên tinh thần doanh nhân trẻ và thúc đẩy phát
                triển kinh tế.
              </li>
              <li className="my-2">
                Là diễn đàn trao đổi thông tin, ý kiến của doanh nhân trẻ, giới
                thiệu các doanh nhân trẻ với cơ quan Nhà nước, các tổ chức, các
                doanh nghiệp khác trong và ngoài nước theo đúng Pháp luật.
              </li>
            </ul>

            <h2 className="mt-6 mb-4 text-xl font-semibold">Nhiệm vụ</h2>
            <ul className="mb-4 list-disc list-inside">
              <li className="my-2">
                Hướng dẫn, tư vấn, cung cấp thông tin về thương mại, pháp lý,
                kinh tế, kỹ thuật cho Hội viên, nâng cao kiến thức và năng lực
                kinh doanh của Hội viên.
              </li>
              <li className="my-2">
                Tổ chức các hoạt động giúp Hội viên nâng cao năng lực quản trị
                doanh nghiệp, phát triển sản xuất kinh doanh, phát huy tinh thần
                tương trợ lẫn nhau giữa các Hội viên.
              </li>
              <li className="my-2">
                Phối hợp với Hội Liên Hiệp Thanh Niên TP.HCM đề xuất với các cơ
                quan nhà nước các vấn đề liên quan đến chính sách, khuyến khích
                và hỗ trợ phát triển sản xuất kinh doanh cho giới doanh nhân trẻ
                thành phố.
              </li>
              <li className="my-2">
                Tổ chức, hướng dẫn và tiếp nhận sự tài trợ của Nhà nước, của
                giới doanh nhân, của các tổ chức, cá nhân trong và ngoài nước để
                hỗ trợ giới doanh nhân trẻ thành phố, giúp đỡ các Hội viên mở
                rộng quan hệ hợp tác quốc tế và kinh tế, xã hội trên cơ sở bình
                đẳng, tôn trọng lẫn nhau phù hợp với xu thế hợp tác, tập quán
                quốc tế và tuân thủ pháp luật của Nhà nước Việt Nam.
              </li>
              <li className="my-2">
                Tham gia liên kết thực hiện chương trình hoạt động chung của các
                Hiệp Hội, ngành nghề khác trên địa bàn thành phố và của Hội Liên
                Hiệp Thanh Niên Thành Phố Hồ Chí Minh, phù hợp với đặc điểm của
                giới doanh nhân trẻ.
              </li>
            </ul>
          </>
        )}
      </div>
      <PoweredByBlock />
    </Page>
  );
};

export default AboutPage;
