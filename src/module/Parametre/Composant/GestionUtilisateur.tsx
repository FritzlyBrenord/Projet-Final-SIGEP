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

const GestionUtilisateur = ({ isDarkMode }: Props) => {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [presenceStatuses, setPresenceStatuses] = useState<
    Map<string, UserPresenceStatus>
  >(new Map());
  const [selectedUserPresence, setSelectedUserPresence] =
    useState<UserPresenceStatus | null>(null);

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
    role: "Utilisateur" as "Utilisateur" | "Administrateur",
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

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchPresenceStatuses, 30000);
    return () => clearInterval(interval);
  }, [listeUtilisateurs]);

  const filteredEmployees = useMemo(() => {
    return employes.filter((emp) =>
      `${emp.prenom} ${emp.nom} ${emp.departement + "/" + emp.fonction}`
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

  const generatePassword = () => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = ["@", "#", "%", "&"];

    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const letter3 = letters[Math.floor(Math.random() * letters.length)];
    const num1 = numbers[Math.floor(Math.random() * numbers.length)];
    const num2 = numbers[Math.floor(Math.random() * numbers.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    const parts = [letter1, letter2, letter3, num1, num2, symbol];
    return parts.sort(() => Math.random() - 0.5).join("");
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(
      `${employee.prenom} ${employee.nom} - ${
        employee.departement + "/" + employee.fonction
      }`
    );
    setNewUserData({
      email: generateEmail(employee.nom, employee.prenom),
      password: generatePassword(),
      role: "Utilisateur",
    });
    setShowEmployeeDropdown(false);
  };

  const handleCreateUser = async () => {
    if (!selectedEmployee || !newUserData.email || !newUserData.password)
      return;

    const success = await AddUtilisateur({
      email_connexion: newUserData.email,
      password_connexion: newUserData.password,
      role: newUserData.role,
      employer_id: selectedEmployee.id,
    });

    if (success) {
      setSelectedEmployee(null);
      setEmployeeSearch("");
      setNewUserData({ email: "", password: "", role: "Utilisateur" });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const dataToUpdate: any = {
      email_connexion: editingUser.email_connexion,
      role: editingUser.role,
    };

    if (editingUser.password_connexion) {
      dataToUpdate.password_connexion = editingUser.password_connexion;
    }

    const success = await UpdateUtilisateur(editingUser.id, dataToUpdate);

    if (success) {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const success = await DeleteUtilisateur(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const handleToggleStatus = async (id: string, isBlocked: boolean) => {
    if (isBlocked) {
      await DebloquerUtilisateur(id);
    } else {
      await BloquerUtilisateur(id);
    }
  };

  // ✅ Formater la durée de session
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // ✅ Ouvrir le modal de détails de présence
  const handleShowPresenceDetails = (userEmail: string) => {
    const status = presenceStatuses.get(userEmail);
    if (status) {
      setSelectedUserPresence(status);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className={`text-2xl sm:text-3xl font-bold ${themeClasses.text}`}
            >
              Gestion des utilisateurs
            </h2>
            <p className={`mt-1 text-sm ${themeClasses.textSecondary}`}>
              Créez, modifiez et gérez les comptes utilisateurs
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-lg p-3 text-center`}
            >
              <Users
                className={`w-5 h-5 mx-auto mb-1 ${themeClasses.textSecondary}`}
              />
              <div className={`text-xl font-bold ${themeClasses.text}`}>
                {stats.total}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                Total
              </div>
            </div>

            {/* ✅ Stat En ligne */}
            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-lg p-3 text-center`}
            >
              <Wifi className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className={`text-xl font-bold ${themeClasses.text}`}>
                {stats.online}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                En ligne
              </div>
            </div>

            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-lg p-3 text-center`}
            >
              <UserCheck className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className={`text-xl font-bold ${themeClasses.text}`}>
                {stats.active}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                Actifs
              </div>
            </div>
            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-lg p-3 text-center`}
            >
              <UserX className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <div className={`text-xl font-bold ${themeClasses.text}`}>
                {stats.blocked}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                Bloqués
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Formulaire de création - IDENTIQUE */}
        <div
          className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl shadow-lg overflow-hidden`}
        >
          {/* ... Votre code de formulaire existant ... */}
        </div>

        {/* Liste des utilisateurs */}
        <div>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
            Utilisateurs existants ({listeUtilisateurs.length})
          </h3>

          {listeUtilisateurs.length === 0 ? (
            <div
              className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-12 text-center`}
            >
              <Users
                className={`w-16 h-16 mx-auto mb-4 ${themeClasses.textSecondary} opacity-50`}
              />
              <p className={`${themeClasses.textSecondary}`}>
                Aucun utilisateur créé pour le moment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listeUtilisateurs.map((user) => {
                const presenceStatus = presenceStatuses.get(
                  user.email_connexion
                );
                const isOnline = presenceStatus?.isOnline || false;

                return (
                  <div
                    key={user.id}
                    className={`${themeClasses.cardBg} border ${
                      themeClasses.border
                    } rounded-xl p-5 shadow-md hover:shadow-lg transition-all ${
                      user.isbloquer ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* ✅ Indicateur en ligne */}
                          <button
                            onClick={() =>
                              handleShowPresenceDetails(user.email_connexion)
                            }
                            className="relative group"
                            title={
                              isOnline
                                ? "En ligne - Cliquez pour détails"
                                : "Hors ligne - Cliquez pour détails"
                            }
                          >
                            <Circle
                              className={`w-3 h-3 ${
                                isOnline
                                  ? "text-green-500 fill-green-500 animate-pulse"
                                  : "text-gray-400 fill-gray-400"
                              }`}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {isOnline ? "🟢 En ligne" : "⚫ Hors ligne"}
                            </div>
                          </button>

                          <h4 className={`font-semibold ${themeClasses.text}`}>
                            {user.employer?.prenom} {user.employer?.nom}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              !user.isbloquer
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {!user.isbloquer ? "Actif" : "Bloqué"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                              user.role === "Administrateur"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {user.role === "Administrateur" ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {user.role}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${themeClasses.textSecondary} mb-1`}
                        >
                          {user.employer?.departement} /{" "}
                          {user.employer?.fonction}
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          {user.email_connexion}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-xs ${themeClasses.textSecondary} mb-4 pb-4 border-b ${themeClasses.border}`}
                    >
                      <div>
                        Dernière connexion:{" "}
                        {user.derniere_connexion
                          ? new Date(user.derniere_connexion).toLocaleString(
                              "fr-FR"
                            )
                          : "Jamais connecté"}
                      </div>
                      <div>
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
                        onClick={() => setEditingUser(user)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${themeClasses.hover} border ${themeClasses.border} transition-colors`}
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Modifier</span>
                      </button>
                      <button
                        onClick={() =>
                          handleToggleStatus(user.id!, user.isbloquer || false)
                        }
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          !user.isbloquer
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                        }`}
                        title={!user.isbloquer ? "Bloquer" : "Débloquer"}
                      >
                        {!user.isbloquer ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Bloquer</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            <span className="text-sm">Activer</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id!)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-red-300"
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

      {/* ✅ Modal des détails de présence */}
      {selectedUserPresence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`${themeClasses.modalBg} rounded-xl shadow-2xl max-w-md w-full p-6`}
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
              {/* Email */}
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

              {/* Dernière connexion */}
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

              {/* Déconnexion */}
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

              {/* Durée de session */}
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

              {/* Adresse IP */}
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

              {/* Dernière activité */}
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

      {/* Modal d'édition - IDENTIQUE */}
      {/* Modal de suppression - IDENTIQUE */}
    </div>
  );
};

export default GestionUtilisateur;
