"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  Download,
  Printer,
  Settings,
  CheckCircle,
  Loader2,
  Users,
  ChevronRight,
  Sparkles,
  RotateCw,
  Palette,
  ImageIcon,
  Save,
  Eye,
  EyeOff,
  Trash2,
  LayoutGrid,
  Type,
  QrCode,
  FileCheck,
  AlertCircle,
  Square,
  RefreshCw,
} from "lucide-react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useEleves } from "@/Context/ContextEleves";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import BadgeClassicCustomizable, {
  BadgeConfig,
  EleveData,
  AVAILABLE_FIELDS,
} from "@/module/BadgeCadre/BadgeClassicCustomizable";
import { badgeModelService, BadgeModel } from "@/services/badgeModelService";
import {
  generateBadgeImage,
  exportBadgesAsPdf,
  exportBadgesAsImages,
  sanitizeColors,
} from "@/utils/badgeUtils";

// ... (keep unused imports if needed or rely on ts cleanup)

// ... inside component

// --- Types & Interfaces ---

interface Props {
  isDarkMode: boolean;
}

// Configuration par défaut du badge
export const DEFAULT_BADGE_CONFIG: BadgeConfig = {
  // Couleurs
  headerBgColor: "#ea580c",
  bodyBgColor: "#fff7ed",
  headerTextColor: "#ffffff",
  nameTextColor: "#ea580c",
  infoTextColor: "#1f2937",
  footerBgColor: "rgba(0,0,0,0.05)",
  footerTextColor: "#1f2937",

  // Contenu
  showLogo: true,
  customLogo: "",
  customSignature: "",
  showQRCode: true,

  // Style En-tête
  headerHeight: 20,
  headerBorderWidth: 0,
  headerBorderColor: "#ea580c",
  headerBorderPositions: {
    top: false,
    bottom: false,
    left: false,
    right: false,
  },
  headerRounded: "none",
  useTransparentHeader: false,

  // Arrière-plan
  backgroundPattern: "none",
  customBackground: "",
  selectedBackgroundImage: "",
  useBackgroundImage: false,

  // Structure
  orientation: "portrait",
  // Photo defaults
  photoWidthMm: 22,
  photoHeightMm: 25,
  photoBorderEnabled: true,
  photoBorderWidth: 0.4,
  photoBorderColor: "#ea580c",
  photoBorderRadius: 0,
  photoBorderShape: "square",
  // Photo background defaults
  photoBackgroundColor: "rgba(255,255,255,0.7)",
  photoBackgroundTransparent: false,
  // Footer
  footerTransparent: false,

  // Contenu Dynamique
  selectedFields: ["code", "classe_nom", "salle_nom", "groupe_sanguin", "vacation"],
  vacationValue: "AM",
};

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  isPremium?: boolean;
}

// Images de background prédéfinies
const PREDEFINED_BACKGROUNDS = [
  {
    id: "abstract1",
    url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=600&fit=crop&q=80",
    name: "Abstrait Orange",
  },
  {
    id: "abstract2",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=600&fit=crop&q=80",
    name: "Abstrait Bleu",
  },
  {
    id: "geometric1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop&q=80",
    name: "Géométrique",
  },
  {
    id: "gradient1",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=600&fit=crop&q=80",
    name: "Dégradé",
  },
  {
    id: "wave1",
    url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&h=600&fit=crop&q=80",
    name: "Vagues",
  },
  {
    id: "minimal1",
    url: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=400&h=600&fit=crop&q=80",
    name: "Minimal",
  },
];

const BACKGROUND_PATTERNS = {
  none: "Uni",
  gradient1: "Dégradé 1",
  gradient2: "Dégradé 2",
  dots: "Points",
  waves: "Vagues",
};

// Exemple d'élève pour la prévisualisation
const MOCK_STUDENT: EleveData = {
  id: "preview-123",
  code: "EX-2024-001",
  nom: "DUPONT",
  prenom: "Jean-Michel",
  photo_url: "/image.png",
  classe_nom: "Terminale S",
  salle_nom: "Salle 101",
};

// --- Composants UI Helper ---

const SectionTitle = ({
  icon: Icon,
  title,
  className = "",
}: {
  icon: any;
  title: string;
  className?: string;
}) => (
  <h3
    className={`font-bold flex items-center gap-2 text-sm uppercase tracking-wide mb-4 ${className}`}
  >
    <Icon size={18} className="text-blue-600" />
    {title}
  </h3>
);

const SettingsGroup = ({
  title,
  icon,
  children,
  isDarkMode,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  isDarkMode: boolean;
}) => (
  <div
    className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md mb-4 ${
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`}
  >
    <SectionTitle
      icon={icon}
      title={title}
      className={isDarkMode ? "text-gray-100" : "text-gray-800"}
    />
    <div className="space-y-4 text-sm">{children}</div>
  </div>
);

// --- Main Component ---

const GestionBadge = ({ isDarkMode }: Props) => {
  const { currentYear } = useAnneeScolaire();
  const { eleves } = useEleves();
  const { currentSession } = useContextUtilisateur();

  // États principaux
  const [currentStep, setCurrentStep] = useState<
    "selection" | "template_choice" | "design" | "print"
  >("selection");
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedSalle, setSelectedSalle] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");

  // États de traitement
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedBadges, setGeneratedBadges] = useState<any[]>([]);

  // Modèles sauvegardés
  const [savedModels, setSavedModels] = useState<BadgeModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modelName, setModelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  // Pour contrôler le rendu paresseux des aperçus (évite de monter des composants lourds)
  const [previewActiveIds, setPreviewActiveIds] = useState<Set<string>>(
    new Set()
  );

  // Pagination des modèles sauvegardés
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const displayedModels = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return savedModels.slice(start, start + PAGE_SIZE);
  }, [savedModels, currentPage]);

  // Quand la page change ou que les modèles changent, activer automatiquement
  // les aperçus pour les modèles de la page courante seulement.
  useEffect(() => {
    const ids = new Set(displayedModels.map((m) => m.id));
    setPreviewActiveIds(ids);

    // Si la page courante dépasse le nombre de pages disponibles, remettre à 1
    const pageCount = Math.max(1, Math.ceil(savedModels.length / PAGE_SIZE));
    if (currentPage > pageCount) setCurrentPage(1);
  }, [displayedModels, savedModels.length, currentPage]);

  // Sélection pour export
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<Set<string>>(
    new Set()
  );

  const toggleBadgeSelection = (id: string) => {
    const newUi = new Set(selectedBadgeIds);
    if (newUi.has(id)) {
      newUi.delete(id);
    } else {
      newUi.add(id);
    }
    setSelectedBadgeIds(newUi);
  };

  const toggleSelectAll = () => {
    if (selectedBadgeIds.size === generatedBadges.length) {
      setSelectedBadgeIds(new Set());
    } else {
      setSelectedBadgeIds(new Set(generatedBadges.map((b) => b.id)));
    }
  };

  // Configuration par défaut du badge
  const [badgeConfig, setBadgeConfig] =
    useState<BadgeConfig>(DEFAULT_BADGE_CONFIG);

  // Photo de prévisualisation dans le design (upload local)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // État local pour le toggle "Couleur unifiée" (UI helper seulement)
  const [useUnifiedTextColor, setUseUnifiedTextColor] = useState(false);
  const [unifiedTextColor, setUnifiedTextColor] = useState("#1f2937");

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
  };

  const templates: BadgeTemplate[] = [
    {
      id: "classic",
      name: "Classic",
      description: "Le standard scolaire.",
      isPremium: false,
    },
  ];

  const allClasses = currentYear?.classes || [];
  const filteredSalles =
    allClasses.find((c) => c.id === selectedClasse)?.salles || [];

  const elevesInClasseSalle = eleves.filter(
    (eleve) =>
      eleve.classe_id === selectedClasse &&
      eleve.salle_id === selectedSalle &&
      eleve.annee_scolaire_id === currentYear?.id
  );

  const loadSavedModels = useCallback(async () => {
    if (isLoadingModels) return;
    setIsLoadingModels(true);
    console.log("[GestionBadge] Tentative de chargement des modèles...");

    try {
      const role = (currentSession?.role || "").toLowerCase().trim();
      const isAdmin =
        role === "super administrateur" || role === "administrateur";
      const currentUserId = currentSession?.user?.id;

      console.log(
        `[GestionBadge] Session info: id=${currentUserId}, role=${role}, isAdmin=${isAdmin}`
      );

      // Si on n'a ni ID ni admin, on attend la session
      if (!currentUserId && !isAdmin) {
        console.log("[GestionBadge] En attente de session utilisateur...");
        setIsLoadingModels(false);
        return;
      }

      const models = await badgeModelService.getMyModels(
        isAdmin ? undefined : currentUserId
      );

      // Sécurité: S'assurer que 'config' est bien un objet
      const sanitizedModels = (models || []).map((m) => {
        let parsedConfig = m.config;
        if (typeof m.config === "string") {
          try {
            // On gère d'éventuels double-quotes de Supabase/Postgres
            let raw = (m.config as any).trim();
            parsedConfig = JSON.parse(raw);
            // Si après premier parse c'est encore une string, on re-parse (double stringify)
            if (typeof parsedConfig === "string") {
              parsedConfig = JSON.parse(parsedConfig);
            }
          } catch (e) {
            console.error("Erreur parse config pour modèle:", m.name, e);
          }
        }
        return { ...m, config: { ...DEFAULT_BADGE_CONFIG, ...parsedConfig } };
      });

      console.log(
        `[GestionBadge] ${sanitizedModels.length} modèles chargés avec succès.`
      );
      setSavedModels(sanitizedModels);
    } catch (e) {
      console.error("Erreur fatale lors du chargement des modèles:", e);
    } finally {
      setIsLoadingModels(false);
    }
  }, [currentSession?.role, currentSession?.user?.id, isLoadingModels]);

  useEffect(() => {
    loadSavedModels();
  }, [currentSession?.user?.id, loadSavedModels]);

  const handleSaveModel = async () => {
    if (!modelName.trim() || !currentSession?.user?.id) return;
    try {
      setIsSaving(true);

      if (editingModelId) {
        // Modification d'un modèle existant
        await badgeModelService.updateModel(editingModelId, {
          name: modelName,
          config: badgeConfig,
        });
        alert("Modèle mis à jour !");
      } else {
        // Création d'un nouveau modèle
        await badgeModelService.createModel(
          {
            name: modelName,
            description: "Modèle personnalisé",
            config: badgeConfig,
            template_id: selectedTemplate,
          },
          currentSession.user.id
        );
        alert("Nouveau modèle sauvegardé !");
      }

      setShowSaveModal(false);
      loadSavedModels();
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModel = (model: BadgeModel) => {
    // 1. Mettre à jour la config
    const config = model.config;
    setBadgeConfig(config);
    setSelectedTemplate(model.template_id);
    setEditingModelId(model.id);
    setModelName(model.name);

    // 2. Générer les badges immédiatement pour les élèves sélectionnés
    if (elevesInClasseSalle.length > 0) {
      const badges = elevesInClasseSalle.map((eleve) => {
        const classe = allClasses.find((c) => c.id === eleve.classe_id);
        const salle = classe?.salles.find((s) => s.id === eleve.salle_id);
        const eleveData: EleveData = {
          id: eleve.id,
          code: eleve.code,
          nom: eleve.nom,
          prenom: eleve.prenom,
          photo_url: eleve.photo_url,
          classe_nom: classe?.name || (eleve as any).classe_nom || "N/A",
          salle_nom: salle?.name || (eleve as any).salle_nom || "N/A",
          groupe_sanguin: (eleve as any).groupe_sanguin,
          sexe: (eleve as any).sexe,
          date_naissance: (eleve as any).date_naissance,
          pays_naissance: (eleve as any).pays_naissance,
          ville_naissance: (eleve as any).ville_naissance,
          adresse_actuelle: (eleve as any).adresse_actuelle,
          telephone_parents: (eleve as any).telephone_parents,
          nom_prenom_parent: (eleve as any).nom_prenom_parent,
          nif_parents: (eleve as any).nif_parents,
        };

        return {
          id: eleve.id,
          eleve: eleveData,
          config: config, // Utilisation directe pour éviter l'async de setBadgeConfig
        };
      });
      setGeneratedBadges(badges);
      console.log(
        `[GestionBadge] ${badges.length} badges générés à partir du modèle "${model.name}".`
      );
    } else {
      console.warn(
        "[GestionBadge] Aucun élève sélectionné pour générer les badges."
      );
    }

    // 3. Aller à l'impression
    setCurrentStep("print");
  };

  const togglePreviewModel = (id: string) => {
    setPreviewActiveIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleCreateNew = () => {
    setEditingModelId(null);
    setModelName("");
    // Optionnel: reset des couleurs par défaut
    setCurrentStep("design");
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${name}" ?`))
      return;

    try {
      await badgeModelService.deleteModel(id);
      loadSavedModels();
      alert("Modèle supprimé.");
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "customLogo" | "customSignature" | "customBackground"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBadgeConfig({ ...badgeConfig, [field]: reader.result as string });
        // Si c'est un background, on désactive les autres modes de background
        if (field === "customBackground") {
          setBadgeConfig((prev) => ({
            ...prev,
            customBackground: reader.result as string,
            useBackgroundImage: false,
            selectedBackgroundImage: "",
            backgroundPattern: "none",
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePredefinedBackground = (url: string) => {
    setBadgeConfig({
      ...badgeConfig,
      selectedBackgroundImage: url,
      useBackgroundImage: true,
      customBackground: "",
      backgroundPattern: "none",
    });
  };

  const toggleUnifiedColor = (checked: boolean) => {
    setUseUnifiedTextColor(checked);
    if (checked) {
      setBadgeConfig((prev) => ({
        ...prev,
        headerTextColor: unifiedTextColor,
        nameTextColor: unifiedTextColor,
        infoTextColor: unifiedTextColor,
      }));
    }
  };

  const updateUnifiedColor = (color: string) => {
    setUnifiedTextColor(color);
    if (useUnifiedTextColor) {
      setBadgeConfig((prev) => ({
        ...prev,
        headerTextColor: color,
        nameTextColor: color,
        infoTextColor: color,
      }));
    }
  };

  const toggleBorderPosition = (
    pos: keyof typeof badgeConfig.headerBorderPositions
  ) => {
    setBadgeConfig((prev) => ({
      ...prev,
      headerBorderPositions: {
        ...prev.headerBorderPositions,
        [pos]: !prev.headerBorderPositions[pos],
      },
    }));
  };

  const prepareGeneration = () => {
    const badges = elevesInClasseSalle.map((eleve) => {
      const classe = allClasses.find((c) => c.id === eleve.classe_id);
      const salle = classe?.salles.find((s) => s.id === eleve.salle_id);
      const eleveData: EleveData = {
        id: eleve.id,
        code: eleve.code,
        nom: eleve.nom,
        prenom: eleve.prenom,
        photo_url: eleve.photo_url,
        classe_nom: classe?.name || (eleve as any).classe_nom || "N/A",
        salle_nom: salle?.name || (eleve as any).salle_nom || "N/A",
        groupe_sanguin: (eleve as any).groupe_sanguin,
        sexe: (eleve as any).sexe,
        date_naissance: (eleve as any).date_naissance,
        pays_naissance: (eleve as any).pays_naissance,
        ville_naissance: (eleve as any).ville_naissance,
        adresse_actuelle: (eleve as any).adresse_actuelle,
        telephone_parents: (eleve as any).telephone_parents,
        nom_prenom_parent: (eleve as any).nom_prenom_parent,
        nif_parents: (eleve as any).nif_parents,
      };

      return {
        id: eleve.id,
        eleve: eleveData,
        config: badgeConfig,
      };
    });
    setGeneratedBadges(badges);
    // On laisse un petit délai pour le rendu du DOM avant de passer à l'étape suivante si nécessaire
    // mais ici le rendu est réactif.
    setCurrentStep("print");
    console.log(
      `[GestionBadge] ${badges.length} badges préparés pour l'impression/export.`
    );
  };

  const handleExport = async (
    specificBadges?: any[],
    format: "pdf" | "img" = "pdf"
  ) => {
    setIsExporting(true);
    setExportProgress(0);

    // 1. Si des badges spécifiques sont passés (ex: bouton individuel), on les utilise
    // 2. Sinon, si une sélection est active, on l'utilise
    // 3. Sinon, on prend tout
    let targetBadges = specificBadges;

    if (!targetBadges) {
      if (selectedBadgeIds.size > 0) {
        targetBadges = generatedBadges.filter((b) =>
          selectedBadgeIds.has(b.id)
        );
      } else {
        targetBadges = generatedBadges;
      }
    }

    const nodes: HTMLElement[] = [];
    const filenames: string[] = [];

    targetBadges.forEach((badge) => {
      const el = document.getElementById(`badge-render-${badge.id}`);
      if (el) {
        nodes.push(el);
        filenames.push(`${badge.eleve.nom}_${badge.eleve.prenom}.png`);
      }
    });

    if (nodes.length === 0) {
      alert("Aucun badge à exporter.");
      setIsExporting(false);
      return;
    }

    try {
      if (format === "pdf") {
        await exportBadgesAsPdf(nodes, filenames, (progress) => {
          setExportProgress(Math.round(progress * 100));
        });
      } else {
        await exportBadgesAsImages(nodes, filenames, (progress) => {
          setExportProgress(Math.round(progress * 100));
        });
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'export des badges.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
    // Existing handleExport function ends here
  };

  // Print handler that sanitizes colors before invoking the browser print dialog
  const handlePrint = () => {
    const container = document.querySelector(
      ".print-container"
    ) as HTMLElement | null;
    if (container) {
      sanitizeColors(container);
    }
    window.print();
  };

  // Pagination helpers
  const pageCount = Math.max(1, Math.ceil(savedModels.length / PAGE_SIZE));
  const pagesArray = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <>
      <style jsx global>{`
        @media print {
          /* 1. Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* 2. Make sure print container and ALL its children are visible */
          .print-container,
          .print-container * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 3. Position the print container at the absolute top-left of the paper */
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }

          /* 4. Reset page settings */
          @page {
            size: auto;
            margin: 0mm;
          }

          /* Optional: Hide specific non-print elements explicitly if needed */
          .no-print {
            display: none !important;
          }

          .print-grid {
            display: grid;
            /* Center the grid content on the A4 page */
            justify-content: center;
            align-content: start;

            /* 2 columns, auto-sized to content (the badge width) */
            /* Using auto-fit allows 3 portrait badges (162mm) to fit in 210mm space */
            grid-template-columns: repeat(auto-fit, max-content);

            /* Spacing */
            column-gap: 10mm;
            row-gap: 10mm;
            padding-top: 15mm;
          }

          .badge-print-wrapper {
            break-inside: avoid;
            page-break-inside: avoid;
            /* Ensure wrapper doesn't act weird */
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .print-only {
          display: none;
        }

        /* When printing, show the print-only container (override display:none) */
        @media print {
          .print-only {
            display: block;
          }
        }
      `}</style>

      <div
        className={`min-h-screen ${themeClasses.bg} font-sans transition-colors duration-300 flex flex-col`}
      >
        {/* TOP BAR */}
        <div
          className={`${themeClasses.cardBg} border-b ${themeClasses.border} px-6 py-3 sticky top-0 z-50 shadow-sm flex-none`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg">
                <CreditCard className="text-white h-5 w-5" />
              </div>
              <div>
                <h1
                  className={`text-lg font-bold ${themeClasses.text} leading-tight`}
                >
                  Badge Studio Pro
                </h1>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
              {[
                { id: "selection", label: "1. Sélection" },
                { id: "template_choice", label: "2. Modèle" },
                { id: "design", label: "3. Design" },
                { id: "print", label: "4. Impression" },
              ].map((step) => (
                <button
                  key={step.id}
                  disabled={step.id === "print" && generatedBadges.length === 0}
                  onClick={() => setCurrentStep(step.id as any)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentStep === step.id
                      ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 overflow-hidden flex flex-col md:flex-row gap-6">
          {/* ETAPE 1 : SELECTION */}
          {currentStep === "selection" && (
            <div className="w-full max-w-2xl mx-auto mt-10 animate-fadeIn">
              <div
                className={`${themeClasses.cardBg} p-8 rounded-2xl shadow-xl border ${themeClasses.border} space-y-6`}
              >
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
                  Sélection des élèves
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                      Classe
                    </label>
                    <select
                      value={selectedClasse}
                      onChange={(e) => {
                        setSelectedClasse(e.target.value);
                        setSelectedSalle("");
                      }}
                      className="w-full p-3 rounded-lg border-2 bg-transparent"
                    >
                      <option value="">-- Choisir --</option>
                      {allClasses.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="text-gray-800"
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                      Salle
                    </label>
                    <select
                      value={selectedSalle}
                      onChange={(e) => setSelectedSalle(e.target.value)}
                      disabled={!selectedClasse}
                      className="w-full p-3 rounded-lg border-2 bg-transparent disabled:opacity-50"
                    >
                      <option value="">-- Toutes --</option>
                      {filteredSalles.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          className="text-gray-800"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedClasse && (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 font-bold text-center">
                    {elevesInClasseSalle.length} Élève(s) trouvé(s)
                  </div>
                )}
                <button
                  onClick={() => setCurrentStep("template_choice")}
                  disabled={elevesInClasseSalle.length === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Choisir un Modèle →
                </button>
              </div>
            </div>
          )}

          {/* ETAPE 1.5 : CHOIX DU MODELE */}
          {currentStep === "template_choice" && (
            <div className="w-full animate-fadeIn space-y-8">
              <div className="text-center relative">
                <h2
                  className={`text-3xl font-bold ${themeClasses.text} mb-2 flex items-center justify-center gap-3`}
                >
                  Choisissez un point de départ 🎨
                  <button
                    onClick={loadSavedModels}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title="Rafraîchir"
                    disabled={isLoadingModels}
                  >
                    <RefreshCw
                      size={20}
                      className={isLoadingModels ? "animate-spin" : ""}
                    />
                  </button>
                </h2>
                <p className={themeClasses.textSecondary}>
                  Utilisez un modèle existant ou créez-en un nouveau.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Option Nouveau Modèle */}
                <div
                  onClick={handleCreateNew}
                  className={`${themeClasses.cardBg} border-2 border-dashed ${themeClasses.border} rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group shadow-sm`}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">Nouveau Design</h3>
                    <p className="text-sm opacity-60">
                      Partir d'une page blanche
                    </p>
                  </div>
                </div>

                {/* Liste des modèles sauvegardés */}
                {savedModels.length > 0 ? (
                  displayedModels.map((model) => (
                    <div
                      key={model.id}
                      className={`${themeClasses.cardBg} border-2 ${themeClasses.border} rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all group`}
                    >
                      <div className="h-48 bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center overflow-hidden">
                        {/* Aperçu paresseux du badge: on monte le composant complet seulement sur demande */}
                        {previewActiveIds.has(model.id) ? (
                          <div className="scale-[0.45] origin-center shadow-lg">
                            <BadgeClassicCustomizable
                              config={model.config}
                              eleve={MOCK_STUDENT}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                            <div className="text-xs text-gray-500">
                              Aperçu désactivé
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setPreviewActiveIds((prev) => {
                                    const s = new Set(prev);
                                    s.add(model.id);
                                    return s;
                                  })
                                }
                                className="px-3 py-1 bg-white border rounded text-xs"
                              >
                                Afficher Aperçu
                              </button>
                              <button
                                onClick={() => handleLoadModel(model)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                              >
                                Utiliser / Modifier
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                          <button
                            onClick={() => handleLoadModel(model)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg transform hover:scale-105 active:scale-95 transition-all"
                          >
                            Utiliser / Modifier
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between border-t">
                        <div>
                          <h3 className="font-bold text-sm truncate max-w-[140px]">
                            {model.name}
                          </h3>
                          <p className="text-[10px] opacity-50">
                            Dernière modif:{" "}
                            {new Date(
                              model.updated_at || model.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePreviewModel(model.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={
                              previewActiveIds.has(model.id)
                                ? "Désactiver aperçu"
                                : "Activer aperçu"
                            }
                          >
                            {previewActiveIds.has(model.id) ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModel(model.id, model.name);
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={`col-span-1 md:col-span-2 border-2 border-dashed ${themeClasses.border} rounded-2xl p-8 flex flex-col items-center justify-center text-center`}
                  >
                    {isLoadingModels ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2
                          className="animate-spin text-blue-500"
                          size={32}
                        />
                        <p className="text-gray-400">
                          Chargement des modèles...
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-400 italic mb-2">
                          Aucun modèle sauvegardé trouvé.
                        </p>
                        <p className="text-xs text-gray-500">
                          Cliquez sur le bouton de rafraîchissement en haut si
                          vous venez d'en créer un.
                        </p>
                        <p className="text-[10px] text-gray-500 mt-4 opacity-50">
                          Debug: role={currentSession?.role || "null"} user=
                          {currentSession?.user?.id || "null"}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination des modèles */}
              <div className="w-full flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-1">
                  {pagesArray.map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-2 py-1 rounded ${
                        currentPage === pg
                          ? "bg-blue-600 text-white"
                          : "bg-white hover:bg-gray-100"
                      } text-xs`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ETAPE 2 : DESIGN */}
          {currentStep === "design" && (
            <>
              {/* LEFT PANEL: CONFIGURATION */}
              <div className="w-full md:w-[350px] flex-none overflow-y-auto pr-2 custom-scrollbar pb-20 max-h-[calc(100vh-100px)]">
                {/* 1. DISPOSITION & MODELE */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Structure"
                  icon={LayoutGrid}
                >
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() =>
                        setBadgeConfig({
                          ...badgeConfig,
                          orientation: "portrait",
                        })
                      }
                      className={`flex-1 py-2 text-xs rounded border ${
                        badgeConfig.orientation === "portrait"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "border-gray-300"
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      onClick={() =>
                        setBadgeConfig({
                          ...badgeConfig,
                          orientation: "paysage",
                        })
                      }
                      className={`flex-1 py-2 text-xs rounded border ${
                        badgeConfig.orientation === "paysage"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "border-gray-300"
                      }`}
                    >
                      Paysage
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      QR Code
                    </span>
                    <input
                      type="checkbox"
                      checked={badgeConfig.showQRCode}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          showQRCode: e.target.checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Logo
                    </span>
                    <input
                      type="checkbox"
                      checked={badgeConfig.showLogo}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          showLogo: e.target.checked,
                        })
                      }
                    />
                  </div>

                  {/* Sauvegarde / Chargement Rapide */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-dashed border-gray-300">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
                    >
                      <Save size={12} className="inline mr-1" /> Sauver
                    </button>
                    {savedModels.length > 0 && (
                      <select
                        onChange={(e) => {
                          const m = savedModels.find(
                            (m) => m.id === e.target.value
                          );
                          if (m) handleLoadModel(m);
                        }}
                        className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border-none"
                      >
                        <option value="">Charger...</option>
                        {savedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </SettingsGroup>

                {/* 1.5 INFORMATIONS A AFFICHER */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Contenu du Badge"
                  icon={FileCheck}
                >
                  <p className="text-[10px] text-gray-500 mb-2">
                    Sélectionnez jusqu'à 6 informations (Nom et Prénom sont obligatoires).
                  </p>
                  
                  <div className="space-y-1 mb-4 h-32 overflow-y-auto pr-2 custom-scrollbar border border-gray-100 dark:border-gray-700 rounded p-1">
                    {AVAILABLE_FIELDS.map((field) => {
                       const isSelected = (badgeConfig.selectedFields || []).includes(field.id);
                       
                       return (
                         <label key={field.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors w-full">
                           <input
                             type="checkbox"
                             checked={isSelected}
                             disabled={!isSelected && (badgeConfig.selectedFields?.length || 0) >= 6}
                             onChange={(e) => {
                               const currentFields = badgeConfig.selectedFields || [];
                               let newFields;
                               
                               if (e.target.checked) {
                                  if (currentFields.length < 6) {
                                    newFields = [...currentFields, field.id];
                                  } else {
                                    return; // Max reached
                                  }
                               } else {
                                  newFields = currentFields.filter(id => id !== field.id);
                               }
                               
                               setBadgeConfig({
                                 ...badgeConfig,
                                 selectedFields: newFields
                               });
                             }}
                             className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                           />
                           <span className={`truncate ${isSelected ? "font-semibold text-blue-700 dark:text-blue-400" : ""}`}>
                            {field.label}
                           </span>
                         </label>
                       );
                    })}
                  </div>

                  {/* Vacation Special Input */}
                  {(badgeConfig.selectedFields || []).includes("vacation") && (
                    <div className="animate-fadeIn p-2 bg-blue-50 dark:bg-gray-800/50 rounded border border-blue-100 dark:border-gray-700">
                      <label className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1 block">
                        Valeur Vacation
                      </label>
                      <input
                        type="text"
                        value={badgeConfig.vacationValue || ""}
                        onChange={(e) => setBadgeConfig({
                          ...badgeConfig,
                          vacationValue: e.target.value
                        })}
                        placeholder="Ex: AM, PM, Soir..."
                        className="w-full text-xs p-1.5 rounded border bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}
                </SettingsGroup>

                {/* 2. STYLE EN-TÊTE (DÉTAILLÉ) */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Style En-tête"
                  icon={Square}
                >
                  <div className="mb-3">
                    <label className="text-xs block mb-1">
                      Hauteur ({badgeConfig.headerHeight}%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={badgeConfig.headerHeight}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          headerHeight: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-xs block mb-1">Arrondi</label>
                    <select
                      value={badgeConfig.headerRounded}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          headerRounded: e.target.value,
                        })
                      }
                      className="w-full p-1.5 text-xs rounded border bg-transparent"
                    >
                      <option value="none">Aucun</option>
                      <option value="sm">Léger</option>
                      <option value="md">Moyen</option>
                      <option value="lg">Grand</option>
                      <option value="full">Rond</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <label className="text-xs">
                        Bordures ({badgeConfig.headerBorderWidth}px)
                      </label>
                      <input
                        type="color"
                        value={badgeConfig.headerBorderColor}
                        onChange={(e) =>
                          setBadgeConfig({
                            ...badgeConfig,
                            headerBorderColor: e.target.value,
                          })
                        }
                        className="w-4 h-4 rounded cursor-pointer border-none p-0 overflow-hidden"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={badgeConfig.headerBorderWidth}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          headerBorderWidth: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600 mb-2"
                    />

                    {badgeConfig.headerBorderWidth > 0 && (
                      <div className="flex gap-1 justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        {["top", "right", "bottom", "left"].map((pos) => (
                          <label
                            key={pos}
                            className={`cursor-pointer w-6 h-6 flex items-center justify-center rounded border ${
                              badgeConfig.headerBorderPositions[
                                pos as keyof typeof badgeConfig.headerBorderPositions
                              ]
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={
                                badgeConfig.headerBorderPositions[
                                  pos as keyof typeof badgeConfig.headerBorderPositions
                                ]
                              }
                              onChange={() => toggleBorderPosition(pos as any)}
                            />
                            <span className="text-[10px] uppercase font-bold">
                              {pos[0]}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </SettingsGroup>

                {/* 3. COULEURS & FOND */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Couleurs & Fond"
                  icon={Palette}
                >
                  {/* Fond Couleurs */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                        En-tête
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={badgeConfig.headerBgColor}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              headerBgColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-none p-0"
                        />
                        <span className="text-xs font-mono opacity-50">
                          {badgeConfig.headerBgColor}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                        Fond
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={badgeConfig.bodyBgColor}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              bodyBgColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-none p-0"
                        />
                        <span className="text-xs font-mono opacity-50">
                          {badgeConfig.bodyBgColor}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                        Pied de page
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={badgeConfig.footerBgColor || "#f3f4f6"}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              footerBgColor: e.target.value,
                            })
                          }
                          disabled={badgeConfig.footerTransparent}
                          className={`w-8 h-8 rounded cursor-pointer border-none p-0 ${
                            badgeConfig.footerTransparent ? "opacity-30" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={badgeConfig.useTransparentHeader}
                        onChange={(e) =>
                          setBadgeConfig({
                            ...badgeConfig,
                            useTransparentHeader: e.target.checked,
                          })
                        }
                      />
                      En-tête transparent
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={badgeConfig.footerTransparent || false}
                        onChange={(e) =>
                          setBadgeConfig({
                            ...badgeConfig,
                            footerTransparent: e.target.checked,
                          })
                        }
                      />
                      Pied de page transparent
                    </label>
                  </div>

                  {/* Patterns */}
                  <div className="mb-4">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                      Texture de fond
                    </label>
                    <select
                      value={badgeConfig.backgroundPattern}
                      onChange={(e) =>
                        setBadgeConfig({
                          ...badgeConfig,
                          backgroundPattern: e.target.value,
                          customBackground: "",
                          useBackgroundImage: false,
                        })
                      }
                      className="w-full text-xs p-1.5 rounded border bg-transparent"
                    >
                      {Object.entries(BACKGROUND_PATTERNS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Images Predefinies */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                      Images Pro
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {PREDEFINED_BACKGROUNDS.map((bg) => (
                        <div
                          key={bg.id}
                          onClick={() => handlePredefinedBackground(bg.url)}
                          className={`aspect-[2/3] rounded cursor-pointer overflow-hidden border-2 ${
                            badgeConfig.selectedBackgroundImage === bg.url
                              ? "border-blue-600"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={bg.url}
                            alt={bg.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <label className="block text-center p-2 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                      <span className="text-xs font-semibold text-gray-500">
                        Uploader fond perso
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, "customBackground")
                        }
                      />
                    </label>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 text-xs mb-2">
                        <input
                          type="checkbox"
                          checked={!!badgeConfig.footerTransparent}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              footerTransparent: e.target.checked,
                            })
                          }
                        />
                        Footer transparent
                      </label>
                    </div>
                  </div>
                </SettingsGroup>

                {/* 4. TEXTES */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Typographie"
                  icon={Type}
                >
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={useUnifiedTextColor}
                        onChange={(e) => toggleUnifiedColor(e.target.checked)}
                      />
                      Couleur unique pour tout le texte
                    </label>
                  </div>

                  {useUnifiedTextColor ? (
                    <div>
                      <input
                        type="color"
                        value={unifiedTextColor}
                        onChange={(e) => updateUnifiedColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs">Titre En-tête</label>
                        <input
                          type="color"
                          value={badgeConfig.headerTextColor}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              headerTextColor: e.target.value,
                            })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none p-0"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs">Nom Élève</label>
                        <input
                          type="color"
                          value={badgeConfig.nameTextColor}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              nameTextColor: e.target.value,
                            })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none p-0"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs">Labels & Infos</label>
                        <input
                          type="color"
                          value={badgeConfig.infoTextColor}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              infoTextColor: e.target.value,
                            })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none p-0"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs">Pied de page</label>
                        <input
                          type="color"
                          value={
                            badgeConfig.footerTextColor ||
                            badgeConfig.infoTextColor
                          }
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              footerTextColor: e.target.value,
                            })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none p-0"
                        />
                      </div>
                    </div>
                  )}
                </SettingsGroup>

                {/* 5. LOGOS */}
                <SettingsGroup
                  isDarkMode={isDarkMode}
                  title="Fichiers Graphiques"
                  icon={ImageIcon}
                >
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold block mb-1">
                        Logo Établissement
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "customLogo")}
                        className="text-xs w-full text-gray-500 file:py-1 file:px-2 file:border-none file:rounded file:bg-gray-100"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block mb-1">
                        Signature Directeur
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "customSignature")}
                        className="text-xs w-full text-gray-500 file:py-1 file:px-2 file:border-none file:rounded file:bg-gray-100"
                      />
                    </div>
                    <div className="pt-3 border-t">
                      <label className="text-xs font-semibold block mb-2">
                        Taille photo (mm)
                      </label>
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          type="number"
                          min={10}
                          max={60}
                          value={badgeConfig.photoWidthMm}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoWidthMm: Number(e.target.value),
                            })
                          }
                          className="w-20 p-1 rounded border text-sm"
                        />
                        <span className="text-xs opacity-60">×</span>
                        <input
                          type="number"
                          min={10}
                          max={80}
                          value={badgeConfig.photoHeightMm}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoHeightMm: Number(e.target.value),
                            })
                          }
                          className="w-20 p-1 rounded border text-sm"
                        />
                        <span className="text-xs ml-2 text-gray-500">mm</span>
                      </div>

                      <div className="flex gap-2 items-center mb-2">
                        <label className="text-xs">Forme:</label>
                        <select
                          value={badgeConfig.photoBorderShape || "square"}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBorderShape: e.target.value as any,
                            })
                          }
                          className="p-1 rounded border text-xs bg-transparent flex-1"
                        >
                          <option value="square">Carré</option>
                          <option value="rounded">Arrondi (Standard)</option>
                          <option value="pill">Ovale / Pill</option>
                          <option value="custom">Personnalisé</option>
                        </select>
                      </div>

                      {badgeConfig.photoBorderShape === "custom" && (
                        <div className="mb-2 pl-4 border-l-2 border-gray-200">
                          <label className="text-xs block mb-1">
                            Rayon ({badgeConfig.photoBorderRadius}mm)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={badgeConfig.photoBorderRadius || 0}
                            onChange={(e) =>
                              setBadgeConfig({
                                ...badgeConfig,
                                photoBorderRadius: parseFloat(e.target.value),
                              })
                            }
                            className="w-full h-1 accent-blue-600 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={!!badgeConfig.photoBorderEnabled}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBorderEnabled: e.target.checked,
                            })
                          }
                        />
                        <span className="text-xs">Activer bordure photo</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={
                            badgeConfig.photoBorderColor ||
                            badgeConfig.headerBgColor
                          }
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBorderColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-none p-0"
                        />
                        <input
                          type="range"
                          min={0}
                          max={3}
                          step={0.1}
                          value={badgeConfig.photoBorderWidth}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBorderWidth: Number(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs w-8 text-right">
                          {badgeConfig.photoBorderWidth}mm
                        </span>
                      </div>
                      <div className="mt-2">
                        <label className="text-xs font-semibold block mb-1">
                          Rayon bord photo (mm)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={badgeConfig.photoBorderRadius || 0}
                            onChange={(e) =>
                              setBadgeConfig({
                                ...badgeConfig,
                                photoBorderRadius: Number(e.target.value),
                              })
                            }
                            className="w-20 p-1 rounded border text-sm"
                          />
                          <input
                            type="range"
                            min={0}
                            max={40}
                            value={badgeConfig.photoBorderRadius || 0}
                            onChange={(e) =>
                              setBadgeConfig({
                                ...badgeConfig,
                                photoBorderRadius: Number(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-xs ml-2">mm</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-semibold block mb-1">
                          Forme bord photo
                        </label>
                        <select
                          value={badgeConfig.photoBorderShape}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBorderShape: e.target.value as any,
                            })
                          }
                          className="w-full p-1 rounded border bg-transparent text-sm"
                        >
                          <option value="square">Carré</option>
                          <option value="rounded">Arrondi</option>
                          <option value="pill">Ovale / Cercle</option>
                          <option value="custom">Personnalisé (mm)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={!!badgeConfig.photoBackgroundTransparent}
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBackgroundTransparent: e.target.checked,
                            })
                          }
                        />
                        <span className="text-xs">Photo fond transparent</span>
                      </label>

                      <div
                        className={`flex items-center gap-2 ${
                          badgeConfig.photoBackgroundTransparent
                            ? "opacity-40 pointer-events-none"
                            : ""
                        }`}
                      >
                        <label className="text-xs">Couleur fond photo</label>
                        <input
                          type="color"
                          value={
                            badgeConfig.photoBackgroundColor ||
                            "rgba(255,255,255,0.7)"
                          }
                          onChange={(e) =>
                            setBadgeConfig({
                              ...badgeConfig,
                              photoBackgroundColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                </SettingsGroup>
              </div>

              {/* MIDDLE: PREVIEW */}
              <div className="flex-1 bg-gray-100/50 dark:bg-black/20 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm text-gray-600">
                    Aperçu interactif
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-10 overflow-auto">
                  <div className="transform scale-[1.3] transition-all duration-300 shadow-2xl rounded-[4mm]">
                    <BadgeClassicCustomizable
                      config={badgeConfig}
                      eleve={{
                        ...MOCK_STUDENT,
                        photo_url: previewPhoto || MOCK_STUDENT.photo_url,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 border-t flex justify-between items-center z-20">
                  <div className="text-xs text-gray-500">
                    Format:{" "}
                    {badgeConfig.orientation === "portrait"
                      ? "54x86mm"
                      : "86x54mm"}
                  </div>
                  <div className="flex  items-center gap-3">
                    <label className="text-xs flex flex-col items-center gap-2">
                      <span className="text-[11px] font-medium">
                        Changer photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () =>
                              setPreviewPhoto(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="preview-photo-input"
                      />
                      <label
                        htmlFor="preview-photo-input"
                        className="px-2 py-1 bg-gray-100 rounded text-xs cursor-pointer"
                      >
                        Upload
                      </label>
                      {previewPhoto && (
                        <button
                          onClick={() => setPreviewPhoto(null)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs"
                        >
                          Supprimer
                        </button>
                      )}
                    </label>
                  </div>
                  <button
                    onClick={prepareGeneration}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow flex items-center gap-2"
                  >
                    <FileCheck size={18} /> Valider ce Design
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ETAPE 3 : IMPRESSION */}
          {currentStep === "print" && (
            <div className="w-full animate-fadeIn flex flex-col gap-6">
              <div
                className={`${themeClasses.cardBg} p-4 rounded-xl shadow border flex justify-between items-center sticky top-0 z-10`}
              >
                <button
                  onClick={() => setCurrentStep("design")}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-2"
                >
                  ← Retour au design
                </button>
                <div className="flex gap-3">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <input
                      type="checkbox"
                      checked={
                        generatedBadges.length > 0 &&
                        selectedBadgeIds.size === generatedBadges.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      Tout sélectionner
                    </span>
                  </label>

                  <button
                    onClick={() => handleExport(undefined, "img")}
                    disabled={isExporting}
                    className={`px-5 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-all ${
                      isExporting
                        ? "bg-gray-400"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    {selectedBadgeIds.size > 0 ? "Images" : "Images (Tout)"}
                  </button>

                  <button
                    onClick={() => handleExport(undefined, "pdf")}
                    disabled={isExporting}
                    className={`px-5 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-all ${
                      isExporting
                        ? "bg-gray-400"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Download size={18} />
                    )}
                    {isExporting
                      ? `${exportProgress}%`
                      : selectedBadgeIds.size > 0
                      ? `PDF (${selectedBadgeIds.size})`
                      : "PDF (Tout)"}
                  </button>
                  <button
                    onClick={() => {
                      const container =
                        document.querySelector(".print-container");
                      if (container) sanitizeColors(container as HTMLElement);
                      setTimeout(() => window.print(), 100);
                    }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Printer size={18} /> Imprimer
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gray-200 p-8 rounded-xl overflow-auto flex justify-center">
                <div className="bg-white shadow-2xl p-[10mm] min-h-[297mm] w-[210mm] scale-75 origin-top relative">
                  <div className="grid grid-cols-2 gap-[10mm]">
                    {generatedBadges.map((badge) => (
                      <div key={badge.id} className="relative group">
                        {/* Controls Overlay */}
                        <div className="absolute -top-2 -left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-md p-1">
                          <input
                            type="checkbox"
                            checked={selectedBadgeIds.has(badge.id)}
                            onChange={() => toggleBadgeSelection(badge.id)}
                            className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                          />
                        </div>

                        <button
                          onClick={() => handleExport([badge], "img")}
                          className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-md"
                          title="Télécharger ce badge (Image)"
                        >
                          <Download size={16} />
                        </button>

                        <div
                          id={`badge-render-${badge.id}`}
                          className={`break-inside-avoid w-fit transition-all duration-200 ${
                            selectedBadgeIds.has(badge.id)
                              ? "ring-4 ring-blue-500 rounded-[4mm]"
                              : "hover:ring-2 hover:ring-blue-300 rounded-[4mm]"
                          }`}
                          onClick={() => toggleBadgeSelection(badge.id)}
                        >
                          <BadgeClassicCustomizable
                            config={badge.config}
                            eleve={badge.eleve}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="print-container print-only badge-print-zone">
        <div
          className="print-grid"
          style={{
            display: "grid",

            /* 3 cartes verticales par ligne */
            gridTemplateColumns: "repeat(3, 50mm)",

            justifyContent: "center",
            alignContent: "start",
          }}
        >
          {generatedBadges.map((badge) => (
            <div
              key={badge.id}
              style={{
                width: "60mm",
                height: "90mm",
                pageBreakInside: "avoid",
              }}
            >
              <BadgeClassicCustomizable
                config={badge.config}
                eleve={badge.eleve}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className={`${themeClasses.cardBg} p-6 rounded-2xl w-full max-w-md shadow-2xl`}
          >
            <h3 className="font-bold mb-4">
              {editingModelId
                ? "Mettre à jour le modèle"
                : "Sauvegarder comme nouveau modèle"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  placeholder="Ex: Badge Officiel v2..."
                  className="w-full p-2 border rounded bg-transparent dark:border-gray-700"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded font-semibold"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveModel}
                  disabled={isSaving || !modelName.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : editingModelId ? (
                    "Mettre à jour"
                  ) : (
                    "Sauvegarder"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionBadge;
