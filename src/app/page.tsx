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
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Pencil,
} from "lucide-react";
import TableauDeBord from "../module/Daphboard/TableauDeBord";
import ElevesPage from "../module/Eleves/ElevesPage";
import NotesPage from "../module/Notes/Notes";
import FraisScolaritePage from "../module/Paiements/Paiements";
import GestionProfesseurs from "../module/Professeur/Professeur";
import NewYearModal from "../module/AnneeAcademique/ConfigurationAn ee";
import GestionEmployer from "../module/Employer/Employer";
import Image from "next/image";
import CalendrierScolaire from "@/module/Calendrier/Calendrier";
import Rapport from "@/module/Rapport/Rapport";
import AdminSettingsPage from "@/module/Parametre/Parametre";

interface User {
  name: string;
  role: string;
  avatar: string;
}

export interface SchoolYear {
  id: string;
  label: string;
  isActive: boolean;
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

const Dashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Tableau de Bord"); // State pour gérer le menu actif
  const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
  const [selectedYearForConfig, setSelectedYearForConfig] = useState<
    string | null
  >(null);
  const [yearConfigurations, setYearConfigurations] = useState<{
    [key: string]: any;
  }>({});

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([
    { id: "2024-2025", label: "2024-2025", isActive: true },
    { id: "2023-2024", label: "2023-2024", isActive: false },
    { id: "2022-2023", label: "2022-2023", isActive: false },
  ]);

  // Données de démonstration
  const currentUser: User = {
    name: "Brenord Fritzly",
    role: "Administrateur",
    avatar: "/profil.jpg",
  };

  const notifications: Notification[] = [
    {
      id: "1",
      title: "Nouveau paiement",
      message: "Élève Jean Martin a effectué son paiement mensuel",
      time: "Il y a 5 minutes",
      type: "success",
    },
    {
      id: "2",
      title: "Absence signalée",
      message: "3 élèves absents en classe de 6ème A",
      time: "Il y a 15 minutes",
      type: "warning",
    },
    {
      id: "3",
      title: "Réunion programmée",
      message: "Conseil pédagogique prévu demain à 14h",
      time: "Il y a 1 heure",
      type: "info",
    },
  ];

  // Items du sidebar avec gestion dynamique de l'état actif
  const sidebarItems: SidebarItem[] = [
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
    {
      id: "settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Paramètres",
    },
  ];

  const handleMenuChange = (menuLabel: string) => {
    setActiveMenu(menuLabel);
  };

  const applyAsActiveYear = (yearId: string) => {
    setSchoolYears((prev) =>
      prev.map((y) => ({ ...y, isActive: y.id === yearId }))
    );
    setShowYearSelector(false);
  };

  const yearsLabels = schoolYears.map((year) => year.label);

  const handleSaveYearConfiguration = (config: any) => {
    setYearConfigurations((prev) => ({
      ...prev,
      [config.year]: config,
    }));
    setIsNewYearModalOpen(false);
    setSelectedYearForConfig(null);
  };

  const handleDeleteYearConfiguration = (year: string) => {
    const newConfigurations = { ...yearConfigurations };
    delete newConfigurations[year];
    setYearConfigurations(newConfigurations);
    setIsNewYearModalOpen(false);
    setSelectedYearForConfig(null);
  };

  const openNewYearModal = (mode: "create" | "edit", yearId?: string) => {
    if (mode === "edit" && yearId) {
      setSelectedYearForConfig(yearId);
    } else {
      setSelectedYearForConfig(null);
    }
    setIsNewYearModalOpen(true);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notification-menu")) setShowNotifications(false);
      if (!target.closest(".user-menu")) setShowUserMenu(false);
      if (!target.closest(".year-selector")) setShowYearSelector(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const activeYear = schoolYears.find((year) => year.isActive);

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
    switch (activeMenu) {
      case "Tableau de Bord":
        return <TableauDeBord isDarkMode={isDarkMode} />;
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

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDarkMode
          ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-amber-50/30 text-gray-900"
      }`}
    >
      {/* Sidebar */}
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
                  Gestion Scolaire
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

        {/* Bouton déconnexion */}
        <div className="absolute bottom-6 left-4 right-4"></div>
      </aside>

      {/* Contenu principal */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-80"
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-amber-500 bg-clip-text text-transparent">
                {activeMenu}
              </h2>

              {/* Sélecteur d'année scolaire */}
              <div className="relative year-selector">
                <button
                  onClick={() => setShowYearSelector(!showYearSelector)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{activeYear?.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showYearSelector && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl border py-3 z-50 backdrop-blur-lg ${
                      isDarkMode
                        ? "bg-gray-800/95 border-gray-700/50"
                        : "bg-white/95 border-gray-200/50"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 border-b ${
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                      }`}
                    >
                      <h4
                        className={`font-semibold text-sm ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Années scolaires
                      </h4>
                    </div>
                    {schoolYears.map((year) => (
                      <div key={year.id} className="px-3 py-1">
                        <div className="space-y-2">
                          <button
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                              year.isActive
                                ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30"
                                : isDarkMode
                                ? "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                                : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                            }`}
                            onClick={() => applyAsActiveYear(year.id)}
                            disabled={year.isActive}
                          >
                            <div className="flex items-center justify-between">
                              <span>{year.label}</span>
                              {year.isActive && (
                                <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full shadow-sm">
                                  Actuelle
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Boutons pour appliquer/éditer */}
                          <div className="flex space-x-1">
                            <button
                              className={`flex-1 px-2 py-1 text-xs rounded transition-all duration-200 ${
                                year.isActive
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                              onClick={() => applyAsActiveYear(year.id)}
                              disabled={year.isActive}
                            >
                              Appliquer
                            </button>
                            <button
                              className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200"
                              onClick={() => openNewYearModal("edit", year.id)}
                            >
                              Éditer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Bouton pour créer une nouvelle année */}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        className="w-full px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                        onClick={() => openNewYearModal("create")}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Créer une nouvelle année</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Toggle thème */}
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

              {/* Notifications */}
              <div className="relative notification-menu">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-110 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse shadow-lg">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border py-3 z-50 max-h-96 overflow-y-auto backdrop-blur-lg ${
                      isDarkMode
                        ? "bg-gray-800/95 border-gray-700/50"
                        : "bg-white/95 border-gray-200/50"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 border-b ${
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                      }`}
                    >
                      <h3
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Notifications récentes
                      </h3>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b last:border-b-0 transition-all duration-200 hover:scale-102 cursor-pointer ${
                          isDarkMode
                            ? "hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-600/30 border-gray-600/50"
                            : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border-gray-100"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p
                              className={`text-sm mt-1 line-clamp-2 ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2">
                              <Clock className="w-3 h-3 text-gray-400 mr-1" />
                              <p className="text-xs text-gray-500">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div
                      className={`px-4 py-2 border-t ${
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                      }`}
                    >
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                        Voir toutes les notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800 transition-transform duration-200 hover:scale-110"
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
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
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
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon profil
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center hover:scale-105 ${
                        isDarkMode
                          ? "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                      }`}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Paramètres
                    </button>
                    <hr
                      className={`my-2 ${
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                      }`}
                    />
                    <button
                      className={`w-full text-left px-4 py-2 text-sm text-red-600 transition-all duration-200 flex items-center hover:scale-105 ${
                        isDarkMode
                          ? "hover:bg-gradient-to-r hover:from-red-900/30 hover:to-red-800/30"
                          : "hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100"
                      }`}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <div className="min-h-screen">{renderMainContent()}</div>
        <NewYearModal
          isOpen={isNewYearModalOpen}
          onClose={() => setIsNewYearModalOpen(false)}
          existingYears={yearsLabels}
          isDarkMode={isDarkMode}
          mode={selectedYearForConfig ? "edit" : "create"}
          initialConfig={
            selectedYearForConfig
              ? yearConfigurations[selectedYearForConfig] || {
                  year: selectedYearForConfig,
                  description: "",
                  levels: [],
                }
              : undefined
          }
          onSave={handleSaveYearConfiguration}
          onDelete={handleDeleteYearConfiguration}
        />
      </main>
    </div>
  );
};

export default Dashboard;
