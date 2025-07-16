import React, { useState, useEffect } from "react"
import { Sheet } from "zmp-ui"

const GroupTicketsSheet = ({
  show,
  ticketCount,
  onSubmit,
  onClose,
  confirmButtonText = "Xác nhận",
  isComboTicket,
}) => {
  const [tickets, setTickets] = useState([])

  const handleChange = (index, field, value) => {
    const updatedTickets = [...tickets]
    if (!updatedTickets[index]) {
      updatedTickets[index] = {}
    }
    updatedTickets[index][field] = value
    setTickets(updatedTickets)
  }

  const verifyTickets = () => {
    console.log('========verifyTickets========');
    const filledTickets = tickets.filter(
      (ticket) => ticket && ticket["Tên"] && ticket["Số điện thoại"]
    )
    return filledTickets.length === ticketCount
  }

  const handleSubmit = () => {
    if (!verifyTickets()) return
    onSubmit([...tickets])
  }

  const renderTicketForm = (index) => (
    <div
      key={index}
      className="mb-6 p-4 border rounded-lg"
    >
      <h3 className="font-bold mb-4">Thông tin vé {index + 1}</h3>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">
          Tên<span className="text-red-600"> *</span>
        </label>
        <input
          type="text"
          className="border w-full h-12 p-4 rounded-md"
          placeholder="Nhập họ và tên"
          onChange={(e) => handleChange(index, "Tên", e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">
          Số điện thoại<span className="text-red-600"> *</span>
        </label>
        <input
          type="tel"
          className="border w-full h-12 p-4 rounded-md"
          placeholder="Nhập số điện thoại"
          onChange={(e) => handleChange(index, "Số điện thoại", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-2">Email</label>
        <input
          type="email"
          className="border w-full h-12 p-4 rounded-md"
          placeholder="Nhập email"
          onChange={(e) => handleChange(index, "Email", e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <Sheet
      visible={show}
      onClose={onClose}
      autoHeight
      handler={false}
      maskClosable
      swipeToClose={false}
    >
      <div className="p-4">
        <div className="text-lg font-bold my-4">
          {isComboTicket
            ? "Thông tin người nhận vé combo"
            : "Thông tin thành viên nhóm"}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {Array.from({ length: ticketCount }).map((_, index) =>
            renderTicketForm(index)
          )}
        </div>
        <div className="flex justify-between mt-4">
          <button
            className="bg-slate-200 text-black font-bold py-3 rounded-lg text-normal w-1/2 mr-4"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            disabled={!verifyTickets()}
            className="bg-[#0E3D8A] text-white font-bold py-3 rounded-lg text-normal w-1/2 disabled:bg-blue-200"
            onClick={handleSubmit}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

export default GroupTicketsSheet
