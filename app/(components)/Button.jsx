export default function Button({
  type = "button",
  bgColor = "bg-gradient-to-br from-red-600 to-black",
  hoverColor = "hover:from-red-600 hover:to-red-800",
  textColor = "text-white",
  className = "",
  children,
  ...props
}) {
  const baseClasses =
    "cursor-pointer rounded-lg transition-all duration-300 font-medium text-center flex justify-center items-center";
  const responsivePadding = "px-4 py-2 sm:px-5 sm:py-2.5";
  const responsiveText = "text-sm sm:text-base";

  return (
    <button
      type={type}
      className={`${bgColor} ${hoverColor} ${textColor} ${baseClasses} ${responsivePadding} ${responsiveText} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
