import React, { useEffect, useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";


const TicketCheckinLoading = () => {
    

    return (
        <Page className="page bg-white safe-page-content">
            <div className="border rounded-2xl py-9 px-4 mt-6">
            <div className="h-40 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="h-4 my-4 w-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="col-span-2 mt-1 flex justify-center">
                    <div className="h-10 rounded-lg w-32 bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="border-t border-dashed my-4 py-4">
                    <div className="flex justify-between">
                        <div className="">
                            <p className="text-sm text-[#5F5A5A]">ID hội viên</p>
                            <div className="h-4 mt-1 w-32 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div className="">
                            <p className="text-sm text-[#5F5A5A]">Tên người đăng ký</p>
                            <div className="h-4 mt-1 w-32 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-6">
                        <div className="">
                            <p className="text-sm text-[#5F5A5A]">Trạng thái thanh toán</p>
                            <div className="h-4 mt-1 w-32 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div className="">
                            <p className="text-sm text-[#5F5A5A] text-right">Loại vé</p>
                            <div className="h-4 mt-1 w-32 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    </div>
                </div>
                <div className="text-center h-10 bg-[#F4F4F4] flex items-center justify-center -mx-4">
                    <p className="font-bold flex items-center">
                        <span className="">xxxxxxxxx</span>
                        <Icon className="px-2 -pt-1" icon="zi-copy" size={16} />
                    </p>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
                <button className="bg-slate-200 text-black font-bold py-3 rounded-lg text-normal w-1/2 mr-4" >Quay lại</button>
                <button className="bg-blue-custom disabled:bg-blue-200 text-white font-bold py-3 rounded-lg text-normal w-1/2">Checkin</button>
            </div>

        </Page>
    );
};

export default TicketCheckinLoading;