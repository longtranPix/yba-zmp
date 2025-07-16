import React, { useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";

const RegisterMemberLoading = () => {
    const navigate = useNavigate();

    return (
        <Page className="page bg-white safe-page-content">
            <div className="">
                <div className="mt-2">
                    <label className="text-base font-bold">Người đăng ký</label>
                    <div className="mt-2 flex flex-row gap-x-3">
                        <div className="flex py-2 px-3 border border-blue-500 basis-1/2 rounded-md items-center">
                            <div className="">
                                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            </div>
                            <div className="pl-2 items-center">
                                <div className="h-2.5 w-24 bg-gray-200 rounded-full dark:bg-gray-700 my-2"></div>
                                <div className="h-2.5 w-24 bg-gray-200 rounded-full dark:bg-gray-700 my-2"></div>
                            </div>
                        </div>
                        <div className="flex py-2 px-3 border basis-1/2 rounded-md items-center" onClick={() => setShowCustomerForm(true)}>
                            <div className="">
                                <img className="w-10 h-auto" src="https://api.ybahcm.vn/public/yba/default-avatar.png" />
                            </div>
                            <div className="pl-2">
                                <p className="text-normal">Khách vãng lai</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="text-base font-bold">Thông tin đăng ký</label>
                    <div className="py-3 px-3 border rounded-md mt-2">
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Người đăng ký</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Số điện thoại</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Doanh nghiệp</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Sự kiện</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Thời gian</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3 border-b">
                            <label className="block basis-1/3">Địa điểm</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                        <div className="flex font-normal gap-x-2 py-3">
                            <label className="block basis-1/3">Tổng tiền</label>
                            <label className="block font-bold basis-2/3 text-right">...</label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <button className="bg-blue-custom text-white font-bold py-2 rounded-lg text-normal w-full block h-10" onClick={confirm}>Tiếp tục</button>
            </div>
        </Page>

    );
};

export default RegisterMemberLoading;