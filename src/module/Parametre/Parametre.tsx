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
  X,
  Search,
  Lock,
  Unlock,
  ChevronDown,
  UserCheck,
  Mail,
  Key,
} from "lucide-react";
import MonCompte from "./Composant/MonCompte";
import GestionUtilisateur from "./Composant/GestionUtilisateur";
import Roles from "./Composant/Roles";
import Corbeille from "./Composant/Corbeille";

interface Props {
  isDarkMode: boolean;
}
const AdminSettingsPage = ({ isDarkMode }: Props) => {
  const [activeTab, setActiveTab] = useState("profile");

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
          {activeTab === "profile" && <MonCompte isDarkMode={isDarkMode} />}

          {activeTab === "users" && (
            <GestionUtilisateur isDarkMode={isDarkMode} />
          )}

          {activeTab === "permissions" && <Roles isDarkMode={isDarkMode} />}

          {activeTab === "trash" && <Corbeille isDarkMode={isDarkMode} />}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
