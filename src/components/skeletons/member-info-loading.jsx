import React, { useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";

const MemberInfoLoading = () => {
    const navigate = useNavigate();
    return (
        <Page className="page safe-page-content bg-white">
            <div className="">
                <div className="mt-2">
                    <label className="text-base font-bold">Ảnh đại diện</label>
                    <div className="mt-2">
                        <div className="w-20 h-20 bg-gray-300 rounded-full">
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Nhân xưng
                        </label>
                        <div className="mt-2 grid grid-cols-4">
                            {
                                ['Anh', 'Chị'].map((v, i) => {
                                    return (
                                        <div className="flex items-center mb-2" key={i}>
                                            <input id={`gender_${i}`} type="radio" name="gender" value={v} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <label htmlFor={`gender_${i}`} className="ml-2 block ">{v}</label>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Tên
                            <span className="text-red-600"> *</span>
                        </label>
                        <div className="mt-2">
                            <div className="h-12 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Số điện thoại
                            <span className="text-red-600"> *</span>
                        </label>
                        <div className="mt-2">
                            <div className="h-12 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Doanh nghiệp
                        </label>
                        <div className="mt-2">
                            <div className="h-12 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Chức vụ
                        </label>
                        <div className="mt-2">
                            <div className="h-12 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-base font-bold">
                            Email
                        </label>
                        <div className="mt-2">
                            <div className="h-12 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
                        </div>
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                    <button className="bg-slate-200 font-bold py-2 rounded-lg text-normal w-full block h-10">Cập nhật</button>
                </div>
            </div>
        </Page>
    );
};

export default MemberInfoLoading;