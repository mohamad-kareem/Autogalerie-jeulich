import { useState, useRef, useEffect } from "react";

const CarTypeSelector = ({ formData, handleInputChange, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [carTypeFilter, setCarTypeFilter] = useState("");
  const wrapperRef = useRef(null);

  const carTypes = [
    // Ford
    "Ford Focus",
    "Ford Kuga",
    "Ford Puma",
    "Ford Explorer",
    "Ford Fiesta",

    // Volkswagen (VW)
    "VW Polo",
    "VW Golf",
    "VW Tiguan",
    "VW ID.3",
    "VW ID.4",
    "VW ID.7",
    "VW T-Roc",
    "VW Passat",
    "VW Touran",

    // Hyundai
    "Hyundai i10",
    "Hyundai i20",
    "Hyundai Tucson",
    "Hyundai Ioniq 5",
    "Hyundai Kona",
    "Hyundai Bayon",

    // Honda
    "Honda Jazz",
    "Honda Civic",
    "Honda CR-V",

    // Toyota
    "Toyota Yaris",
    "Toyota Corolla",
    "Toyota RAV4",
    "Toyota C-HR",
    "Toyota Aygo X",

    // SEAT
    "SEAT Ibiza",
    "SEAT Leon",
    "SEAT Ateca",
    "SEAT Arona",

    // Dacia
    "Dacia Sandero",
    "Dacia Duster",
    "Dacia Jogger",

    // BMW
    "BMW 1 Series",
    "BMW 2 Series",
    "BMW 3 Series",
    "BMW X1",
    "BMW X3",
    "BMW X5",

    // Mercedes-Benz
    "Mercedes A-Class",
    "Mercedes B-Class",
    "Mercedes C-Class",
    "Mercedes E-Class",
    "Mercedes GLA",
    "Mercedes GLC",

    // Opel
    "Opel Corsa",
    "Opel Astra",
    "Opel Mokka",
    "Opel Meriva",
    "Opel Grandland",

    // Fiat
    "Fiat 500",
    "Fiat Panda",
    "Fiat Tipo",
    "Fiat 500X",

    // Skoda
    "Skoda Fabia",
    "Skoda Octavia",
    "Skoda Karoq",
    "Skoda Kodiaq",
    "Skoda Scala",
    "Skoda Superb",

    // Peugeot
    "Peugeot 208",
    "Peugeot 308",
    "Peugeot 3008",
    "Peugeot 2008",

    // Renault
    "Renault Clio",
    "Renault Captur",
    "Renault Megane",
    "Renault Kadjar",
    "Renault Arkana",
    "Renault Austral",

    // Kia
    "Kia Picanto",
    "Kia Ceed",
    "Kia Sportage",
    "Kia Niro",
    "Kia Stonic",

    // Nissan
    "Nissan Micra",
    "Nissan Qashqai",
    "Nissan Juke",
    "Nissan X-Trail",

    // Mazda
    "Mazda2",
    "Mazda3",
    "Mazda CX-5",
    "Mazda CX-30",

    // Citroën
    "Citroën C3",
    "Citroën C4",
    "Citroën C5 Aircross",
    "Citroën C3 Aircross",

    // Mini
    "Mini Cooper",
    "Mini Countryman",

    // Volvo
    "Volvo XC40",
    "Volvo XC60",
    "Volvo V60",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (type) => {
    handleInputChange({ target: { name: "carType", value: type } });
    setCarTypeFilter("");
    setIsOpen(false);
  };

  const filteredCarTypes = carTypes
    .filter((type) => type.toLowerCase().includes(carTypeFilter.toLowerCase()))
    .slice(0, 10);

  return (
    <div className="mb-4" ref={wrapperRef}>
      <label
        className={`block text-sm font-medium mb-1 ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Car Type
      </label>

      <div className="relative">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search car (e.g. 'Ford' or 'SUV')"
            value={isOpen ? carTypeFilter : formData.carType || carTypeFilter}
            onChange={(e) => {
              setCarTypeFilter(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={`w-full p-2 pl-3 pr-8 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`absolute right-2 p-1 rounded-md ${
              darkMode
                ? "text-gray-300 hover:bg-gray-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label={isOpen ? "Close dropdown" : "Open dropdown"}
          >
            {isOpen ? "✕" : "⌄"}
          </button>
        </div>

        {isOpen && (
          <div
            className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
              darkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            {filteredCarTypes.length > 0 ? (
              filteredCarTypes.map((type) => (
                <div
                  key={type}
                  onClick={() => handleSelect(type)}
                  className={`p-3 text-sm cursor-pointer transition-colors flex justify-between items-center ${
                    formData.carType === type
                      ? darkMode
                        ? "bg-blue-900 text-white"
                        : "bg-blue-100 text-blue-900"
                      : darkMode
                      ? "hover:bg-gray-700 text-gray-200"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{type}</span>
                  {formData.carType === type && (
                    <span className="text-xs opacity-70">✓</span>
                  )}
                </div>
              ))
            ) : (
              <div
                className={`p-3 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No matching cars found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarTypeSelector;
