import React, { useEffect, useState } from "react"
import { Icon, Page, useNavigate } from "zmp-ui"
import Tags from "../components/tags"
import { useRecoilState, useRecoilValue } from "recoil"
import Helper from "../utils/helper"
import {
  listEventState,
  selectedChapterState,
  listChapterState,
  multipleEventTicketsState,
  userByPhoneNumberState,
} from "../state"
import APIServices from "../services/api-service"
const EventPage = () => {
  const navigate = useNavigate()
  const events = useRecoilValue(listEventState)
  const eventIds = events.map((event) => event.documentId)
  const allEventTickets = useRecoilValue(multipleEventTicketsState(eventIds))
  const getLowestPrice = (eventId) => {
    const eventTickets = allEventTickets.filter(
      (ticket) => ticket.eventId === eventId
    )
    if (!eventTickets || eventTickets.length === 0) return 0

    const prices = eventTickets
      .map((ticket) => ticket.gia || 0)
      .filter((price) => price !== null)

    if (prices.length === 0) return null
    return Math.min(...prices)
  }
  const chapters = useRecoilValue(listChapterState)
  const [selectedChapter, setSelectedChapter] =
    useRecoilState(selectedChapterState)

  const changeTags = (index) => {
    setSelectedChapter(index)
  }

  const [isMember, setIsMember] = useState(false)
  const profile = useRecoilValue(userByPhoneNumberState)

  // Don't automatically check membership - always start as guest
  // Only check membership when user takes explicit action (register/verify)
  // useEffect(() => {
  //   const checkMembership = async () => {
  //     const result = await APIServices.checkIsMember()
  //     setIsMember(result)
  //   }
  //   checkMembership()
  // }, [])

  const getEventWithFilter = () => {
    if (!chapters || chapters.length == 0) return events
    console.log('getEventWithFilter', chapters.length);

    let filteredEvents = events.filter((event) => {
      // GraphQL field: chi_danh_cho_hoi_vien
      if (event.chi_danh_cho_hoi_vien && !isMember) {
        return false
      }

      // Private event filtering - will need to be implemented when relationship is available
      // For now, show all events

      if (selectedChapter !== 0) {
        let chapter = chapters[selectedChapter]
        // Chapter filtering will need to be implemented when relationship is available
        // For now, show all events
        return true
      }

      return true
    })

    return filteredEvents
  }

  const getEventStatus = (event) => {
    // GraphQL field: trang_thai (ENUM_EVENTINFORMATION_TRANG_THAI)
    const status = event.trang_thai
    switch (status) {
      case "Huy":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#333333]">
            Sự kiện đã hủy
          </div>
        )
      case "Sap_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#EF8521]">
            Sự kiện sắp diễn ra
          </div>
        )
      case "Dang_dien_ra":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#00B050]">
            Sự kiện đang diễn ra
          </div>
        )
      case "Nhap":
        return (
          <div className="absolute top-4 left-4 z-10 h-8 rounded-3xl bg-white px-3 flex items-center text-sm font-medium text-[#999999]">
            Bản nháp
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Page
      className="page bg-white safe-page-content"
      restoreScrollOnBack={true}
    >
      <Tags
        items={chapters}
        onClick={changeTags}
        active={selectedChapter}
      />
      {getEventWithFilter().map((k, i) => {
        return (
          <div
            className="my relative mb-4 border rounded-lg shadow-sm"
            key={i}
            onClick={() => {
              navigate(`/events/detail/${k.documentId}`)
            }}
          >
            <img
              className="block w-full rounded-t-lg"
              src={
                k.hinh_anh?.url ||
                "https://api.ybahcm.vn/public/yba/yba-01.png"
              }
              onError={(e) => {
                e.target.src = "https://api.ybahcm.vn/public/yba/yba-01.png";
              }}
            />
            {getEventStatus(k)}
            <div className="p-3">
              <p className="font-bold">{k.ten_su_kien}</p>
              <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                <Icon
                  icon="zi-clock-1"
                  size={16}
                />
                <span className="px-2">
                  Ngày diễn ra:{" "}
                  <strong>
                    {Helper.formatDateWithDay(
                      k.thoi_gian_to_chuc
                    )}
                  </strong>
                </span>
              </p>
              <p className="text-[13px] text-[#6F7071] pt-1 items-center flex">
                <Icon
                  icon="zi-location"
                  size={16}
                />
                <span className="px-2">{k.dia_diem}</span>
              </p>
            </div>
            <div className="flex p-3 justify-between border-t">
              <span className="text-sm">Phí tham dự</span>
              <span className="text-normal font-bold">
                {Helper.formatCurrency(getLowestPrice(k.documentId))}
              </span>
            </div>
          </div>
        )
      })}
      {getEventWithFilter().length == 0 && (
        <div className="flex items-center justify-center h-full -translate-y-8">
          <div className="mx-auto text-center ">
            <img
              className="w-24 h-auto block m-auto"
              src="https://api.ybahcm.vn/public/yba/icon-empty.png"
            />
            <p className="text-normal text-[#6F7071] my-2">Chưa có sự kiện</p>
          </div>
        </div>
      )}
    </Page>
  )
}

export default EventPage
