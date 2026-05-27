export default function Button({
  type = "button",
  bgColor = "bg-[#146c2e]",
  hoverColor = "hover:bg-[#0f5724]",
  textColor = "text-white",
  className = "",
  fullWidth = false,
  disabled = false,
  children,
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    rounded-xl font-semibold tracking-[-0.01em]
    transition-all duration-200
    active:scale-[0.98]
    disabled:cursor-not-allowed
  `;

  const responsivePadding = `
    h-10 px-4 text-[12px]
    sm:h-11 sm:px-5 sm:text-[14px]
  `;

  const fullWidthClass = fullWidth ? "w-full" : "";

  const disabledStyles = disabled
    ? "opacity-50"
    : "shadow-md shadow-green-900/10";

  // remove unwanted props
  const { icon, size, loading, ...filteredProps } = props;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${bgColor}
        ${hoverColor}
        ${textColor}
        ${baseStyles}
        ${responsivePadding}
        ${fullWidthClass}
        ${disabledStyles}
        ${className}
      `}
      {...filteredProps}
    >
      {children}
    </button>
  );
}
