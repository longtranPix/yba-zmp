import React, { useEffect, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
import { useParams } from "react-router-dom";
import { followOA } from "zmp-sdk/apis";
import ZaloService from "../services/zalo-service";
import APIServices from "../services/api-service";
import {
  getSponsorLogoUrl,
  getImageProps,
  getEmptyStateIcon,
  getSponsorStatusDisplay,
  getSponsorApprovalStatusDisplay,
  getSponsorTierDisplay,
  getSponsorTypeDisplay,
  getSponsorFormDisplay,
  getSponsorPaymentStatusDisplay
} from "../utils/imageHelper";
import Helper from "../utils/helper";

const SponsorDetailPage = () => {
  const [isFollower, setIsFollower] = useState(false);
  const { id } = useParams();
  const [sponsor, setSponsor] = useState(null);

  useEffect(() => {
    const getSponsor = async () => {
      const result = await APIServices.getSponsorInfo(id);
      setSponsor(result.data);
    };
    getSponsor();

    console.log("sponsor", sponsor);
  }, []);

  const handleClickFollow = () => {
    console.log('handleClickFollow', sponsor?.lien_ket);
    if (sponsor?.lien_ket) {
      let zaloOAID = "";
      // ===== FIXED: Use schema-compliant lien_ket field only =====
      const linkData = sponsor.lien_ket;

      if (typeof linkData === 'string') {
        // Handle Zalo OA link format: https://zalo.me/4082136522598975631
        if (linkData.includes('zalo.me/')) {
          zaloOAID = linkData.split("/")?.reverse()[0];
        } else {
          // Direct OA ID
          zaloOAID = linkData;
        }
      }

      if (zaloOAID) {
        followOA({
          id: zaloOAID,
          success: () => {
            console.log('Follow OA success');
            setIsFollower(true);
          },
          fail: (error) => {
            console.log("Follow OA failed", error);
          },
        });
      } else {
        console.warn('Invalid Zalo OA link format:', linkData);
      }
    }
  };

  const handleOpenChat = () => {
    // Handle both old customFields format and new GraphQL format
    const linkData = sponsor?.customFields?.["Link Zalo OA"] || sponsor?.lien_ket;
    if (linkData) {
      ZaloService.openOfficialAccount(linkData);
    }
  };

  // ===== NEW: Helper functions to safely display sponsor information =====
  const getSafeDisplayValue = (value, fallback = "Chưa cập nhật") => {
    return value && value.trim() !== "" ? value : fallback;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Chưa xác định";
    return Helper.formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa xác định";
    return Helper.formatDateWithDay(dateString);
  };

  if (!sponsor)
    return (
      <Page className="page bg-white safe-page-content">
        <div className="mx-auto text-center mt-10 mb-44">
          <img
            className="w-24 h-auto block m-auto"
            src={getEmptyStateIcon()}
            alt="No sponsor found"
          />
          <p className="text-normal text-[#6F7071] my-2 px-16">
            Không tìm thấy nhà tài trợ hoặc đã bị xóa
          </p>
        </div>
      </Page>
    );

  return (
    <Page className="page bg-white safe-page-content">
      {/* ===== SPONSOR LOGO ===== */}
      <img
        className="w-[72px] mx-auto pb-4"
        {...getImageProps(sponsor?.logo?.url)}
        alt={getSafeDisplayValue(sponsor?.ten_cong_ty, "Sponsor logo")}
      />

      <div className="py-2.5 grid gap-2.5">
        {/* ===== COMPANY NAME ===== */}
        <p className="text-lg font-bold pb-2 text-[#333333]">
          {getSafeDisplayValue(sponsor?.ten_cong_ty, "Tên công ty chưa cập nhật")}
        </p>

        {/* ===== SPONSOR DETAILS ===== */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-md mb-3 text-[#333333]">Thông tin tài trợ</h3>

          {/* Sponsor Tier */}
          {sponsor?.hang && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Hạng tài trợ:</span>
              <span className="font-medium">{getSponsorTierDisplay(sponsor.hang)}</span>
            </div>
          )}

          {/* Sponsor Type */}
          {sponsor?.loai_tai_tro && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Loại tài trợ:</span>
              <span className="font-medium">{getSponsorTypeDisplay(sponsor.loai_tai_tro)}</span>
            </div>
          )}

          {/* Sponsor Form */}
          {sponsor?.hinh_thuc_tai_tro && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Hình thức:</span>
              <span className="font-medium">{getSponsorFormDisplay(sponsor.hinh_thuc_tai_tro)}</span>
            </div>
          )}

          {/* Sponsor Amount */}
          {sponsor?.so_tien_tai_tro && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Số tiền tài trợ:</span>
              <span className="font-medium text-green-600">{formatCurrency(sponsor.so_tien_tai_tro)}</span>
            </div>
          )}

          {/* Sponsor Date */}
          {sponsor?.ngay_tai_tro && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Ngày tài trợ:</span>
              <span className="font-medium">{formatDate(sponsor.ngay_tai_tro)}</span>
            </div>
          )}

          {/* Payment Status */}
          {sponsor?.trang_thai_thanh_toan && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Trạng thái thanh toán:</span>
              <span className={`font-medium ${
                sponsor.trang_thai_thanh_toan === 'Da_Nhan' ? 'text-green-600' :
                sponsor.trang_thai_thanh_toan === 'Huy' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {getSponsorPaymentStatusDisplay(sponsor.trang_thai_thanh_toan)}
              </span>
            </div>
          )}

          {/* Approval Status */}
          {sponsor?.trang_thai_phe_duyet && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Trạng thái duyệt:</span>
              <span className={`font-medium ${
                sponsor.trang_thai_phe_duyet === 'Duyet' ? 'text-green-600' :
                sponsor.trang_thai_phe_duyet === 'Khong_Duyet' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {getSponsorApprovalStatusDisplay(sponsor.trang_thai_phe_duyet)}
              </span>
            </div>
          )}
        </div>

        {/* ===== RELATED EVENT ===== */}
        {(sponsor?.su_kien || sponsor?.su_kien_tham_chieu) && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-md mb-3 text-[#333333]">Sự kiện liên quan</h3>
            {sponsor?.su_kien && (
              <div>
                <p className="font-medium text-blue-800">{sponsor.su_kien.ten_su_kien}</p>
                {sponsor.su_kien.thoi_gian_to_chuc && (
                  <p className="text-sm text-gray-600">
                    Thời gian: {formatDate(sponsor.su_kien.thoi_gian_to_chuc)}
                  </p>
                )}
                {sponsor.su_kien.dia_diem && (
                  <p className="text-sm text-gray-600">Địa điểm: {sponsor.su_kien.dia_diem}</p>
                )}
              </div>
            )}
            {sponsor?.su_kien_tham_chieu && !sponsor?.su_kien && (
              <div>
                <p className="font-medium text-blue-800">{sponsor.su_kien_tham_chieu.ten_su_kien}</p>
                {sponsor.su_kien_tham_chieu.thoi_gian_to_chuc && (
                  <p className="text-sm text-gray-600">
                    Thời gian: {formatDate(sponsor.su_kien_tham_chieu.thoi_gian_to_chuc)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== MEMBER INFO ===== */}
        {sponsor?.hoi_vien && (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-md mb-3 text-[#333333]">Thông tin hội viên</h3>
            <p className="font-medium text-green-800">{sponsor.hoi_vien.full_name}</p>
            {sponsor.hoi_vien.company && (
              <p className="text-sm text-gray-600">Công ty: {sponsor.hoi_vien.company}</p>
            )}
            {sponsor.hoi_vien.phone_number_1 && (
              <p className="text-sm text-gray-600">SĐT: {sponsor.hoi_vien.phone_number_1}</p>
            )}
            {sponsor.hoi_vien.email_1 && (
              <p className="text-sm text-gray-600">Email: {sponsor.hoi_vien.email_1}</p>
            )}
          </div>
        )}

        {/* ===== SPONSOR DESCRIPTION ===== */}
        {sponsor?.bai_viet && (
          <div className="text-normal text-gray-700">
            <h3 className="font-semibold text-md mb-3 text-[#333333]">Giới thiệu</h3>
            <div className="ql-snow">
              <div
                className={`ql-editor`}
                dangerouslySetInnerHTML={{
                  __html: getSafeDisplayValue(sponsor.bai_viet, "<p>Chưa có thông tin giới thiệu</p>"),
                }}
              />
            </div>
          </div>
        )}
        {/* ===== CONTACT BUTTONS ===== */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
          {/* Contact Phone Button */}
          {sponsor?.nguoi_phu_trach && (
            <button
              className={`bg-slate-200 text-black font-bold py-3 rounded-lg text-normal ${
                sponsor?.lien_ket ? "w-1/2 mr-2" : "w-full"
              }`}
            >
              <a href={`tel:${sponsor.nguoi_phu_trach}`}>
                Liên hệ: {sponsor.nguoi_phu_trach}
              </a>
            </button>
          )}

          {/* Zalo OA Button */}
          {sponsor?.lien_ket && (
            isFollower ? (
              <button
                onClick={() => handleOpenChat()}
                className={`${
                  sponsor?.nguoi_phu_trach ? "w-1/2 ml-2" : "w-full"
                } bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal disabled:bg-blue-200`}
              >
                Nhắn tin
              </button>
            ) : (
              <button
                onClick={() => handleClickFollow()}
                className={`${
                  sponsor?.nguoi_phu_trach ? "w-1/2 ml-2" : "w-full"
                } bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal disabled:bg-blue-200`}
              >
                Quan tâm OA
              </button>
            )
          )}

          {/* No Contact Info Available */}
          {!sponsor?.nguoi_phu_trach && !sponsor?.lien_ket && (
            <div className="w-full text-center py-3 text-gray-500">
              Chưa có thông tin liên hệ
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export default SponsorDetailPage;
