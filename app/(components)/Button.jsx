export default function Button({
  type = "button",
  bgColor = "bg-gradient-to-br from-red-600 to-black",

  hoverColor = "hover:from-red-600 hover:to-red-800",
  textColor = "text-white",
  className = "px-4 py-2 rounded-lg transition text-sm sm:text-base flex justify-center items-center",
  children,
  ...props // catch all other props like onClick, disabled, etc.
}) {
  return (
    <button
      type={type}
      className={`${bgColor} ${hoverColor} ${textColor} ${className}`}
      {...props} // spread the rest of the props here
    >
      {children}
    </button>
  );
}
