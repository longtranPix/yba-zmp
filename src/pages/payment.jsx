import React, { useState, useEffect } from "react"
import { Page, Icon, useNavigate } from "zmp-ui"
import { vietQrState, configState } from "../state"
import { useRecoilState, useRecoilValue } from "recoil"
import ZaloService from "../services/zalo-service"
import Helper from "../utils/helper"
import copy from "copy-to-clipboard"

const PaymentPage = () => {
  const navigate = useNavigate()
  const vietqr = useRecoilValue(vietQrState)
  const configs = useRecoilValue(configState)
  const bankInfo = vietqr?.bankInfo || configs?.bankInfo || {}
  const bankInfoDetails =
    bankInfo.bankInfo && Object.keys(bankInfo.bankInfo).length > 0
      ? bankInfo
      : configs?.bankInfo
  console.log("bankInfo", bankInfo, "bankInfoDetails", bankInfoDetails)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingQR, setIsSavingQR] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 750)
  }, [])
  const saveQR = () => {
    if (isSavingQR) {
      return
    }
    if (vietqr) {
      setIsSavingQR(true)
      ZaloService.saveImageToGallery(vietqr)
        .then(() => {
          Helper.showAlertInfo("Lưu mã thanh toán thành công.")
        })
        .catch(() => {
          Helper.showAlert(
            "Lưu mã thanh toán không thành công. Vui lòng cấp quyền truy cập bộ nhớ cho Zalo và thử lại."
          )
        })
      setTimeout(() => {
        setIsSavingQR(false)
      }, 3000)
    }
  }

  const handleCopy = (content) => {
    copy(content, { debug: true })
    Helper.showAlertInfo(`Copy to clipboard: ${content}`)
  }

  const getPaymentContent = () => {
    if (!vietqr?.url) return ""
    try {
      let obj = new URL(vietqr.url)
      let params = new URLSearchParams(obj.search)
      return params.get("addInfo") || params.get("memo") || ""
    } catch (error) {
      console.log(error)
      return ""
    }
  }
  return (
    <Page className="page bg-white safe-page-content">
      {isLoading && (
        <div className="block m-auto h-2/3 w-4/5 bg-gray-200 rounded-2xl dark:bg-gray-700 mb-2.5"></div>
      )}
      <img
        className={`block m-auto h-2/3 ${isLoading ? "hidden" : ""}`}
        src={vietqr?.url}
      />
      <div className="text-center text-sm">
        <button
          onClick={saveQR}
          className="p-2 px-4 mt-3 bg-[#DBEBFF] rounded-lg text-blue-700 font-bold"
        >
          Tải xuống mã QR
        </button>
        <p className="text-sm text-gray-500 w-4/5 m-auto my-2">
          Tải xuống mã VietQR để thanh toán, hoặc sao chép đúng các thông tin
          bên dưới để BTC xác nhận thông tin giao dịch hợp lệ.
        </p>
      </div>
      <div className="px-3 border rounded-md">
        <div className="flex justify-between items-center py-3 border-b">
          <div className="">
            <p className="text-sm">Số tài khoản</p>
            <p className="text-base font-bold">
              {bankInfoDetails.accountNumber}
            </p>
          </div>
          <Icon
            className="text-blue-600"
            icon="zi-copy"
            onClick={() => handleCopy(bankInfoDetails.accountNumber)}
          />
        </div>
        <div className="flex justify-between items-center py-3 border-b">
          <div className="">
            <p className="text-sm">Chủ tài khoản</p>
            <p className="text-base font-bold">{bankInfoDetails.accountName}</p>
          </div>
          <Icon
            className="text-blue-600"
            icon="zi-copy"
            onClick={() => handleCopy(bankInfo.accountName)}
          />
        </div>
        <div className="flex justify-between items-center py-3">
          <div className="">
            <p className="text-sm">Ngân hàng</p>
            <p className="text-base font-bold">{bankInfoDetails.bankName}</p>
          </div>
          <Icon
            className="text-blue-600"
            icon="zi-copy"
            onClick={() => handleCopy(bankInfoDetails.bankName)}
          />
        </div>
        <div className="flex justify-between items-center py-3">
          <div className="">
            <p className="text-sm">Nội dung thanh toán</p>
            <p className="text-base font-bold">{getPaymentContent()}</p>
          </div>
          <Icon
            className="text-blue-600"
            icon="zi-copy"
            onClick={() => handleCopy(getPaymentContent())}
          />
        </div>
      </div>
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t"
        onClick={() => navigate("/")}
      >
        <button className="bg-gray-200  font-bold py-2 rounded-lg text-lg w-full block">
          Đóng
        </button>
      </div>
    </Page>
  )
}

export default PaymentPage
