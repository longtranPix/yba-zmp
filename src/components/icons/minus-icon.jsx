const Icon = ({ customClass, color }) => {
  return (
    <svg
      width="12"
      height="4"
      viewBox="0 0 12 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 0.5V3.5H0V0.5H12Z"
        fill={color}
      />
    </svg>
  )
}

export default Icon
