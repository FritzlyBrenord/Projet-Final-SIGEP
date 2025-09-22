import React from "react";
import {
  AlertTriangle,
  User,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { DoublonEleve } from "../types/EleveTypeV2";

interface DoublonConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  doublons: DoublonEleve[];
  isDarkMode?: boolean;
}

const DoublonConfirmationModal: React.FC<DoublonConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  doublons,
  isDarkMode = false,
}) => {
  if (!isOpen) return null;

  const baseClasses = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const buttonPrimaryClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const buttonSecondaryClasses = isDarkMode
    ? "bg-gray-700 hover:bg-gray-600 text-white"
    : "bg-gray-200 hover:bg-gray-300 text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${cardClasses} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border`}
      >
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Doublons détectés</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Des personnes avec des informations similaires existent déjà
              </p>
            </div>
          </div>

          {/* Message d'avertissement */}
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Attention :</strong> Nous avons trouvé {doublons.length}{" "}
              personne(s) avec le même nom, prénom, lieu de naissance et
              informations de contact. Voulez-vous continuer l'ajout ou annuler
              ?
            </p>
          </div>

          {/* Liste des doublons */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Personnes similaires trouvées :
            </h3>
            <div className="space-y-4">
              {doublons.map((doublon, index) => (
                <div
                  key={doublon.id}
                  className={`${cardClasses} p-4 rounded-lg border`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">
                          {doublon.prenom} {doublon.nom}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({doublon.code})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Né(e) le{" "}
                            {new Date(
                              doublon.date_naissance
                            ).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {doublon.lieu_naissance}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {doublon.telephone_parents}
                          </span>
                        </div>

                        {doublon.nif_parents && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              NIF: {doublon.nif_parents}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {doublon.annee_scolaire} - {doublon.classe}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doublon.statut === "actif"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : doublon.statut === "inactif"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {doublon.statut.charAt(0).toUpperCase() +
                              doublon.statut.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onCancel}
              className={`px-6 py-2 rounded-lg transition-colors ${buttonSecondaryClasses}`}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2 rounded-lg transition-colors ${buttonPrimaryClasses}`}
            >
              Continuer l'ajout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoublonConfirmationModal;
