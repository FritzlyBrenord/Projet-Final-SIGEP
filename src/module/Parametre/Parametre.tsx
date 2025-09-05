import React, { useState, useMemo } from "react";
import {
  Settings,
  User,
  Users,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Plus,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Search,
  Moon,
  Sun,
  Lock,
  Unlock,
  ChevronDown,
  UserX,
  UserCheck,
  Mail,
  Key,
} from "lucide-react";

interface Props {
  isDarkMode: boolean;
}
const AdminSettingsPage = ({ isDarkMode }: Props) => {
  const [activeTab, setActiveTab] = useState("profile");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Données de démonstration
  const [adminProfile, setAdminProfile] = useState({
    nom: "Dupont",
    prenom: "Jean",
    email: "admin@imfp.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [employees] = useState([
    { id: 1, nom: "Martin", prenom: "Sophie", poste: "Professeur Math" },
    { id: 2, nom: "Bernard", prenom: "Pierre", poste: "Professeur Français" },
    { id: 3, nom: "Petit", prenom: "Marie", poste: "Secrétaire" },
    { id: 4, nom: "Moreau", prenom: "Luc", poste: "Directeur Adjoint" },
    { id: 5, nom: "Dubois", prenom: "Anne", poste: "Professeur Sciences" },
    { id: 6, nom: "Leroy", prenom: "Paul", poste: "Surveillant" },
    { id: 7, nom: "Garcia", prenom: "Maria", poste: "Professeur Espagnol" },
  ]);

  const [users, setUsers] = useState([
    {
      id: 1,
      nom: "Martin",
      prenom: "Sophie",
      email: "sophie.martin@imfp.com",
      status: "active",
      lastLogin: "2024-09-01",
      permissions: {
        "Tableau de Bord": true,
        "Années scolaires": true,
        Élèves: true,
        Notes: true,
        Professeurs: false,
        Employés: false,
        Paiements: false,
        Rapports: false,
        Calendrier: true,
        Paramètres: false,
      },
    },
    {
      id: 2,
      nom: "Bernard",
      prenom: "Pierre",
      email: "pierre.bernard@imfp.com",
      status: "blocked",
      lastLogin: "2024-08-28",
      permissions: {
        "Tableau de Bord": true,
        "Années scolaires": false,
        Élèves: true,
        Notes: true,
        Professeurs: false,
        Employés: false,
        Paiements: false,
        Rapports: false,
        Calendrier: false,
        Paramètres: false,
      },
    },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
  });

  const permissions = [
    "Tableau de Bord",
    "Années scolaires",
    "Élèves",
    "Notes",
    "Professeurs",
    "Employés",
    "Paiements",
    "Rapports",
    "Calendrier",
    "Paramètres",
  ];

  const [deletedItems] = useState([
    {
      id: 1,
      type: "Élève",
      nom: "Doe John",
      dateSupression: "2024-08-30",
      details: "Classe: 5ème A",
    },
    {
      id: 2,
      type: "Professeur",
      nom: "Smith Alice",
      dateSupression: "2024-08-28",
      details: "Matière: Anglais",
    },
    {
      id: 3,
      type: "Employé",
      nom: "Brown Bob",
      dateSupression: "2024-08-25",
      details: "Poste: Gardien",
    },
    {
      id: 4,
      type: "Note",
      nom: "Contrôle Math - Marie Durand",
      dateSupression: "2024-08-29",
      details: "Note: 15/20",
    },
    {
      id: 5,
      type: "Paiement",
      nom: "Frais scolaires - Paul Martin",
      dateSupression: "2024-08-27",
      details: "Montant: 500€",
    },
  ]);

  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Recherche d'employés filtrée
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      `${emp.prenom} ${emp.nom} ${emp.poste}`
        .toLowerCase()
        .includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  const generateEmail = (nom, prenom) => {
    return `${prenom.toLowerCase()}.${nom.toLowerCase()}@imfp.com`;
  };

  const generatePassword = () => {
    return (
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8).toUpperCase()
    );
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(`${employee.prenom} ${employee.nom} - ${employee.poste}`);
    setNewUserData({
      email: generateEmail(employee.nom, employee.prenom),
      password: generatePassword(),
    });
    setShowEmployeeDropdown(false);
  };

  const handleCreateUser = () => {
    if (!selectedEmployee || !newUserData.email || !newUserData.password)
      return;

    const newUser = {
      id: users.length + 1,
      nom: selectedEmployee.nom,
      prenom: selectedEmployee.prenom,
      email: newUserData.email,
      status: "active",
      lastLogin: "Jamais connecté",
      permissions: Object.fromEntries(permissions.map((p) => [p, false])),
    };

    setUsers([...users, newUser]);
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setNewUserData({ email: "", password: "" });
    alert(
      `Utilisateur créé avec succès!\nEmail: ${newUser.email}\nMot de passe: ${newUserData.password}`
    );
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      newEmail: user.email,
      newPassword: generatePassword(),
    });
  };

  const handleUpdateUser = () => {
    setUsers(
      users.map((user) =>
        user.id === editingUser.id
          ? { ...user, email: editingUser.newEmail }
          : user
      )
    );
    setEditingUser(null);
    alert("Utilisateur mis à jour avec succès!");
  };

  const handleDeleteUser = (userId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) {
      setUsers(users.filter((user) => user.id !== userId));
      alert("Utilisateur supprimé!");
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "active" ? "blocked" : "active" }
          : user
      )
    );
  };

  const handlePermissionChange = (userId, permission) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [permission]: !user.permissions[permission],
              },
            }
          : user
      )
    );
  };

  const handleProfileUpdate = () => {
    if (
      adminProfile.newPassword &&
      adminProfile.newPassword !== adminProfile.confirmPassword
    ) {
      alert("Les nouveaux mots de passe ne correspondent pas!");
      return;
    }
    alert("Profil mis à jour avec succès!");
  };

  const handleRestore = (itemId) => {
    alert(`Élément ${itemId} restauré avec succès!`);
  };

  const handlePermanentDelete = (itemId) => {
    if (
      confirm("Êtes-vous sûr de vouloir supprimer définitivement cet élément?")
    ) {
      alert(`Élément ${itemId} supprimé définitivement!`);
    }
  };

  const handleEmptyTrash = () => {
    if (
      confirm(
        "ATTENTION: Cette action est irréversible! Voulez-vous vraiment vider complètement la corbeille?"
      )
    ) {
      alert("Corbeille vidée!");
      setShowEmptyWarning(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Mon Compte", icon: User },
    { id: "users", label: "Gestion Utilisateurs", icon: Users },
    { id: "permissions", label: "Autorisations", icon: Shield },
    { id: "trash", label: "Corbeille", icon: Trash2 },
  ];

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    sidebarBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100"
      : "bg-white border-gray-300 text-gray-900",
    button: isDarkMode
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex`}>
      {/* Sidebar */}
      <div className={`w-64 ${themeClasses.sidebarBg} shadow-lg`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="text-blue-600" size={28} />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>
              Paramètres
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-8`}>
          {activeTab === "profile" && (
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                Modifier mon compte
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    value={adminProfile.nom}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, nom: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={adminProfile.prenom}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        prenom: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        email: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminProfile.currentPassword}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          currentPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-3.5 ${themeClasses.textSecondary}`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={adminProfile.newPassword}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          newPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-4 top-3.5 ${themeClasses.textSecondary}`}
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                  >
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={adminProfile.confirmPassword}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                  />
                </div>
              </div>

              <button
                onClick={handleProfileUpdate}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={20} />
                Sauvegarder les modifications
              </button>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                Gestion des utilisateurs
              </h2>

              {/* Créer un utilisateur */}
              <div
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } p-6 rounded-xl`}
              >
                <h3
                  className={`text-lg font-semibold ${themeClasses.text} mb-6`}
                >
                  Créer un nouvel utilisateur
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Recherche d'employé */}
                  <div className="relative">
                    <label
                      className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                    >
                      <Search size={16} className="inline mr-1" />
                      Rechercher un employé
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => {
                          setEmployeeSearch(e.target.value);
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder="Tapez pour rechercher..."
                        className={`w-full px-4 py-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                      />
                      <ChevronDown
                        size={20}
                        className={`absolute right-3 top-3.5 ${themeClasses.textSecondary}`}
                      />

                      {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div
                          className={`absolute z-10 w-full mt-1 ${themeClasses.cardBg} border ${themeClasses.border} rounded-lg shadow-lg max-h-60 overflow-y-auto`}
                        >
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              onClick={() => handleEmployeeSelect(emp)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 ${
                                themeClasses.text
                              } border-b ${
                                themeClasses.border
                              } last:border-b-0 ${
                                isDarkMode
                                  ? "hover:bg-gray-600"
                                  : "hover:bg-blue-50"
                              }`}
                            >
                              <div className="font-medium">
                                {emp.prenom} {emp.nom}
                              </div>
                              <div
                                className={`text-sm ${themeClasses.textSecondary}`}
                              >
                                {emp.poste}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email généré */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                    >
                      <Mail size={16} className="inline mr-1" />
                      Email généré
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          email: e.target.value,
                        })
                      }
                      placeholder="L'email sera généré automatiquement"
                      className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                    />
                  </div>

                  {/* Mot de passe généré */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                    >
                      <Key size={16} className="inline mr-1" />
                      Mot de passe généré
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
                        placeholder="Mot de passe généré automatiquement"
                        className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                      />
                      <button
                        onClick={() =>
                          setNewUserData({
                            ...newUserData,
                            password: generatePassword(),
                          })
                        }
                        className="px-3 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        title="Générer un nouveau mot de passe"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateUser}
                  disabled={
                    !selectedEmployee ||
                    !newUserData.email ||
                    !newUserData.password
                  }
                  className="mt-6 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  Créer l'utilisateur
                </button>
              </div>

              {/* Liste des utilisateurs */}
              <div>
                <h3
                  className={`text-lg font-semibold ${themeClasses.text} mb-6`}
                >
                  Utilisateurs existants
                </h3>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`${themeClasses.cardBg} border ${themeClasses.border} p-6 rounded-xl`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              user.status === "active"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <User size={24} />
                          </div>
                          <div>
                            <h4
                              className={`font-semibold ${themeClasses.text}`}
                            >
                              {user.prenom} {user.nom}
                            </h4>
                            <p
                              className={`text-sm ${themeClasses.textSecondary}`}
                            >
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.status === "active" ? "Actif" : "Bloqué"}
                              </span>
                              <span
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                Dernière connexion: {user.lastLogin}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === "active"
                                ? "text-red-600 hover:bg-red-100"
                                : "text-green-600 hover:bg-green-100"
                            }`}
                            title={
                              user.status === "active" ? "Bloquer" : "Débloquer"
                            }
                          >
                            {user.status === "active" ? (
                              <Lock size={18} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal de modification */}
              {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div
                    className={`${themeClasses.cardBg} p-8 rounded-xl w-full max-w-md`}
                  >
                    <h3
                      className={`text-xl font-bold ${themeClasses.text} mb-6`}
                    >
                      Modifier {editingUser.prenom} {editingUser.nom}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          value={editingUser.newEmail}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              newEmail: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
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
                            value={editingUser.newPassword}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                newPassword: e.target.value,
                              })
                            }
                            className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                          />
                          <button
                            onClick={() =>
                              setEditingUser({
                                ...editingUser,
                                newPassword: generatePassword(),
                              })
                            }
                            className="px-3 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={handleUpdateUser}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className={`flex-1 py-3 rounded-lg transition-colors ${
                          isDarkMode
                            ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                Gestion des rôles et autorisations
              </h2>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Sélectionner un utilisateur
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className={`w-full max-w-md px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} (
                      {user.status === "active" ? "Actif" : "Bloqué"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div
                  className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-8`}
                >
                  <h3
                    className={`text-xl font-semibold ${themeClasses.text} mb-6`}
                  >
                    Autorisations pour{" "}
                    {users.find((u) => u.id === parseInt(selectedUser))?.prenom}{" "}
                    {users.find((u) => u.id === parseInt(selectedUser))?.nom}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {permissions.map((permission) => {
                      const userPermissions =
                        users.find((u) => u.id === parseInt(selectedUser))
                          ?.permissions || {};
                      const isEnabled = userPermissions[permission];

                      return (
                        <div
                          key={permission}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-50"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${themeClasses.text}`}
                          >
                            {permission}
                          </span>
                          <button
                            onClick={() =>
                              handlePermissionChange(
                                parseInt(selectedUser),
                                permission
                              )
                            }
                            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                              isEnabled
                                ? "bg-green-500"
                                : isDarkMode
                                ? "bg-gray-600"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 mt-1 ml-1 transform rounded-full bg-white transition-transform ${
                                isEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "trash" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                  Corbeille
                </h2>
                <button
                  onClick={() => setShowEmptyWarning(true)}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={20} />
                  Vider la corbeille
                </button>
              </div>

              {showEmptyWarning && (
                <div
                  className={`border border-red-200 rounded-xl p-6 ${
                    isDarkMode ? "bg-red-900 bg-opacity-20" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="text-red-600" size={32} />
                    <div>
                      <h3
                        className={`font-semibold text-red-900 ${
                          isDarkMode ? "text-red-300" : ""
                        }`}
                      >
                        Attention!
                      </h3>
                      <p
                        className={`text-red-700 ${
                          isDarkMode ? "text-red-400" : ""
                        }`}
                      >
                        Cette action supprimera définitivement tous les éléments
                        de la corbeille. Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleEmptyTrash}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirmer la suppression
                    </button>
                    <button
                      onClick={() => setShowEmptyWarning(false)}
                      className={`px-6 py-3 rounded-lg transition-colors ${
                        isDarkMode
                          ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {deletedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`${themeClasses.cardBg} border ${themeClasses.border} p-6 rounded-xl`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            item.type === "Élève"
                              ? "bg-blue-100 text-blue-600"
                              : item.type === "Professeur"
                              ? "bg-green-100 text-green-600"
                              : item.type === "Employé"
                              ? "bg-purple-100 text-purple-600"
                              : item.type === "Note"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.type === "Élève" ? (
                            <User size={20} />
                          ) : item.type === "Professeur" ? (
                            <UserCheck size={20} />
                          ) : item.type === "Employé" ? (
                            <Users size={20} />
                          ) : item.type === "Note" ? (
                            <Edit3 size={20} />
                          ) : (
                            <Mail size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-medium ${
                                item.type === "Élève"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.type === "Professeur"
                                  ? "bg-green-100 text-green-800"
                                  : item.type === "Employé"
                                  ? "bg-purple-100 text-purple-800"
                                  : item.type === "Note"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.type}
                            </span>
                            <h4
                              className={`font-semibold ${themeClasses.text}`}
                            >
                              {item.nom}
                            </h4>
                          </div>
                          <p
                            className={`text-sm ${themeClasses.textSecondary}`}
                          >
                            {item.details}
                          </p>
                          <p
                            className={`text-xs ${themeClasses.textSecondary} mt-1`}
                          >
                            Supprimé le: {item.dateSupression}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <RefreshCw size={16} />
                          Restaurer
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X size={16} />
                          Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
