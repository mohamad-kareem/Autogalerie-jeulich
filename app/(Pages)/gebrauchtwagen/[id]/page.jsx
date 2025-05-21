import { connectDB } from "../../../../lib/mongodb";
import Car from "../../../../models/Car";
import {
  FaGasPump,
  FaCar,
  FaTachometerAlt,
  FaCogs,
  FaPalette,
  FaChair,
  FaShieldAlt,
  FaKey,
  FaSun,
  FaSnowflake,
  Faredtooth,
  FaMapMarkerAlt,
  FaMusic,
  FaWifi,
  FaParking,
  FaLightbulb,
} from "react-icons/fa";
import { GiGearStick, GiCarDoor, GiSteeringWheel } from "react-icons/gi";
import {
  MdAir,
  MdElectricCar,
  MdSecurity,
  MdDirectionsCar,
} from "react-icons/md";

export default async function CarPage({ params }) {
  await connectDB();
  const car = await Car.findById(params.id).lean();

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            🚫 Car Not Found
          </h1>
          <p className="text-gray-600">
            The requested vehicle could not be located in our inventory.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to render boolean features
  const renderFeature = (value, label) => (
    <div className="flex items-center space-x-2">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          value ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        {value ? "✓" : "✗"}
      </span>
      <span>{label}</span>
    </div>
  );

  // Group features into categories
  const featureCategories = [
    {
      title: "Performance",
      icon: <FaTachometerAlt className="text-red-500" />,
      features: [
        { label: "Power", value: `${car.power} HP` },
        { label: "Drive Type", value: car.driveType },
        { label: "Gearbox", value: car.gearbox },
        { label: "Fuel Type", value: car.fuel },
        { label: "Start-Stop System", value: car.startStopSystem },
      ],
    },
    {
      title: "Exterior",
      icon: <MdDirectionsCar className="text-red-500" />,
      features: [
        { label: "Color", value: car.exteriorColor },
        { label: "Manufacturer Color", value: car.manufacturerColorName },
        { label: "Alloy Wheels", value: car.alloyWheels },
        { label: "Panoramic Roof", value: car.panoramicGlassRoof },
        { label: "Sunroof", value: car.sunroof },
        { label: "Tinted Windows", value: car.tintedWindows },
      ],
    },
    {
      title: "Interior",
      icon: <FaChair className="text-red-500" />,
      features: [
        { label: "Interior Type", value: car.interiorType },
        { label: "Interior Color", value: car.interiorColor },
        { label: "Leather Steering Wheel", value: car.leatherSteeringWheel },
        { label: "Sport Seats", value: car.sportSeats },
        {
          label: "Electric Adjustable Seats",
          value: car.electricAdjustableSeats,
        },
        { label: "Heated Seats", value: car.electricHeatedSeats },
      ],
    },
    {
      title: "Comfort",
      icon: <MdAir className="text-red-500" />,
      features: [
        { label: "Climatisation", value: car.climatisation },
        { label: "Ambient Lighting", value: car.ambientLighting },
        { label: "Keyless Entry", value: car.keylessEntry },
        { label: "Electric Windows", value: car.electricWindows },
        { label: "Electric Tailgate", value: car.electricTailgate },
        { label: "Arm Rest", value: car.armRest },
      ],
    },
    {
      title: "Entertainment",
      icon: <FaMusic className="text-red-500" />,
      features: [
        { label: "Navigation System", value: car.navigationSystem },
        { label: "redtooth", value: car.redtooth },
        { label: "Touchscreen", value: car.touchscreen },
        { label: "Voice Control", value: car.voiceControl },
        { label: "Wireless Charging", value: car.wirelessCharging },
        { label: "Radio System", value: car.radio?.join(", ") },
      ],
    },
    {
      title: "Safety",
      icon: <FaShieldAlt className="text-red-500" />,
      features: [
        { label: "Airbags", value: car.airbag },
        { label: "ABS", value: car.abs },
        { label: "ESP", value: car.esp },
        { label: "Lane Departure Warning", value: car.laneDepartureWarning },
        {
          label: "Tire Pressure Monitoring",
          value: car.tirePressureMonitoring,
        },
        { label: "Collision Avoidance", value: car.collisionAvoidance },
      ],
    },
  ];

  return (
    <main className="mt-20 min-h-screen">
      {/* Hero Section */}
      <div className=" text-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            {car.make} {car.model}
          </h1>
          <p className="text-xl mb-6">{car.modelDescription}</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <FaTachometerAlt className="mr-2" />
              <span>{car.mileage?.toLocaleString()} km</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <FaCar className="mr-2" />
              <span>{car.firstRegistration}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <FaGasPump className="mr-2" />
              <span>{car.fuel}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <GiGearStick className="mr-2" />
              <span>{car.gearbox}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            {car.images?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="relative overflow-hidden rounded-xl aspect-video bg-gray-200">
                  <img
                    src={car.images[0].ref}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {car.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {car.images.slice(1).map((img, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden rounded-lg aspect-square bg-gray-200"
                      >
                        <img
                          src={img.ref}
                          alt={`${car.make} ${car.model} - ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center text-gray-400">
                No images available
              </div>
            )}

            {/* Detailed Specifications */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <FaCar className="text-red-500 mr-2" />
                Vehicle Specifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Technical Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">VIN</span>
                      <span className="font-medium">{car.vin || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Power</span>
                      <span className="font-medium">{car.power} HP</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Fuel Type</span>
                      <span className="font-medium">{car.fuel}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Gearbox</span>
                      <span className="font-medium">{car.gearbox}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Drive Type</span>
                      <span className="font-medium">
                        {car.driveType || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Dimensions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Doors</span>
                      <span className="font-medium">{car.doors || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Seats</span>
                      <span className="font-medium">{car.seats || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Emission Class</span>
                      <span className="font-medium">
                        {car.emissionClass || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{car.category || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price & Features */}
          <div className="space-y-6">
            {/* Price Box */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-gray-500 text-sm">Total Price</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {car.price.consumerPriceGross} {car.price.currency}
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  VAT {car.price.vatRate}%
                </span>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition duration-200">
                Contact Dealer
              </button>
              <div className="mt-4 text-sm text-gray-500 text-center">
                Free delivery available
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Highlights</h2>
              <div className="grid grid-cols-2 gap-3">
                {car.navigationSystem && renderFeature(true, "Navigation")}
                {car.redtooth && renderFeature(true, "redtooth")}
                {car.leatherSteeringWheel &&
                  renderFeature(true, "Leather Wheel")}
                {car.electricHeatedSeats && renderFeature(true, "Heated Seats")}
                {car.panoramicGlassRoof &&
                  renderFeature(true, "Panoramic Roof")}
                {car.keylessEntry && renderFeature(true, "Keyless Entry")}
                {car.abs && renderFeature(true, "ABS")}
                {car.esp && renderFeature(true, "ESP")}
              </div>
            </div>

            {/* Contact & Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Quick Info</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaCar className="text-gray-400 mr-3 w-5" />
                  <span>
                    First Registration: {car.firstRegistration || "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <FaTachometerAlt className="text-gray-400 mr-3 w-5" />
                  <span>
                    Mileage: {car.mileage?.toLocaleString() || "0"} km
                  </span>
                </div>
                <div className="flex items-center">
                  <FaPalette className="text-gray-400 mr-3 w-5" />
                  <span>Color: {car.exteriorColor || "-"}</span>
                </div>
                <div className="flex items-center">
                  <GiCarDoor className="text-gray-400 mr-3 w-5" />
                  <span>Doors: {car.doors || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Features & Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-2 rounded-lg mr-3">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{category.title}</h3>
                </div>
                <div className="space-y-2">
                  {category.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-600">{feature.label}</span>
                      <span className="font-medium text-gray-800">
                        {typeof feature.value === "boolean"
                          ? feature.value
                            ? "Yes"
                            : "No"
                          : feature.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
