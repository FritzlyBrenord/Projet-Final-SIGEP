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
import React, { useEffect, useMemo, useState } from "react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { SelectData } from "@/Config/SupabaseData";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<{
    eleves: number;
    enseignants: number;
    employes: number;
    paiementsMontant: number;
  } | null>(null);
  const [serverEnrollmentByYear, setServerEnrollmentByYear] = useState<
    Array<{ year: string; filles?: number; garcons?: number; total: number }>
  >([]);
  const [serverGenderDistribution, setServerGenderDistribution] = useState<
    Array<{ name: string; value: number; color?: string }>
  >([]);
  const { schoolYears, currentYear } = useAnneeScolaire();
  const { activities } = useRecentActivities();

  const totalElevesActiveYear = useMemo(() => {
    const filles =
      serverGenderDistribution.find((g) => g.name.includes("Filles"))?.value ||
      0;
    const garcons =
      serverGenderDistribution.find((g) => g.name.includes("Garçons"))?.value ||
      0;
    return filles + garcons;
  }, [serverGenderDistribution]);

  useEffect(() => {
    const loadLocalStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          elevesRows,
          inscriptionsRows,
          profsAffectRows,
          employesRows,
          paiementsRows,
          notesRows,
        ] = await Promise.all([
          SelectData("eleves"),
          SelectData("eleves_inscriptions"),
          SelectData("professeurs_affectations"),
          SelectData("employes"),
          SelectData("paiements"),
          SelectData("notes"),
        ]);

        // Sélection stricte pour les cartes (année active)
        const activeYearId = currentYear?.id ? String(currentYear.id) : "";
        const activeYearLabel = currentYear?.year || activeYearId;

        const byYearMap = new Map<
          string,
          { total: number; filles: number; garcons: number }
        >();
        const eleveById = new Map<string, any>();
        for (const e of elevesRows || []) {
          if (e?.id) eleveById.set(String(e.id), e);
        }

        // 1) Évolution par année: AGRÉGER TOUTES LES ANNÉES (pas seulement l'année active)
        for (const ins of inscriptionsRows || []) {
          if (ins?.deleted) continue;
          const yid = String(ins.annee_scolaire_id || "");
          if (!byYearMap.has(yid))
            byYearMap.set(yid, { total: 0, filles: 0, garcons: 0 });
          const agg = byYearMap.get(yid)!;
          agg.total += 1;
          const eleve = eleveById.get(String(ins.eleve_id || ""));
          const sexe = (eleve?.sexe ?? eleve?.genre ?? "")
            .toString()
            .toLowerCase();
          if (sexe.startsWith("f")) agg.filles += 1;
          else if (sexe.startsWith("m")) agg.garcons += 1;
        }

        // Mapper id -> libellé (2024-2025) depuis le context des années
        const yearLabelById = new Map<string, string>();
        for (const y of schoolYears) yearLabelById.set(String(y.id), y.year);

        const enrollment = Array.from(byYearMap.entries())
          .map(([id, agg]) => ({
            year: yearLabelById.get(id) || id,
            total: agg.total,
            filles: agg.filles,
            garcons: agg.garcons,
          }))
          .sort((a, b) => a.year.localeCompare(b.year));

        // 2) Distribution globale pour les cartes (limiter à l'année active) + comptage par salle
        let totalFilles = 0;
        let totalGarcons = 0;
        const salleCount: Record<string, number> = {};
        for (const ins of inscriptionsRows || []) {
          if (ins?.deleted) continue;
          const yid = String(ins.annee_scolaire_id || "");
          if (!activeYearId || yid !== activeYearId) continue;
          const eleve = eleveById.get(String(ins.eleve_id || ""));
          const sexe = (eleve?.sexe ?? eleve?.genre ?? "")
            .toString()
            .toLowerCase();
          if (sexe.startsWith("f")) totalFilles += 1;
          else if (sexe.startsWith("m")) totalGarcons += 1;
          const sid = String(ins.salle_id || "");
          if (sid) salleCount[sid] = (salleCount[sid] || 0) + 1;
        }

        setServerEnrollmentByYear(enrollment);
        setServerGenderDistribution([
          { name: "Élèves Filles", value: totalFilles, color: "#e11d48" },
          { name: "Élèves Garçons", value: totalGarcons, color: "#1e40af" },
        ]);

        setSalleCounts(salleCount);

        // 3) Totaux pour cartes Corps Enseignant et Personnel Administratif (année active)
        const enseignantsCount = (profsAffectRows || []).filter(
          (a: any) => !a.deleted && String(a.annee_scolaire_id) === activeYearId
        ).length;
        const employesCount = (employesRows || []).filter(
          (e: any) => !e.deleted && String(e.annee_scolaire_id) === activeYearId
        ).length;

        setServerTotals({
          eleves: totalFilles + totalGarcons,
          enseignants: enseignantsCount,
          employes: employesCount,
          paiementsMontant: 0,
        });

        // 4) Indicateurs: Paiements (taux de couverture) et Réussite élèves
        const paiementsActive = (paiementsRows || []).filter(
          (p: any) => !p.deleted && String(p.annee_scolaire_id) === activeYearId
        );
        const totalDu = paiementsActive.reduce(
          (s: number, p: any) => s + (Number(p.montant_du) || 0),
          0
        );
        const totalPaye = paiementsActive.reduce(
          (s: number, p: any) => s + (Number(p.montant_paye) || 0),
          0
        );
        const tauxCouverture =
          totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

        const notesActive = (notesRows || []).filter(
          (n: any) => !n.deleted && String(n.annee_scolaire_id) === activeYearId
        );
        const reussites = notesActive.filter(
          (n: any) => Number(n.note) >= 5.5
        ).length;
        const tauxReussite =
          notesActive.length > 0
            ? Math.round((reussites / notesActive.length) * 100)
            : 0;

        setPerformance({
          tauxCouverture,
          totalDu,
          totalPaye,
          tauxReussite,
          echantillonNotes: notesActive.length,
        });
      } catch (e: any) {
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };
    loadLocalStats();
  }, [currentYear?.id, currentYear?.year, schoolYears]);

  const [performance, setPerformance] = useState<{
    tauxCouverture: number;
    totalDu: number;
    totalPaye: number;
    tauxReussite: number;
    echantillonNotes: number;
  } | null>(null);

  const [salleCounts, setSalleCounts] = useState<Record<string, number>>({});
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
      value:
        serverGenderDistribution
          ?.find((g) => g.name.includes("Filles"))
          ?.value?.toString() || "0",
      change: "+3.2%",
      changeType: "increase",
      illustration: <StudentGirlIllustration />,
      color: "rose",
    },
    {
      title: "Élèves Garçons",
      value:
        serverGenderDistribution
          ?.find((g) => g.name.includes("Garçons"))
          ?.value?.toString() || "0",
      change: "+2.1%",
      changeType: "increase",
      illustration: <StudentBoyIllustration />,
      color: "blue",
    },
    {
      title: "Professeurs",
      value: serverTotals?.enseignants?.toString() || "0",
      change: "+2.1%",
      changeType: "increase",
      illustration: <TeacherIllustration />,
      color: "amber",
    },
    {
      title: "Personnels",
      value: serverTotals?.employes?.toString() || "0",
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

  const enrollmentByYearData =
    serverEnrollmentByYear.length > 0
      ? serverEnrollmentByYear.map((r) => ({
          year: r.year,
          Filles: r.filles,
          Garçons: r.garcons,
          Total: r.total,
        }))
      : [
          { year: "0000-0000", Filles: 0, Garçons: 0 },
          { year: "0000-0000", Filles: 0, Garçons: 0 },
          { year: "0000-0000", Filles: 0, Garçons: 0 },
          { year: "0000-0000", Filles: 0, Garçons: 0 },
          { year: "0000-0000", Filles: 0, Garçons: 0 },
        ];

  const genderDistributionData =
    serverGenderDistribution.length > 0
      ? serverGenderDistribution
      : [
          { name: "Élèves Filles", value: 0, color: "#e11d48" },
          { name: "Élèves Garçons", value: 0, color: "#1e40af" },
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
                Année Scolaire • Dernière mise à jour:{" "}
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
              <div
                className={`flex items-center space-x-2 p-2 ${
                  isDarkMode ? "bg-pink-900/20" : "bg-pink-50"
                }   rounded-lg`}
              >
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Filles:{" "}
                  {genderDistributionData.find((g) => g.name.includes("Filles"))
                    ?.value ?? 0}
                </span>
              </div>
              <div
                className={`flex items-center space-x-2 p-2 ${
                  isDarkMode ? "bg-gray-900/20" : "bg-blue-50"
                }   rounded-lg`}
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Garçons:
                  {genderDistributionData.find((g) =>
                    g.name.includes("Garçons")
                  )?.value ?? 0}
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
            <div
              className={`mt-6 text-center p-4 ${
                isDarkMode ? "bg-slate-700/20" : "bg-gray-50"
              } rounded-xl`}
            >
              <p
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-gray-100"
                }`}
              >
                Total: {totalElevesActiveYear} élèves
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
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 scroll-mx-6 w-full">
          {/* Répartition par Classe */}
          <div
            className={`rounded-2xl p-4 sm:p-6 shadow-lg border ${
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
                  className={`text-lg sm:text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Effectifs par Classe
                </h3>
                <p
                  className={`text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Distribution collège et lycée
                </p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="min-w-[320px] space-y-4">
                {(() => {
                  // Construire effectifs par classe/salle depuis currentYear + inscriptions année active
                  const activeYearId = currentYear?.id
                    ? String(currentYear.id)
                    : "";
                  const bySalle: Array<{
                    label: string;
                    count: number;
                    color: string;
                    category: string;
                  }> = [];
                  const colorPalette = [
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                    "bg-red-500",
                    "bg-emerald-500",
                  ];
                  const colorOf = (idx: number) =>
                    colorPalette[idx % colorPalette.length];

                  let idx = 0;
                  for (const classe of currentYear?.classes || []) {
                    for (const salle of classe.salles || []) {
                      const c = salleCounts[salle.id] || 0;
                      bySalle.push({
                        label: `${classe.name} - ${salle.name}`,
                        count: c,
                        color: colorOf(idx++),
                        category: classe.name || "Classe",
                      });
                    }
                  }

                  // NOTE: Pour un comptage exact par salle, on peut enrichir loadLocalStats pour exposer un map salle_id -> count
                  // Affichage
                  return bySalle.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${item.color} shadow-sm flex-shrink-0`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`font-semibold text-sm sm:text-base ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            } truncate block`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`inline-block mt-1 sm:mt-0 sm:ml-2 text-xs px-2 py-1 rounded-full ${
                              isDarkMode
                                ? "bg-slate-600 text-slate-300"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <span
                          className={`font-bold text-base sm:text-lg ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {item.count}
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
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
        {/* Activités récentes via RecentActivitiesContext */}
        <div
          className={`rounded-2xl p-4 sm:p-6 shadow-lg border ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-lg sm:text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Journal des Activités Récentes
                </h3>
                <p
                  className={`text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Dernières opérations et événements
                </p>
              </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[320px] space-y-4">
              {activities.slice(0, 5).map((a, index) => {
                const type =
                  a.action === "suppression"
                    ? "warning"
                    : a.action === "ajout" ||
                      a.action === "connexion" ||
                      a.action === "reinscription"
                    ? "success"
                    : "info";
                const icon =
                  type === "success" ? (
                    <UserCheck className="w-4 h-4" />
                  ) : type === "warning" ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  );
                const badge = a.module || "Système";
                const time = new Date(a.created_at).toLocaleString();
                return (
                  <div
                    key={`${a.id}-${index}`}
                    className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl transition-all duration-200 hover:transform hover:scale-[1.01] ${
                      isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"
                    } border ${
                      isDarkMode ? "border-slate-700" : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${
                        type === "success"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                          : type === "warning"
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                      }`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`font-semibold text-sm sm:text-base ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {a.title}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            type === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : type === "warning"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {badge}
                        </span>
                      </div>
                      <p
                        className={`text-xs sm:text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {a.details || a.action}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center text-xs text-gray-500 space-x-2 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="whitespace-nowrap">{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableauDeBord;
