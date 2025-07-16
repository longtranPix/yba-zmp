import React, { useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const submitOrder = () => {
    navigate("/payment");
  };
  return (
    <Page className="page bg-white safe-page-content">
      <img
        className="block w-full rounded-lg"
        src="https://api.ybahcm.vn/public/yba/banner-01.png"
      />
      <div className="py-4">
        <p className="text-sm">Tên sự kiện</p>
        <p className="text-sm font-bold my-2">
          Họp mặt CLB BCH YBA Các Thời Kỳ: Navigating Change for Success
        </p>
        <p className="text-sm">Mô tả</p>
        <p className="text-sm text-gray-700 py-2">
          Trong thời đại số hóa ngày nay, từ cá nhân đến tổ chức, từ người dùng
          thông thường đến các doanh nghiệp lớn, ai cũng đối mặt với nguy cơ mất
          dữ liệu, lừa đảo trực ... Xem thêm
        </p>
        <p className="text-sm">Thời gian</p>
        <p className="text-sm font-bold my-2">10:00 24/05/2024</p>
        <p className="text-sm">Địa điểm</p>
        <p className="text-sm font-bold my-2">
          Nhà văn hoá thanh niên, 4 Phạm Ngọc Thạch, Bến Nghé, Quận 1, TP.HCM
        </p>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="text-base flex justify-between pb-6">
          <span>Tổng tiền</span>
          <span className="font-bold text-blue-800">500.000đ</span>
        </div>
        <button
          className="bg-blue-custom text-white font-bold py-2 rounded-lg text-normal w-full block h-10"
          onClick={submitOrder}
        >
          Thanh toán
        </button>
      </div>
    </Page>
  );
};

export default CheckoutPage;
