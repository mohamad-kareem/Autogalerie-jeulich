import React from "react";
import * as Icons from "react-icons/fi";

const Button = ({
  children,
  onClick,
  type = "button",
  bgColor = "bg-red-600",
  hoverColor = "hover:bg-red-700",
  icon,
  ...props
}) => {
  const Icon = Icons[icon];
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${bgColor} ${hoverColor} text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md`}
      {...props}
    >
      <span>{children}</span>
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
};

export default Button;
