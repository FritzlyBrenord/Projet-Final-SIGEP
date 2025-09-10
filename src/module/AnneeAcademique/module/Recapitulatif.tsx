import React from "react";
import { X, Save, Printer, Calendar } from "lucide-react";
import { Level, Class, Subject } from "../../../types/AnneeScolaireType";
import { generateCompleteConfigPrintContent } from "./PrintUtils";

interface RecapitulatifProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isDarkMode: boolean;
  yearInput: string;
  description: string;
  levels: Level[];
}

const Recapitulatif: React.FC<RecapitulatifProps> = ({
  isOpen,
  onClose,
  onSave,
  isDarkMode,
  yearInput,
  description,
  levels,
}) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateCompleteConfigPrintContent(
        yearInput,
        description,
        levels
      );
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-green-500" />
            <h2
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Récapitulatif de la Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Informations générales */}
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 bg-gray-700/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Informations Générales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Année scolaire:
                  </span>
                  <p
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {yearInput}
                  </p>
                </div>
                <div>
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Description:
                  </span>
                  <p
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {description || "Aucune description"}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 bg-gray-700/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Statistiques
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold text-blue-500 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {levels.length}
                  </div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Classex
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold text-green-500 ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {levels.reduce(
                      (acc, level) => acc + level.classes.length,
                      0
                    )}
                  </div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Classes
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold text-purple-500 ${
                      isDarkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  >
                    {levels.reduce(
                      (acc, level) =>
                        acc +
                        level.classes.reduce(
                          (acc2, cls) => acc2 + cls.subjects.length,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Matières
                  </div>
                </div>
              </div>
            </div>

            {/* Détails par Classe */}
            {levels.map((level) => (
              <div
                key={level.id}
                className={`border rounded-lg p-4 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {level.name}
                </h4>
                <div className="space-y-3">
                  {level.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-3 rounded-lg ${
                        isDarkMode ? "bg-gray-700/30" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {cls.name}
                        </h5>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            isDarkMode
                              ? "bg-gray-600 text-gray-300"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {cls.maxStudents} élèves max
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cls.subjects.map((subject) => (
                          <span
                            key={subject.id}
                            className={`px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-blue-900/30 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {subject.name} (Coef: {subject.coefficient})
                          </span>
                        ))}
                      </div>
                      {cls.schedule.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {cls.schedule.length} créneaux horaires configurés
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between p-6 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Retour
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className={`px-4 py-2 rounded-lg border flex items-center space-x-2 transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Créer l'année</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recapitulatif;
