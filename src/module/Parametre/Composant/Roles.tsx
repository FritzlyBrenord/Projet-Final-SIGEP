import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Save,
  LayoutDashboard,
  Calendar as CalendarIcon,
  GraduationCap,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Props {
  isDarkMode: boolean;
}

interface Permission {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const Roles = ({ isDarkMode }: Props) => {
  const {
    listeUtilisateurs,
    UpdateUtilisateurAutorisations,
    GetUtilisateurAutorisations,
  } = useContextUtilisateur();

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [initialPermissions, setInitialPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

  const permissions: Permission[] = [
    {
      id: "Tableau de Bord",
      label: "Tableau de Bord",
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: "Accès au tableau de bord principal",
    },
    {
      id: "Années Scolaires",
      label: "Années Scolaires",
      icon: <CalendarIcon className="w-5 h-5" />,
      description: "Gestion des années scolaires",
    },
    {
      id: "Élèves",
      label: "Élèves",
      icon: <GraduationCap className="w-5 h-5" />,
      description: "Gestion des élèves inscrits",
    },
    {
      id: "Notes",
      label: "Notes",
      icon: <FileText className="w-5 h-5" />,
      description: "Gestion des notes et évaluations",
    },
    {
      id: "Professeurs",
      label: "Professeurs",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Gestion des professeurs",
    },
    {
      id: "Employés",
      label: "Employés",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Gestion du personnel",
    },
    {
      id: "Paiements",
      label: "Paiements",
      icon: <DollarSign className="w-5 h-5" />,
      description: "Gestion des paiements et finances",
    },
    {
      id: "Rapports",
      label: "Rapports",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "Génération de rapports",
    },
    {
      id: "Calendrier",
      label: "Calendrier",
      icon: <CalendarIcon className="w-5 h-5" />,
      description: "Gestion du calendrier scolaire",
    },
    {
      id: "Paramètres",
      label: "Paramètres",
      icon: <Settings className="w-5 h-5" />,
      description: "Configuration du système",
    },
  ];

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100"
      : "bg-white border-gray-300 text-gray-900",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardHover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
    permissionCard: isDarkMode ? "bg-gray-700" : "bg-gray-50",
  };

  // Charger les autorisations quand un utilisateur est sélectionné
  useEffect(() => {
    const loadPermissions = async () => {
      if (!selectedUser) {
        setActivePermissions([]);
        setInitialPermissions([]);
        return;
      }

      setLoading(true);
      try {
        const userPermissions = await GetUtilisateurAutorisations(selectedUser);
        const perms = userPermissions || [];
        setActivePermissions(perms);
        setInitialPermissions(perms);
      } catch (error) {
        console.error("Erreur lors du chargement des autorisations:", error);
        setMessage({
          type: "error",
          text: "Erreur lors du chargement des autorisations",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [selectedUser]);

  // Vérifier s'il y a des modifications non sauvegardées
  const hasUnsavedChanges = () => {
    if (initialPermissions.length !== activePermissions.length) return true;
    return !initialPermissions.every((perm) =>
      activePermissions.includes(perm)
    );
  };

  const handlePermissionToggle = (permissionId: string) => {
    setActivePermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((p) => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
    // Effacer le message précédent
    setMessage({ type: null, text: "" });
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    setMessage({ type: null, text: "" });

    try {
      const success = await UpdateUtilisateurAutorisations(
        selectedUser,
        activePermissions
      );

      if (success) {
        setInitialPermissions(activePermissions);
        setMessage({
          type: "success",
          text: "Autorisations mises à jour avec succès",
        });
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setMessage({ type: null, text: "" });
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: "Erreur lors de la mise à jour des autorisations",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessage({
        type: "error",
        text: "Erreur lors de la sauvegarde",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setActivePermissions(permissions.map((p) => p.id));
    setMessage({ type: null, text: "" });
  };

  const handleDeselectAll = () => {
    setActivePermissions([]);
    setMessage({ type: null, text: "" });
  };
  const UtilisateurActif = listeUtilisateurs.filter(
    (u) => u.isbloquer === false
  );
  const selectedUserData = UtilisateurActif.find((u) => u.id === selectedUser);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}
          >
            <Shield className="w-7 h-7 text-blue-500" />
            Gestion des rôles et autorisations
          </h2>
          <p className={`mt-1 text-sm ${themeClasses.textMuted}`}>
            Définissez les permissions d'accès pour chaque utilisateur
          </p>
        </div>
      </div>

      {/* Sélection utilisateur */}
      <div
        className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
      >
        <label
          className={`block text-sm font-medium ${themeClasses.textSecondary} mb-3`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Sélectionner un utilisateur
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
        >
          <option value="">-- Choisir un utilisateur --</option>
          {UtilisateurActif.map((user) => (
            <option key={user.id} value={user.id}>
              {user.employer?.nom} {user.employer?.prenom} ({user.role}) -{" "}
              {!user.isbloquer ? "Actif" : "Bloqué"}
            </option>
          ))}
        </select>
      </div>

      {/* Message de feedback */}
      {message.type && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Autorisations */}
      {selectedUser && (
        <div
          className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
        >
          {/* En-tête des permissions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-xl font-semibold ${themeClasses.text}`}>
                Autorisations pour {selectedUserData?.employer?.nom}{" "}
                {selectedUserData?.employer?.prenom}
              </h3>
              <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
                {activePermissions.length} / {permissions.length} autorisations
                actives
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Tout sélectionner
              </button>
              <button
                onClick={handleDeselectAll}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Liste des permissions */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissions.map((permission) => {
                const isActive = activePermissions.includes(permission.id);
                return (
                  <div
                    key={permission.id}
                    onClick={() => handlePermissionToggle(permission.id)}
                    className={`${themeClasses.permissionCard} border ${
                      isActive
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : themeClasses.border
                    } rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`${
                            isActive ? "text-blue-500" : themeClasses.textMuted
                          }`}
                        >
                          {permission.icon}
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-semibold ${themeClasses.text}`}
                          >
                            {permission.label}
                          </h4>
                          <p
                            className={`text-xs ${themeClasses.textMuted} mt-1`}
                          >
                            {permission.description}
                          </p>
                        </div>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                          isActive ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white transition-transform ${
                            isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton de sauvegarde */}
          {hasUnsavedChanges() && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Modifications non sauvegardées
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message si aucun utilisateur sélectionné */}
      {!selectedUser && (
        <div
          className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-12 text-center`}
        >
          <Users
            className={`w-16 h-16 mx-auto mb-4 ${themeClasses.textMuted}`}
          />
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
            Aucun utilisateur sélectionné
          </h3>
          <p className={`text-sm ${themeClasses.textMuted}`}>
            Veuillez sélectionner un utilisateur pour gérer ses autorisations
          </p>
        </div>
      )}
    </div>
  );
};

export default Roles;
