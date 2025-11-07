import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  Shield,
  User,
  Circle,
  Clock,
  Wifi,
  MapPin,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  DollarSign,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useEmployer } from "@/Context/ContextEmployer";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";

interface Props {
  isDarkMode: boolean;
}

interface UserPresenceStatus {
  email: string;
  isOnline: boolean;
  status: string;
  connected_at: string | null;
  disconnected_at: string | null;
  last_activity: string | null;
  ip_address: string | null;
  session_duration: number | null;
}

// 🎯 Définition des rôles et leurs autorisations automatiques
const ROLE_PERMISSIONS = {
  Administrateur: [
    "Tableau de Bord",
    "Années Scolaires",
    "Élèves",
    "Notes",
    "Professeurs",
    "Employés",
    "Paiements",
    "Rapports",
    "Calendrier",
    "Paramètres",
  ],
  Registraire: ["Tableau de Bord", "Élèves", "Années Scolaires"],
  Pedagogie: ["Tableau de Bord", "Notes"],
  Econome: ["Tableau de Bord", "Paiements"],
  RRH: ["Tableau de Bord", "Employés", "Professeurs"],
};

// 🎨 Informations visuelles des rôles
const ROLE_INFO = {
  Administrateur: {
    icon: Shield,
    color: "purple",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-500",
    description: "Accès complet à toutes les fonctionnalités",
  },
  Registraire: {
    icon: BookOpen,
    color: "blue",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500",
    description: "Gestion des élèves et années scolaires",
  },
  Pedagogie: {
    icon: GraduationCap,
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-600 dark:text-green-400",
    borderClass: "border-green-500",
    description: "Gestion pédagogique et notes",
  },
  Econome: {
    icon: DollarSign,
    color: "yellow",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    textClass: "text-yellow-600 dark:text-yellow-400",
    borderClass: "border-yellow-500",
    description: "Gestion financière et paiements",
  },
  RRH: {
    icon: Briefcase,
    color: "orange",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-500",
    description: "Gestion des ressources humaines",
  },
};

const GestionUtilisateur = ({ isDarkMode }: Props) => {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [presenceStatuses, setPresenceStatuses] = useState<
    Map<string, UserPresenceStatus>
  >(new Map());
  const [selectedUserPresence, setSelectedUserPresence] =
    useState<UserPresenceStatus | null>(null);

  // 🆕 États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 🆕 États pour les notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { employes } = useEmployer();

  const {
    listeUtilisateurs,
    AddUtilisateur,
    UpdateUtilisateur,
    BloquerUtilisateur,
    DebloquerUtilisateur,
    DeleteUtilisateur,
    loading,
    error,
  } = useContextUtilisateur();

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    role: "Registraire" as
      | "Administrateur"
      | "Registraire"
      | "Pedagogie"
      | "Econome"
      | "RRH",
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    modalBg: isDarkMode ? "bg-gray-900" : "bg-white",
  };

  // 🆕 Fonction pour afficher une notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ✅ Récupérer les statuts de présence
  useEffect(() => {
    const fetchPresenceStatuses = async () => {
      if (listeUtilisateurs.length === 0) return;

      const emails = listeUtilisateurs
        .map((u) => u.email_connexion)
        .filter(Boolean);

      try {
        const response = await fetch("/api/presence/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails }),
        });

        if (response.ok) {
          const data = await response.json();
          const statusMap = new Map<string, UserPresenceStatus>();
          data.statuses.forEach((status: UserPresenceStatus) => {
            statusMap.set(status.email, status);
          });
          setPresenceStatuses(statusMap);
        }
      } catch (error) {
        console.error("Erreur récupération statuts:", error);
      }
    };

    fetchPresenceStatuses();
    const interval = setInterval(fetchPresenceStatuses, 30000);
    return () => clearInterval(interval);
  }, [listeUtilisateurs]);

  const filteredEmployees = useMemo(() => {
    return employes.filter((emp) =>
      `${emp.prenom} ${emp.nom} ${emp.departement}/${emp.fonction}`
        .toLowerCase()
        .includes(employeeSearch.toLowerCase())
    );
  }, [employes, employeeSearch]);

  // ✅ Stats avec utilisateurs en ligne
  const stats = useMemo(() => {
    const total = listeUtilisateurs.length;
    const active = listeUtilisateurs.filter((u) => !u.isbloquer).length;
    const blocked = listeUtilisateurs.filter((u) => u.isbloquer).length;
    const online = Array.from(presenceStatuses.values()).filter(
      (s) => s.isOnline
    ).length;
    return { total, active, blocked, online };
  }, [listeUtilisateurs, presenceStatuses]);

  const generateEmail = (nom: string, prenom: string) =>
    `${prenom.toLowerCase()}.${nom.toLowerCase()}@imfp.com`;

  // 🔐 Fonction pour générer un mot de passe sécurisé
  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "@#$%&!*";

    // Garantir au moins un de chaque type (4 caractères minimum)
    const mandatoryChars = [
      lowercase[Math.floor(Math.random() * lowercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    // Ajouter 4 caractères aléatoires supplémentaires (total 8 caractères)
    const allChars = lowercase + uppercase + numbers + symbols;
    const additionalChars = [];
    for (let i = 0; i < 4; i++) {
      additionalChars.push(
        allChars[Math.floor(Math.random() * allChars.length)]
      );
    }

    // Mélanger tous les caractères
    const allPasswordChars = [...mandatoryChars, ...additionalChars];
    return allPasswordChars.sort(() => Math.random() - 0.5).join("");
  };

  // 🔐 Fonction pour valider le mot de passe
  const validatePassword = (
    password: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push("Au moins 6 caractères");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Au moins une lettre minuscule");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Au moins une lettre majuscule");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Au moins un chiffre");
    }

    if (!/[@#$%&!*]/.test(password)) {
      errors.push("Au moins un caractère spécial (@#$%&!*)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 🔐 Fonction pour calculer la force du mot de passe
  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@#$%&!*]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength: 33, label: "Faible", color: "bg-red-500" };
    } else if (strength <= 4) {
      return { strength: 66, label: "Moyen", color: "bg-yellow-500" };
    } else {
      return { strength: 100, label: "Fort", color: "bg-green-500" };
    }
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(
      `${employee.prenom} ${employee.nom} - ${employee.departement}/${employee.fonction}`
    );
    setNewUserData({
      email: generateEmail(employee.nom, employee.prenom),
      password: generatePassword(),
      role: "Registraire",
    });
    setShowEmployeeDropdown(false);
  };

  // 🎯 Réinitialiser le formulaire
  const resetForm = () => {
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setNewUserData({ email: "", password: "", role: "Registraire" });
  };

  // 🆕 Fonction améliorée pour créer un utilisateur avec autorisations automatiques
  const handleCreateUser = async () => {
    if (!selectedEmployee || !newUserData.email || !newUserData.password) {
      showNotification("error", "Veuillez remplir tous les champs");
      return;
    }

    // 🔐 Validation du mot de passe
    const passwordValidation = validatePassword(newUserData.password);
    if (!passwordValidation.isValid) {
      showNotification(
        "error",
        `Mot de passe invalide : ${passwordValidation.errors.join(", ")}`
      );
      return;
    }

    setIsCreating(true);

    try {
      // 🎯 Récupérer les autorisations automatiques selon le rôle
      const autorisations = ROLE_PERMISSIONS[newUserData.role];

      const success = await AddUtilisateur({
        email_connexion: newUserData.email,
        password_connexion: newUserData.password,
        role: newUserData.role,
        employer_id: selectedEmployee.id,
        autorisations, // 🎯 Autorisations automatiques
      });

      if (success) {
        showNotification(
          "success",
          `Utilisateur ${newUserData.role} créé avec succès !`
        );
        setShowCreateModal(false);
        resetForm();
      } else {
        showNotification("error", error || "Erreur lors de la création");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Erreur inattendue");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // 🔐 Valider le nouveau mot de passe s'il est fourni
    if (editingUser.password_connexion) {
      const passwordValidation = validatePassword(
        editingUser.password_connexion
      );
      if (!passwordValidation.isValid) {
        showNotification(
          "error",
          `Mot de passe invalide : ${passwordValidation.errors.join(", ")}`
        );
        return;
      }
    }

    const dataToUpdate: any = {
      email_connexion: editingUser.email_connexion,
      role: editingUser.role,
      autorisations:
        ROLE_PERMISSIONS[editingUser.role as keyof typeof ROLE_PERMISSIONS], // 🎯 Mise à jour automatique des autorisations
    };

    if (editingUser.password_connexion) {
      dataToUpdate.password_connexion = editingUser.password_connexion;
    }

    const success = await UpdateUtilisateur(editingUser.id, dataToUpdate);

    if (success) {
      showNotification("success", "Utilisateur modifié avec succès !");
      setEditingUser(null);
    } else {
      showNotification("error", "Erreur lors de la modification");
    }
  };

  const handleDeleteUser = async (id: string) => {
    const success = await DeleteUtilisateur(id);
    if (success) {
      showNotification("success", "Utilisateur supprimé avec succès !");
      setDeleteConfirm(null);
    } else {
      showNotification("error", "Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (id: string, isBlocked: boolean) => {
    const success = isBlocked
      ? await DebloquerUtilisateur(id)
      : await BloquerUtilisateur(id);

    if (success) {
      showNotification(
        "success",
        isBlocked ? "Utilisateur débloqué !" : "Utilisateur bloqué !"
      );
    } else {
      showNotification("error", "Erreur lors de l'opération");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleShowPresenceDetails = (userEmail: string) => {
    const status = presenceStatuses.get(userEmail);
    if (status) {
      setSelectedUserPresence(status);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🆕 Notification Toast */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl animate-in slide-in-from-top-5 ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 hover:opacity-80 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header avec Stats et Bouton Créer */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2
              className={`text-3xl font-bold ${themeClasses.text} flex items-center gap-3`}
            >
              <Users className="w-8 h-8 text-blue-500" />
              Gestion des utilisateurs
            </h2>
            <p className={`mt-2 text-sm ${themeClasses.textSecondary}`}>
              Créez, modifiez et gérez les comptes utilisateurs du système
            </p>
          </div>

          {/* 🆕 Bouton Créer Utilisateur */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <UserPlus className="w-5 h-5" />
            <span>Créer un utilisateur</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-5 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <Users className={`w-8 h-8 ${themeClasses.textSecondary}`} />
              <div className={`text-3xl font-bold ${themeClasses.text}`}>
                {stats.total}
              </div>
            </div>
            <div
              className={`text-sm font-medium ${themeClasses.textSecondary}`}
            >
              Total
            </div>
          </div>

          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-5 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <Wifi className="w-8 h-8 text-blue-500" />
              <div className={`text-3xl font-bold ${themeClasses.text}`}>
                {stats.online}
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              En ligne
            </div>
          </div>

          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-5 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div className={`text-3xl font-bold ${themeClasses.text}`}>
                {stats.active}
              </div>
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              Actifs
            </div>
          </div>

          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-5 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <UserX className="w-8 h-8 text-red-500" />
              <div className={`text-3xl font-bold ${themeClasses.text}`}>
                {stats.blocked}
              </div>
            </div>
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              Bloqués
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div>
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>
            Utilisateurs existants ({listeUtilisateurs.length})
          </h3>

          {listeUtilisateurs.length === 0 ? (
            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-12 text-center`}
            >
              <Users
                className={`w-20 h-20 mx-auto mb-4 ${themeClasses.textSecondary} opacity-50`}
              />
              <p className={`text-lg ${themeClasses.textSecondary}`}>
                Aucun utilisateur créé pour le moment
              </p>
              <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>
                Cliquez sur "Créer un utilisateur" pour commencer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listeUtilisateurs.map((user) => {
                const presenceStatus = presenceStatuses.get(
                  user.email_connexion
                );
                const isOnline = presenceStatus?.isOnline || false;
                const roleInfo = ROLE_INFO[user.role as keyof typeof ROLE_INFO];
                const RoleIcon = roleInfo?.icon || User;

                return (
                  <div
                    key={user.id}
                    className={`${themeClasses.cardBg} border ${
                      themeClasses.border
                    } rounded-xl p-6 shadow-md hover:shadow-xl transition-all ${
                      user.isbloquer ? "opacity-60" : ""
                    }`}
                  >
                    {/* En-tête utilisateur */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Indicateur en ligne */}
                          <button
                            onClick={() =>
                              handleShowPresenceDetails(user.email_connexion)
                            }
                            className="relative group"
                            title={
                              isOnline
                                ? "En ligne - Cliquez pour détails"
                                : "Hors ligne"
                            }
                          >
                            <Circle
                              className={`w-3 h-3 ${
                                isOnline
                                  ? "text-green-500 fill-green-500 animate-pulse"
                                  : "text-gray-400 fill-gray-400"
                              }`}
                            />
                          </button>

                          <h4
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {user.employer?.prenom} {user.employer?.nom}
                          </h4>
                        </div>

                        <p
                          className={`text-sm ${themeClasses.textSecondary} mb-2`}
                        >
                          {user.employer?.departement} /{" "}
                          {user.employer?.fonction}
                        </p>
                        <p
                          className={`text-sm ${themeClasses.textSecondary} flex items-center gap-1`}
                        >
                          📧 {user.email_connexion}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col gap-2 items-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${roleInfo?.bgClass} ${roleInfo?.textClass}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {user.role}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            !user.isbloquer
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {!user.isbloquer ? "✓ Actif" : "✗ Bloqué"}
                        </span>
                      </div>
                    </div>

                    {/* Infos complémentaires */}
                    <div
                      className={`text-xs ${themeClasses.textSecondary} mb-4 pb-4 border-b ${themeClasses.border} space-y-1`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Dernière connexion:{" "}
                        {user.derniere_connexion
                          ? new Date(user.derniere_connexion).toLocaleString(
                              "fr-FR"
                            )
                          : "Jamais connecté"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Créé le:{" "}
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "fr-FR"
                            )
                          : "N/A"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ${themeClasses.hover} border ${themeClasses.border} transition-all font-medium text-sm`}
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(user.id!, user.isbloquer || false)
                        }
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                          !user.isbloquer
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                        }`}
                        title={!user.isbloquer ? "Bloquer" : "Débloquer"}
                      >
                        {!user.isbloquer ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Bloquer
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Activer
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(user.id!)}
                        className="px-3 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all dark:bg-red-900 dark:text-red-300"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🆕 MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div
            className={`${themeClasses.modalBg} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            {/* Header Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-7 h-7" />
                  <h3 className="text-2xl font-bold">
                    Créer un nouvel utilisateur
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenu Modal */}
            <div className="p-6 space-y-6">
              {/* Recherche employé */}
              <div>
                <label
                  className={`block text-sm font-semibold ${themeClasses.text} mb-3`}
                >
                  1. Sélectionner un employé
                </label>
                <div className="relative">
                  <Search
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`}
                  />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Rechercher par nom, prénom ou fonction..."
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                    disabled={isCreating}
                  />
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div
                      className={`absolute z-20 w-full mt-2 ${themeClasses.cardBg} border-2 ${themeClasses.border} rounded-xl shadow-2xl max-h-60 overflow-y-auto`}
                    >
                      {filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleEmployeeSelect(emp)}
                          className={`w-full text-left px-4 py-3 transition-colors ${themeClasses.hover} first:rounded-t-xl last:rounded-b-xl border-b ${themeClasses.border} last:border-b-0`}
                        >
                          <div className={`font-semibold ${themeClasses.text}`}>
                            {emp.prenom} {emp.nom}
                          </div>
                          <div
                            className={`text-sm ${themeClasses.textSecondary}`}
                          >
                            {emp.departement} / {emp.fonction}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedEmployee && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedEmployee.prenom} {selectedEmployee.nom}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sélection du Rôle */}
              <div>
                <label
                  className={`block text-sm font-semibold ${themeClasses.text} mb-3`}
                >
                  2. Choisir le rôle et les autorisations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>
                  ).map((role) => {
                    const info = ROLE_INFO[role];
                    const RoleIcon = info.icon;
                    const isSelected = newUserData.role === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewUserData({ ...newUserData, role })}
                        disabled={isCreating}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${info.borderClass} ${info.bgClass} shadow-lg scale-105`
                            : `${themeClasses.border} ${themeClasses.hover}`
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <RoleIcon
                            className={`w-6 h-6 flex-shrink-0 ${
                              isSelected
                                ? info.textClass
                                : themeClasses.textSecondary
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-bold text-sm ${
                                isSelected ? info.textClass : themeClasses.text
                              }`}
                            >
                              {role}
                            </h4>
                            <p
                              className={`text-xs mt-1 ${themeClasses.textSecondary}`}
                            >
                              {info.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-current/20">
                            <p
                              className={`text-xs font-medium ${info.textClass} mb-2`}
                            >
                              Autorisations :
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {ROLE_PERMISSIONS[role].map((perm) => (
                                <span
                                  key={perm}
                                  className={`text-xs px-2 py-0.5 rounded ${info.bgClass} ${info.textClass}`}
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email généré */}
              <div>
                <label
                  className={`block text-sm font-semibold ${themeClasses.text} mb-3`}
                >
                  3. Email de connexion
                </label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                  placeholder="email@imfp.com"
                  className={`w-full px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  disabled={isCreating}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  className={`block text-sm font-semibold ${themeClasses.text} mb-3`}
                >
                  4. Mot de passe
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Ex: aB4@2x"
                    className={`flex-1 px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                    disabled={isCreating}
                  />
                  <button
                    onClick={() =>
                      setNewUserData({
                        ...newUserData,
                        password: generatePassword(),
                      })
                    }
                    disabled={isCreating}
                    className="px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg font-medium disabled:opacity-50"
                  >
                    Générer
                  </button>
                </div>

                {/* 🔐 Indicateur de force du mot de passe */}
                {newUserData.password && (
                  <div className="mt-3 space-y-2">
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          getPasswordStrength(newUserData.password).color
                        }`}
                        style={{
                          width: `${
                            getPasswordStrength(newUserData.password).strength
                          }%`,
                        }}
                      />
                    </div>

                    {/* Label de force */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          getPasswordStrength(newUserData.password).strength ===
                          100
                            ? "text-green-600 dark:text-green-400"
                            : getPasswordStrength(newUserData.password)
                                .strength === 66
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        Force :{" "}
                        {getPasswordStrength(newUserData.password).label}
                      </span>
                    </div>

                    {/* Critères de validation */}
                    <div className="text-xs space-y-1">
                      <div
                        className={`flex items-center gap-2 ${
                          newUserData.password.length >= 6
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {newUserData.password.length >= 6 ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Au moins 6 caractères
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[a-z]/.test(newUserData.password)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[a-z]/.test(newUserData.password) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Une lettre minuscule
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[A-Z]/.test(newUserData.password)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[A-Z]/.test(newUserData.password) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Une lettre majuscule
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[0-9]/.test(newUserData.password)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[0-9]/.test(newUserData.password) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Un chiffre
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[@#$%&!*]/.test(newUserData.password)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[@#$%&!*]/.test(newUserData.password) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Un caractère spécial (@#$%&!*)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div
              className={`p-6 border-t ${themeClasses.border} flex gap-3 sticky bottom-0 ${themeClasses.modalBg}`}
            >
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={isCreating}
                className={`flex-1 px-6 py-3 rounded-xl border-2 ${themeClasses.border} ${themeClasses.hover} transition-all font-medium disabled:opacity-50`}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                disabled={
                  !selectedEmployee ||
                  !newUserData.email ||
                  !newUserData.password ||
                  isCreating
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Créer l'utilisateur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails de présence - SUITE DU CODE... */}
      {selectedUserPresence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`${themeClasses.modalBg} rounded-2xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Circle
                  className={`w-4 h-4 ${
                    selectedUserPresence.isOnline
                      ? "text-green-500 fill-green-500 animate-pulse"
                      : "text-gray-400 fill-gray-400"
                  }`}
                />
                <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                  {selectedUserPresence.isOnline
                    ? "🟢 En ligne"
                    : "⚫ Hors ligne"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserPresence(null)}
                className={`p-2 rounded-lg ${themeClasses.hover}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${themeClasses.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                  <span
                    className={`text-sm font-medium ${themeClasses.textSecondary}`}
                  >
                    Email
                  </span>
                </div>
                <p className={`text-sm ${themeClasses.text}`}>
                  {selectedUserPresence.email}
                </p>
              </div>

              {selectedUserPresence.connected_at && (
                <div className={`p-4 rounded-lg border ${themeClasses.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`w-4 h-4 ${themeClasses.textSecondary}`}
                    />
                    <span
                      className={`text-sm font-medium ${themeClasses.textSecondary}`}
                    >
                      Connecté le
                    </span>
                  </div>
                  <p className={`text-sm ${themeClasses.text}`}>
                    {new Date(selectedUserPresence.connected_at).toLocaleString(
                      "fr-FR"
                    )}
                  </p>
                </div>
              )}

              {selectedUserPresence.disconnected_at && (
                <div className={`p-4 rounded-lg border ${themeClasses.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`w-4 h-4 ${themeClasses.textSecondary}`}
                    />
                    <span
                      className={`text-sm font-medium ${themeClasses.textSecondary}`}
                    >
                      Déconnecté le
                    </span>
                  </div>
                  <p className={`text-sm ${themeClasses.text}`}>
                    {new Date(
                      selectedUserPresence.disconnected_at
                    ).toLocaleString("fr-FR")}
                  </p>
                </div>
              )}

              {selectedUserPresence.session_duration !== null && (
                <div
                  className={`p-4 rounded-lg border ${themeClasses.border} bg-blue-50 dark:bg-blue-900/20`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Durée de la dernière session
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatDuration(selectedUserPresence.session_duration)}
                  </p>
                </div>
              )}

              {selectedUserPresence.ip_address && (
                <div className={`p-4 rounded-lg border ${themeClasses.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin
                      className={`w-4 h-4 ${themeClasses.textSecondary}`}
                    />
                    <span
                      className={`text-sm font-medium ${themeClasses.textSecondary}`}
                    >
                      Adresse IP
                    </span>
                  </div>
                  <p className={`text-sm font-mono ${themeClasses.text}`}>
                    {selectedUserPresence.ip_address}
                  </p>
                </div>
              )}

              {selectedUserPresence.last_activity && (
                <div className={`p-4 rounded-lg border ${themeClasses.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock
                      className={`w-4 h-4 ${themeClasses.textSecondary}`}
                    />
                    <span
                      className={`text-sm font-medium ${themeClasses.textSecondary}`}
                    >
                      Dernière activité
                    </span>
                  </div>
                  <p className={`text-sm ${themeClasses.text}`}>
                    {new Date(
                      selectedUserPresence.last_activity
                    ).toLocaleString("fr-FR")}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedUserPresence(null)}
              className="mt-6 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal d'édition - SUITE... */}
      {editingUser && (
        <div className="fixed inset-0 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div
            className={`${themeClasses.modalBg}  overflow-y-auto rounded-2xl shadow-2xl max-w-md w-full `}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Edit2 className="w-6 h-6" />
                  Modifier l'utilisateur
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Rôle
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>
                  ).map((role) => {
                    const info = ROLE_INFO[role];
                    const RoleIcon = info.icon;
                    const isSelected = editingUser.role === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, role })}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${info.borderClass} ${info.bgClass}`
                            : `${themeClasses.border} ${themeClasses.hover}`
                        }`}
                      >
                        <RoleIcon
                          className={`w-5 h-5 ${
                            isSelected
                              ? info.textClass
                              : themeClasses.textSecondary
                          }`}
                        />
                        <span
                          className={`font-medium text-sm ${
                            isSelected ? info.textClass : themeClasses.text
                          }`}
                        >
                          {role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email_connexion}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email_connexion: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Nouveau mot de passe
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingUser.password_connexion || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        password_connexion: e.target.value,
                      })
                    }
                    placeholder="Entrez un nouveau mot de passe"
                    className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  />
                  <button
                    onClick={() =>
                      setEditingUser({
                        ...editingUser,
                        password_connexion: generatePassword(),
                      })
                    }
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                    title="Générer un nouveau mot de passe"
                  >
                    Générer
                  </button>
                </div>
                <p className={`text-xs mt-1 ${themeClasses.textSecondary}`}>
                  Laissez vide pour conserver l'actuel
                </p>

                {/* 🔐 Indicateur de force pour le modal d'édition */}
                {editingUser.password_connexion && (
                  <div className="mt-3 space-y-2">
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          getPasswordStrength(editingUser.password_connexion)
                            .color
                        }`}
                        style={{
                          width: `${
                            getPasswordStrength(editingUser.password_connexion)
                              .strength
                          }%`,
                        }}
                      />
                    </div>

                    {/* Label de force */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          getPasswordStrength(editingUser.password_connexion)
                            .strength === 100
                            ? "text-green-600 dark:text-green-400"
                            : getPasswordStrength(
                                editingUser.password_connexion
                              ).strength === 66
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        Force :{" "}
                        {
                          getPasswordStrength(editingUser.password_connexion)
                            .label
                        }
                      </span>
                    </div>

                    {/* Critères de validation */}
                    <div className="text-xs space-y-1 grid grid-cols-2">
                      <div
                        className={`flex items-center gap-2 ${
                          editingUser.password_connexion.length >= 6
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {editingUser.password_connexion.length >= 6 ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Au moins 6 caractères
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[a-z]/.test(editingUser.password_connexion)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[a-z]/.test(editingUser.password_connexion) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Une lettre minuscule
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[A-Z]/.test(editingUser.password_connexion)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[A-Z]/.test(editingUser.password_connexion) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Une lettre majuscule
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[0-9]/.test(editingUser.password_connexion)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[0-9]/.test(editingUser.password_connexion) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Un chiffre
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          /[@#$%&!*]/.test(editingUser.password_connexion)
                            ? "text-green-600 dark:text-green-400"
                            : themeClasses.textSecondary
                        }`}
                      >
                        {/[@#$%&!*]/.test(editingUser.password_connexion) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        Un caractère spécial (@#$%&!*)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateUser}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className={`flex-1 px-4 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.hover} transition-colors font-medium`}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div
            className={`${themeClasses.modalBg} rounded-2xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-full dark:bg-orange-900">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
              <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                Supprimer l'utilisateur
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className={`${themeClasses.textSecondary}`}>
                Êtes-vous sûr de vouloir supprimer cet utilisateur ?
              </p>

              <div
                className={`p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p
                      className={`text-sm font-medium text-blue-800 dark:text-blue-300`}
                    >
                      💡 Information importante
                    </p>
                    <p
                      className={`text-xs text-blue-700 dark:text-blue-400 mt-1`}
                    >
                      L'utilisateur sera <strong>désactivé</strong> mais ses
                      données seront conservées. Il ne pourra plus se connecter
                      et n'apparaîtra plus dans la liste.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={loading}
                className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Oui, supprimer
                  </>
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.hover} transition-colors font-medium`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUtilisateur;
