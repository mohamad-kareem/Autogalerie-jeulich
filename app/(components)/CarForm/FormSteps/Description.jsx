import React from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud, FiX, FiPlus } from "react-icons/fi";
import Button from "@/app/(components)/helpers/Button";
import Textarea from "@/app/(components)/CarForm/FormElements/Textarea";
import Checkbox from "@/app/(components)/CarForm/FormElements/Checkbox";

const Description = ({
  formData,
  setFormData,
  images,
  setImages,
  previews,
  setPreviews,
  prevStep,
  handleSubmit,
  currentStep,
  totalSteps,
  isSubmitting,
}) => {
  React.useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
    };
  }, [previews]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 16,
    onDrop: (acceptedFiles) => {
      const remainingSlots = 16 - images.length;

      if (remainingSlots <= 0) {
        toast.error("Maximal 16 Bilder erlaubt.");
        return;
      }

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      const newPreviews = filesToAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setPreviews([...previews, ...newPreviews]);
      setImages([...images, ...filesToAdd]);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleRemoveImage = (index) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    setImages(newPreviews.map((p) => p.file));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-sm sm:text-2xl font-bold text-gray-900">
            Beschreibung & Bilder
          </h2>
          <p className="text-gray-600 mt-2 text-sm ">
            Stellen Sie das Fahrzeug mit Bildern und einer detaillierten
            Beschreibung vor
          </p>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Fahrzeugbeschreibung
        </h3>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={6}
          placeholder="Geben Sie eine detaillierte Fahrzeugbeschreibung ein..."
          inputSize="small"
        />
        <div className="mt-3 sm:mt-4">
          <Checkbox
            label="Motorschaden vorhanden"
            name="hasEngineDamage"
            checked={formData.hasEngineDamage}
            onChange={handleChange}
            inputSize="small"
          />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Fahrzeugbilder (Max 16)
        </h3>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-red-500 transition-colors bg-gray-50"
        >
          <input {...getInputProps()} />
          <div className="space-y-2 sm:space-y-3">
            <FiUploadCloud className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-gray-400" />
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Bilder hierher ziehen oder klicken zum Auswählen
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Unterstützte Formate: JPEG, PNG, WEBP (Max 16 Bilder)
            </p>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={preview.preview}
                    alt={`Vorschau ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-white rounded-full p-0.5 sm:p-1 shadow-md hover:bg-red-50 text-red-600 transition-colors"
                >
                  <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200">
        <Button
          onClick={prevStep}
          bgColor="bg-black"
          hoverColor="hover:bg-red-950"
          icon="FiArrowLeft"
          size="small"
        >
          Zurück
        </Button>
        <Button
          type="submit"
          icon="FiPlus"
          size="small"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Wird gesendet..." : "Fahrzeug hinzufügen"}
        </Button>
      </div>
    </div>
  );
};

export default Description;
