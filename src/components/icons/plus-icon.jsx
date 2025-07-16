const Icon = ({ customClass, color }) => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4.53962V7.2H0V4.53962H12ZM7.52705 0V12H4.48497V0H7.52705Z"
        fill={color}
      />
    </svg>
  )
}

export default Icon
