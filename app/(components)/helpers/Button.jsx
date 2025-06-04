export default function Button({
  type = "button",
  bgColor = "bg-gradient-to-br from-red-600 to-black",
  hoverColor = "hover:from-red-600 hover:to-red-800",
  textColor = "text-white",
  className = "",
  fullWidth = false,
  disabled = false,
  children,
  ...props // we'll filter props below
}) {
  const baseStyles = `
    flex items-center justify-center
    font-medium text-center
    rounded-lg transition-all duration-300 cursor-pointer
  `;

  const responsivePadding = `
    px-2 py-2 text-xs
    sm:px-5 sm:py-2.5 sm:text-base
  `;

  const fullWidthClass = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  // Destructure & discard unwanted props before passing to <button>
  const { icon, size, ...filteredProps } = props;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${bgColor} ${hoverColor} ${textColor}
        ${baseStyles} ${responsivePadding}
        ${fullWidthClass} ${disabledStyles} ${className}
      `}
      {...filteredProps}
    >
      {children}
    </button>
  );
}
