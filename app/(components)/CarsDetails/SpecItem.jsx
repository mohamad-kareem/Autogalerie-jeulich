const SpecItem = ({ icon, label, value }) => {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="text-red-500 mt-0.5 flex-shrink-0">{icon}</span>
      )}
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium">{value || "N/A"}</div>
      </div>
    </div>
  );
};

export default SpecItem;
