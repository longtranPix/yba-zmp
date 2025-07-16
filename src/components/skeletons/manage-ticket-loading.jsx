import React from "react";
import BannerSkeleton from "./banner-skeleton";
import { Page, Icon } from "zmp-ui";

const ManageTicketLoading = ({ }) => {
    return (
        <Page className="page bg-white safe-page-content">
            <div className="">
                <div className="mt-2 my-4">
                    <div className="flex flex-row gap-2">
                        <div className="mh-6 w-32 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                    </div>
                    {
                [1, 2, 3, 4].map((v, i) => {
                    return (
                        <div onClick={() => handleClick(i)} className="my-4 border px-4 py-3 rounded-lg flex items-center shadow-sm divide-x divide-slate-500 divide-dashed" key={i}>
                            <div className="w-3/4">
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

                </div>
            </div>
        </Page>
    );
};

export default ManageTicketLoading;
