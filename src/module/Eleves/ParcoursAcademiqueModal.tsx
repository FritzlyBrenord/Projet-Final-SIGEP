import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  User,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Award,
  DollarSign,
  BookOpen,
  GraduationCap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Home,
  Building,
  CreditCard,
  School,
} from "lucide-react";
import { EntetIMFP } from "../AnneeAcademique/module";

interface ParcoursAcademique {
  eleve: {
    id: string;
    code: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    pays_naissance: string;
    region_naissance: string;
    ville_naissance: string;
    section_naissance: string;
    sexe: "M" | "F";
    adresse_actuelle: string;
    telephone_parents: string;
    adresse_parents: string;
    nif_parents: string;
    etablissement_precedent: string;
    photo_url?: string;
    created_at?: string;
  };
  historique: {
    annee_scolaire_id: string;
    annee_scolaire_libelle: string;
    date_inscription: string;
    statut: string;
    classe_nom: string;
    salle_nom: string;
    observations?: string;
    notes: {
      trimestre_1: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      trimestre_2: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      trimestre_3: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      moyenne_annuelle: number;
    };
    decision_fin_annee?: {
      decision: "ADMIS" | "REDOUBLER" | "EXPULSER";
      observation?: string;
      date_decision: string;
    };
    frais: {
      type_frais: string;
      montant_du: number;
      montant_paye: number;
      solde: number;
      paiements: {
        date_paiement: string;
        heure_paiement: string;
        montant_paye: number;
        numero_recu: string;
        remarques?: string;
      }[];
    }[];
    total_frais_du: number;
    total_frais_paye: number;
    solde_total: number;
  }[];
  statistiques: {
    nombre_annees_scolaires: number;
    moyenne_generale_cumulative: number;
    total_frais_du_global: number;
    total_frais_paye_global: number;
    solde_global: number;
    annees_admis: number;
    annees_redouble: number;
    annees_expulse: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  eleveId: string;
  getParcoursAcademique: (eleveId: string) => Promise<ParcoursAcademique>;
}

const ParcoursAcademiqueModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDarkMode,
  eleveId,
  getParcoursAcademique,
}) => {
  const [parcours, setParcours] = useState<ParcoursAcademique | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set()); // Vide par défaut = tout fermé
  const [printMode, setPrintMode] = useState<"all" | string>("all");

  useEffect(() => {
    const loadParcours = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getParcoursAcademique(eleveId);
        setParcours(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        setTimeout(() => onClose(), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && eleveId) {
      loadParcours();
    }
  }, [isOpen, eleveId, getParcoursAcademique, onClose]);

  const toggleYear = (yearId: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(yearId)) {
      newExpanded.delete(yearId);
    } else {
      newExpanded.add(yearId);
    }
    setExpandedYears(newExpanded);
  };

  const handlePrint = (yearId?: string) => {
    // Générer le HTML
    const htmlContent = genererHTMLImpression(yearId);

    // Ouvrir une nouvelle fenêtre
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      // Écrire le contenu
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Attendre le chargement puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Optionnel : fermer automatiquement après impression
          // printWindow.onafterprint = () => printWindow.close();
        }, 500);
      };
    } else {
      alert("Veuillez autoriser les pop-ups pour imprimer le document.");
    }
  };
  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "ADMIS":
        return isDarkMode
          ? "bg-green-900 text-green-200"
          : "bg-green-100 text-green-800";
      case "REDOUBLER":
        return isDarkMode
          ? "bg-orange-900 text-orange-200"
          : "bg-orange-100 text-orange-800";
      case "EXPULSER":
        return isDarkMode
          ? "bg-red-900 text-red-200"
          : "bg-red-100 text-red-800";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const getNoteColor = (note: number) => {
    if (note >= 70) return isDarkMode ? "text-green-400" : "text-green-600";
    if (note >= 50) return isDarkMode ? "text-yellow-400" : "text-yellow-600";
    return isDarkMode ? "text-red-400" : "text-red-600";
  };

  const genererHTMLImpression = (yearId?: string) => {
    if (!parcours) return "";

    const historiqueFiltre =
      yearId && yearId !== "all"
        ? parcours.historique.filter((h) => h.annee_scolaire_id === yearId)
        : parcours.historique;

    const dateImpression = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Parcours Académique - ${parcours.eleve.prenom} ${
      parcours.eleve.nom
    }</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
          padding: 20px;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        /* EN-TÊTE PRINCIPAL */
        .header {
          text-align: center;
          border: 3px solid #2563eb;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 10px;
        }
        
        .header h1 {
          color: #1e40af;
          font-size: 28px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .header h2 {
          color: #374151;
          font-size: 22px;
          margin-bottom: 8px;
        }
        
        .header .code {
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
        }
        
        .header .date-impression {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #93c5fd;
          font-size: 12px;
          color: #4b5563;
        }
        
        /* SECTION */
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: #1e40af;
          color: white;
          padding: 12px 20px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .section-content {
          border: 2px solid #e5e7eb;
          border-top: none;
          padding: 20px;
          border-radius: 0 0 8px 8px;
          background: #fafafa;
        }
        
        /* INFORMATIONS PERSONNELLES */
        .info-personnelle {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 30px;
          align-items: start;
        }
        
        .photo-container {
          width: 150px;
          height: 180px;
          border: 3px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .photo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .photo-placeholder {
          color: #9ca3af;
          font-size: 60px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }
        
        .info-item.full-width {
          grid-column: span 2;
        }
        
        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }
        
        /* STATISTIQUES */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .stat-value.green {
          color: #059669;
        }
        
        .stat-value.red {
          color: #dc2626;
        }
        
        .stat-value.blue {
          color: #2563eb;
        }
        
        /* ANNÉE SCOLAIRE */
        .annee-scolaire {
          margin-bottom: 30px;
          page-break-inside: avoid;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .annee-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .annee-header h3 {
          font-size: 20px;
          margin: 0;
        }
        
        .annee-info {
          font-size: 13px;
          opacity: 0.95;
        }
        
        .annee-badges {
          display: flex;
          gap: 10px;
        }
        
        .badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .badge-admis {
          background: #10b981;
          color: white;
        }
        
        .badge-redoubler {
          background: #f59e0b;
          color: white;
        }
        
        .badge-expulser {
          background: #ef4444;
          color: white;
        }
        
        .badge-actif {
          background: #06b6d4;
          color: white;
        }
        
        .annee-body {
          padding: 20px;
          background: white;
        }
        
        /* NOTES */
        .notes-trimestres {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .trimestre-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #fafafa;
        }
        
        .trimestre-title {
          font-weight: bold;
          text-align: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d1d5db;
          color: #374151;
          font-size: 14px;
        }
        
        .note-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .note-item:last-child {
          border-bottom: none;
        }
        
        .note-matiere {
          color: #4b5563;
        }
        
        .note-valeur {
          font-weight: bold;
        }
        
        .note-valeur.excellent {
          color: #059669;
        }
        
        .note-valeur.bien {
          color: #d97706;
        }
        
        .note-valeur.faible {
          color: #dc2626;
        }
        
        .moyenne-trimestre {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 2px solid #d1d5db;
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 14px;
        }
        
        .moyenne-annuelle {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .moyenne-annuelle-label {
          font-size: 14px;
          color: #1e40af;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .moyenne-annuelle-value {
          font-size: 36px;
          font-weight: bold;
        }
        
        /* FRAIS */
        .frais-container {
          margin-bottom: 20px;
        }
        
        .frais-item {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 15px;
          overflow: hidden;
        }
        
        .frais-header {
          background: #f3f4f6;
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .frais-type {
          font-weight: bold;
          font-size: 15px;
          color: #1f2937;
        }
        
        .frais-solde {
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 13px;
          font-weight: bold;
        }
        
        .frais-solde.positif {
          background: #fef2f2;
          color: #dc2626;
        }
        
        .frais-solde.zero {
          background: #f0fdf4;
          color: #059669;
        }
        
        .frais-details {
          padding: 15px;
          background: white;
        }
        
        .frais-montants {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .frais-montant-item {
          text-align: center;
          padding: 10px;
          background: #fafafa;
          border-radius: 6px;
        }
        
        .frais-montant-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .frais-montant-value {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .paiements-list {
          border-top: 2px solid #e5e7eb;
          padding-top: 12px;
        }
        
        .paiements-title {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 8px;
        }
        
        .paiement-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 12px;
        }
        
        .paiement-date {
          color: #6b7280;
        }
        
        .paiement-montant {
          font-weight: bold;
          color: #059669;
        }
        
        .frais-total {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .frais-total-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          text-align: center;
        }
        
        .frais-total-item {
          padding: 10px;
        }
        
        .frais-total-label {
          font-size: 12px;
          color: #92400e;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .frais-total-value {
          font-size: 20px;
          font-weight: bold;
          color: #78350f;
        }
        
        /* DÉCISION */
        .decision-box {
          border: 3px solid #d1d5db;
          border-radius: 8px;
          padding: 15px;
          background: white;
          margin-top: 20px;
        }
        
        .decision-header {
          font-weight: bold;
          margin-bottom: 10px;
          color: #374151;
          font-size: 15px;
        }
        
        .decision-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .decision-badge-large {
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .decision-details {
          flex: 1;
        }
        
        .decision-date {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .decision-observation {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          border-left: 4px solid #9ca3af;
        }
        
        /* PIED DE PAGE */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 11px;
        }
        
        /* IMPRESSION */
        @media print {
          body {
            padding: 10px;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          .annee-scolaire {
            page-break-inside: avoid;
          }
          
          @page {
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <!-- EN-TÊTE -->
      ${EntetIMFP("")}
      <div class="header">
        <h1>📋 DOSSIER ACADÉMIQUE COMPLET</h1>
        <h2>${parcours.eleve.prenom} ${parcours.eleve.nom}</h2>
        <p class="code">Code Étudiant: ${parcours.eleve.code}</p>
        <p class="date-impression">Document imprimé le ${dateImpression}</p>
      </div>

      <!-- INFORMATIONS PERSONNELLES -->
      <div class="section">
        <div class="section-title">
          👤 INFORMATIONS PERSONNELLES
        </div>
        <div class="section-content">
          <div class="info-personnelle">
            <div class="photo-container">
              ${
                parcours.eleve.photo_url
                  ? `<img src="${parcours.eleve.photo_url}" alt="Photo">`
                  : '<div class="photo-placeholder">👤</div>'
              }
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nom Complet</div>
                <div class="info-value">${parcours.eleve.prenom} ${
      parcours.eleve.nom
    }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date de Naissance</div>
                <div class="info-value">${
                  parcours.eleve.date_naissance
                } (${calculateAge(parcours.eleve.date_naissance)} ans)</div>
              </div>
              <div class="info-item">
                <div class="info-label">Sexe</div>
                <div class="info-value">${
                  parcours.eleve.sexe === "M" ? "Masculin" : "Féminin"
                }</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Lieu de Naissance</div>
                <div class="info-value">${parcours.eleve.ville_naissance}, ${
      parcours.eleve.region_naissance
    }, ${parcours.eleve.pays_naissance}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Adresse Actuelle</div>
                <div class="info-value">${parcours.eleve.adresse_actuelle}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Téléphone Parents</div>
                <div class="info-value">${
                  parcours.eleve.telephone_parents
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">NIF Parents</div>
                <div class="info-value">${
                  parcours.eleve.nif_parents || "Non renseigné"
                }</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Adresse Parents</div>
                <div class="info-value">${parcours.eleve.adresse_parents}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Établissement Précédent</div>
                <div class="info-value">${
                  parcours.eleve.etablissement_precedent || "Non renseigné"
                }</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STATISTIQUES GLOBALES -->
      <div class="section">
        <div class="section-title">
          📊 STATISTIQUES GLOBALES
        </div>
        <div class="section-content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Années Scolaires</div>
              <div class="stat-value blue">${
                parcours.statistiques.nombre_annees_scolaires
              }</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Moyenne Cumulative</div>
              <div class="stat-value ${
                parcours.statistiques.moyenne_generale_cumulative >= 70
                  ? "green"
                  : parcours.statistiques.moyenne_generale_cumulative >= 50
                  ? ""
                  : "red"
              }">
                ${parcours.statistiques.moyenne_generale_cumulative.toFixed(2)}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Payé</div>
              <div class="stat-value green">${parcours.statistiques.total_frais_paye_global.toLocaleString()} HTG</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Solde Restant</div>
              <div class="stat-value ${
                parcours.statistiques.solde_global > 0 ? "red" : "green"
              }">
                ${parcours.statistiques.solde_global.toLocaleString()} HTG
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORIQUE PAR ANNÉE -->
      <div class="section">
        <div class="section-title">
          📚 HISTORIQUE ACADÉMIQUE DÉTAILLÉ
        </div>
        <div class="section-content">
          ${historiqueFiltre
            .map(
              (annee) => `
            <div class="annee-scolaire">
              <div class="annee-header">
                <div>
                  <h3>${annee.annee_scolaire_libelle}</h3>
                  <div class="annee-info">${annee.classe_nom} - ${
                annee.salle_nom
              }</div>
                </div>
                <div class="annee-badges">
                  <span class="badge badge-actif">${annee.statut}</span>
                  ${
                    annee.decision_fin_annee
                      ? `
                    <span class="badge badge-${annee.decision_fin_annee.decision.toLowerCase()}">
                      ${annee.decision_fin_annee.decision}
                    </span>
                  `
                      : ""
                  }
                </div>
              </div>
              
              <div class="annee-body">
                <!-- NOTES PAR TRIMESTRE -->
                <div class="notes-trimestres">
                  ${[1, 2, 3]
                    .map((trimestre) => {
                      type TrimestreKey =
                        | "trimestre_1"
                        | "trimestre_2"
                        | "trimestre_3";
                      const trimestreKey =
                        `trimestre_${trimestre}` as TrimestreKey;
                      const trimestreData = annee.notes[trimestreKey];

                      return `
                      <div class="trimestre-card">
                        <div class="trimestre-title">Trimestre ${trimestre}</div>
                        ${
                          typeof trimestreData !== "number" &&
                          trimestreData.notes_par_matiere.length > 0
                            ? `
                          ${trimestreData.notes_par_matiere
                            .map(
                              (note) => `
                            <div class="note-item">
                              <span class="note-matiere">${
                                note.matiere_nom
                              }</span>
                              <span class="note-valeur ${
                                note.note >= 70
                                  ? "excellent"
                                  : note.note >= 50
                                  ? "bien"
                                  : "faible"
                              }">
                                ${note.note.toFixed(1)}
                              </span>
                            </div>
                          `
                            )
                            .join("")}
                          <div class="moyenne-trimestre">
                            <span>Moyenne:</span>
                            <span class="${
                              trimestreData.moyenne_generale >= 70
                                ? "excellent"
                                : trimestreData.moyenne_generale >= 50
                                ? "bien"
                                : "faible"
                            }">
                              ${trimestreData.moyenne_generale.toFixed(2)}
                            </span>
                          </div>
                        `
                            : '<p style="text-align:center; color:#9ca3af; font-style:italic;">Aucune note</p>'
                        }
                      </div>
                    `;
                    })
                    .join("")}
                </div>

                <!-- MOYENNE ANNUELLE -->
                <div class="moyenne-annuelle">
                  <div class="moyenne-annuelle-label">MOYENNE ANNUELLE</div>
                  <div class="moyenne-annuelle-value ${
                    annee.notes.moyenne_annuelle >= 70
                      ? "excellent"
                      : annee.notes.moyenne_annuelle >= 50
                      ? "bien"
                      : "faible"
                  }">
                    ${annee.notes.moyenne_annuelle.toFixed(2)}
                  </div>
                </div>

                <!-- FRAIS SCOLAIRES -->
                ${
                  annee.frais.length > 0
                    ? `
                  <div class="frais-container">
                    ${annee.frais
                      .map(
                        (frais) => `
                      <div class="frais-item">
                        <div class="frais-header">
                          <span class="frais-type">${frais.type_frais}</span>
                          <span class="frais-solde ${
                            frais.solde > 0 ? "positif" : "zero"
                          }">
                            Solde: ${frais.solde.toLocaleString()} HTG
                          </span>
                        </div>
                        <div class="frais-details">
                          <div class="frais-montants">
                            <div class="frais-montant-item">
                              <div class="frais-montant-label">Montant Dû</div>
                              <div class="frais-montant-value">${frais.montant_du.toLocaleString()} HTG</div>
                            </div>
                            <div class="frais-montant-item">
                              <div class="frais-montant-label">Montant Payé</div>
                              <div class="frais-montant-value">${frais.montant_paye.toLocaleString()} HTG</div>
                            </div>
                            <div class="frais-montant-item">
                              <div class="frais-montant-label">Solde</div>
                              <div class="frais-montant-value">${frais.solde.toLocaleString()} HTG</div>
                            </div>
                          </div>
                          ${
                            frais.paiements.length > 0
                              ? `
                            <div class="paiements-list">
                              <div class="paiements-title">📝 ${
                                frais.paiements.length
                              } Paiement(s) effectué(s)</div>
                              ${frais.paiements
                                .map(
                                  (paiement) => `
                                <div class="paiement-item">
                                  <div>
                                    <div class="paiement-date">${
                                      paiement.date_paiement
                                    } à ${paiement.heure_paiement}</div>
                                    <div style="font-size:11px; color:#9ca3af;">Reçu: ${
                                      paiement.numero_recu
                                    }</div>
                                  </div>
                                  <div class="paiement-montant">${paiement.montant_paye.toLocaleString()} HTG</div>
                                </div>
                              `
                                )
                                .join("")}
                            </div>
                          `
                              : ""
                          }
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                    
                    <div class="frais-total">
                      <div class="frais-total-grid">
                        <div class="frais-total-item">
                          <div class="frais-total-label">Total Dû</div>
                          <div class="frais-total-value">${annee.total_frais_du.toLocaleString()} HTG</div>
                        </div>
                        <div class="frais-total-item">
                          <div class="frais-total-label">Total Payé</div>
                          <div class="frais-total-value">${annee.total_frais_paye.toLocaleString()} HTG</div>
                        </div>
                        <div class="frais-total-item">
                          <div class="frais-total-label">Solde Total</div>
                          <div class="frais-total-value">${annee.solde_total.toLocaleString()} HTG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                `
                    : ""
                }

                <!-- DÉCISION FIN D'ANNÉE -->
                ${
                  annee.decision_fin_annee
                    ? `
                  <div class="decision-box">
                    <div class="decision-header">🎓 DÉCISION DE FIN D'ANNÉE</div>
                    <div class="decision-content">
                      <span class="badge-${annee.decision_fin_annee.decision.toLowerCase()} decision-badge-large">
                        ${annee.decision_fin_annee.decision}
                      </span>
                      <div class="decision-details">
                        <div class="decision-date">Date de décision: ${
                          annee.decision_fin_annee.date_decision
                        }</div>
                        ${
                          annee.decision_fin_annee.observation
                            ? `
                          <div class="decision-observation">
                            <strong>Observation:</strong> ${annee.decision_fin_annee.observation}
                          </div>
                        `
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- PIED DE PAGE -->
      <div class="footer">
        <p><strong>Document officiel - Parcours Académique Complet</strong></p>
        <p>Imprimé le ${dateImpression}</p>
        <p>Code Étudiant: ${parcours.eleve.code} | ${parcours.eleve.prenom} ${
      parcours.eleve.nom
    }</p>
      </div>
    </body>
    </html>
  `;
  };

  if (!isOpen) return null;

  const bgModal = isDarkMode ? "bg-gray-900" : "bg-white";
  const bgCard = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-600";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";

  return (
    <>
      <style>
        {`
  @media print {
    /* === RESET COMPLET === */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      background: white !important;
    }
    
    /* === MASQUER L'INTERFACE === */
    .fixed.inset-0.bg-black {
      position: static !important;
      background: white !important;
    }
    
    .max-w-6xl {
      max-width: 100% !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
    
    .no-print,
    button,
    .sticky {
      display: none !important;
    }
    
    /* === FORCER FOND BLANC === */
    .bg-gray-900,
    .bg-gray-800,
    .bg-gray-700,
    .bg-gray-600 {
      background: white !important;
    }
    
    /* === TEXTE NOIR === */
    .text-white,
    .text-gray-300,
    .text-gray-100 {
      color: #1f2937 !important;
    }
    
    .text-gray-600,
    .text-gray-400 {
      color: #4b5563 !important;
    }
    
    /* === BORDURES VISIBLES === */
    .border-gray-700,
    .border-gray-200 {
      border-color: #d1d5db !important;
    }
    
    /* === CONFIGURATION PAGE === */
    @page {
      size: A4 portrait;
      margin: 15mm 10mm;
    }
    
    /* === ÉVITER LES COUPURES === */
    .rounded-xl,
    .space-y-6 > div {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* === ESPACEMENTS === */
    .p-6 {
      padding: 10px !important;
    }
    
    .space-y-6 > * + * {
      margin-top: 15px !important;
    }
    
    .space-y-4 > * + * {
      margin-top: 10px !important;
    }
    
    /* === GRILLE RESPONSIVE === */
    .grid {
      display: grid !important;
    }
    
    .md\\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    
    .md\\:grid-cols-3 {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 10px !important;
    }
    
    .md\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    
    /* === PHOTO ÉLÈVE === */
    img {
      max-width: 120px !important;
      max-height: 120px !important;
    }
    
    /* === TITRES === */
    h2, h3 {
      color: #1f2937 !important;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 5px;
      margin-bottom: 10px !important;
    }
    
    h4 {
      color: #1f2937 !important;
    }
    
    /* === TABLEAUX DE NOTES === */
    .grid.gap-4 {
      gap: 8px !important;
    }
    
    /* === BADGES ET ÉTIQUETTES === */
    .rounded-full {
      border: 1px solid #d1d5db !important;
      background: white !important;
      color: #1f2937 !important;
      font-weight: 600 !important;
    }
    
    /* === CARTES === */
    .rounded-lg,
    .rounded-xl {
      border: 1px solid #d1d5db !important;
      padding: 8px !important;
    }
    
    /* === ICÔNES (cacher si trop) === */
    svg {
      display: inline-block !important;
      width: 16px !important;
      height: 16px !important;
    }
    
    /* === SAUT DE PAGE INTELLIGENT === */
    .space-y-4 > div:nth-child(n+3) {
      page-break-before: auto;
    }
    
    /* === ÉCONOMIE D'ESPACE === */
    .flex-col {
      display: block !important;
    }
    
    .md\\:flex-row {
      display: flex !important;
    }
    
    /* === IMPRESSION SÉLECTIVE === */
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:block {
      display: block !important;
    }
    
    /* === COMPACTER LES PAIEMENTS === */
    .space-y-2 {
      margin-top: 5px !important;
    }
    
    .space-y-3 {
      margin-top: 8px !important;
    }
  }
  
  /* === EN-TÊTE D'IMPRESSION === */
  @media print {
    #printable-area::before {
      content: "";
      display: block;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding: 10px;
      border: 2px solid #2563eb;
      background: #eff6ff;
    }
  }
`}
      </style>

      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div
          className={`${bgModal} rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto`}
        >
          {/* Header */}
          <div
            className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor} p-6 flex items-center justify-between no-print`}
          >
            <h2 className={`text-2xl font-bold ${textPrimary}`}>
              Parcours Académique Complet
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Tout Imprimer
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6" id="printable-area">
            {/* EN-TÊTE ADMINISTRATIF - Visible uniquement à l'impression */}
            <div className="hidden print:block border-2 border-blue-600 bg-blue-50 p-4 mb-4 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                DOSSIER ACADÉMIQUE COMPLET
              </h1>
              {parcours && (
                <>
                  <p className="text-lg font-semibold text-gray-800">
                    {parcours.eleve.prenom} {parcours.eleve.nom}
                  </p>
                  <p className="text-sm text-gray-600">
                    Code Étudiant: {parcours.eleve.code} | Date d'impression:{" "}
                    {new Date().toLocaleDateString("fr-FR")} à{" "}
                    {new Date().toLocaleTimeString("fr-FR")}
                  </p>
                </>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  isDarkMode
                    ? "bg-red-900/30 text-red-200"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            {parcours && (
              <div className="space-y-6">
                {/* INFORMATIONS PERSONNELLES COMPLÈTES */}
                <div
                  className={`${bgCard} border ${borderColor} rounded-xl p-6`}
                >
                  <h3
                    className={`text-xl font-bold ${textPrimary} mb-6 flex items-center gap-2`}
                  >
                    <User className="h-6 w-6 text-blue-600" />
                    Informations Personnelles
                  </h3>

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo */}
                    <div className="flex justify-center md:justify-start">
                      <div
                        className={`w-40 h-40 rounded-xl overflow-hidden border-4 ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        } flex items-center justify-center ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        } shadow-lg`}
                      >
                        {parcours.eleve.photo_url ? (
                          <img
                            src={parcours.eleve.photo_url}
                            alt={`${parcours.eleve.prenom} ${parcours.eleve.nom}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <User className="h-20 w-20 text-gray-400" />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    <div className="flex-1 space-y-6">
                      {/* Identité */}
                      <div>
                        <h4
                          className={`text-2xl font-bold ${textPrimary} mb-1`}
                        >
                          {parcours.eleve.prenom} {parcours.eleve.nom}
                        </h4>
                        <p className={`${textSecondary} font-mono text-lg`}>
                          Code: {parcours.eleve.code}
                        </p>
                      </div>

                      {/* Détails personnels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start gap-3">
                            <Calendar
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Date de Naissance
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.date_naissance}
                              </p>
                              <p className={`text-sm ${textSecondary}`}>
                                {calculateAge(parcours.eleve.date_naissance)}{" "}
                                ans
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start gap-3">
                            <User className={`h-5 w-5 ${textSecondary} mt-1`} />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Sexe
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.sexe === "M"
                                  ? "Masculin"
                                  : "Féminin"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3 md:col-span-2`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Lieu de Naissance
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.ville_naissance},{" "}
                                {parcours.eleve.region_naissance},{" "}
                                {parcours.eleve.pays_naissance}
                              </p>
                              {parcours.eleve.section_naissance && (
                                <p className={`text-sm ${textSecondary}`}>
                                  Section: {parcours.eleve.section_naissance}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3 md:col-span-2`}
                        >
                          <div className="flex items-start gap-3">
                            <Home className={`h-5 w-5 ${textSecondary} mt-1`} />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Adresse Actuelle
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.adresse_actuelle}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start gap-3">
                            <Phone
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Téléphone Parents
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.telephone_parents}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start gap-3">
                            <CreditCard
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                NIF Parents
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.nif_parents || "Non renseigné"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3 md:col-span-2`}
                        >
                          <div className="flex items-start gap-3">
                            <Building
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Adresse Parents
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.adresse_parents}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`${bgCard} border ${borderColor} rounded-lg p-3 md:col-span-2`}
                        >
                          <div className="flex items-start gap-3">
                            <School
                              className={`h-5 w-5 ${textSecondary} mt-1`}
                            />
                            <div>
                              <p
                                className={`text-xs ${textSecondary} uppercase mb-1`}
                              >
                                Établissement Précédent
                              </p>
                              <p className={`${textPrimary} font-semibold`}>
                                {parcours.eleve.etablissement_precedent ||
                                  "Non renseigné"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiques Globales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    className={`${bgCard} border ${borderColor} rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className={`text-sm ${textSecondary}`}>
                          Années scolaires
                        </p>
                        <p className={`text-2xl font-bold ${textPrimary}`}>
                          {parcours.statistiques.nombre_annees_scolaires}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${bgCard} border ${borderColor} rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-8 w-8 text-green-600" />
                      <div>
                        <p className={`text-sm ${textSecondary}`}>
                          Moyenne cumulative
                        </p>
                        <p
                          className={`text-2xl font-bold ${getNoteColor(
                            parcours.statistiques.moyenne_generale_cumulative
                          )}`}
                        >
                          {parcours.statistiques.moyenne_generale_cumulative.toFixed(
                            2
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${bgCard} border ${borderColor} rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className={`text-sm ${textSecondary}`}>Total payé</p>
                        <p className={`text-xl font-bold ${textPrimary}`}>
                          {parcours.statistiques.total_frais_paye_global.toLocaleString()}{" "}
                          HTG
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${bgCard} border ${borderColor} rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className={`text-sm ${textSecondary}`}>Solde</p>
                        <p
                          className={`text-xl font-bold ${
                            parcours.statistiques.solde_global > 0
                              ? isDarkMode
                                ? "text-red-400"
                                : "text-red-600"
                              : isDarkMode
                              ? "text-green-400"
                              : "text-green-600"
                          }`}
                        >
                          {parcours.statistiques.solde_global.toLocaleString()}{" "}
                          HTG
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORIQUE PAR ANNÉE AVEC CHEVRONS */}
                <div className="space-y-4">
                  <h3
                    className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}
                  >
                    <BookOpen className="h-6 w-6" />
                    Historique Académique par Année
                  </h3>

                  {parcours.historique.map((annee, index) => {
                    const isExpanded = expandedYears.has(
                      annee.annee_scolaire_id
                    );
                    const shouldPrint =
                      printMode === "all" ||
                      printMode === annee.annee_scolaire_id;

                    return (
                      <div
                        key={index}
                        className={`${bgCard} border ${borderColor} rounded-xl overflow-hidden ${
                          !shouldPrint ? "print:hidden" : ""
                        }`}
                      >
                        {/* En-tête cliquable */}
                        <button
                          onClick={() => toggleYear(annee.annee_scolaire_id)}
                          className={`w-full p-6 flex items-center justify-between ${
                            isDarkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          } transition-colors no-print`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                              }`}
                            >
                              <GraduationCap className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <h4
                                className={`text-lg font-bold ${textPrimary}`}
                              >
                                {annee.annee_scolaire_libelle}
                              </h4>
                              <p className={textSecondary}>
                                {annee.classe_nom} - {annee.salle_nom}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {annee.decision_fin_annee && (
                              <span
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${getDecisionColor(
                                  annee.decision_fin_annee.decision
                                )}`}
                              >
                                {annee.decision_fin_annee.decision}
                              </span>
                            )}
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-semibold bg-emerald-700}`}
                            >
                              {annee.statut}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint(annee.annee_scolaire_id);
                              }}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              title="Imprimer cette année"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="h-6 w-6" />
                            ) : (
                              <ChevronDown className="h-6 w-6" />
                            )}
                          </div>
                        </button>

                        {/* Contenu détaillé - CACHÉ PAR DÉFAUT */}
                        <div
                          className={`transition-all duration-300 ${
                            isExpanded ? "block" : "hidden"
                          } print:block`}
                        >
                          <div className="p-6 pt-0 space-y-6">
                            <div
                              className={`border-t ${borderColor} pt-6`}
                            ></div>

                            {/* Notes par trimestre */}
                            <div>
                              <h5
                                className={`font-bold ${textPrimary} mb-4 text-lg`}
                              >
                                Notes et Moyennes
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map((trimestre) => {
                                  const trimestreKey =
                                    `trimestre_${trimestre}` as keyof typeof annee.notes;
                                  const trimestreData =
                                    annee.notes[trimestreKey];

                                  return (
                                    <div
                                      key={trimestre}
                                      className={`border ${borderColor} rounded-lg p-4`}
                                    >
                                      <h6
                                        className={`font-semibold ${textPrimary} mb-3 text-center`}
                                      >
                                        Trimestre {trimestre}
                                      </h6>
                                      {typeof trimestreData !== "number" &&
                                      trimestreData.notes_par_matiere.length >
                                        0 ? (
                                        <>
                                          <div className="space-y-2 mb-3">
                                            {trimestreData.notes_par_matiere.map(
                                              (note, idx) => (
                                                <div
                                                  key={idx}
                                                  className="flex justify-between items-center text-sm"
                                                >
                                                  <span
                                                    className={textSecondary}
                                                  >
                                                    {note.matiere_nom}
                                                  </span>
                                                  <span
                                                    className={`font-semibold ${getNoteColor(
                                                      note.note
                                                    )}`}
                                                  >
                                                    {note.note.toFixed(1)}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                          <div
                                            className={`pt-3 border-t ${borderColor} flex justify-between`}
                                          >
                                            <span
                                              className={`font-semibold ${textSecondary}`}
                                            >
                                              Moyenne:
                                            </span>
                                            <span
                                              className={`font-bold text-lg ${getNoteColor(
                                                trimestreData.moyenne_generale
                                              )}`}
                                            >
                                              {trimestreData.moyenne_generale.toFixed(
                                                2
                                              )}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <p
                                          className={`text-sm ${textSecondary} italic text-center`}
                                        >
                                          Aucune note
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div
                                className={`mt-4 bg-gradient-to-r ${
                                  isDarkMode
                                    ? "from-blue-900/30 to-purple-900/30"
                                    : "from-blue-50 to-purple-50"
                                } rounded-lg p-4`}
                              >
                                <div className="flex justify-between items-center">
                                  <span
                                    className={`text-lg font-semibold ${textPrimary}`}
                                  >
                                    Moyenne Annuelle
                                  </span>
                                  <span
                                    className={`text-3xl font-bold ${getNoteColor(
                                      annee.notes.moyenne_annuelle
                                    )}`}
                                  >
                                    {annee.notes.moyenne_annuelle.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Frais et paiements */}
                            {annee.frais.length > 0 && (
                              <div>
                                <h5
                                  className={`font-bold ${textPrimary} mb-4 text-lg`}
                                >
                                  Frais Scolaires
                                </h5>
                                <div className="space-y-3">
                                  {annee.frais.map((frais, idx) => (
                                    <div
                                      key={idx}
                                      className={`border ${borderColor} rounded-lg p-4`}
                                    >
                                      <div className="flex justify-between items-center mb-3">
                                        <span
                                          className={`font-semibold ${textPrimary} text-lg`}
                                        >
                                          {frais.type_frais}
                                        </span>
                                        <span
                                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            frais.solde > 0
                                              ? isDarkMode
                                                ? "bg-red-900 text-red-200"
                                                : "bg-red-100 text-red-800"
                                              : isDarkMode
                                              ? "bg-green-900 text-green-200"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          Solde: {frais.solde.toLocaleString()}{" "}
                                          HTG
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                          <p
                                            className={`text-xs ${textSecondary} mb-1`}
                                          >
                                            Montant dû
                                          </p>
                                          <p
                                            className={`text-lg font-bold ${textPrimary}`}
                                          >
                                            {frais.montant_du.toLocaleString()}{" "}
                                            HTG
                                          </p>
                                        </div>
                                        <div>
                                          <p
                                            className={`text-xs ${textSecondary} mb-1`}
                                          >
                                            Montant payé
                                          </p>
                                          <p
                                            className={`text-lg font-bold ${textPrimary}`}
                                          >
                                            {frais.montant_paye.toLocaleString()}{" "}
                                            HTG
                                          </p>
                                        </div>
                                      </div>
                                      {frais.paiements.length > 0 && (
                                        <div
                                          className={`border-t ${borderColor} pt-3`}
                                        >
                                          <p
                                            className={`text-sm ${textSecondary} mb-2 font-semibold`}
                                          >
                                            {frais.paiements.length} Paiement(s)
                                          </p>
                                          <div className="space-y-2">
                                            {frais.paiements.map(
                                              (paiement, pidx) => (
                                                <div
                                                  key={pidx}
                                                  className={`${
                                                    isDarkMode
                                                      ? "bg-gray-700/50"
                                                      : "bg-gray-50"
                                                  } rounded p-2 flex justify-between items-center text-sm`}
                                                >
                                                  <div>
                                                    <p className={textPrimary}>
                                                      {paiement.date_paiement} à{" "}
                                                      {paiement.heure_paiement}
                                                    </p>
                                                    <p
                                                      className={`text-xs ${textSecondary}`}
                                                    >
                                                      Reçu:{" "}
                                                      {paiement.numero_recu}
                                                    </p>
                                                  </div>
                                                  <p
                                                    className={`font-bold ${textPrimary}`}
                                                  >
                                                    {paiement.montant_paye.toLocaleString()}{" "}
                                                    HTG
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  <div
                                    className={`bg-gradient-to-r ${
                                      isDarkMode
                                        ? "from-purple-900/30 to-pink-900/30"
                                        : "from-purple-50 to-pink-50"
                                    } rounded-lg p-4`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span
                                        className={`font-bold ${textPrimary} text-lg`}
                                      >
                                        Total de l'année
                                      </span>
                                      <div className="text-right">
                                        <p
                                          className={`text-sm ${textSecondary}`}
                                        >
                                          Payé:{" "}
                                          {annee.total_frais_paye.toLocaleString()}{" "}
                                          HTG
                                        </p>
                                        <p
                                          className={`text-2xl font-bold ${
                                            annee.solde_total > 0
                                              ? isDarkMode
                                                ? "text-red-400"
                                                : "text-red-600"
                                              : isDarkMode
                                              ? "text-green-400"
                                              : "text-green-600"
                                          }`}
                                        >
                                          Solde:{" "}
                                          {annee.solde_total.toLocaleString()}{" "}
                                          HTG
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Décision de fin d'année et observations */}
                            {annee.decision_fin_annee && (
                              <div
                                className={`border ${borderColor} rounded-lg p-4`}
                              >
                                <h5
                                  className={`font-bold ${textPrimary} mb-3 text-lg`}
                                >
                                  Décision de Fin d'Année
                                </h5>
                                <div className="flex items-center gap-4 mb-3">
                                  <span
                                    className={`px-6 py-3 rounded-full text-lg font-bold ${getDecisionColor(
                                      annee.decision_fin_annee.decision
                                    )}`}
                                  >
                                    {annee.decision_fin_annee.decision}
                                  </span>
                                  <span className={textSecondary}>
                                    Date:{" "}
                                    {annee.decision_fin_annee.date_decision}
                                  </span>
                                </div>
                                {annee.decision_fin_annee.observation && (
                                  <div
                                    className={`${
                                      isDarkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-50"
                                    } rounded-lg p-3`}
                                  >
                                    <p
                                      className={`text-sm ${textSecondary} mb-1`}
                                    >
                                      Observation:
                                    </p>
                                    <p className={textPrimary}>
                                      {annee.decision_fin_annee.observation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {annee.observations && (
                              <div
                                className={`border ${borderColor} rounded-lg p-4`}
                              >
                                <h5 className={`font-bold ${textPrimary} mb-2`}>
                                  Observations de l'inscription
                                </h5>
                                <p className={textSecondary}>
                                  {annee.observations}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ParcoursAcademiqueModal;
