import React from "react";
import { Page, Icon } from "zmp-ui";

const UserLoading = () => {
	return (
		<Page className="safe-page-content">
			<div className="gap-2.5 grid">
				<div className="flex items-center px-4 py-2 mx-4 mt-3 bg-white rounded-lg shadow-sm">
					<div className="w-14 h-14 bg-gray-300 rounded-full"></div>
					<div className="pl-4">
						<div className="h-4 w-24 bg-gray-200 rounded-full mb-2 mr-2"></div>
						<div className="h-3 w-24 bg-gray-200 rounded-full"></div>
					</div>
					<div className="flex items-center ml-auto space-x-2">
						<div className="h-8 w-28 bg-gray-200 rounded-lg"></div>
						<Icon icon="zi-chevron-right" size={16} />
					</div>
				</div>

				<div className="px-3 mx-4 bg-white rounded-lg shadow-sm">
					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
						<Icon icon="zi-chevron-right" size={16} />
					</div>
					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
						<Icon icon="zi-chevron-right" size={16} />
					</div>
					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
						<Icon icon="zi-chevron-right" size={16} />
					</div>
					<div className="flex items-center justify-between py-3">
						<div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
						<Icon icon="zi-chevron-right" size={16} />
					</div>
				</div>

				<div className="mx-4 bg-[#0E3D8A] rounded-lg px-3 py-4">
					<div className="flex items-center">
						<div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
						<div className="flex-1 px-3">
							<div className="h-4 w-3/4 bg-gray-300 rounded-full mb-2"></div>
							<div className="h-3 w-1/2 bg-gray-300 rounded-full"></div>
						</div>
					</div>
				</div>
			</div>

			<div className="fixed bottom-24 left-0 right-0">
				<div className="h-4 w-32 bg-gray-200 rounded-full mx-auto"></div>
			</div>
		</Page>
	);
};

export default UserLoading;
