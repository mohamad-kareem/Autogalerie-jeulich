export default function Button({
  type = "button",
  bgColor = "bg-gradient-to-br from-red-600 to-black",
  hoverColor = "hover:from-red-600 hover:to-red-800",
  textColor = "text-white",
  className = "",
  fullWidth = false, // ✅ Add this line
  children,
  ...props // ✅ This now won't contain fullWidth
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

  const fullWidthClass = fullWidth ? "w-full" : ""; // ✅ Conditionally apply

  return (
    <button
      type={type}
      className={`
        ${bgColor} ${hoverColor} ${textColor}
        ${baseStyles} ${responsivePadding} ${fullWidthClass} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
