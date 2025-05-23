export default function Button({
  type = "button",
  bgColor = "bg-gradient-to-br from-red-600 to-black",
  hoverColor = "hover:from-red-600 hover:to-red-800",
  textColor = "text-white",
  className = "",
  children,
  ...props
}) {
  const baseStyles = `
    flex items-center justify-center
    font-medium text-center
    rounded-lg transition-all duration-300 cursor-pointer
  `;

  const responsivePadding = `
    px-2 py-1 text-xs
    sm:px-5 sm:py-2.5 sm:text-base
  `;

  return (
    <button
      type={type}
      className={`
        ${bgColor} ${hoverColor} ${textColor}
        ${baseStyles} ${responsivePadding} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
