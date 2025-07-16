import React from "react";
import { Page } from "zmp-ui";

const RegisterLoading = () => {
	return (
		<Page className="page bg-white safe-page-content">
			<div className="">
				<div className="mt-4">
					<label className="text-sm font-bold">Tên</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">Số điện thoại</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">Email</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">Doanh nghiệp</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">Chức vụ</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">Chi hội tham gia</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>

				<div className="mt-4">
					<label className="text-sm font-bold">
						Thông tin người giới thiệu
					</label>
					<div className="mt-2">
						<div className="h-12 bg-gray-200 rounded-md"></div>
					</div>
				</div>
			</div>

			<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
				<div className="h-10 bg-blue-200 rounded-lg"></div>
			</div>
		</Page>
	);
};

export default RegisterLoading;
