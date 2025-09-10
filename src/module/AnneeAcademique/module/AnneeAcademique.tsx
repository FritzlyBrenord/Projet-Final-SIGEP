import React from "react";
import { Calendar } from "lucide-react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";

interface AnneeAcademiqueProps {
  isDarkMode: boolean;
  error: string | null;
  yearValidationError: string | null;
}

const AnneeAcademique: React.FC<AnneeAcademiqueProps> = ({
  isDarkMode,
  error,
  yearValidationError,
}) => {
  const { anneeActuelle, modifierAnnee } = useAnneeScolaire();

  const yearInput = anneeActuelle?.year || "";
  const description = anneeActuelle?.description || "";

  const handleYearChange = (value: string) => {
    modifierAnnee({ year: value });
  };

  const handleDescriptionChange = (value: string) => {
    modifierAnnee({ description: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Année scolaire *
        </label>
        <input
          type="text"
          value={yearInput}
          onChange={(e) => handleYearChange(e.target.value)}
          placeholder="2024-2025"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
            error || yearValidationError
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          } ${
            isDarkMode
              ? "bg-gray-700 text-white placeholder-gray-400"
              : "bg-white text-gray-900 placeholder-gray-500"
          }`}
        />
        {(error || yearValidationError) && (
          <p className="mt-1 text-sm text-red-500">
            {error || yearValidationError}
          </p>
        )}
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Description (optionnel)
        </label>
        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Description de l'année scolaire..."
          className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 transition-colors resize-none ${
            isDarkMode
              ? "bg-gray-700 text-white placeholder-gray-400"
              : "bg-white text-gray-900 placeholder-gray-500"
          }`}
        />
      </div>
    </div>
  );
};

export default AnneeAcademique;
