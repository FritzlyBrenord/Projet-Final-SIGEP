import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  AlertTriangle,
} from "lucide-react";
import ConfigurationAnee from "./ConfigurationAnee";

import {
  useAnneeScolaire,
  Subject,
  ScheduleItem,
  Salle,
  Classe,
  SchoolYear,
} from "@/Context/ContextAnneeScolaire";
import {
  generateClassesPrintContent,
  generateClassSchedulePrintContent,
} from "./module";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";

interface GestionAnneeScolaireProps {
  isDarkMode: boolean;
  isSuperAdmin?: boolean;
}

// Modal de confirmation pour la suppression
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schoolYear: SchoolYear | null;
  isDarkMode: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  schoolYear,
  isDarkMode,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isValid, setIsValid] = useState(false);
  const expectedText = "je veux le faire";

  useEffect(() => {
    setIsValid(confirmText.toLowerCase().trim() === expectedText);
  }, [confirmText]);

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setIsValid(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onClose();
      setConfirmText("");
    }
  };

  const handleClose = () => {
    onClose();
    setConfirmText("");
  };

  if (!isOpen || !schoolYear) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border-2 ${
          isDarkMode
            ? "bg-gray-800 border-red-500/30"
            : "bg-white border-red-200"
        }`}
      >
        {/* Header avec icône d'alerte */}
        <div className="p-6 text-center border-b border-red-200 dark:border-red-800/30">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Supprimer l'année scolaire
          </h3>
          <p
            className={`text-lg font-semibold mt-1 ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {schoolYear.year}
          </p>
        </div>

        {/* Corps du modal */}
        <div className="p-6">
          {/* Message d'avertissement */}
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              isDarkMode
                ? "bg-red-900/20 border-red-500 text-red-200"
                : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-2">⚠️ Action irréversible</p>
                <p className="text-sm leading-relaxed">
                  Cette action supprimera définitivement toutes les données de
                  l'année{" "}
                  <span className="font-semibold">{schoolYear.year}</span> :
                </p>
              </div>
            </div>
          </div>

          {/* Liste des conséquences */}
          <div
            className={`mb-6 space-y-2 text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>
                <strong>{schoolYear.classes.length}</strong> classe(s) et toutes
                leurs configurations
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>
                <strong>
                  {schoolYear.classes.reduce(
                    (acc, classe) => acc + classe.salles.length,
                    0
                  )}
                </strong>{" "}
                salle(s) et leurs emplois du temps
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>
                <strong>
                  {schoolYear.classes.reduce(
                    (acc, classe) =>
                      acc +
                      classe.salles.reduce(
                        (acc2, salle) => acc2 + salle.subjects.length,
                        0
                      ),
                    0
                  )}
                </strong>{" "}
                matière(s) configurées
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Tous les élèves et professeurs associés</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Tous les rapports et historiques</span>
            </div>
          </div>

          {/* Champ de confirmation */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Pour confirmer, tapez exactement :{" "}
              <span className="font-mono font-bold text-red-500">
                "{expectedText}"
              </span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                confirmText && !isValid
                  ? isDarkMode
                    ? "border-red-500 bg-red-900/20 text-white focus:border-red-400"
                    : "border-red-500 bg-red-50 focus:border-red-500"
                  : isValid
                  ? isDarkMode
                    ? "border-green-500 bg-green-900/20 text-white focus:border-green-400"
                    : "border-green-500 bg-green-50 focus:border-green-500"
                  : isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500"
                  : "border-gray-300 bg-white focus:border-blue-500"
              } focus:outline-none focus:ring-0`}
              placeholder="Tapez ici pour confirmer..."
              autoComplete="off"
            />
            {confirmText && (
              <p
                className={`text-xs mt-1 ${
                  isValid
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isValid ? "✓ Confirmation valide" : "✗ Texte incorrect"}
              </p>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                isValid
                  ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-[1.02]"
                  : isDarkMode
                  ? "bg-red-900/30 text-red-700 cursor-not-allowed"
                  : "bg-red-200 text-red-400 cursor-not-allowed"
              }`}
            >
              {isValid
                ? "Supprimer définitivement"
                : "Confirmer pour supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonctions d'impression fournies par l'utilisateur
const handlePrintSalleSchedule = (salle: Salle, classeName: string) => {
  const clsForPrint = {
    id: salle.id,
    name: `${classeName} - ${salle.name}`,
    maxStudents: salle.maxStudents,
    subjects: salle.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      coefficient: s.coefficient,
    })),
    schedule: salle.schedule.map((i) => ({
      id: i.id,
      day: i.day,
      startTime: i.startTime,
      endTime: i.endTime,
      subject: i.subject,
      teacherName: i.teacherName,
    })),
  } as any;
  const w = window.open("", "_blank");
  if (w) {
    const html = generateClassSchedulePrintContent(clsForPrint, classeName);
    w.document.write(html);
    w.document.close();
    w.print();
  }
};

const handlePrintSubjectsList = (salle: Salle) => {
  const levelLike = [
    {
      id: salle.id,
      name: salle.name,
      classes: [
        {
          id: salle.id,
          name: salle.name,
          maxStudents: salle.maxStudents,
          subjects: salle.subjects.map((s) => ({
            id: s.id,
            name: s.name,
            coefficient: s.coefficient,
          })),
        },
      ],
    },
  ] as any;
  const w = window.open("", "_blank");
  if (w) {
    const html = generateClassesPrintContent(levelLike);
    w.document.write(html);
    w.document.close();
    w.print();
  }
};

// Fonctions de génération HTML pour l'impression (à adapter selon votre implémentation)

const GestionAnneeScolaire: React.FC<GestionAnneeScolaireProps> = ({
  isDarkMode,
  isSuperAdmin,
}) => {
  const {
    schoolYears,
    currentYear,
    setCurrentYear,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    clearLocalStorage,
  } = useAnneeScolaire();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedYearForEdit, setSelectedYearForEdit] =
    useState<SchoolYear | null>(null);
  const { currentSession } = useContextUtilisateur();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState<SchoolYear | null>(null);

  // États pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<SchoolYear | null>(null);

  // États pour les filtres et accordéons
  const [expandedClasses, setExpandedClasses] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedSalles, setExpandedSalles] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedClasseFilter, setSelectedClasseFilter] =
    useState<string>("all");
  const [selectedSalleFilter, setSelectedSalleFilter] = useState<string>("all");

  // Notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Toggle functions
  const toggleClass = (classeId: string) => {
    setExpandedClasses((prev) => ({ ...prev, [classeId]: !prev[classeId] }));
  };

  const toggleSalle = (salleId: string) => {
    setExpandedSalles((prev) => ({ ...prev, [salleId]: !prev[salleId] }));
  };

  // Déterminer le statut d'une année
  const getYearStatus = (year: string) => {
    if (currentYear?.year === year) {
      return {
        status: "current",
        label: "Année actuelle",
        color: "text-green-600 bg-green-100",
      };
    }

    const currentDate = new Date();
    const currentYearNum = currentDate.getFullYear();
    const [startYear] = year.split("-").map(Number);

    if (startYear < currentYearNum) {
      return {
        status: "past",
        label: "Année passée",
        color: "text-gray-600 bg-gray-100",
      };
    } else if (startYear === currentYearNum) {
      return {
        status: "current",
        label: "Année en cours",
        color: "text-blue-600 bg-blue-100",
      };
    } else {
      return {
        status: "future",
        label: "Année future",
        color: "text-orange-600 bg-orange-100",
      };
    }
  };

  // Icône selon le statut
  const getYearIcon = (year: string) => {
    const status = getYearStatus(year);
    switch (status.status) {
      case "current":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "past":
        return <Clock className="w-5 h-5 text-gray-500" />;
      case "future":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  // Créer nouvelle année
  const handleCreateNewYear = () => {
    setModalMode("create");
    setSelectedYearForEdit(null);
    setShowModal(true);
  };

  // Définir comme année actuelle
  const handleSetCurrentYear = async (schoolYear: SchoolYear) => {
    try {
      await setCurrentYear(schoolYear);
      showNotification(
        "success",
        `Année ${schoolYear.year} définie comme année actuelle et sauvegardée`
      );
    } catch (error) {
      showNotification(
        "error",
        `Erreur lors de la définition de l'année ${schoolYear.year}`
      );
    }
  };

  // Éditer une année
  const handleEditYear = (schoolYear: SchoolYear) => {
    setModalMode("edit");
    setSelectedYearForEdit(schoolYear);
    setShowModal(true);
  };
  const handleViewDetails = (schoolYear: SchoolYear) => {
    setShowDetails(schoolYear);
  };

  // Supprimer une année - nouvelle implémentation avec modal de confirmation
  const handleDeleteYear = (yearId: string) => {
    const yearToDeleteData = schoolYears.find((y) => y.id === yearId);
    if (!yearToDeleteData) return;

    if (currentYear?.id === yearId) {
      showNotification("error", "Impossible de supprimer l'année actuelle");
      return;
    }

    // Ouvrir le modal de confirmation
    setYearToDelete(yearToDeleteData);
    setShowDeleteModal(true);
  };

  // Confirmer la suppression
  const handleConfirmDelete = () => {
    if (yearToDelete) {
      deleteSchoolYear(yearToDelete.id);
      showNotification("success", `Année ${yearToDelete.year} supprimée`);
      setYearToDelete(null);
    }
  };

  // Fermer le modal de confirmation
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setYearToDelete(null);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedYearForEdit(null);
  };

  // Sauvegarder depuis le modal
  const handleSaveFromModal = async (newYear: SchoolYear) => {
    if (modalMode === "create") {
      const created = await createSchoolYear({
        year: newYear.year,
        description: newYear.description,
        created: true,
        classes: newYear.classes || [],
        configurationSaved: !!newYear.configurationSaved,
      });
      if (created) {
        showNotification("success", `Année ${newYear.year} créée avec succès`);
      } else {
        showNotification(
          "error",
          `Erreur lors de la création de l'année ${newYear.year}`
        );
      }
    } else {
      const updated = await updateSchoolYear(newYear.id, newYear);
      if (updated) {
        if (currentYear?.id === newYear.id) {
          setCurrentYear(newYear);
        }
        showNotification(
          "success",
          `Année ${newYear.year} modifiée avec succès`
        );
      } else {
        showNotification(
          "error",
          `Erreur lors de la modification de l'année ${newYear.year}`
        );
      }
    }
  };

  // Filtrer les classes et salles
  const getFilteredData = () => {
    if (!showDetails) return { classes: [] };

    let filteredClasses = showDetails.classes;

    if (selectedClasseFilter !== "all") {
      filteredClasses = filteredClasses.filter(
        (c) => c.id === selectedClasseFilter
      );
    }

    if (selectedSalleFilter !== "all") {
      filteredClasses = filteredClasses
        .map((c) => ({
          ...c,
          salles: c.salles.filter((s) => s.id === selectedSalleFilter),
        }))
        .filter((c) => c.salles.length > 0);
    }

    return { classes: filteredClasses };
  };

  const filteredData = getFilteredData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Gestion des Années Scolaires
          </h1>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Créez, modifiez et gérez les configurations des années scolaires
          </p>
        </div>
        {(currentSession.role === "Administrateur" || isSuperAdmin) && (
          <button
            onClick={handleCreateNewYear}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle année</span>
          </button>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {notification.message}
        </div>
      )}

      {/* Année actuelle */}
      {currentYear && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isDarkMode
              ? "border-green-500 bg-gray-800"
              : "border-green-500 bg-green-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Année actuelle : {currentYear.year}
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {currentYear.description}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {currentYear.classes.length} Classe(s),{" "}
                  {currentYear.classes.reduce(
                    (acc, classe) => acc + classe.salles.length,
                    0
                  )}{" "}
                  salle(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewDetails(currentYear)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                title="Voir les détails"
              >
                <Eye className="w-4 h-4" />
              </button>
              {currentSession.role === "Administrateur" ||
                (isSuperAdmin && (
                  <button
                    onClick={() => handleEditYear(currentYear)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des années */}
      <div
        className={`rounded-xl border ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Toutes les années scolaires ({schoolYears.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {schoolYears.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar
                className={`w-12 h-12 mx-auto mb-4 ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <h3
                className={`text-lg font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-900"
                }`}
              >
                Aucune année scolaire
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Commencez par créer votre première année scolaire
              </p>
            </div>
          ) : (
            schoolYears
              .sort((a, b) => b.year.localeCompare(a.year))
              .map((schoolYear) => {
                const yearStatus = getYearStatus(schoolYear.year);
                const isCurrentYear = currentYear?.year === schoolYear.year;

                return (
                  <div
                    key={schoolYear.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isCurrentYear
                        ? isDarkMode
                          ? "bg-green-900/20"
                          : "bg-green-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getYearIcon(schoolYear.year)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3
                              className={`text-lg font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {schoolYear.year}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? yearStatus.color
                                      .replace("bg-", "bg-")
                                      .replace("text-", "text-")
                                  : yearStatus.color
                              }`}
                            >
                              {yearStatus.label}
                            </span>
                            {!schoolYear.configurationSaved && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Configuration incomplète
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {schoolYear.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {schoolYear.classes.length} Classe(s)
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {schoolYear.classes.reduce(
                                (acc, classe) => acc + classe.salles.length,
                                0
                              )}{" "}
                              salle(s)
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {schoolYear.classes.reduce(
                                (acc, classe) =>
                                  acc +
                                  classe.salles.reduce(
                                    (acc2, salle) =>
                                      acc2 + salle.subjects.length,
                                    0
                                  ),
                                0
                              )}{" "}
                              matière(s)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isCurrentYear && (
                          <button
                            onClick={() => handleSetCurrentYear(schoolYear)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              isDarkMode
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                            title="Appliquer comme année actuelle"
                          >
                            Appliquer
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(schoolYear)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-gray-400 hover:text-white hover:bg-gray-700"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(currentSession.role === "Administrateur" ||
                          isSuperAdmin) && (
                          <button
                            onClick={() => handleEditYear(schoolYear)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {!isCurrentYear &&
                          (currentSession.role === "Administrateur" ||
                            isSuperAdmin) && (
                            <button
                              onClick={() => handleDeleteYear(schoolYear.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  : "text-red-500 hover:text-red-700 hover:bg-red-50"
                              }`}
                              title="Supprimer l'année"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        schoolYear={yearToDelete}
        isDarkMode={isDarkMode}
      />

      {/* Modal de configuration */}
      <ConfigurationAnee
        isOpen={showModal}
        onClose={handleCloseModal}
        isDarkMode={isDarkMode}
        mode={modalMode}
        existingYears={schoolYears.map((y) => y.year)}
        availableYears={schoolYears.filter((y) => y.configurationSaved)}
        schoolYear={selectedYearForEdit}
        onSave={handleSaveFromModal}
      />

      {/* Modal de détails */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`flex items-center justify-between p-4 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div>
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Détails - {showDetails.year}
                </h3>
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {showDetails.description}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(null)}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Section emplois du temps améliorée */}
              <div
                className={`border rounded-lg p-3 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Emplois du temps par classe{" "}
                  </h4>
                </div>

                {/* Filtres */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtres:</span>
                  </div>
                  <select
                    value={selectedClasseFilter}
                    onChange={(e) => setSelectedClasseFilter(e.target.value)}
                    className={`px-3 py-1 text-sm rounded border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="all">Toutes les classes</option>
                    {showDetails.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSalleFilter}
                    onChange={(e) => setSelectedSalleFilter(e.target.value)}
                    className={`px-3 py-1 text-sm rounded border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="all">Toutes les salles</option>
                    {showDetails.classes
                      .flatMap((c) => c.salles)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  {(selectedClasseFilter !== "all" ||
                    selectedSalleFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSelectedClasseFilter("all");
                        setSelectedSalleFilter("all");
                      }}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredData.classes.map((classe) => (
                    <div
                      key={classe.id}
                      className={`border rounded-lg overflow-hidden ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800/30"
                          : "border-gray-200 bg-gray-50/30"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between p-3 cursor-pointer hover:opacity-80 transition-opacity ${
                          isDarkMode
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                        onClick={() => toggleClass(classe.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedClasses[classe.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                          <span
                            className={`font-semibold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {classe.name}
                          </span>
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              isDarkMode
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {classe.salles.length} salle
                            {classe.salles.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {expandedClasses[classe.id] && (
                        <div className="p-3">
                          {classe.salles.map((salle) => (
                            <div key={salle.id} className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                  onClick={() => toggleSalle(salle.id)}
                                >
                                  {expandedSalles[salle.id] ? (
                                    <ChevronDown className="w-4 h-4 ml-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 ml-4" />
                                  )}
                                  <div className="text-sm font-medium">
                                    {salle.name}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
                                      isDarkMode
                                        ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      handlePrintSalleSchedule(
                                        salle,
                                        classe.name
                                      )
                                    }
                                    title="Imprimer emploi du temps"
                                  >
                                    <Printer className="w-3 h-3" />
                                    EMPL
                                  </button>
                                  <button
                                    className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
                                      isDarkMode
                                        ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      handlePrintSubjectsList(salle)
                                    }
                                    title="Imprimer matières"
                                  >
                                    <FileText className="w-3 h-3" />
                                    Mat
                                  </button>
                                </div>
                              </div>
                              {expandedSalles[salle.id] && (
                                <div className="grid grid-cols-5 gap-1 text-xs mt-1">
                                  {[
                                    "Lundi",
                                    "Mardi",
                                    "Mercredi",
                                    "Jeudi",
                                    "Vendredi",
                                  ].map((day) => (
                                    <div key={day}>
                                      <div
                                        className={`font-semibold ${
                                          isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {day}
                                      </div>
                                      {salle.schedule
                                        .filter((i) => i.day === day)
                                        .map((i) => (
                                          <div
                                            key={i.id}
                                            className={`mt-1 px-2 py-1 rounded ${
                                              isDarkMode
                                                ? "bg-green-900/30 text-green-300"
                                                : "bg-green-100 text-green-700"
                                            }`}
                                          >
                                            {i.startTime}-{i.endTime} •{" "}
                                            {i.subject}{" "}
                                            {i.teacherName
                                              ? `(${i.teacherName})`
                                              : ""}
                                          </div>
                                        ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAnneeScolaire;
