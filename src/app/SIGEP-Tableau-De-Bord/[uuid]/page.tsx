"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  GraduationCap,
  UserCheck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Calendar,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Pencil,
  ShieldAlert,
  Lock,
  Shield,
} from "lucide-react";
import TableauDeBord from "../../../module/Daphboard/TableauDeBord";
import ElevesPage from "../../../module/Eleves/ElevesPage";
import NotesPage from "../../../module/Notes/Notes";
import FraisScolaritePage from "../../../module/Paiements/Paiements";
import GestionProfesseurs from "../../../module/Professeur/Professeur";
import GestionAnneeScolaire from "../../../module/AnneeAcademique/GestionAnneeScolaire";
import GestionEmployer from "../../../module/Employer/Employer";
import Image from "next/image";
import CalendrierScolaire from "@/module/Calendrier/Calendrier";
import Rapport from "@/module/Rapport/Rapport";
import AdminSettingsPage from "@/module/Parametre/Parametre";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import ProtectedRoute, { useRouteProtection } from "@/components/ProtectedPage";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import Spinner from "@/utils/Spinner/Spinner";
import { SUPER_ADMIN_CREDENTIALS } from "@/Config/SuperAdmin/SuperAdmin";
import ProfilModal from "@/components/ProfilModal";

interface User {
  name?: string;
  role?: string;
  avatar?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success";
}

interface SidebarItem {
  id: string;
  icon: any;
  label: string;
}

// Fonction pour vérifier si c'est le Super Admin
const isSuperAdmin = (session: any): boolean => {
  if (typeof window !== "undefined") {
    const superAdminSession = localStorage.getItem("superadmin_session");
    if (superAdminSession) {
      return true;
    }
  }

  if (!session || !session.user) return false;

  const userEmail = session.user.email?.toLowerCase();
  if (userEmail === SUPER_ADMIN_CREDENTIALS.email.toLowerCase()) {
    return true;
  }

  if (session.user.id === SUPER_ADMIN_CREDENTIALS.id) {
    return true;
  }

  return false;
};

const Dashboard: React.FC = () => {
  const { currentYear } = useAnneeScolaire();
  const { currentSession, GetUtilisateurAutorisations, GetProfilPhoto } =
    useContextUtilisateur();
  const { handleLogout, isLoggingOut } = useRouteProtection();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Tableau de Bord");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("/avatar.png");

  // Charger la photo de profil au montage
  const handlePhotoUpdate = (newPhotoUrl: string) => {
    setProfilePhoto(newPhotoUrl);
  };
  useEffect(() => {
    if (currentSession?.user?.id) {
      const savedPhoto = GetProfilPhoto(currentSession.user.id);

      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      } else {
        setProfilePhoto("/avatar.png");
      }
    }
  }, [currentSession, GetProfilPhoto]);
  // Données de l'utilisateur
  const currentUser: User = {
    name: isUserSuperAdmin
      ? "Compte Système"
      : currentSession
      ? currentSession.employer?.nom + " " + currentSession.employer?.prenom
      : "SIGEP",
    role: isUserSuperAdmin
      ? "Super Administrateur / Accès Total"
      : currentSession
      ? currentSession.employer?.departement +
        "/" +
        currentSession.employer?.fonction
      : "utilisateur",
    avatar: profilePhoto,
  };

  // Tous les items du sidebar possibles
  const allSidebarItems: SidebarItem[] = [
    {
      id: "dashboard",
      icon: <Home className="w-5 h-5" />,
      label: "Tableau de Bord",
    },
    {
      id: "students",
      icon: <GraduationCap className="w-5 h-5" />,
      label: "Élèves",
    },
    {
      id: "Notes",
      icon: <Pencil className="w-5 h-5" />,
      label: "Notes",
    },
    {
      id: "teachers",
      icon: <UserCheck className="w-5 h-5" />,
      label: "Professeurs",
    },
    {
      id: "employees",
      icon: <Users className="w-5 h-5" />,
      label: "Employés",
    },
    {
      id: "payments",
      icon: <CreditCard className="w-5 h-5" />,
      label: "Paiements",
    },
    {
      id: "reports",
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Rapports",
    },
    {
      id: "calendar",
      icon: <Calendar className="w-5 h-5" />,
      label: "Calendrier",
    },
  ];

  // Charger les autorisations de l'utilisateur
  useEffect(() => {
    const loadUserPermissions = async () => {
      setLoading(true);

      // Vérifier d'abord si c'est le Super Admin
      const checkSuperAdmin = isSuperAdmin(currentSession);
      setIsUserSuperAdmin(checkSuperAdmin);

      if (checkSuperAdmin) {
        // Super Admin a TOUTES les permissions
        console.log("🔐 Super Admin détecté - Accès complet accordé");
        setUserPermissions([
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
        ]);
        setLoading(false);
        return;
      }

      // Pour les utilisateurs normaux
      if (currentSession?.user?.id) {
        try {
          const permissions = await GetUtilisateurAutorisations(
            currentSession.user.id
          );
          setUserPermissions(permissions || []);

          if (permissions && permissions.length > 0) {
            setActiveMenu(permissions[0]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des autorisations:", error);
          setUserPermissions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, [GetUtilisateurAutorisations, currentSession]);

  // Vérifier si l'utilisateur a une autorisation spécifique
  const hasPermission = (permission: string): boolean => {
    // Super Admin a toutes les permissions
    if (isUserSuperAdmin) {
      return true;
    }
    return userPermissions.includes(permission);
  };

  // Filtrer les items du sidebar en fonction des autorisations
  const sidebarItems = isUserSuperAdmin
    ? allSidebarItems // Super Admin voit tout
    : allSidebarItems.filter((item) => hasPermission(item.label));

  const handleMenuChange = (menuLabel: string) => {
    // Super Admin peut accéder à tout
    if (isUserSuperAdmin || hasPermission(menuLabel)) {
      setActiveMenu(menuLabel);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notification-menu")) setShowNotifications(false);
      if (!target.closest(".user-menu")) setShowUserMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const activeYear = currentYear ? { label: currentYear.year } : null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const renderMainContent = () => {
    // Si aucune autorisation et pas Super Admin
    if (userPermissions.length === 0 && !isUserSuperAdmin) {
      return null;
    }

    // Super Admin peut tout voir, sinon vérifier permission
    if (!isUserSuperAdmin && !hasPermission(activeMenu)) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Lock
              className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <h3
              className={`text-xl font-semibold mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Accès refusé
            </h3>
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Vous n'avez pas l'autorisation d'accéder à cette page
            </p>
          </div>
        </div>
      );
    }

    // Afficher le composant correspondant
    switch (activeMenu) {
      case "Tableau de Bord":
        return <TableauDeBord isDarkMode={isDarkMode} />;
      case "Années Scolaires":
        return (
          <GestionAnneeScolaire
            isSuperAdmin={isUserSuperAdmin}
            isDarkMode={isDarkMode}
          />
        );
      case "Élèves":
        return <ElevesPage isDarkMode={isDarkMode} />;
      case "Notes":
        return <NotesPage isDarkMode={isDarkMode} />;
      case "Professeurs":
        return <GestionProfesseurs isDarkMode={isDarkMode} />;
      case "Employés":
        return <GestionEmployer isDarkMode={isDarkMode} />;
      case "Paiements":
        return <FraisScolaritePage isDarkMode={isDarkMode} />;
      case "Rapports":
        return <Rapport darkMode={isDarkMode} />;
      case "Calendrier":
        return <CalendrierScolaire darkMode={isDarkMode} />;
      case "Paramètres":
        return <AdminSettingsPage isDarkMode={isDarkMode} />;
      default:
        return <TableauDeBord isDarkMode={isDarkMode} />;
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen transition-all duration-300 ${
          isDarkMode
            ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100"
            : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-amber-50/30 text-gray-900"
        }`}
      >
        {/* Badge Super Admin flottant */}
        {isUserSuperAdmin && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg animate-pulse">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-bold">MODE SUPER ADMIN</span>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {userPermissions.length > 0 && (
          <aside
            className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-80"
            } ${
              isDarkMode
                ? "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 border-gray-700/50 shadow-2xl"
                : "bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50 shadow-xl"
            } border-r backdrop-blur-sm`}
          >
            {/* Header du sidebar */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Logo" width={50} height={50} />
                {!sidebarCollapsed && (
                  <div>
                    <h1
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      SIGEP
                    </h1>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {isUserSuperAdmin ? "Super Admin" : "Gestion Scolaire"}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                  isDarkMode
                    ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                {sidebarCollapsed ? (
                  <Menu className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-4">
              <ul className="space-y-3">
                {sidebarItems.map((item) => {
                  const isActive = activeMenu === item.label;
                  return (
                    <li key={item.id}>
                      <button
                        className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 text-left group relative overflow-hidden ${
                          isActive
                            ? isDarkMode
                              ? "bg-gradient-to-r from-blue-600/90 to-amber-500/90 text-white shadow-lg transform scale-105 shadow-blue-500/25"
                              : "bg-gradient-to-r from-blue-600 to-amber-500 text-white shadow-lg transform scale-105 shadow-blue-500/25"
                            : isDarkMode
                            ? "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:transform hover:scale-102"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-amber-50 hover:transform hover:scale-102"
                        }`}
                        onClick={() => handleMenuChange(item.label)}
                      >
                        <span
                          className={`flex-shrink-0 transition-transform duration-200 ${
                            isActive ? "scale-110" : "group-hover:scale-105"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="ml-3 font-medium transition-all duration-300">
                            {item.label}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-amber-400/20 animate-pulse"></div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        )}

        {/* Contenu principal */}
        <main
          className={`transition-all duration-300 ${
            userPermissions.length > 0
              ? sidebarCollapsed
                ? "ml-20"
                : "ml-80"
              : "ml-0"
          }`}
        >
          {/* Header */}
          <header
            className={`border-b px-6 py-4 backdrop-blur-lg sticky top-0 z-30 ${
              isDarkMode
                ? "bg-gray-800/80 border-gray-700/50 shadow-lg"
                : "bg-white/80 border-gray-200/50 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {userPermissions.length > 0 ? (
                  <>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-amber-500 bg-clip-text text-transparent">
                      {activeMenu}
                    </h2>

                    {hasPermission("Années Scolaires") && (
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => handleMenuChange("Années Scolaires")}
                          className="flex items-center cursor-pointer space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            {activeYear?.label || "Aucune année"}
                          </span>
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            Actuelle
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-red-600">
                    Accès refusé
                  </h2>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-110 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-amber-400 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-yellow-500/20 hover:shadow-lg hover:shadow-amber-500/25"
                      : "text-gray-500 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-sky-500/20 hover:shadow-lg hover:shadow-blue-500/25"
                  }`}
                  title={isDarkMode ? "Mode clair" : "Mode sombre"}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>

                {/* Menu utilisateur */}
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                      isDarkMode
                        ? "hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                        : "hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                    }`}
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className={`w-10 h-10 rounded-full object-cover ring-2 ${
                        isUserSuperAdmin ? "ring-purple-500" : "ring-blue-500"
                      } ring-offset-2 dark:ring-offset-gray-800 transition-transform duration-200 hover:scale-110`}
                    />
                    <div className="text-left hidden md:block">
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {currentUser.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {currentUser.role}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showUserMenu ? "rotate-180" : ""
                      } ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    />
                  </button>

                  {showUserMenu && (
                    <div
                      className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border py-3 z-50 backdrop-blur-lg ${
                        isDarkMode
                          ? "bg-gray-800/95 border-gray-700/50"
                          : "bg-white/95 border-gray-200/50"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 border-b ${
                          isDarkMode
                            ? "border-gray-700/50"
                            : "border-gray-200/50"
                        }`}
                      >
                        <p
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {currentUser.name}
                        </p>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {currentUser.role}
                        </p>
                      </div>
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center hover:scale-105 ${
                          isDarkMode
                            ? "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                        }`}
                        onClick={() => setShowProfilModal(true)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Mon profil
                      </button>
                      {hasPermission("Paramètres") && (
                        <button
                          className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center hover:scale-105 ${
                            isDarkMode
                              ? "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                          }`}
                          onClick={() => setActiveMenu("Paramètres")}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Paramètres
                        </button>
                      )}
                      <hr
                        className={`my-2 ${
                          isDarkMode
                            ? "border-gray-700/50"
                            : "border-gray-200/50"
                        }`}
                      />
                      <button
                        className={`w-full text-left px-4 py-2 text-sm text-red-600 transition-all duration-200 flex items-center hover:scale-105 ${
                          isDarkMode
                            ? "hover:bg-gradient-to-r hover:from-red-900/30 hover:to-red-800/30"
                            : "hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100"
                        }`}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Contenu */}
          <div className="min-h-screen">
            {userPermissions.length === 0 && !isUserSuperAdmin ? (
              <div className="flex items-center justify-center min-h-[80vh]">
                <div
                  className={`text-center p-12 rounded-2xl ${
                    isDarkMode ? "bg-gray-800/50" : "bg-white/50"
                  } backdrop-blur-sm border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  } max-w-lg mx-4`}
                >
                  <ShieldAlert
                    className={`w-20 h-20 mx-auto mb-6 ${
                      isDarkMode ? "text-red-400" : "text-red-500"
                    }`}
                  />
                  <h2
                    className={`text-3xl font-bold mb-4 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Aucune autorisation
                  </h2>
                  <p
                    className={`text-lg mb-6 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Vous n'avez actuellement aucun droit d'accès au système.
                  </p>
                  <div
                    className={`p-4 rounded-lg mb-6 ${
                      isDarkMode
                        ? "bg-yellow-900/20 border-yellow-800"
                        : "bg-yellow-50 border-yellow-200"
                    } border`}
                  >
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-yellow-300" : "text-yellow-800"
                      }`}
                    >
                      Veuillez contacter l'administrateur système pour obtenir
                      les autorisations nécessaires.
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                  >
                    {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                  </button>
                </div>
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </main>
        <ProfilModal
          isOpen={showProfilModal}
          onClose={() => setShowProfilModal(false)}
          isDarkMode={isDarkMode}
          onPhotoUpdate={handlePhotoUpdate}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
