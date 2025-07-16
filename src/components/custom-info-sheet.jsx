import React, { useRef, useState } from "react"
import { Sheet } from "zmp-ui"

const CustomerInfoSheet = ({ show, handleClick, isGroupTicket }) => {
  const [data, setData] = useState({})
  const [errors, setErrors] = useState({})

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(84|0)[2|3|5|7|8|9][0-9]{8}$/
    return phoneRegex.test(phone)
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setData({
      ...data,
      [name]: value || "",
    })
    // Clear error when user types
    setErrors({
      ...errors,
      [name]: "",
    })
  }

  const verifyInfo = () => {
    const newErrors = {}

    if (!data.fullname?.trim()) {
      newErrors.fullname = "Vui lòng nhập họ tên"
    }

    if (!data.phoneNumber) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại"
    } else if (!validatePhoneNumber(data.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ"
    }

    if (!data.email) {
      newErrors.email = "Vui lòng nhập email"
    } else if (!validateEmail(data.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (verifyInfo()) {
      handleClick(data)
    }
  }

  return (
    <div className="">
      <Sheet
        visible={show}
        autoHeight
        mask
        handler={false}
        swipeToClose={false}
      >
        <div className="p-4 my-4">
          <div className="text-center font-bold text-lg">
            {isGroupTicket
              ? "Thông tin người đăng ký đại diện"
              : "Nhập thông tin khách vãng lai"}
          </div>
          <div className="m-h-2/3 overflow-y-scroll">
            <div className="mt-4">
              <label className="text-base font-bold">
                Tên
                <span className="text-red-600"> *</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  className={`border w-full h-12 p-4 rounded-md focus:border-blue-700 focus:ring focus:ring-0 focus:outline-none ${
                    errors.fullname ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập họ và tên"
                  value={data?.fullname}
                  onChange={handleChange}
                  name="fullname"
                />
                {errors.fullname && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-base font-bold">
                Số điện thoại
                <span className="text-red-600"> *</span>
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  className={`border w-full h-12 p-4 rounded-md focus:border-blue-700 focus:ring focus:ring-0 focus:outline-none ${
                    errors.phoneNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập số điện thoại"
                  value={data?.phoneNumber}
                  onChange={handleChange}
                  name="phoneNumber"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 hidden">
              <label className="text-base font-bold">Doanh nghiệp</label>
              <div className="mt-2">
                <input
                  type="text"
                  className="border w-full h-12 p-4 rounded-md focus:border-blue-700 focus:ring focus:ring-0 focus:outline-none"
                  placeholder="Nhập tên doanh nghiệp"
                  value={data?.company}
                  onChange={handleChange}
                  name="company"
                />
              </div>
            </div>

            <div className="mt-4 hidden">
              <label className="text-base font-bold">Chức vụ</label>
              <div className="mt-2">
                <input
                  type="text"
                  className="border w-full h-12 p-4 rounded-md focus:border-blue-700 focus:ring focus:ring-0 focus:outline-none"
                  placeholder="Nhập chức vụ"
                  value={data?.position}
                  onChange={handleChange}
                  name="position"
                />
              </div>
            </div>
            <div className="mt-4 pb-20">
              <label className="text-base font-bold">Email</label>
              <div className="mt-2">
                <input
                  type="email"
                  className={`border w-full h-12 p-4 rounded-md focus:border-blue-700 focus:ring focus:ring-0 focus:outline-none ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập email"
                  value={data?.email}
                  onChange={handleChange}
                  name="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between">
          <button
            className="bg-slate-200 text-black font-bold py-3 rounded-lg text-normal w-1/2 mr-4"
            onClick={() => handleClick()}
          >
            Đóng
          </button>
          <button
            className="bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal w-1/2 disabled:bg-blue-200"
            onClick={handleSubmit}
          >
            Xong
          </button>
        </div>
      </Sheet>
    </div>
  )
}

export default CustomerInfoSheet
