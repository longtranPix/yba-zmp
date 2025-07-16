import React, { useState, useEffect } from "react"

const CountdownTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const padWithZero = (num) => {
    return String(num).padStart(2, "0")
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const end = new Date(endDate)

      const difference = end.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        )
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        )
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <div className="text-sm font-medium">
      <span className="text-red-600">Chỉ còn: </span>
      <span className="text-[#0E3D8A]">
        {padWithZero(timeLeft.days)}
      </span> ngày{" "}
      <span className="text-[#0E3D8A]">{padWithZero(timeLeft.hours)}</span> giờ{" "}
      <span className="text-[#0E3D8A]">{padWithZero(timeLeft.minutes)}</span>{" "}
      phút{" "}
      <span className="text-[#0E3D8A]">{padWithZero(timeLeft.seconds)}</span>{" "}
      giây
    </div>
  )
}

export default CountdownTimer
