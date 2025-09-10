import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Activity,
  User,
  CreditCard,
  UserX,
  UserCheck,
  Clock,
  CheckCircle,
  GraduationCap,
  BookOpen,
  School,
  Award,
  Calendar,
} from "lucide-react";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  illustration: React.ReactNode;
  color: string;
}

interface Props {
  isDarkMode: boolean;
}

const TableauDeBord = ({ isDarkMode }: Props) => {
  // Illustrations académiques élégantes
  const StudentGirlIllustration = () => (
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
          <span className="text-2xl">👩‍🎓</span>
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        <span className="text-xs text-rose-600 font-bold">♀</span>
      </div>
    </div>
  );

  const StudentBoyIllustration = () => (
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
          <span className="text-2xl">👨‍🎓</span>
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        <span className="text-xs text-blue-600 font-bold">♂</span>
      </div>
    </div>
  );

  const TeacherIllustration = () => (
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-amber-600" />
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        <BookOpen className="w-3 h-3 text-amber-600" />
      </div>
    </div>
  );

  const EmployeeIllustration = () => (
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
          <Users className="w-7 h-7 text-emerald-600" />
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        <Award className="w-3 h-3 text-emerald-600" />
      </div>
    </div>
  );

  const statsCards: StatsCard[] = [
    {
      title: "Élèves Filles",
      value: "634",
      change: "+3.2%",
      changeType: "increase",
      illustration: <StudentGirlIllustration />,
      color: "rose",
    },
    {
      title: "Élèves Garçons",
      value: "600",
      change: "+2.1%",
      changeType: "increase",
      illustration: <StudentBoyIllustration />,
      color: "blue",
    },
    {
      title: "Corps Enseignant",
      value: "89",
      change: "+2.1%",
      changeType: "increase",
      illustration: <TeacherIllustration />,
      color: "amber",
    },
    {
      title: "Personnel Administratif",
      value: "42",
      change: "-1.5%",
      changeType: "decrease",
      illustration: <EmployeeIllustration />,
      color: "emerald",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      rose: " border-2 border-rose-200 hover:border-rose-300 hover:shadow-rose-100",
      blue: " border-2 border-blue-200 hover:border-blue-300 hover:shadow-blue-100",
      amber:
        " border-2 border-amber-200 hover:border-amber-300 hover:shadow-amber-100",
      emerald:
        " border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-100",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  // Données pour les graphiques

  const enrollmentByYearData = [
    { year: "2020-21", Filles: 580, Garçons: 570 },
    { year: "2021-22", Filles: 595, Garçons: 580 },
    { year: "2022-23", Filles: 610, Garçons: 590 },
    { year: "2023-24", Filles: 625, Garçons: 595 },
    { year: "2024-25", Filles: 634, Garçons: 600 },
  ];

  const genderDistributionData = [
    { name: "Élèves Filles", value: 634, color: "#e11d48" },
    { name: "Élèves Garçons", value: 600, color: "#1e40af" },
  ];

  const COLORS = ["#e11d48", "#1e40af"];

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-slate-900" : "bg-gray-50"}`}
    >
      {/* Header avec logo et titre */}
      <div
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border-b shadow-sm`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Tableau de Bord - SIGEP
              </h1>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Année Scolaire 2024-2025 • Dernière mise à jour:{" "}
                {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Cartes statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className={`${getColorClasses(
                card.color
              )} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wide ${
                        isDarkMode ? "text-gray-600" : "text-gray-600"
                      }`}
                    >
                      {card.title}
                    </h3>
                  </div>
                  <p
                    className={`text-3xl font-bold mb-3 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {card.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    {card.changeType === "increase" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        card.changeType === "increase"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {card.change}
                    </span>
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ce mois
                    </span>
                  </div>
                </div>
                <div className="ml-4 transform hover:scale-110 transition-transform duration-200">
                  {card.illustration}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section principale avec graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des inscriptions */}
          <div
            className={`rounded-2xl p-6 shadow-lg border ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Évolution des Inscriptions par Année Scolaire
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  } mt-1`}
                >
                  Croissance des effectifs sur 5 années
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentByYearData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="year"
                    stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Filles" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Garçons" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="flex items-center space-x-2 p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Filles: 634
                </span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Garçons: 600
                </span>
              </div>
            </div>
          </div>

          {/* Répartition par genre */}
          <div
            className={`rounded-2xl p-6 shadow-lg border ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Répartition des Élèves
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  } mt-1`}
                >
                  Par genre
                </p>
              </div>
              <div className="p-3 bg-pink-100 rounded-xl">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <p
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-gray-100"
                }`}
              >
                Total: 1,234 élèves
              </p>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-300"
                } mt-1`}
              >
                Effectif total de l'établissement
              </p>
            </div>
          </div>
        </div>

        {/* Sections détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition par Classe */}
          <div
            className={`rounded-2xl p-6 shadow-lg border ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Effectifs par Classe
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Distribution collège et lycée
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  level: "6ème",
                  students: 245,
                  color: "bg-blue-500",
                  category: "Collège",
                },
                {
                  level: "5ème",
                  students: 238,
                  color: "bg-green-500",
                  category: "Collège",
                },
                {
                  level: "4ème",
                  students: 232,
                  color: "bg-yellow-500",
                  category: "Collège",
                },
                {
                  level: "3ème",
                  students: 219,
                  color: "bg-purple-500",
                  category: "Collège",
                },
                {
                  level: "2nde",
                  students: 203,
                  color: "bg-pink-500",
                  category: "Lycée",
                },
                {
                  level: "1ère",
                  students: 195,
                  color: "bg-indigo-500",
                  category: "Lycée",
                },
                {
                  level: "Terminale",
                  students: 189,
                  color: "bg-red-500",
                  category: "Lycée",
                },
              ].map((item, index) => (
                <div
                  key={item.level}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-5 h-5 rounded-full ${item.color} shadow-sm`}
                    ></div>
                    <div>
                      <span
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.level}
                      </span>
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          isDarkMode
                            ? "bg-slate-600 text-slate-300"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {item.students}
                    </span>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      élèves
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs de performance */}
          <div
            className={`rounded-2xl p-6 shadow-lg border ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Indicateurs de Performance
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Suivi de la qualité éducative
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {[
                {
                  category: "Taux de Présence des Enseignants",
                  value: 87,
                  total: 89,
                  percentage: 98,
                  color: "bg-green-500",
                  icon: <GraduationCap className="w-4 h-4" />,
                },
                {
                  category: "Personnel Administratif Présent",
                  value: 40,
                  total: 42,
                  percentage: 95,
                  color: "bg-blue-500",
                  icon: <Users className="w-4 h-4" />,
                },
                {
                  category: "Cours Dispensés",
                  value: 142,
                  total: 145,
                  percentage: 98,
                  color: "bg-purple-500",
                  icon: <BookOpen className="w-4 h-4" />,
                },
                {
                  category: "Satisfaction des Élèves",
                  value: 91,
                  total: 100,
                  percentage: 91,
                  color: "bg-amber-500",
                  icon: <Award className="w-4 h-4" />,
                },
              ].map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 ${item.color
                          .replace("bg-", "bg-")
                          .replace("-500", "-100")} rounded-lg`}
                      >
                        <div
                          className={`${item.color.replace("bg-", "text-")}`}
                        >
                          {item.icon}
                        </div>
                      </div>
                      <span
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${item.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      >
                        {item.percentage}%
                      </span>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {item.value}/{item.total}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-full rounded-full h-3 ${
                      isDarkMode ? "bg-slate-700" : "bg-gray-200"
                    } shadow-inner`}
                  >
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${item.color} shadow-sm`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activités récentes avec style académique */}
        <div
          className={`rounded-2xl p-6 shadow-lg border ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Journal des Activités Récentes
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Dernières opérations et événements
                </p>
              </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                action: "Nouvelle Inscription",
                details:
                  "Sophie Martin - Classe de 5ème B (Section Scientifique)",
                time: "Il y a 2 heures",
                type: "success",
                icon: <User className="w-4 h-4" />,
                badge: "Nouvelle Élève",
              },
              {
                action: "Règlement Reçu",
                details: "Famille Dubois - Frais de scolarité Q2 2024-2025",
                time: "Il y a 3 heures",
                type: "info",
                icon: <CreditCard className="w-4 h-4" />,
                badge: "Paiement",
              },
              {
                action: "Absence Signalée",
                details:
                  "Pierre Durand - Classe de 3ème A (Justificatif requis)",
                time: "Il y a 4 heures",
                type: "warning",
                icon: <UserX className="w-4 h-4" />,
                badge: "Absence",
              },
              {
                action: "Recrutement",
                details: "Mme Claire Rousseau - Professeure de Mathématiques",
                time: "Il y a 1 jour",
                type: "success",
                icon: <UserCheck className="w-4 h-4" />,
                badge: "Nouveau Personnel",
              },
              {
                action: "Personnel Administratif",
                details: "M. Paul Legrand - Agent de maintenance et sécurité",
                time: "Il y a 2 jours",
                type: "success",
                icon: <Users className="w-4 h-4" />,
                badge: "Administration",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 hover:transform hover:scale-[1.01] ${
                  isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"
                } border ${
                  isDarkMode ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    activity.type === "success"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                      : activity.type === "warning"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                  }`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {activity.action}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.type === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : activity.type === "warning"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {activity.badge}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {activity.details}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg">
              Consulter l'Historique Complet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableauDeBord;
