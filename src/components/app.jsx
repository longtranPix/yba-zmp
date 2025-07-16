import React, { Suspense, lazy, useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import {
  App,
  ZMPRouter,
  AnimationRoutes,
  SnackbarProvider,
  Box,
  Button,
} from "zmp-ui";
import { RecoilRoot } from "recoil";
import AppHeader from "./header";
import NavigationBar from "./navigation-bar";
import ErrorBoundary from "./error-boundary";
import TicketPage from "../pages/ticket";
import EventPage from "../pages/event";
import UserPage from "../pages/user";
import ManageTicketPage from "../pages/manage-ticket";
import EventDetailPage from "../pages/event-detail";
import AboutPage from "../pages/about";
import CheckoutPage from "../pages/checkout";
import PaymentPage from "../pages/payment";
import TicketDetailPage from "../pages/ticket-detail";
import TicketQRPage from "../pages/ticket-qr";
import RegisterMemberPage from "../pages/register-member";
import MemberInfoPage from "../pages/member-info";
import HomeLoading from "../components/skeletons/home-loading";
import UserLoading from "./skeletons/user-loading";
import RegisterMemberLoading from "./skeletons/register-member-loading";
import TicketPageLoading from "./skeletons/ticket-loading";
import EventPageLoading from "./skeletons/event-loading";
import ManageTicketLoading from "./skeletons/manage-ticket-loading";
import MemberInfoLoading from "./skeletons/member-info-loading";
import TicketCheckinPage from "../pages/ticket-checkin";
import { Toaster } from "react-hot-toast";
import TicketShareViewPage from "../pages/ticket-share-view";
import PostDetailPage from "../pages/post-detail";
import RegisterPage from "../pages/register";
import InviteToJoinByLinkLoadingPage from "../pages/invite-to-join-by-link";
import InviteToJoinByLinkLoading from "./skeletons/register-member-loading";
import PostPage from "../pages/post";
import PostLoading from "./skeletons/post-loading";
import SponsorDetailPage from "../pages/sponsor-detail";
import QRScanPage from "../pages/qrscan";
import MemberVerifyPage from "../pages/member-verify";
import RegisterLoading from "./skeletons/register-loading";
import TicketDetailLoading from "./skeletons/ticket-detail-loading";
import MemberVerifyLoading from "./skeletons/member-verify-loading";
import MembershipPage from "../pages/membership";
import MembershipDetailPage from "../pages/membership-detail";
import logo from "../assets/logo.png";
import { getSetting, authorize } from "zmp-sdk/apis";
import APIService from "../services/api-service";

const HomePage = lazy(() => import("../pages/index"));

const MyApp = () => {
  const [canGetInfo, setCanGetInfo] = useState(true);

  const checkExistingPermissions = async () => {
    console.log('========checkExistingPermissions========');
    try {
      const settingResponse = await getSetting();
      if (
        settingResponse?.authSetting?.["scope.userInfo"] &&
        settingResponse?.authSetting?.["scope.userPhonenumber"]
      ) {
        setCanGetInfo(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking existing permissions:", error);
      return false;
    }
  };

  const requestPermissions = async () => {
    console.log('========requestPermissions========');
    try {
      const authResult = await authorize({
        scopes: ["scope.userInfo", "scope.userPhonenumber"],
      });
      const hasPermissions =
        authResult?.["scope.userInfo"] && authResult?.["scope.userPhonenumber"];
      setCanGetInfo(hasPermissions);
      return hasPermissions;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await checkExistingPermissions();
      // Gọi login ngay khi ứng dụng khởi động
      await APIService.login();
    };

    initApp();
  }, []);

  const handleAllowAccess = () => {
    requestPermissions();
  };

  return (
    <RecoilRoot>
      <App>
        <Suspense>
          <SnackbarProvider>
            <ZMPRouter>
              {canGetInfo ? (
                <div>
                  <AppHeader />
                  <ErrorBoundary>
                    <AnimationRoutes>
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<HomeLoading />}>
                          <HomePage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/events/detail/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <EventDetailPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/users/memberships"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <MembershipPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/users/memberships/detail/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <MembershipDetailPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/users/*"
                      element={
                        <Suspense fallback={<UserLoading />}>
                          <UserPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/members/verify"
                      element={
                        <Suspense fallback={<MemberVerifyLoading />}>
                          <MemberVerifyPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/members/info"
                      element={
                        <Suspense fallback={<MemberInfoLoading />}>
                          <MemberInfoPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/members/register-member"
                      element={
                        <Suspense fallback={<RegisterMemberLoading />}>
                          <RegisterMemberPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/members/register"
                      element={
                        <Suspense fallback={<RegisterLoading />}>
                          <RegisterPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/invite-to-join-by-link/:id/:name"
                      element={
                        <Suspense fallback={<InviteToJoinByLinkLoading />}>
                          <InviteToJoinByLinkLoadingPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/tickets"
                      element={
                        <Suspense fallback={<TicketPageLoading />}>
                          <TicketPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/checkout"
                      element={
                        <Suspense fallback={<RegisterMemberLoading />}>
                          <CheckoutPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/tickets/detail/:id"
                      element={
                        <Suspense fallback={<TicketDetailLoading />}>
                          <TicketDetailPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/tickets/qrcode/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <TicketQRPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/events"
                      element={
                        <Suspense fallback={<EventPageLoading />}>
                          <EventPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/posts"
                      element={
                        <Suspense fallback={<PostLoading />}>
                          <PostPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/posts/detail/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <PostDetailPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/sponsors/detail/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <SponsorDetailPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/tickets-management"
                      element={
                        <Suspense fallback={<ManageTicketLoading />}>
                          <ManageTicketPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/admin/qrscan"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <QRScanPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/admin/checkin/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <TicketCheckinPage />
                        </Suspense>
                      }
                    ></Route>
                    <Route
                      path="/about"
                      element={<AboutPage></AboutPage>}
                    ></Route>
                    <Route
                      path="/payment"
                      element={<PaymentPage></PaymentPage>}
                    ></Route>
                    <Route
                      path="/tickets/views/:id"
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <TicketShareViewPage />
                        </Suspense>
                      }
                    ></Route>
                  </AnimationRoutes>
                  </ErrorBoundary>
                  <NavigationBar />
                  <Toaster
                    containerStyle={{
                      position: "absolute",
                      top: "60%",
                      left: "50%",
                      width: "80vw",
                      transform: "translate(-50%, -50%)",
                    }}
                    toastOptions={{
                      style: {
                        width: "500px !important",
                        textAlign: "left",
                        margin: "0 auto",
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center z-[100] px-4 bg-[#0E3D8A]">
                  <div className="bg-white  text-[#333333] rounded-[20px] p-4 flex flex-col space-y-4 w-full">
                    <div className="mx-auto">
                      <img src={logo} alt="logo" />
                    </div>
                    <h2 className="font-bold text-center text-[20px] leading-[24px]">
                      YBA HCM muốn truy cập thông tin của bạn
                    </h2>
                    <p className="font-normal text-[14px] leading-[17px] pb-4">
                      Tên, hình ảnh hồ sơ Zalo để xác định và truy cập các tính
                      năng của Zalo (bắt buộc)
                      <br /> <br /> Số điện thoại để xác thực hội viên 
                    </p>
                    <button
                      onClick={handleAllowAccess}
                      className="w-full bg-[#0E3D8A] text-white text-[15px] rounded-lg leading-[18px] py-[11px] font-medium"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}
            </ZMPRouter>
          </SnackbarProvider>
        </Suspense>
      </App>
    </RecoilRoot>
  );
};
export default MyApp;
