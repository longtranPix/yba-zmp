import React, { useEffect, useState } from "react";
import { Icon, Page } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Tags from "../components/tags";
import Banner from "../components/banner";
import { useRecoilValue } from "recoil";
import Helper from "../utils/helper";
import {
  listEventState,
  listChapterState,
  configState,
  listPostsState,
  multipleEventTicketsState,
  userByPhoneNumberState,
} from "../state";
import HomeLoading from "../components/skeletons/home-loading";
import APIServices from "../services/api-service";
import PoweredByBlock from "../components/powered-by-block";
import ZaloService from "../services/zalo-service";
import { getRouteParams } from "zmp-sdk/apis";

const HomePage = () => {
  const navigate = useNavigate();
  const events = useRecoilValue(listEventState);
  const profile = useRecoilValue(userByPhoneNumberState);

  const eventIds = events.map((event) => event.documentId);
  const allEventTickets = useRecoilValue(multipleEventTicketsState(eventIds));
  const getLowestPrice = (eventId) => {
    const eventTickets = allEventTickets.filter(
      (ticket) => ticket.eventId === eventId
    );
    if (!eventTickets || eventTickets.length === 0) return 0;

    const prices = eventTickets
      .map((ticket) => ticket.gia || 0)
      .filter((price) => price !== null);

    if (prices.length === 0) return null;
    return Math.min(...prices);
  };
  const chapters = useRecoilValue(listChapterState);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const configs = useRecoilValue(configState);
  const [sponsorsA, setSponsorsA] = useState([]);
  const [sponsorsB, setSponsorsB] = useState([]);
  const posts = useRecoilValue(listPostsState);
  const [isMember, setIsMember] = useState(false);

  const [bannerImages, setBannerImages] = useState([]);
  const [introText, setIntroText] = useState("");

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
    const fetchMiniappData = async () => {
      try {
        const res = await APIServices.getMiniapp();
        if (res.data && Array.isArray(res.data)) {
          const bannerItem = res.data.find(
            (item) => item.customFields?.["Hạng mục"] === "Banner Hình Ảnh"
          );
          if (
            bannerItem &&
            bannerItem.customFields?.["Tập tin"] &&
            bannerItem.customFields["Tập tin"].length > 0
          ) {
            const formattedBanners = bannerItem.customFields["Tập tin"].map(
              (file) => ({
                image: file.url,
                url: "#",
                id: file.id,
              })
            );
            setBannerImages(formattedBanners);
          }

          const introItem = res.data.find(
            (item) => item.customFields?.["Hạng mục"] === "Bài viết giới thiệu"
          );
          if (introItem && introItem.customFields?.["Đoạn văn bản"]?.text) {
            const fullText = introItem.customFields["Đoạn văn bản"].text;
            const firstParagraph = fullText.split("\n")[0];
            setIntroText(firstParagraph);
          }
        }
      } catch (error) {
        console.error("Error fetching miniapp data:", error);
      }
    };

    fetchMiniappData();
  }, []);

  useEffect(() => {
    APIServices.getSponsorsA().then((results) => {
      if (results?.data?.sponsors && results?.data?.sponsors?.length > 0) {
        setSponsorsA(results?.data?.sponsors);
      }
    });
    APIServices.getSponsorsB().then((results) => {
      if (results?.data?.sponsors && results?.data?.sponsors?.length > 0) {
        setSponsorsB(results?.data?.sponsors);
      }
    });
  }, []);

  const hasEnoughSponsorsWithLogos = (sponsors, type = "strategic") => {
    if (type === "strategic") {
      const strategicSponsors = sponsors.filter(
        (sponsor) => sponsor.customFields?.["Logo"]?.[0]?.url
      );
      return strategicSponsors.length > 2;
    } else if (type === "sponsor") {
      const regularSponsors = sponsors.filter(
        (sponsor) => sponsor.customFields?.["Logo"]?.[0]?.url
      );

      return regularSponsors.length > 2;
    }
  };

  const getEventWithFilter = () => {
    if (!chapters || chapters.length == 0) return events;

    let filteredEvents = events.filter((event) => {
      // GraphQL field: chi_danh_cho_hoi_vien
      if (event.chi_danh_cho_hoi_vien && !isMember) {
        return false;
      }

      // Private event filtering - will need to be implemented when relationship is available
      // For now, show all events

      if (selectedChapter !== 0) {
        let chapter = chapters[selectedChapter];
        // Chapter filtering will need to be implemented when relationship is available
        // For now, show all events
        return true;
      }

      return true;
    });

    filteredEvents.sort((a, b) => {
      // GraphQL field: thoi_gian_to_chuc
      const dateA = a.thoi_gian_to_chuc
        ? new Date(a.thoi_gian_to_chuc)
        : new Date(0);
      const dateB = b.thoi_gian_to_chuc
        ? new Date(b.thoi_gian_to_chuc)
        : new Date(0);
      return dateA - dateB;
    });

    return filteredEvents.length > 0 ? [filteredEvents[0]] : [];
  };

  if (!chapters || chapters.length == 0) {
    return <HomeLoading />;
  }

  const MarqueeContentHighLight = () => {
    return (
      <ul className="marquee__content">
        {sponsorsA.map(
          (sponsor, index) =>
            sponsor.customFields?.["Logo"]?.[0].url && (
              <div
                key={index}
                className="marquee__item"
                onClick={() => navigate(`/sponsors/detail/${sponsor.id}`)}
              >
                <img src={sponsor.customFields?.["Logo"]?.[0].url} />
              </div>
            )
        )}
      </ul>
    );
  };
  const MarqueeContent = () => {
    return (
      <ul className="marquee__content marquee__content__small">
        {sponsorsB.map(
          (sponsor, index) =>
            sponsor.customFields?.["Logo"]?.[0].url && (
              <div
                key={index}
                className="marquee__item"
                onClick={() => navigate(`/sponsors/detail/${sponsor.id}`)}
              >
                <img src={sponsor.customFields?.["Logo"]?.[0].url} />
              </div>
            )
        )}
      </ul>
    );
  };

  const getEventStatus = (event) => {
    if (!event.status) return null;
    // GraphQL enum values: Nhap, Sap_dien_ra, Dang_dien_ra, Huy
    switch (event.status) {
      case "Huy":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#333333]">
            Sự kiện đã hủy
          </div>
        );
      case "Sap_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#EF8521]">
            Sự kiện sắp diễn ra
          </div>
        );
      case "Dang_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#00B050]">
            Sự kiện đang diễn ra
          </div>
        );
      case "Nhap":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#999999]">
            Bản nháp
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Page
      className="bg-white page safe-page-content"
      restoreScrollOnBack={true}
    >
      <div className="my-4 text-base">
        <p className="mb-4 font-bold">Sự kiện</p>
        {/* <Tags items={chapters} onClick={changeTags} active={selectedChapter} /> */}
        {getEventWithFilter().map((k, i) => {
          return (
            <div
              className="relative mb-4 border rounded-lg shadow-sm"
              key={i}
              onClick={() => {
                navigate(`/events/detail/${k.documentId}`);
              }}
            >
              <img
                className="block w-full rounded-t-lg"
                src={
                  k.hinh_anh?.url ||
                  "https://api.ybahcm.vn/public/yba/yba-01.png"
                }
                onError={(e) => {
                  e.target.src = "https://api.ybahcm.vn/public/yba/yba-01.png";
                }}
              />
              {getEventStatus({ status: k.trang_thai })}
              <div className="p-3">
                <p className="font-bold">{k.ten_su_kien}</p>
                <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                  <Icon icon="zi-clock-1" size={16} />
                  <span className="px-2">
                    Ngày diễn ra:{" "}
                    <strong>
                      {Helper.formatDateWithDay(
                        k.thoi_gian_to_chuc
                      )}
                    </strong>
                  </span>
                </p>
                <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                  <Icon icon="zi-location" size={16} />
                  <span className="px-2">{k.dia_diem}</span>
                </p>
              </div>
              <div className="flex justify-between p-3 border-t">
                <span className="text-sm">Phí tham dự</span>
                <span className="font-bold text-normal">
                  {Helper.formatCurrency(getLowestPrice(k.documentId))}
                </span>
              </div>
            </div>
          );
        })}
        {getEventWithFilter().length == 0 && (
          <div className="mx-auto mt-10 text-center mb-44">
            <img
              className="block w-24 h-auto m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
            />
            <p className="text-normal text-[#6F7071] my-2 px-16">
              Chưa có sự kiện
            </p>
          </div>
        )}
      </div>

      {sponsorsA &&
        sponsorsA.some(
          (sponsor) => sponsor.customFields?.["Logo"]?.[0]?.url
        ) && (
          <>
            <div className="p-4 text-lg font-bold text-center">
              Đồng hành chiến lược
            </div>
            <div
              className={`${
                hasEnoughSponsorsWithLogos(sponsorsA, "strategic")
                  ? "enable-animation"
                  : ""
              }`}
            >
              <div className="marquee">
                <MarqueeContentHighLight />
                <MarqueeContentHighLight aria-hidden="true" />
              </div>
            </div>
          </>
        )}

      <div className="my-4 text-base">
        <div className="flex justify-between">
          <p className="font-bold">Tin tức mới nhất</p>
          <p
            className="text-[#0068FF] font-medium text-sm"
            onClick={() => navigate("/posts")}
          >
            Xem thêm
          </p>
        </div>
        <Swiper
          modules={[Pagination, Navigation]}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop
          slidesPerView={1.2}
          spaceBetween={16}
          speed={1000}
          navigation={true}
          pagination={{ clickable: true, type: "fraction" }}
          className="mt-4"
        >
          {posts &&
            posts.posts &&
            posts.posts.length > 0 &&
            posts.posts.map((post, i) => (
              <SwiperSlide key={i}>
                <div
                  className="mb-4 overflow-hidden border rounded-lg cursor-pointer"
                  onClick={() => navigate(`/posts/detail/${post.id}`)}
                >
                  <img
                    className="block object-cover w-full h-48"
                    src={
                      post.customFields?.["Ảnh minh hoạ"]?.[0]?.url ||
                      "https://api.ybahcm.vn/public/yba/yba-01.png"
                    }
                    alt="Post Thumbnail"
                  />
                  <div className="grid gap-2 mx-4 my-3">
                    <p className="text-sm font-normal text-[#F40000]">
                      Thông tin - Sự kiện
                      {post.customFields?.["Danh mục"]?.[0]?.data && (
                        <> • {post.customFields?.["Danh mục"]?.[0]?.data}</>
                      )}
                    </p>
                    <p className="line-clamp-3 text-base font-semibold text-[#333333]">
                      {post.customFields?.["Tiêu đề"]}
                    </p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: post.customFields?.["Nội dung"]?.html,
                      }}
                      className="line-clamp-3 text-sm text-[#999999] max-h-[60px]"
                    ></p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-[#999999] py-3 px-4 border-t border-[#e5e5e5]">
                    <div className="flex items-center">
                      <Icon icon="zi-clock-1" size={16} className="mr-1" />
                      <span>
                        {Helper.formatDate(post.customFields?.["Tạo lúc"])}
                      </span>
                    </div>
                    <div className="flex items-center uppercase">
                      <Icon icon="zi-user-solid" size={16} className="mr-1" />
                      <span>{post.customFields?.["Tác giả"]}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
        </Swiper>
        {posts && posts.posts && posts.posts.length > 0 ? (
          ""
        ) : (
          <div className="mx-auto my-4 text-center">
            <img
              className="block w-24 h-auto m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
              alt="No Posts"
            />
            <p className="mt-2 text-sm text-gray-500">{"Chưa có tin tức"}</p>
          </div>
        )}
      </div>

      {sponsorsB && (
        <>
          <div className="pb-4 text-lg font-bold text-center">
            Các nhà tài trợ
          </div>
          <div
            className={`pb-6 ${
              hasEnoughSponsorsWithLogos(sponsorsB, "sponsor")
                ? "enable-animation"
                : ""
            }`}
          >
            <div className="marquee">
              <MarqueeContent />
              <MarqueeContent aria-hidden="true" />
            </div>
          </div>
        </>
      )}
      {bannerImages && bannerImages.length > 0 ? (
        <Banner items={bannerImages} />
      ) : (
        configs && configs.banners && <Banner items={configs?.banners} />
      )}
      <div className="my-4 text-base">
        <div className="flex justify-between">
          <p className="font-bold">Giới thiệu về YBA HCM</p>
          <p
            onClick={() => navigate("/about")}
            className="text-[#0070DF] text-sm font-bold"
          >
            Xem thêm
          </p>
        </div>
        <p className="text-[#999999] text-sm line-clamp-3">
          {introText ||
            "Hội Doanh Nhân Trẻ TP.HCM (YBA HCM) là tổ chức Hội đầu tiên của các Doanh Nhân Trẻ cả nước. Tính đến nay YBA HCM đang là nơi quy tụ của hàng nghìn doanh nhân trẻ có chất lượng, năng động, nhiều hoài bão, khát khao vươn ra khu vực và toàn cầu..."}
        </p>
      </div>
      <PoweredByBlock customClass="mt-4" />
    </Page>
  );
};

export default HomePage;
