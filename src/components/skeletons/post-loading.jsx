import React from "react";
import { Page } from "zmp-ui";

const PostLoading = () => {
	return (
		<Page className="bg-white page safe-page-content">
			<div className="text-base">
				<div className="relative w-full pb-2">
					<div className="flex items-center bg-gray-100 rounded-full py-1.5 px-2 h-8">
						<div className="w-5 h-5 bg-gray-300 rounded-full" />
						<div className="w-full h-4 bg-gray-300 rounded-full ml-1.5" />
					</div>
				</div>

				<div className="overflow-x-auto no-scrollbar py-3 pl-4">
					<div className="flex min-w-max space-x-2">
						{[1, 2, 3, 4, 5].map((index) => (
							<div
								key={index}
								className="h-9 w-28 bg-gray-200 rounded-full animate-pulse"
							/>
						))}
					</div>
				</div>

				{[1, 2, 3].map((index) => (
					<div
						key={index}
						className="mb-4 border rounded-lg overflow-hidden animate-pulse"
					>
						<div className="w-full h-48 bg-gray-300" />
						<div className="my-3 mx-4 grid gap-2">
							<div className="h-6 bg-gray-200 w-36 rounded" />
							<div className="h-5 bg-gray-300 w-full rounded" />
							<div className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-full" />
								<div className="h-4 bg-gray-200 rounded w-5/6" />
								<div className="h-4 bg-gray-200 rounded w-4/6" />
							</div>
						</div>
						<div className="flex justify-between items-center py-3 px-4 border-t border-[#e5e5e5]">
							<div className="flex items-center space-x-1">
								<div className="w-4 h-4 bg-gray-200 rounded-full" />
								<div className="h-4 bg-gray-200 w-20 rounded" />
							</div>
							<div className="flex items-center space-x-1">
								<div className="w-4 h-4 bg-gray-200 rounded-full" />
								<div className="h-4 bg-gray-200 w-24 rounded" />
							</div>
						</div>
					</div>
				))}
			</div>
		</Page>
	);
};

export default PostLoading;
