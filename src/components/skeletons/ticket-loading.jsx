import React, { useState } from "react";
import { Page, Icon, useNavigate } from "zmp-ui";

const TicketPageLoading = () => {
    const navigate = useNavigate();

    return (
        <Page className="page bg-white safe-page-content">

            {
                [1, 2, 3, 4].map((v, i) => {
                    return (
                        <div onClick={() => handleClick(i)} className="my-4 border px-4 py-3 rounded-lg flex items-center shadow-sm divide-x divide-slate-500 divide-dashed" key={i}>
                            <div className="w-20 h-20 mr-3 aspect-w-1 aspect-h-1 bg-gray-300 rounded-lg"></div>
                            {/* <img className="block w-20 h-20 mr-3 object-cover rounded-lg" src="https://api.ybahcm.vn/public/yba/banner-01.png" /> */}
                            <div className="pl-3 flex-grow">
                                <div className="font-bold line-clamp-2 text-sm">
                                    <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                </div>
                                <div className="text-xs text-[##6F7071] pt-1 items-center flex">
                                    <Icon icon="zi-clock-1" size={16} /> 
                                    <div className="h-2 ml-2 w-32 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                </div>
                                <div className="text-xs text-[##6F7071] pt-1 items-center flex">
                                    <Icon icon="zi-location" size={16} />
                                    <div className="h-2 ml-2 w-32 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                </div>
                            </div>
                        </div>
                    )
                })
            }
        </Page>
    );
};

export default TicketPageLoading;