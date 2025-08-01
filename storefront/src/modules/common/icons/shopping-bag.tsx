import { IconProps } from "types/icon"

export default function ShoppingBag({
  size = 12,
  color = "currentColor",
  fill = "currentColor",
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill={fill}
      color={color}
      {...props}
    >
      <g clipPath="url(#clip0_21037_2701)">
        <path
          d="M11.696 8.392L10.972 2.892C10.792 1.529 9.62003 0.501 8.24503 0.501H3.75403C2.37903 0.5 1.20803 1.528 1.02703 2.892L0.303034 8.392C0.199034 9.177 0.440034 9.969 0.962034 10.564C1.48403 11.16 2.23803 11.501 3.03003 11.501H8.96903C9.76103 11.501 10.514 11.16 11.037 10.564C11.559 9.969 11.799 9.176 11.696 8.392ZM6.00003 6.5C4.48303 6.5 3.25003 5.267 3.25003 3.75C3.25003 3.336 3.58603 3 4.00003 3C4.41403 3 4.75003 3.336 4.75003 3.75C4.75003 4.439 5.31103 5 6.00003 5C6.68903 5 7.25003 4.439 7.25003 3.75C7.25003 3.336 7.58603 3 8.00003 3C8.41403 3 8.75003 3.336 8.75003 3.75C8.75003 5.267 7.51703 6.5 6.00003 6.5Z"
          fill={fill}
        />
      </g>
      <defs>
        <clipPath id="clip0_21037_2701">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
