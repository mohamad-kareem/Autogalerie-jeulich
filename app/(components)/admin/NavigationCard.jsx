// app/(Pages)/AdminDashboard/components/NavigationCard.jsx
import React from "react";
import Link from "next/link";

const NavigationCard = ({
  href,
  icon,
  title,
  description,
  bgColor,
  iconBgColor = "bg-white/20",
}) => (
  <Link href={href} passHref>
    <div
      className={`${bgColor} p-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer text-white h-full`}
    >
      <div className="flex items-start">
        <div className={`p-2 rounded-lg ${iconBgColor} shadow-sm mr-4`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/90">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

export default NavigationCard;
