"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Users,
  Building,
  TrendingUp,
  UserCheck,
  UserX,
  Award,
  Calendar,
  Clock,
  X,
  Download,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  BookOpen,
  DollarSign,
  FileText,
  Activity,
  History,
  Moon,
  Sun,
  Printer,
  Search,
  Star,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Medal,
  Crown,
  Settings,
  Trash2,
  User,
  RefreshCw,
} from "lucide-react";

// Import des contextes
import { useFraisScolarite } from "@/Context/ContextPaiement";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useEleves } from "@/Context/ContextEleves";
import { useNotes } from "@/Context/ContextNotes";
import { useDecisionFinAnnee } from "@/Context/ContextDecisionFinAnnee";
import {
  ActivityAction,
  ActivityModule,
  AUTO_DELETE_DAYS_OPTIONS,
  useRecentActivities,
} from "@/Context/RecentActivitiesContext";

// Import des types
import { Note } from "@/types/NoteType";
import { Eleve } from "@/types/EleveType";
import { DecisionFinAnnee } from "@/types/DecisionFinAnneeType";
import { EntetIMFP } from "../AnneeAcademique/module";

// Types pour les activités utilisateur (gardé local car pas de contexte dédié)
// interface UserActivity {
//   id: string;
//   userId: string;
//   userName: string;
//   action: string;
//   module: string;
//   date: string;
//   heure: string;
//   details: string;
//   typeAction:
//     | "connexion"
//     | "modification"
//     | "ajout"
//     | "suppression"
//     | "consultation";
// }

export interface UserActivity {
  id: string;
  action: ActivityAction;
  module: ActivityModule;
  title: string;
  details?: string;
  source_table?: string;
  entity_id?: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  user_role?: string;
  annee_scolaire_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

// Types étendus pour les rapports
interface StudentReport extends Eleve {
  moyenneT1?: number;
  moyenneT2?: number;
  moyenneT3?: number;
  moyenneGenerale?: number;
  fraisScolarite: number;
  fraisPayes: number;
  solde: number;
  decision?: DecisionFinAnnee;
}

interface LaureatReport {
  student: Eleve;
  moyenne: number;
  classe: string;
  salle: string;
  rank: number;
}

interface Props {
  darkMode: boolean;
}

// Activités récentes via contexte serveur

const Rapport = ({ darkMode }: Props) => {
  // Contextes
  const { eleves, isLoading: elevesLoading } = useEleves();
  const {
    notes,
    getNotesByEleve,
    calculateMoyenneGeneraleTrimestre,
    calculateMoyenneGeneraleAnnuelle,
  } = useNotes();
  const { decisions, getDecisionByEleve } = useDecisionFinAnnee();
  const {
    paiements,
    getPaiementsByEleve,
    getStudentBalance,
    typesFrais,
    getTypesFraisWithStats,
    getFraisForClasse,
  } = useFraisScolarite();
  const { currentYear } = useAnneeScolaire();
  const { activities, loading: activitiesLoading } = useRecentActivities();

  // États locaux
  const [activeSection, setActiveSection] = useState("eleves");
  const [showTracability, setShowTracability] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterClasse, setFilterClasse] = useState("toutes");
  const [activityPage, setActivityPage] = useState(1);
  // Impression (workflow par étapes)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCategory, setPrintCategory] = useState<
    "eleves" | "paiements" | "laureats"
  >("eleves");
  // Plus d'options détaillées: on imprime tout selon la catégorie

  // Classes organisées depuis le contexte
  const classes = useMemo(
    () =>
      currentYear?.classes.map((classe) => ({
        value: classe.id,
        label: classe.name,
      })) || [],
    [currentYear?.classes]
  ) as { value: string; label: string }[];

  // Salles organisées par classe depuis le contexte
  const sallesByClass: Record<string, { value: string; label: string }[]> =
    useMemo(() => {
      const result: Record<string, { value: string; label: string }[]> = {};
      currentYear?.classes.forEach((classe) => {
        result[classe.id] = classe.salles.map((salle) => ({
          value: salle.id,
          label: `${salle.name}`,
        }));
      });
      return result;
    }, [currentYear?.classes]);

  // Fonction pour calculer le montant total dû pour un élève (tous types de frais de sa classe)
  const getStudentTotalDue = useCallback(
    (eleve: Eleve): number => {
      const classeNom =
        classes.find((c) => c.value === eleve.classe_id)?.label || "";
      if (!classeNom) return 0;

      // Additionner tous les types de frais pour cette classe
      return typesFrais.reduce((total, typeFrais) => {
        const montant = getFraisForClasse(classeNom, typeFrais.id);
        return total + montant;
      }, 0);
    },
    [classes, typesFrais, getFraisForClasse]
  );

  // Fonction pour calculer le montant total payé pour un élève
  const getStudentTotalPaid = useCallback(
    (eleve: Eleve): number => {
      return paiements
        .filter((p) => p.eleve_id === eleve.id)
        .reduce((total, p) => total + p.montant_paye, 0);
    },
    [paiements]
  );

  // Fonctions utilitaires pour les rapports
  const getStudentReport = useCallback(
    (eleve: Eleve): StudentReport => {
      const moyenneT1 = calculateMoyenneGeneraleTrimestre(eleve.id, 1);
      const moyenneT2 = calculateMoyenneGeneraleTrimestre(eleve.id, 2);
      const moyenneT3 = calculateMoyenneGeneraleTrimestre(eleve.id, 3);
      const moyenneGenerale = calculateMoyenneGeneraleAnnuelle(eleve.id);
      const decision = getDecisionByEleve(eleve.id);

      // Calculer les montants corrects
      const fraisScolarite = getStudentTotalDue(eleve);
      const fraisPayes = getStudentTotalPaid(eleve);
      const solde = fraisScolarite - fraisPayes;

      return {
        ...eleve,
        moyenneT1,
        moyenneT2,
        moyenneT3,
        moyenneGenerale,
        fraisScolarite,
        fraisPayes,
        solde,
        decision: decision || undefined,
      };
    },
    [
      calculateMoyenneGeneraleTrimestre,
      calculateMoyenneGeneraleAnnuelle,
      getDecisionByEleve,
      getStudentTotalDue,
      getStudentTotalPaid,
    ]
  );

  // Données des rapports
  const studentsReport = useMemo(
    () => eleves.map(getStudentReport),
    [eleves, getStudentReport]
  );

  // Statistiques par classe et salle
  const statsByClass = useMemo(() => {
    const stats: Record<string, any> = {};

    studentsReport.forEach((student) => {
      const classeId = student.classe_id;
      const classe = classes.find((c) => c.value === classeId);
      const classeName = classe?.label || "Inconnue";

      if (!stats[classeName]) {
        stats[classeName] = {
          total: 0,
          actifs: 0,
          admis: 0,
          redoublant: 0,
          expulse: 0,
          salles: new Set(),
        };
      }

      stats[classeName].total++;
      if (student.statut === "actif") stats[classeName].actifs++;

      // Utiliser les décisions de fin d'année
      if (student.decision) {
        switch (student.decision.decision) {
          case "ADMIS":
            stats[classeName].admis++;
            break;
          case "REDOUBLER":
            stats[classeName].redoublant++;
            break;
          case "EXPULSER":
            stats[classeName].expulse++;
            break;
        }
      }

      // Trouver la salle de l'élève
      const salle = sallesByClass[classeId]?.find(
        (s) => s.value === student.salle_id
      );
      if (salle) stats[classeName].salles.add(salle.label);
    });

    return stats;
  }, [studentsReport, classes, sallesByClass]);

  // Statistiques de paiements par type de frais
  const paiementStats = useMemo(() => {
    // Calculer le montant total dû pour TOUS les élèves (tous types de frais de leurs classes)
    const totalDu = eleves.reduce((total, eleve) => {
      return total + getStudentTotalDue(eleve);
    }, 0);

    // Calculer le montant total payé
    const totalPaye = paiements.reduce((sum, p) => sum + p.montant_paye, 0);
    const totalEnAttente = totalDu - totalPaye;

    // Calculer les statistiques par type de frais
    const statsParType = typesFrais.map((typeFrais) => {
      // Pour chaque type de frais, calculer le montant dû pour toutes les classes
      const duParClasse = classes.reduce((total, classe) => {
        const montantClasse = getFraisForClasse(classe.label, typeFrais.id);
        const nombreEleves = eleves.filter(
          (e) => e.classe_id === classe.value
        ).length;
        return total + montantClasse * nombreEleves;
      }, 0);

      // Montant payé pour ce type de frais
      const paiementsType = paiements.filter(
        (p) => p.type_frais_id === typeFrais.id
      );
      const paye = paiementsType.reduce((sum, p) => sum + p.montant_paye, 0);

      return {
        ...typeFrais,
        total_du: duParClasse,
        total_paye: paye,
        nombre_paiements: paiementsType.length,
        solde: duParClasse - paye,
      };
    });

    return {
      general: {
        du: totalDu,
        paye: totalPaye,
        enAttente: totalEnAttente,
        pourcentage: totalDu > 0 ? (totalPaye / totalDu) * 100 : 0,
      },
      parType: statsParType,
    };
  }, [
    paiements,
    typesFrais,
    eleves,
    classes,
    getFraisForClasse,
    getStudentTotalDue,
  ]);

  // CSS professionnel pour l'impression
  const PRINT_CSS = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', serif; 
      line-height: 1.4; 
      color: #1a1a1a; 
      background: white;
      font-size: 12px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding: 20px 0;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }
    
    .header h1 {
      font-size: 24px;
      color: #1e40af;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header .subtitle {
      font-size: 16px;
      color: #374151;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .header .contact {
      font-size: 11px;
      color: #6b7280;
      margin-top: 8px;
    }
    
    .report-title {
      font-size: 20px;
      color: #1f2937;
      text-align: center;
      margin: 20px 0;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat-card .label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .stat-card .value {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      color: #374151;
      margin-bottom: 15px;
      font-weight: bold;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
      background: #f1f5f9;
      padding: 8px 12px;
    }
    
    .class-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .class-card {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 12px;
      background: white;
    }
    
    .class-card .class-name {
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
      text-align: center;
      background: #3b82f6;
      color: white;
      padding: 4px;
      border-radius: 4px;
    }
    
    .class-stats {
      font-size: 10px;
      line-height: 1.6;
    }
    
    .class-stats div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    
    .class-stats .value {
      font-weight: bold;
    }
    
    .laureats-section {
      margin: 20px 0;
    }
    
    .laureat-champion {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 3px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .laureat-champion .crown {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .laureat-champion .name {
      font-size: 18px;
      font-weight: bold;
      color: #92400e;
      margin-bottom: 5px;
    }
    
    .laureat-champion .moyenne {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
    }
    
    .laureat-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .laureat-card {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px;
      background: #f9fafb;
    }
    
    .laureat-card .rank {
      display: inline-block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      text-align: center;
      line-height: 24px;
      font-weight: bold;
      font-size: 11px;
      margin-right: 8px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
    }
    
    .date-signature {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
    }
    
    .signature-box {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
      padding-top: 5px;
      font-size: 10px;
    }
    
    @media print {
      body { font-size: 11px; }
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
      .class-grid { grid-template-columns: repeat(3, 1fr); }
      .section { page-break-inside: avoid; }
    }
  </style>
`;

  // Fonction utilitaire pour créer l'en-tête
  const createHeader = (reportType: any, selectedYear: any) => `

   ${EntetIMFP(`Rapport ${reportType} - Année ${selectedYear}`)}
`;

  // Fonction utilitaire pour créer le pied de page
  const createFooter = () => `
  <div class="footer">
    <p>Rapport généré le ${new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</p>
    <div class="date-signature">
      <div class="signature-box">
        <div>Le Directeur</div>
        <div class="signature-line">Signature et Cachet</div>
      </div>
      <div class="signature-box">
        <div>Le Responsable Académique</div>
        <div class="signature-line">Signature</div>
      </div>
    </div>
  </div>
`;

  // 1. FONCTION POUR ÉLÈVES ET RÉSULTATS
  const generateElevesReport = (
    selectedYear: any,
    totalStudents: any,
    activeStudents: any,
    admisStudents: any,
    redoublantStudents: any,
    expulseStudents: any,
    statsByClass: any
  ) => {
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport Élèves et Résultats - IMFP</title>
      ${PRINT_CSS}
    </head>
    <body>
      ${createHeader("Élèves et Résultats", selectedYear)}
      
      <div class="section">
        <div class="section-title">Statistiques Générales</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Total Élèves</div>
            <div class="value">${totalStudents}</div>
          </div>
          <div class="stat-card">
            <div class="label">Élèves Actifs</div>
            <div class="value">${activeStudents}</div>
          </div>
          <div class="stat-card">
            <div class="label">Admis</div>
            <div class="value">${admisStudents}</div>
          </div>
          <div class="stat-card">
            <div class="label">Redoublants</div>
            <div class="value">${redoublantStudents}</div>
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Expulsés</div>
            <div class="value">${expulseStudents}</div>
          </div>
          <div class="stat-card">
            <div class="label">Taux d'Admission</div>
            <div class="value">${(
              (admisStudents / totalStudents) *
              100
            ).toFixed(2)}%</div>
          </div>
          <div class="stat-card">
            <div class="label">Taux de Redoublement</div>
            <div class="value">${(
              (redoublantStudents / totalStudents) *
              100
            ).toFixed(2)}%</div>
          </div>
          <div class="stat-card">
            <div class="label">Taux de Réussite</div>
            <div class="value">${(
              (admisStudents / totalStudents) *
              100
            ).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Répartition par Classe</div>
        <div class="class-grid">
          ${Object.entries(statsByClass)
            .map(
              ([classe, stats]: [string, any]) => `
            <div class="class-card">
              <div class="class-name">${classe}</div>
              <div class="class-stats">
                <div><span>Total:</span> <span class="value">${
                  stats.total
                }</span></div>
                <div><span>Actifs:</span> <span class="value">${
                  stats.actifs
                }</span></div>
                <div><span>Admis:</span> <span class="value">${
                  stats.admis
                }</span></div>
                <div><span>Redoublants:</span> <span class="value">${
                  stats.redoublant
                }</span></div>
                <div><span>Expulsés:</span> <span class="value">${
                  stats.expulse
                }</span></div>
                <div><span>Salles:</span> <span class="value">${Array.from(
                  stats.salles
                ).join(", ")}</span></div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      ${createFooter()}
    </body>
    </html>
  `;
    return content;
  };

  // 2. FONCTION POUR PAIEMENTS
  const generatePaiementsReport = (
    selectedYear: any,
    paiementStats: any,
    statsByClass: any,
    classes: any,
    typesFrais: any,
    eleves: any,
    getStudentTotalDue: any,
    getStudentTotalPaid: any,
    getFraisForClasse: any
  ) => {
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport Paiements - IMFP</title>
      ${PRINT_CSS}
    </head>
    <body>
      ${createHeader("Paiements et Finances", selectedYear)}
      
      <div class="section">
        <div class="section-title">Statistiques Générales</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Total Dû</div>
            <div class="value">${paiementStats.general.du.toLocaleString()} HTG</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Payé</div>
            <div class="value">${paiementStats.general.paye.toLocaleString()} HTG</div>
          </div>
          <div class="stat-card">
            <div class="label">Restant</div>
            <div class="value">${paiementStats.general.enAttente.toLocaleString()} HTG</div>
          </div>
          <div class="stat-card">
            <div class="label">Taux de Collecte</div>
            <div class="value">${paiementStats.general.pourcentage.toFixed(
              2
            )}%</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Statistiques par Type de Frais</div>
        <div class="class-grid">
          ${paiementStats.parType
            .map(
              (typeFrais: any) => `
            <div class="class-card">
              <div class="class-name">${typeFrais.nom}</div>
              <div class="class-stats">
                <div><span>Dû:</span> <span class="value">${typeFrais.total_du.toLocaleString()} HTG</span></div>
                <div><span>Payé:</span> <span class="value">${typeFrais.total_paye.toLocaleString()} HTG</span></div>
                <div><span>Solde:</span> <span class="value">${(
                  typeFrais.total_du - typeFrais.total_paye
                ).toLocaleString()} HTG</span></div>
                <div><span>Paiements:</span> <span class="value">${
                  typeFrais.nombre_paiements
                }</span></div>
                <div><span>Taux:</span> <span class="value">${
                  typeFrais.total_du > 0
                    ? (
                        (typeFrais.total_paye / typeFrais.total_du) *
                        100
                      ).toFixed(2)
                    : 0
                }%</span></div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Statistiques par Classe</div>
        <div class="class-grid">
          ${Object.entries(statsByClass)
            .map(([classe, stats]: [string, any]) => {
              // Calculer les montants pour cette classe
              const elevesClasse = eleves.filter(
                (e: any) =>
                  classes.find((c: any) => c.value === e.classe_id)?.label ===
                  classe
              );
              const totalDu = elevesClasse.reduce(
                (total: any, eleve: any) => total + getStudentTotalDue(eleve),
                0
              );
              const totalPaye = elevesClasse.reduce(
                (total: any, eleve: any) => total + getStudentTotalPaid(eleve),
                0
              );
              const elevesPayes = elevesClasse.filter(
                (e: any) => getStudentTotalDue(e) - getStudentTotalPaid(e) === 0
              ).length;

              return `
              <div class="class-card">
                <div class="class-name">${classe}</div>
                <div class="class-stats">
                  <div><span>Élèves:</span> <span class="value">${
                    stats.total
                  }</span></div>
                  <div><span>Payés:</span> <span class="value">${elevesPayes}</span></div>
                  <div><span>Dû:</span> <span class="value">${totalDu.toLocaleString()} HTG</span></div>
                  <div><span>Payé:</span> <span class="value">${totalPaye.toLocaleString()} HTG</span></div>
                  <div><span>Taux:</span> <span class="value">${
                    totalDu > 0 ? ((totalPaye / totalDu) * 100).toFixed(2) : 0
                  }%</span></div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      ${createFooter()}
    </body>
    </html>
  `;
    return content;
  };

  // 3. FONCTION POUR LAURÉATS
  const generateLaureatsReport = (
    selectedYear: any,
    laureatDesLaureats: any,
    laureatsParClasse: any
  ) => {
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport Lauréats - IMFP</title>
      ${PRINT_CSS}
    </head>
    <body>
      ${createHeader("Lauréats et Excellence", selectedYear)}
      
      ${
        laureatDesLaureats
          ? `
        <div class="section">
          <div class="laureat-champion">
            <div class="crown">👑</div>
            <div style="font-size: 20px; font-weight: bold; color: #92400e; margin-bottom: 10px;">
              LAURÉAT DES LAURÉATS
            </div>
            <div class="name">${laureatDesLaureats.student.prenom} ${
              laureatDesLaureats.student.nom
            }</div>
            <div style="font-size: 14px; color: #78716c; margin-bottom: 8px;">
              ${laureatDesLaureats.classe} - ${laureatDesLaureats.salle}
            </div>
            <div class="moyenne">${laureatDesLaureats.moyenne.toFixed(
              2
            )}/10</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">Lauréats par Classe (Top 3)</div>
        ${Object.entries(laureatsParClasse)
          .map(
            ([classe, laureats]: [string, any]) => `
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; color: #374151; margin-bottom: 12px; text-align: center; background: #f1f5f9; padding: 8px; border-radius: 4px;">
              ${classe}
            </h3>
            <div class="laureat-list">
              ${laureats
                .map(
                  (laureat: any) => `
                <div class="laureat-card">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                      <span class="rank" style="background: ${
                        laureat.rank === 1
                          ? "#f59e0b"
                          : laureat.rank === 2
                          ? "#6b7280"
                          : "#f97316"
                      }">${laureat.rank}</span>
                      <div>
                        <div style="font-weight: bold; font-size: 12px;">${
                          laureat.student.prenom
                        } ${laureat.student.nom}</div>
                        <div style="font-size: 10px; color: #6b7280;">${
                          laureat.salle
                        }</div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: bold; color: ${
                        laureat.rank === 1
                          ? "#f59e0b"
                          : laureat.rank === 2
                          ? "#6b7280"
                          : "#f97316"
                      };">
                        ${laureat.moyenne.toFixed(2)}/10
                      </div>
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      ${createFooter()}
    </body>
    </html>
  `;
    return content;
  };

  // Fonction principale pour ouvrir l'impression
  const openPrintWindow = (title: any, contentHtml: any) => {
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.write(contentHtml);
    w.document.close();
    w.focus();
    w.print();
  };

  const handlePrintNow = () => {
    if (printCategory === "eleves") {
      const html = generateElevesReport(
        selectedYear,
        totalStudents,
        activeStudents,
        admisStudents,
        redoublantStudents,
        expulseStudents,
        statsByClass
      );
      openPrintWindow("Rapport Élèves", html);
    } else if (printCategory === "paiements") {
      const html = generatePaiementsReport(
        selectedYear,
        paiementStats,
        statsByClass,
        classes,
        typesFrais,
        eleves,
        getStudentTotalDue,
        getStudentTotalPaid,
        getFraisForClasse
      );
      openPrintWindow("Rapport Paiements", html);
    } else if (printCategory === "laureats") {
      const html = generateLaureatsReport(
        selectedYear,
        laureatDesLaureats,
        laureatsParClasse
      );
      openPrintWindow("Rapport Lauréats", html);
    }
    setShowPrintModal(false);
  };

  // Calculs statistiques basés sur les contextes
  const totalStudents = studentsReport.length;
  const activeStudents = studentsReport.filter(
    (s) => s.statut === "actif"
  ).length;

  // Utiliser les décisions de fin d'année
  const admisStudents = studentsReport.filter(
    (s) => s.decision?.decision === "ADMIS"
  ).length;
  const redoublantStudents = studentsReport.filter(
    (s) => s.decision?.decision === "REDOUBLER"
  ).length;
  const expulseStudents = studentsReport.filter(
    (s) => s.decision?.decision === "EXPULSER"
  ).length;

  // Lauréats par classe (top 3 par classe)
  const laureatsParClasse = useMemo(() => {
    const laureatsByClass: Record<string, LaureatReport[]> = {};

    studentsReport.forEach((student) => {
      if (
        student.statut === "actif" &&
        student.moyenneGenerale &&
        student.moyenneGenerale >= 5.5
      ) {
        const classe =
          classes.find((c) => c.value === student.classe_id)?.label ||
          "Inconnue";
        const salle =
          sallesByClass[student.classe_id]?.find(
            (s) => s.value === student.salle_id
          )?.label || "Inconnue";

        if (!laureatsByClass[classe]) {
          laureatsByClass[classe] = [];
        }

        laureatsByClass[classe].push({
          student,
          moyenne: student.moyenneGenerale,
          classe,
          salle,
          rank: 0,
        });
      }
    });

    // Trier et prendre les top 3 par classe
    Object.keys(laureatsByClass).forEach((classe) => {
      laureatsByClass[classe] = laureatsByClass[classe]
        .sort((a, b) => b.moyenne - a.moyenne)
        .slice(0, 3)
        .map((laureat, index) => ({ ...laureat, rank: index + 1 }));
    });

    return laureatsByClass;
  }, [studentsReport, classes, sallesByClass]);

  // Lauréat des lauréats (meilleur de tous)
  const laureatDesLaureats = useMemo(() => {
    const tousLaureats = Object.values(laureatsParClasse).flat();
    return tousLaureats.sort((a, b) => b.moyenne - a.moyenne)[0];
  }, [laureatsParClasse]);

  // Filtrage des activités
  // Remplacer la première version de filteredActivities par :
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filterDate) {
        const activityDate = new Date(activity.created_at)
          .toISOString()
          .slice(0, 10);
        if (activityDate !== filterDate) return false;
      }
      if (filterStatus !== "tous" && activity.action !== filterStatus)
        return false;
      return true;
    });
  }, [activities, filterDate, filterStatus]);

  useEffect(() => {
    setActivityPage(1);
  }, [filterDate, filterStatus]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    onClick,
  }: any) => (
    <div
      className={`p-6 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
        darkMode
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`text-xs ${
                darkMode ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Remplacer le TracabilityModal dans le composant Rapport par celui-ci

  const TracabilityModal = () => {
    const {
      activities,
      loading: activitiesLoading,
      settings,
      settingsLoading,
      deleteActivity,
      deleteActivities,
      deleteAllActivities,
      updateSettings,
      triggerCleanup,
    } = useRecentActivities();

    const [showSettings, setShowSettings] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [localSettings, setLocalSettings] = useState({
      auto_delete_enabled: false,
      auto_delete_days: 30,
      max_activities: 1000,
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<number | null>(null);
    const [deletingActivities, setDeletingActivities] = useState(false);

    // Charger les paramètres au montage
    useEffect(() => {
      if (settings) {
        setLocalSettings({
          auto_delete_enabled: settings.auto_delete_enabled,
          auto_delete_days: settings.auto_delete_days,
          max_activities: settings.max_activities,
        });
      }
    }, [settings]);

    // Filtrer les activités
    // Dans le fichier Rapport.tsx, ligne ~1077
    // Changez cette partie :

    // Dans TracabilityModal, utiliser directement activities sans conversion
    const filteredActivitiesInModal = useMemo(() => {
      return activities.filter((activity) => {
        if (filterDate) {
          const activityDate = new Date(activity.created_at)
            .toISOString()
            .slice(0, 10);
          if (activityDate !== filterDate) return false;
        }
        if (filterStatus !== "tous" && activity.action !== filterStatus)
          return false;
        return true;
      });
    }, [activities]);
    // Pagination
    const startIndex = (activityPage - 1) * 10;
    const endIndex = startIndex + 10;
    const paginatedActivities = filteredActivitiesInModal.slice(
      startIndex,
      endIndex
    );
    const totalPages = Math.max(
      1,
      Math.ceil(filteredActivitiesInModal.length / 10)
    );
    // Sélection
    const handleSelectActivity = (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    const handleSelectAll = () => {
      if (selectedIds.length === paginatedActivities.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(paginatedActivities.map((a) => a.id));
      }
    };

    // Sauvegarder les paramètres
    const handleSaveSettings = async () => {
      setSavingSettings(true);
      const success = await updateSettings(localSettings);
      if (success) {
        setShowSettings(false);
      }
      setSavingSettings(false);
    };

    // Nettoyage manuel
    const handleManualCleanup = async () => {
      if (!confirm("Déclencher le nettoyage automatique maintenant ?")) return;
      const count = await triggerCleanup();
      setCleanupResult(count);
      setTimeout(() => setCleanupResult(null), 5000);
    };

    // Suppression
    const handleDeleteSelected = async () => {
      if (selectedIds.length === 0) return;
      if (!confirm(`Supprimer ${selectedIds.length} activité(s) ?`)) return;

      setDeletingActivities(true);
      const success = await deleteActivities(selectedIds);
      if (success) {
        setSelectedIds([]);
      }
      setDeletingActivities(false);
    };

    const handleDeleteAll = async () => {
      if (
        !confirm(
          "Supprimer TOUTES les activités visibles ? Cette action est irréversible."
        )
      )
        return;

      setDeletingActivities(true);
      await deleteAllActivities();
      setSelectedIds([]);
      setDeletingActivities(false);
    };

    const handleDeleteOne = async (id: string) => {
      if (!confirm("Supprimer cette activité ?")) return;
      setDeletingActivities(true);
      await deleteActivity(id);
      setDeletingActivities(false);
    };

    // Statistiques
    const stats = useMemo(() => {
      return {
        connexion: filteredActivitiesInModal.filter(
          (a) => a.action === "connexion"
        ).length,
        ajout: filteredActivitiesInModal.filter((a) => a.action === "ajout")
          .length,
        modification: filteredActivitiesInModal.filter(
          (a) => a.action === "modification"
        ).length,
        suppression: filteredActivitiesInModal.filter(
          (a) => a.action === "suppression"
        ).length,
        reinscription: filteredActivitiesInModal.filter(
          (a) => a.action === "reinscription"
        ).length,
      };
    }, [filteredActivitiesInModal]);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div
          className={`w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Header */}
          <div
            className={`p-6 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold flex items-center space-x-2">
                  <Activity className="w-6 h-6" />
                  <span>Traçabilité du Système</span>
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Journal complet des actions et connexions
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSettings
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                  title="Paramètres"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowTracability(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex h-[calc(95vh-100px)]">
            {/* Panneau principal */}
            <div
              className={`flex-1 overflow-y-auto p-6 ${
                showSettings ? "w-2/3" : "w-full"
              }`}
            >
              {/* Barre d'actions */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {filteredActivities.length} activité(s)
                  </span>
                  {selectedIds.length > 0 && (
                    <span
                      className={`text-sm ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      ({selectedIds.length} sélectionnée(s))
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Suppression multiple (visible seulement si suppression auto désactivée) */}
                  {!localSettings.auto_delete_enabled && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        disabled={paginatedActivities.length === 0}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-200 hover:bg-gray-300"
                        } disabled:opacity-50`}
                      >
                        {selectedIds.length === paginatedActivities.length
                          ? "Tout désélectionner"
                          : "Tout sélectionner"}
                      </button>

                      {selectedIds.length > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          disabled={deletingActivities}
                          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer ({selectedIds.length})</span>
                        </button>
                      )}

                      <button
                        onClick={handleDeleteAll}
                        disabled={
                          deletingActivities || filteredActivities.length === 0
                        }
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Tout supprimer</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      const win = window.open(
                        "",
                        "_blank",
                        "width=900,height=700"
                      );
                      if (!win) return;
                      const rows = paginatedActivities
                        .map(
                          (a) =>
                            `<tr>
                            <td>${new Date(a.created_at).toLocaleString()}</td>
                            <td>${a.module}</td>
                            <td>${a.action}</td>
                            <td>${a.title}</td>
                            <td>${a.details || ""}</td>
                            <td>${a.user_name || a.user_email}</td>
                          </tr>`
                        )
                        .join("");
                      win.document.write(
                        `<!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <title>Journal d'Activités</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; }
                          h2 { text-align: center; color: #333; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
                          th { background: #f2f2f2; font-weight: bold; }
                          tr:nth-child(even) { background: #f9f9f9; }
                        </style>
                      </head>
                      <body>
                        <h2>Journal d'Activités - Page ${activityPage}</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Date/Heure</th>
                              <th>Module</th>
                              <th>Type</th>
                              <th>Action</th>
                              <th>Détails</th>
                              <th>Utilisateur</th>
                            </tr>
                          </thead>
                          <tbody>${rows}</tbody>
                        </table>
                      </body>
                      </html>`
                      );
                      win.document.close();
                      win.focus();
                      win.print();
                    }}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-1 ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer</span>
                  </button>
                </div>
              </div>

              <div
                className={`mb-6 p-4 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className={`w-full p-2 border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type d'action
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={`w-full p-2 border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="tous">Toutes</option>
                      <option value="connexion">Connexions</option>
                      <option value="ajout">Ajouts</option>
                      <option value="modification">Modifications</option>
                      <option value="suppression">Suppressions</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterDate("");
                        setFilterStatus("tous");
                        setActivityPage(1);
                      }}
                      className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div
                  className={`p-3 rounded-lg text-center ${
                    darkMode ? "bg-blue-900" : "bg-blue-100"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    {stats.connexion}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-blue-400" : "text-blue-700"
                    }`}
                  >
                    Connexions
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    darkMode ? "bg-green-900" : "bg-green-100"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-green-300" : "text-green-600"
                    }`}
                  >
                    {stats.ajout}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-green-400" : "text-green-700"
                    }`}
                  >
                    Ajouts
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    darkMode ? "bg-yellow-900" : "bg-yellow-100"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-yellow-300" : "text-yellow-600"
                    }`}
                  >
                    {stats.modification}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-yellow-400" : "text-yellow-700"
                    }`}
                  >
                    Modifications
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    darkMode ? "bg-red-900" : "bg-red-100"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-red-300" : "text-red-600"
                    }`}
                  >
                    {stats.suppression}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-red-400" : "text-red-700"
                    }`}
                  >
                    Suppressions
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    darkMode ? "bg-purple-900" : "bg-purple-100"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}
                  >
                    {stats.reinscription}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-purple-400" : "text-purple-700"
                    }`}
                  >
                    Réinscriptions
                  </p>
                </div>
              </div>

              {/* Alerte résultat nettoyage */}
              {cleanupResult !== null && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 text-sm">
                    Nettoyage terminé : {cleanupResult} activité(s) supprimée(s)
                  </span>
                </div>
              )}

              {/* Liste des activités */}
              {activitiesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : paginatedActivities.length === 0 ? (
                <div
                  className={`p-8 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        activity.action === "connexion"
                          ? "border-l-blue-500"
                          : activity.action === "modification"
                          ? "border-l-yellow-500"
                          : activity.action === "ajout"
                          ? "border-l-green-500"
                          : activity.action === "suppression"
                          ? "border-l-red-500"
                          : "border-l-purple-500"
                      } ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } ${
                        selectedIds.includes(activity.id)
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {!localSettings.auto_delete_enabled && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(activity.id)}
                            onChange={() => handleSelectActivity(activity.id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                activity.action === "connexion"
                                  ? "bg-blue-100 text-blue-800"
                                  : activity.action === "modification"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : activity.action === "ajout"
                                  ? "bg-green-100 text-green-800"
                                  : activity.action === "suppression"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {activity.action}
                            </span>
                            <span
                              className={`text-xs ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {activity.module}
                            </span>
                          </div>
                          <h4
                            className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {activity.title}
                          </h4>
                          {activity.details && (
                            <p
                              className={`text-sm mt-1 ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {activity.details}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs">
                            <span
                              className={
                                darkMode ? "text-gray-500" : "text-gray-500"
                              }
                            >
                              <User className="w-3 h-3 inline mr-1" />
                              {activity.user_name || activity.user_email}
                            </span>
                            <span
                              className={
                                darkMode ? "text-gray-500" : "text-gray-500"
                              }
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {!localSettings.auto_delete_enabled && (
                          <button
                            onClick={() => handleDeleteOne(activity.id)}
                            disabled={deletingActivities}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm">
                  Page {activityPage} / {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    disabled={activityPage <= 1}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    } disabled:opacity-50`}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() =>
                      setActivityPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={activityPage >= totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    } disabled:opacity-50`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>

            {/* Panneau Paramètres (coulissant) */}
            {showSettings && (
              <div
                className={`w-1/3 border-l overflow-y-auto p-6 ${
                  darkMode
                    ? "bg-gray-900 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h4 className="text-lg font-bold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Paramètres
                </h4>

                {settingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Toggle Suppression Automatique */}
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-medium">
                          Suppression automatique
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={localSettings.auto_delete_enabled}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                auto_delete_enabled: e.target.checked,
                              }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`block w-14 h-8 rounded-full transition-colors ${
                              localSettings.auto_delete_enabled
                                ? "bg-green-600"
                                : "bg-gray-400"
                            }`}
                          >
                            <div
                              className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                localSettings.auto_delete_enabled
                                  ? "transform translate-x-6"
                                  : ""
                              }`}
                            ></div>
                          </div>
                        </div>
                      </label>
                      <p
                        className={`text-xs mt-2 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {localSettings.auto_delete_enabled
                          ? "Les anciennes activités seront supprimées automatiquement"
                          : "La suppression automatique est désactivée"}
                      </p>
                    </div>

                    {/* Nombre de jours */}
                    {localSettings.auto_delete_enabled && (
                      <div>
                        <label className="block font-medium mb-2">
                          Supprimer après (jours)
                        </label>
                        <select
                          value={localSettings.auto_delete_days}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              auto_delete_days: Number(e.target.value),
                            }))
                          }
                          className={`w-full p-2 border rounded-lg ${
                            darkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {AUTO_DELETE_DAYS_OPTIONS.map((days) => (
                            <option key={days} value={days}>
                              {days} jours
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Limite d'activités */}
                    <div>
                      <label className="block font-medium mb-2">
                        Limite d'activités maximum
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="100"
                        value={localSettings.max_activities}
                        onChange={(e) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            max_activities: Number(e.target.value),
                          }))
                        }
                        className={`w-full p-2 border rounded-lg ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      />
                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Nombre maximum d'activités à conserver
                      </p>
                    </div>

                    {/* Informations */}
                    {settings?.last_cleanup_at && (
                      <div
                        className={`p-3 rounded-lg ${
                          darkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">
                          Dernier nettoyage
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {new Date(settings.last_cleanup_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Nettoyage manuel */}
                    {localSettings.auto_delete_enabled && (
                      <button
                        onClick={handleManualCleanup}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Nettoyer maintenant</span>
                      </button>
                    )}

                    {/* Boutons d'action */}
                    <div className="space-y-2 pt-4 border-t">
                      <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                      >
                        {savingSettings ? "Sauvegarde..." : "Sauvegarder"}
                      </button>
                      <button
                        onClick={() => setShowSettings(false)}
                        className={`w-full py-3 rounded-lg font-medium ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`p-6 border-b transition-colors ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex  justify-between items-center">
          <div className="flex flex-col sm:flex-row space-y-7 items-center space-x-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Récapitulatif complet de l'année académique
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-x-4">
            <button
              onClick={() => setShowTracability(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Traçabilité</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Modal d'impression par étapes */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`w-full max-w-2xl rounded-lg shadow-lg ${
                darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              }`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold">Impression - Choix</div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className={`p-1 rounded ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="mb-2 text-sm">Que voulez-vous imprimer ?</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setPrintCategory("eleves")}
                      className={`px-3 py-2 rounded ${
                        printCategory === "eleves"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-200"
                      }`}
                    >
                      Élèves & Résultats
                    </button>
                    <button
                      onClick={() => setPrintCategory("paiements")}
                      className={`px-3 py-2 rounded ${
                        printCategory === "paiements"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-200"
                      }`}
                    >
                      Paiements
                    </button>
                    <button
                      onClick={() => setPrintCategory("laureats")}
                      className={`px-3 py-2 rounded ${
                        printCategory === "laureats"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-200"
                      }`}
                    >
                      Lauréats
                    </button>
                  </div>
                </div>
                <div className="text-sm">
                  Sélectionnez une catégorie puis cliquez sur Imprimer.
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className={`px-4 py-2 rounded ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handlePrintNow}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Navigation des sections */}
        <div
          className={`mb-8 p-1 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <div className="flex space-x-1">
            {[
              { id: "eleves", label: "Élèves & Résultats", icon: Users },
              {
                id: "paiements",
                label: "Paiements & Finances",
                icon: DollarSign,
              },
              { id: "laureats", label: "Lauréats", icon: Award },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <section.icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Élèves & Résultats */}
        {activeSection === "eleves" && (
          <div className="space-y-8">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Élèves"
                value={totalStudents}
                icon={Users}
                color="bg-blue-500"
                subtitle="Tous statuts confondus"
              />
              <StatCard
                title="Élèves Actifs"
                value={activeStudents}
                icon={UserCheck}
                color="bg-green-500"
                subtitle={`${((activeStudents / totalStudents) * 100).toFixed(
                  2
                )}%`}
              />
              <StatCard
                title="Admis"
                value={admisStudents}
                icon={CheckCircle}
                color="bg-emerald-500"
                subtitle={`${((admisStudents / totalStudents) * 100).toFixed(
                  2
                )}%`}
              />
              <StatCard
                title="Redoublants"
                value={redoublantStudents}
                icon={AlertCircle}
                color="bg-orange-500"
                subtitle={`${(
                  (redoublantStudents / totalStudents) *
                  100
                ).toFixed(2)}%`}
              />
            </div>

            {/* Statuts spéciaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Expulsés"
                value={expulseStudents}
                icon={XCircle}
                color="bg-red-600"
              />
              <StatCard
                title="Taux d'Admission"
                value={`${((admisStudents / totalStudents) * 100).toFixed(2)}%`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
              <StatCard
                title="Taux de Redoublement"
                value={`${((redoublantStudents / totalStudents) * 100).toFixed(
                  1
                )}%`}
                icon={BookOpen}
                color="bg-yellow-500"
              />
            </div>

            {/* Statistiques par classe */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Statistiques par Classe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(statsByClass).map(([classe, stats]) => (
                  <div
                    key={classe}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`font-bold text-lg mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {classe}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total élèves:</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actifs:</span>
                        <span className="font-medium text-green-600">
                          {stats.actifs}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Admis:</span>
                        <span className="font-medium text-emerald-600">
                          {stats.admis}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Redoublants:</span>
                        <span className="font-medium text-orange-600">
                          {stats.redoublant}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Expulsés:</span>
                        <span className="font-medium text-red-600">
                          {stats.expulse}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Salles:</span>
                        <span className="font-medium">
                          {Array.from(stats.salles).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section Paiements */}
        {activeSection === "paiements" && (
          <div className="space-y-8">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Montant Total Dû"
                value={`${paiementStats.general.du.toLocaleString()} HTG`}
                icon={DollarSign}
                color="bg-blue-500"
              />
              <StatCard
                title="Montant Total Payé"
                value={`${paiementStats.general.paye.toLocaleString()} HTG`}
                icon={CheckCircle}
                color="bg-green-500"
              />
              <StatCard
                title="Montant Restant"
                value={`${paiementStats.general.enAttente.toLocaleString()} HTG`}
                icon={AlertCircle}
                color="bg-orange-500"
              />
              <StatCard
                title="Taux de Collecte"
                value={`${paiementStats.general.pourcentage.toFixed(2)}%`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
            </div>

            {/* Statistiques par type de frais */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Statistiques par Type de Frais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paiementStats.parType.map((typeFrais) => (
                  <div
                    key={typeFrais.id}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`font-bold text-lg mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {typeFrais.nom}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Montant dû:</span>
                        <span className="font-medium">
                          {typeFrais.total_du.toLocaleString()} HTG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Montant payé:</span>
                        <span className="font-medium text-green-600">
                          {typeFrais.total_paye.toLocaleString()} HTG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">En attente:</span>
                        <span className="font-medium text-red-600">
                          {(
                            typeFrais.total_du - typeFrais.total_paye
                          ).toLocaleString()}{" "}
                          HTG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Nombre de paiements:</span>
                        <span className="font-medium">
                          {typeFrais.nombre_paiements}
                        </span>
                      </div>
                      <div
                        className={`w-full bg-gray-200 rounded-full h-2 ${
                          darkMode ? "bg-gray-600" : ""
                        }`}
                      >
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              typeFrais.total_du > 0
                                ? (typeFrais.total_paye / typeFrais.total_du) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <p
                        className={`text-xs text-center ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {typeFrais.total_du > 0
                          ? (
                              (typeFrais.total_paye / typeFrais.total_du) *
                              100
                            ).toFixed(2)
                          : 0}
                        % payé
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques par classe et salle */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Statistiques de Paiements par Classe et Salle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(statsByClass).map(([classe, stats]) => {
                  const elevesClasse = studentsReport.filter(
                    (s) =>
                      classes.find((c) => c.value === s.classe_id)?.label ===
                      classe
                  );

                  // Calculer le montant total dû pour cette classe (tous types de frais)
                  const totalDu = elevesClasse.reduce((total, eleve) => {
                    return total + getStudentTotalDue(eleve);
                  }, 0);

                  // Calculer le montant total payé pour cette classe
                  const totalPaye = elevesClasse.reduce((total, eleve) => {
                    return total + getStudentTotalPaid(eleve);
                  }, 0);

                  // Compter les élèves avec paiements complets vs partiels
                  const elevesAvecPaiements = new Set(
                    paiements
                      .filter((p) => {
                        const eleve = eleves.find((e) => e.id === p.eleve_id);
                        return (
                          eleve &&
                          classes.find((c) => c.value === eleve.classe_id)
                            ?.label === classe
                        );
                      })
                      .map((p) => p.eleve_id)
                  );

                  const elevesPayes = elevesClasse.filter(
                    (s) => s.solde === 0
                  ).length;
                  const elevesNonPayes = elevesClasse.filter(
                    (s) => s.solde > 0
                  ).length;

                  return (
                    <div
                      key={classe}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-bold text-lg mb-3 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {classe}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total élèves:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Élèves avec paiements:
                          </span>
                          <span className="font-medium text-blue-600">
                            {elevesAvecPaiements.size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Élèves entièrement payés:
                          </span>
                          <span className="font-medium text-green-600">
                            {elevesPayes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Élèves sans paiement:</span>
                          <span className="font-medium text-red-600">
                            {elevesNonPayes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Montant dû:</span>
                          <span className="font-medium">
                            {totalDu.toLocaleString()} HTG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Montant payé:</span>
                          <span className="font-medium text-green-600">
                            {totalPaye.toLocaleString()} HTG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Montant restant:</span>
                          <span className="font-medium text-orange-600">
                            {(totalDu - totalPaye).toLocaleString()} HTG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Salles:</span>
                          <span className="font-medium">
                            {Array.from(stats.salles).join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section Lauréats */}
        {activeSection === "laureats" && (
          <div className="space-y-8">
            {/* Lauréat des lauréats */}
            {laureatDesLaureats && (
              <div
                className={`p-8 rounded-lg border-4 border-yellow-400 ${
                  darkMode
                    ? "bg-gray-800 border-yellow-400"
                    : "bg-yellow-50 border-yellow-400"
                }`}
              >
                <div className="text-center mb-6">
                  <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-yellow-600 mb-2">
                    🏆 LAURÉAT DES LAURÉATS 🏆
                  </h3>
                  <p className="text-lg text-gray-600">
                    Meilleur élève de l'année scolaire {selectedYear}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">1</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {laureatDesLaureats.student.prenom}{" "}
                          {laureatDesLaureats.student.nom}
                        </h4>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          {laureatDesLaureats.classe} -{" "}
                          {laureatDesLaureats.salle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-yellow-600">
                        {laureatDesLaureats.moyenne.toFixed(2)}/10
                      </p>
                      <p className="text-sm text-gray-500">Moyenne générale</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 3 par classe */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-2xl font-semibold mb-6 text-center">
                🏆 Top 3 des Lauréats par Classe 🏆
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(laureatsParClasse).map(([classe, laureats]) => (
                  <div
                    key={classe}
                    className={`p-6 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`text-xl font-bold mb-4 text-center ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {classe}
                    </h4>
                    <div className="space-y-3">
                      {laureats.map((laureat) => (
                        <div
                          key={laureat.student.id}
                          className={`p-4 rounded-lg ${
                            laureat.rank === 1
                              ? "bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400"
                              : laureat.rank === 2
                              ? "bg-gray-100 dark:bg-gray-600 border-2 border-gray-400"
                              : "bg-orange-100 dark:bg-orange-900 border-2 border-orange-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  laureat.rank === 1
                                    ? "bg-yellow-500"
                                    : laureat.rank === 2
                                    ? "bg-gray-400"
                                    : "bg-orange-500"
                                }`}
                              >
                                <span className="text-white font-bold">
                                  {laureat.rank}
                                </span>
                              </div>
                              <div>
                                <p
                                  className={`font-medium ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {laureat.student.prenom} {laureat.student.nom}
                                </p>
                                <p
                                  className={`text-sm ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {laureat.salle}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-xl font-bold ${
                                  laureat.rank === 1
                                    ? "text-yellow-600"
                                    : laureat.rank === 2
                                    ? "text-green-700"
                                    : "text-orange-600"
                                }`}
                              >
                                {laureat.moyenne.toFixed(2)}/10
                              </p>
                              <Star className="h-4 w-4 text-yellow-500 mx-auto" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de traçabilité */}
      {showTracability && <TracabilityModal />}

      {/* Footer avec informations supplémentaires
      <footer
        className={`mt-12 p-6 border-t ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Résumé Exécutif
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📊 <strong>Performance:</strong>{" "}
                  {((admisStudents / totalStudents) * 100).toFixed(2)}%
                  d'admission
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  💰 <strong>Finances:</strong>{" "}
                  {paiementStats.general.pourcentage.toFixed(2)}% collecté
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  👥 <strong>Effectif:</strong> {totalStudents} élèves dans{" "}
                  {Object.keys(statsByClass).length} classes
                </p>
              </div>
            </div>

            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Actions Recommandées
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  🎯 Renforcement pédagogique en 7ème et 8ème AF
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  💳 Suivi des paiements en retard
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  ⭐ Reconnaissance des élèves excellents
                </p>
              </div>
            </div>

            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Informations Système
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📅 Dernière mise à jour:{" "}
                  {new Date().toLocaleDateString("fr-FR")}
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  🔄 Données actualisées en temps réel
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📈 Rapport généré automatiquement
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 pt-6 border-t text-center ${
              darkMode
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <p className="text-sm">
              © {new Date().getFullYear()} Système de Gestion Scolaire - Tous
              droits réservés
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Rapport;
