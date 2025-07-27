import React, { useState, useEffect } from 'react';
import APIService from '../services/api-service';

// ✅ MEMBER FEE STATUS COMPONENT - Shows member fee status for a specific member
const MemberFeeStatus = ({ memberId, className = "" }) => {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMemberFeeStatus = async () => {
      if (!memberId) {
        setError("Member ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('MemberFeeStatus: Loading fee status for member:', memberId);
        const result = await APIService.getMemberFeeStatus(memberId);
        
        if (result.error === 0) {
          setFeeData(result.data);
          console.log('MemberFeeStatus: Fee data loaded:', result.data);
        } else {
          setError(result.message || 'Failed to load member fee status');
          console.error('MemberFeeStatus: Error loading fee data:', result.message);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading fee status');
        console.error('MemberFeeStatus: Exception loading fee data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMemberFeeStatus();
  }, [memberId]);

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className={`member-fee-status-loading p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className={`member-fee-status-error p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center text-red-600">
          <span className="text-lg mr-2">⚠️</span>
          <div>
            <p className="font-medium">Lỗi tải thông tin hội phí</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NO DATA STATE
  if (!feeData || feeData.fees.length === 0) {
    return (
      <div className={`member-fee-status-empty p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-2xl mb-2 block">📋</span>
          <p className="font-medium">Chưa có thông tin hội phí</p>
          <p className="text-sm">Thành viên này chưa có lịch sử đóng hội phí</p>
        </div>
      </div>
    );
  }

  // ✅ FORMAT CURRENCY
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // ✅ FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  // ✅ GET STATUS COLOR
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'đã đóng':
        return 'text-green-600 bg-green-100';
      case 'unpaid':
      case 'chưa đóng':
        return 'text-red-600 bg-red-100';
      case 'partial':
      case 'đóng một phần':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // ✅ GET STATUS TEXT
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Đã đóng';
      case 'unpaid':
        return 'Chưa đóng';
      case 'partial':
        return 'Đóng một phần';
      default:
        return status || 'Không rõ';
    }
  };

  return (
    <div className={`member-fee-status bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header with Summary */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          💰 Thông tin hội phí
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Tổng số lần đóng:</p>
            <p className="font-semibold text-blue-800">{feeData.summary.totalFees} lần</p>
          </div>
          <div>
            <p className="text-gray-600">Tổng số tiền:</p>
            <p className="font-semibold text-blue-800">{formatCurrency(feeData.summary.totalAmountPaid)}</p>
          </div>
          <div>
            <p className="text-gray-600">Các năm đã đóng:</p>
            <p className="font-semibold text-blue-800">
              {feeData.summary.paidYears.length > 0 ? feeData.summary.paidYears.join(', ') : 'Chưa có'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Lần đóng gần nhất:</p>
            <p className="font-semibold text-blue-800">
              {feeData.summary.latestPayment ? formatDate(feeData.summary.latestPayment.paymentDate) : 'Chưa có'}
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        {feeData.summary.hasUnpaidFees && (
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
            ⚠️ Có hội phí chưa được thanh toán đầy đủ
          </div>
        )}
      </div>

      {/* Fee Details */}
      <div className="p-4">
        <h4 className="font-medium text-gray-800 mb-3">Chi tiết hội phí:</h4>
        <div className="space-y-3">
          {feeData.fees.map((fee) => (
            <div key={fee.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800">
                    Hội phí năm {fee.year}
                  </p>
                  {fee.receiptCode && (
                    <p className="text-sm text-gray-600">
                      Mã biên lai: {fee.receiptCode}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.paymentStatus)}`}>
                  {getStatusText(fee.paymentStatus)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Số tiền:</p>
                  <p className="font-semibold">{formatCurrency(fee.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ngày đóng:</p>
                  <p className="font-semibold">{formatDate(fee.paymentDate)}</p>
                </div>
              </div>
              
              {fee.notes && (
                <div className="mt-2">
                  <p className="text-gray-600 text-sm">Ghi chú:</p>
                  <p className="text-sm">{fee.notes}</p>
                </div>
              )}
              
              {fee.chapter && (
                <div className="mt-2">
                  <p className="text-gray-600 text-sm">Chi hội:</p>
                  <p className="text-sm font-medium">{fee.chapter.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberFeeStatus;
