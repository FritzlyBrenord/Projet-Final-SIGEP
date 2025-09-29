import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { useEmployer } from "@/Context/ContextEmployer";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";

interface Props {
  isDarkMode: boolean;
}

const GestionUtilisateur = ({ isDarkMode }: Props) => {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

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

  const filteredEmployees = useMemo(() => {
    return employes.filter((emp) =>
      `${emp.prenom} ${emp.nom} ${emp.departement + "/" + emp.fonction}`
        .toLowerCase()
        .includes(employeeSearch.toLowerCase())
    );
  }, [employes, employeeSearch]);

  // ✅ Stats basées sur listeUtilisateurs du contexte
  const stats = useMemo(() => {
    const total = listeUtilisateurs.length;
    const active = listeUtilisateurs.filter((u) => !u.isbloquer).length;
    const blocked = listeUtilisateurs.filter((u) => u.isbloquer).length;
    return { total, active, blocked };
  }, [listeUtilisateurs]);

  const generateEmail = (nom: string, prenom: string) =>
    `${prenom.toLowerCase()}.${nom.toLowerCase()}@imfp.com`;

  const generatePassword = () => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = ["@", "#", "%", "&"];

    // Générer 3 lettres
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const letter3 = letters[Math.floor(Math.random() * letters.length)];

    // Générer 2 chiffres
    const num1 = numbers[Math.floor(Math.random() * numbers.length)];
    const num2 = numbers[Math.floor(Math.random() * numbers.length)];

    // Générer 1 symbole
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    // Mélanger tous les éléments
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

  // ✅ Utilise AddUtilisateur du contexte
  const handleCreateUser = async () => {
    if (!selectedEmployee || !newUserData.email || !newUserData.password)
      return;
    console.log("Creating user with data:", {
      email_connexion: newUserData.email,
      password_connexion: newUserData.password,
      role: newUserData.role,
      employer_id: selectedEmployee.id,
    });

    const success = await AddUtilisateur({
      email_connexion: newUserData.email,
      password_connexion: newUserData.password,
      role: newUserData.role, // ✅ Inclut le rôle
      employer_id: selectedEmployee.id,
    });

    if (success) {
      setSelectedEmployee(null);
      setEmployeeSearch("");
      setNewUserData({ email: "", password: "", role: "Utilisateur" });
    }
  };

  // ✅ Utilise UpdateUtilisateur du contexte
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const dataToUpdate: any = {
      email_connexion: editingUser.email_connexion,
      role: editingUser.role, // ✅ Inclut le rôle
    };

    if (editingUser.password_connexion) {
      dataToUpdate.password_connexion = editingUser.password_connexion;
    }

    const success = await UpdateUtilisateur(editingUser.id, dataToUpdate);

    if (success) {
      setEditingUser(null);
    }
  };

  // ✅ Utilise DeleteUtilisateur du contexte
  const handleDeleteUser = async (id: string) => {
    const success = await DeleteUtilisateur(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  // ✅ Utilise BloquerUtilisateur et DebloquerUtilisateur du contexte
  const handleToggleStatus = async (id: string, isBlocked: boolean) => {
    if (isBlocked) {
      await DebloquerUtilisateur(id);
    } else {
      await BloquerUtilisateur(id);
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
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
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

        {/* Formulaire de création */}
        <div
          className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl shadow-lg overflow-hidden`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-6 h-6 text-blue-500" />
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Créer un nouvel utilisateur
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Recherche employé */}
              <div className="relative">
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Rechercher un employé
                </label>
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`}
                  />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Nom, prénom ou fonction..."
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  />
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div
                      className={`absolute z-20 w-full mt-2 ${themeClasses.cardBg} border ${themeClasses.border} rounded-lg shadow-xl max-h-60 overflow-y-auto`}
                    >
                      {filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleEmployeeSelect(emp)}
                          className={`w-full text-left px-4 py-3 transition-colors ${themeClasses.hover} first:rounded-t-lg last:rounded-b-lg`}
                        >
                          <div className={`font-medium ${themeClasses.text}`}>
                            {emp.prenom} {emp.nom}
                          </div>
                          <div
                            className={`text-sm ${themeClasses.textSecondary}`}
                          >
                            {emp.departement + " / " + emp.fonction}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Sélection du Rôle */}
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Rôle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserData({ ...newUserData, role: "Utilisateur" })
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      newUserData.role === "Utilisateur"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : `${themeClasses.border} ${themeClasses.hover}`
                    }`}
                  >
                    <Shield
                      className={`w-5 h-5 ${
                        newUserData.role === "Utilisateur"
                          ? "text-blue-500"
                          : themeClasses.textSecondary
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        newUserData.role === "Utilisateur"
                          ? "text-blue-600 dark:text-blue-400"
                          : themeClasses.text
                      }`}
                    >
                      Utilisateur
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserData({ ...newUserData, role: "Administrateur" })
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      newUserData.role === "Administrateur"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : `${themeClasses.border} ${themeClasses.hover}`
                    }`}
                  >
                    <User
                      className={`w-5 h-5 ${
                        newUserData.role === "Administrateur"
                          ? "text-green-500"
                          : themeClasses.textSecondary
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        newUserData.role === "Administrateur"
                          ? "text-green-600 dark:text-green-400"
                          : themeClasses.text
                      }`}
                    >
                      Administrateur
                    </span>
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Email généré
                </label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                  placeholder="email@imfp.com"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Mot de passe
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Ex: aB42#"
                    className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  />
                  <button
                    onClick={() =>
                      setNewUserData({
                        ...newUserData,
                        password: generatePassword(),
                      })
                    }
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex-shrink-0"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateUser}
              disabled={
                !selectedEmployee ||
                !newUserData.email ||
                !newUserData.password ||
                loading
              }
              className="mt-6 w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                {loading ? "Création..." : "Créer l'utilisateur"}
              </div>
            </button>
          </div>
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
              {listeUtilisateurs.map((user) => (
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
                        {/* ✅ Badge de rôle */}
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
                        {user.employer?.departement} / {user.employer?.fonction}
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
                        ? new Date(user.created_at).toLocaleDateString("fr-FR")
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${themeClasses.modalBg} rounded-xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                Modifier l'utilisateur
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className={`p-2 rounded-lg ${themeClasses.hover}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ✅ Modification du Rôle */}
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Rôle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({ ...editingUser, role: "Utilisateur" })
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      editingUser.role === "Utilisateur"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : `${themeClasses.border} ${themeClasses.hover}`
                    }`}
                  >
                    <Shield
                      className={`w-5 h-5 ${
                        editingUser.role === "Utilisateur"
                          ? "text-blue-500"
                          : themeClasses.textSecondary
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        editingUser.role === "Utilisateur"
                          ? "text-blue-600 dark:text-blue-400"
                          : themeClasses.text
                      }`}
                    >
                      User
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({ ...editingUser, role: "Administrateur" })
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      editingUser.role === "Administrateur"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : `${themeClasses.border} ${themeClasses.hover}`
                    }`}
                  >
                    <User
                      className={`w-5 h-5 ${
                        editingUser.role === "Administrateur"
                          ? "text-green-500"
                          : themeClasses.textSecondary
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        editingUser.role === "Administrateur"
                          ? "text-green-600 dark:text-green-400"
                          : themeClasses.text
                      }`}
                    >
                      Admin
                    </span>
                  </button>
                </div>
              </div>

              {/* Email */}
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

              {/* Mot de passe */}
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
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateUser}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  <Check className="w-5 h-5" />
                  {loading ? "Enregistrement..." : "Enregistrer"}
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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${themeClasses.modalBg} rounded-xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full dark:bg-red-900">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
              <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                Confirmer la suppression
              </h3>
            </div>

            <p className={`${themeClasses.textSecondary} mb-6`}>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action
              est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400"
              >
                {loading ? "Suppression..." : "Supprimer"}
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
