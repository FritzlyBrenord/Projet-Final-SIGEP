import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Printer,
  X,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  Filter,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import {
  Professeur,
  Sequence,
  ProfesseurFormData,
} from "../../types/ProfesseurType";
import { useProfesseur } from "../../Context/ContextProfesseur";
import { useAnneeScolaire } from "../../Context/ContextAnneeScolaire";
import { SelectData } from "@/Config/SupabaseData";
import { EntetIMFP } from "../AnneeAcademique/module";

// Fonctions utilitaires pour NIF/CIN
const validateNifCin = (value: string): boolean => {
  // Supprimer tous les caractères non numériques
  const cleanValue = value.replace(/\D/g, "");
  // Vérifier qu'il y a exactement 10 chiffres
  return cleanValue.length === 10;
};

const formatNifCin = (value: string): string => {
  // Supprimer tous les caractères non numériques
  const cleanValue = value.replace(/\D/g, "");

  // Si commence par 0 et a 10 chiffres, formater avec des tirets
  if (cleanValue.length === 10 && cleanValue.startsWith("0")) {
    return `${cleanValue.slice(0, 3)}-${cleanValue.slice(
      3,
      6
    )}-${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
  }

  // Sinon, retourner tel quel
  return cleanValue;
};

const cleanNifCin = (value: string): string => {
  // Supprimer tous les caractères non numériques
  return value.replace(/\D/g, "");
};

interface Props {
  isDarkMode?: boolean;
}

// Composant de sélection avec recherche
const SelectWithSearch = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  multiple = false,
  isDarkMode = false,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  multiple?: boolean;
  isDarkMode?: boolean;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900";

  const dropdownClasses = isDarkMode
    ? "bg-gray-700 border-gray-600"
    : "bg-white border-gray-300";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Vérifier automatiquement si synchronisation nécessaire

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  const handleOptionClick = (value: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange([value]);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const displayText =
    selectedLabels.length > 0
      ? multiple
        ? selectedLabels.join(", ")
        : selectedLabels[0]
      : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${inputClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "focus:ring-2 focus:ring-blue-500"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedLabels.length > 0 ? "" : "text-gray-400"}>
          {displayText}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg ${dropdownClasses}`}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Rechercher..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer hover:${
                    isDarkMode ? "bg-gray-600" : "bg-gray-100"
                  } flex items-center justify-between`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <span>{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Affichage des tags sélectionnés */}
      {multiple && selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedLabels.map((label, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                isDarkMode
                  ? "bg-blue-900 text-blue-200"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const optionValue = options.find(
                    (opt) => opt.label === label
                  )?.value;
                  if (optionValue) {
                    const newValues = selectedValues.filter(
                      (v) => v !== optionValue
                    );
                    onChange(newValues);
                  }
                }}
                className="ml-2 hover:bg-blue-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const GestionProfesseurs = ({ isDarkMode = false }: Props) => {
  // Contexte des professeurs
  const {
    professeurs,
    isLoading,
    error,
    ajouterProfesseur,
    modifierProfesseur,
    supprimerProfesseur,
    supprimerProfesseurDefinitif,
    restaurerProfesseur,
    ajouterSequence,
    modifierSequence,
    supprimerSequence,
    rechercherProfesseurs,
    setError,
    genererNouveauCode,
    rechargerProfesseurs,
    copierProfesseursVersNouvelleAnnee,
  } = useProfesseur();

  // Contexte de l'année scolaire
  const { currentYear, schoolYears } = useAnneeScolaire();

  // Données dynamiques depuis le contexte AnneeScolaire
  const classes =
    currentYear?.classes.map((classe) => ({
      value: classe.id,
      label: classe.name,
    })) || [];

  // Salles organisées par classe depuis le contexte
  const sallesData: Record<string, { value: string; label: string }[]> = {};
  currentYear?.classes.forEach((classe) => {
    sallesData[classe.id] = classe.salles.map((salle) => ({
      value: salle.id,
      label: `${salle.name}`,
    }));
  });

  // Fonction pour obtenir les matières d'une salle spécifique
  const getMatieresForSalle = (salleId: string) => {
    if (!currentYear) return [];

    for (const classe of currentYear.classes) {
      const salle = classe.salles.find((s) => s.id === salleId);
      if (salle) {
        return salle.subjects.map((subject) => ({
          value: subject.id,
          label: subject.name,
        }));
      }
    }
    return [];
  };
  // Obtenir l'année précédente
  const previousYear = useMemo(() => {
    if (!currentYear || !schoolYears) return null;

    return schoolYears
      .slice()
      .sort((a, b) => a.year.localeCompare(b.year))
      .filter((y) => y.year < currentYear.year)
      .pop();
  }, [currentYear, schoolYears]);

  // États d'interface
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | "delete"
  >("add");
  const [selectedProf, setSelectedProf] = useState<Professeur | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClasse, setFilterClasse] = useState<string>("");
  const [filterSalle, setFilterSalle] = useState<string>("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  // États pour la synchronisation automatique
  // États pour la synchronisation automatique
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previousYearProfesseurs, setPreviousYearProfesseurs] = useState<
    Professeur[]
  >([]);
  const [syncFilterClasse, setSyncFilterClasse] = useState<string>("");
  const [syncFilterSalle, setSyncFilterSalle] = useState<string>("");
  const [compatibilityInfo, setCompatibilityInfo] = useState({
    hasCommonClasses: false,
    hasCommonSalles: false,
    commonClasses: [] as string[], // class names
    commonSalles: [] as string[], // keys "<ClassName>::<SalleName>"
    sameClassesCount: false,
    sameSallesCount: false,
  });
  // Impression - état UI
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printHeader, setPrintHeader] = useState({
    companyName: "",
    address: "",
    phone: "",
  });
  const [printColumns, setPrintColumns] = useState({
    code: true,
    nom: true,
    prenom: true,
    email: false,
    telephone: true,
    nifcin: false,
    classe: true,
    salle: true,
  });

  // État du formulaire
  const [formData, setFormData] = useState<ProfesseurFormData>({
    code: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    date_embauche: "",
    nif_cin: "",
    sequences: [],
    diplomes: "",
    statut: "actif",
    type_contrat: "permanent",
    annee_scolaire_id: "",
  });

  // État pour la nouvelle séquence
  const [nouvelleSequence, setNouvelleSequence] = useState<
    Omit<Sequence, "id" | "professeur_affectation_id">
  >({
    classe: "",
    salle: "",
    matiere: "",
  });

  // État pour la gestion des séquences
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceModalType, setSequenceModalType] = useState<"add" | "edit">(
    "add"
  );
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(
    null
  );

  // Styles conditionnels
  const baseClasses = isDarkMode
    ? "min-h-screen bg-gray-900 text-white"
    : "min-h-screen bg-gray-50 text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const buttonPrimaryClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const buttonSecondaryClasses = isDarkMode
    ? "bg-gray-600 hover:bg-gray-500 text-white"
    : "bg-gray-300 hover:bg-gray-400 text-gray-700";

  const buttonDangerClasses = isDarkMode
    ? "bg-red-700 hover:bg-red-600 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  const tableHeaderClasses = isDarkMode
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-50 text-gray-500";

  const tableRowClasses = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";

  const tableBorderClasses = isDarkMode ? "divide-gray-700" : "divide-gray-200";

  // Obtenir les salles disponibles selon la classe sélectionnée
  const getAvailableSalles = (classe: string) => {
    return sallesData[classe] || [];
  };
  // Vérifier si synchronisation nécessaire
  // Vérifier la compatibilité entre années et charger les professeurs
  // Vérifier la compatibilité entre années et charger les professeurs
  // Vérifier la compatibilité entre années et charger les professeurs
  const checkForAutoSync = useCallback(async () => {
    if (!currentYear || !previousYear || professeurs.length > 0) return;

    try {
      // 1. Vérifier que l'année actuelle a des classes et salles
      if (!currentYear.classes || currentYear.classes.length === 0) {
        console.log("Aucune classe définie dans l'année actuelle");
        return;
      }

      // Construire des sets basés sur les NOMS (plus robustes que les IDs qui changent par année)
      const currentClassNameSet = new Set(
        currentYear.classes.map((c) => c.name)
      );
      const currentSalleKeySet = new Set(
        currentYear.classes.flatMap((c) =>
          c.salles.map((s) => `${c.name}::${s.name}`)
        )
      );

      if (currentSalleKeySet.size === 0) {
        console.log("Aucune salle définie dans l'année actuelle");
        return;
      }

      // 2. Vérifier que l'année précédente a des classes et salles
      if (!previousYear.classes || previousYear.classes.length === 0) {
        console.log("Aucune classe définie dans l'année précédente");
        return;
      }

      const previousClassNameSet = new Set(
        previousYear.classes.map((c) => c.name)
      );
      const previousSalleKeySet = new Set(
        previousYear.classes.flatMap((c) =>
          c.salles.map((s) => `${c.name}::${s.name}`)
        )
      );

      // 3. Trouver les classes et salles communes (par noms)
      const commonClasses = Array.from(currentClassNameSet).filter((name) =>
        previousClassNameSet.has(name)
      );
      const commonSalles = Array.from(currentSalleKeySet).filter((key) =>
        previousSalleKeySet.has(key)
      );

      // 4. Charger TOUS les professeurs (affectations) de l'année précédente (nouvelle structure)
      const [affectationsData, enseignantsData, sequencesData] =
        await Promise.all([
          SelectData("professeurs_affectations"),
          SelectData("enseignants"),
          SelectData("sequences"),
        ]);
      if (!affectationsData || !enseignantsData) return;

      const prevYearAffectations = affectationsData.filter(
        (a: any) => a.annee_scolaire_id === previousYear.id && !a.deleted
      );

      if (prevYearAffectations.length === 0) {
        console.log("Aucun professeur trouvé dans l'année précédente");
        // On affiche malgré tout le modal pour expliquer qu'il n'y a rien à synchroniser
        setPreviousYearProfesseurs([]);
        setShowSyncModal(true);
        return;
      }

      // 5. Convertir TOUS les professeurs (affectations -> Professeur)
      const professeursConverted: Professeur[] = prevYearAffectations
        .map((a: any) => {
          const enseignant = (enseignantsData as any[]).find(
            (e: any) => e.id === a.enseignant_id
          );
          if (!enseignant) return null;

          const sequences =
            (sequencesData as any[] | undefined)
              ?.filter(
                (s: any) => s.professeur_affectation_id === a.id && !s.deleted
              )
              .map((s: any) => ({
                id: s.id,
                professeur_affectation_id: a.id,
                classe: s.classe,
                salle: s.salle,
                matiere: s.matiere,
                deleted: s.deleted,
              })) || [];

          const prof: Professeur = {
            id: a.id,
            enseignant_id: a.enseignant_id,
            code: a.code,
            nom: enseignant.nom,
            prenom: enseignant.prenom,
            email: enseignant.email,
            telephone: enseignant.telephone,
            adresse: enseignant.adresse,
            date_embauche: a.date_embauche,
            nif_cin: enseignant.nif_cin,
            sequences,
            diplomes: enseignant.diplomes,
            statut: (a.statut as any) ?? "actif",
            type_contrat: (a.type_contrat as any) ?? "permanent",
            annee_scolaire_id: a.annee_scolaire_id,
            deleted: a.deleted,
            created_at: a.created_at,
            updated_at: a.updated_at,
          };
          return prof;
        })
        .filter(Boolean) as Professeur[];

      // 6. Mettre à jour les états SANS filtrage préalable
      setPreviousYearProfesseurs(professeursConverted); // Tous les professeurs
      setCompatibilityInfo({
        hasCommonClasses: commonClasses.length > 0,
        hasCommonSalles: commonSalles.length > 0,
        commonClasses,
        commonSalles,
        sameClassesCount:
          currentClassNameSet.size === previousClassNameSet.size,
        sameSallesCount: currentSalleKeySet.size === previousSalleKeySet.size,
      });

      // 7. Afficher le modal avec TOUS les professeurs
      setShowSyncModal(true);
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de synchronisation:",
        error
      );
    }
  }, [currentYear, previousYear, professeurs.length]); // Dépendances du useCallback

  // Gérer la synchronisation
  // Gérer la synchronisation
  const handleSyncAccept = async () => {
    if (!currentYear || !previousYear) return;

    try {
      setIsSyncing(true);

      // Filtrer les professeurs à synchroniser selon les filtres
      let profsToSync = previousYearProfesseurs;

      if (syncFilterClasse) {
        profsToSync = profsToSync.filter((prof) =>
          prof.sequences.some((seq) => seq.classe === syncFilterClasse)
        );
      }

      if (syncFilterSalle) {
        profsToSync = profsToSync.filter((prof) =>
          prof.sequences.some((seq) => seq.salle === syncFilterSalle)
        );
      }

      if (profsToSync.length === 0) {
        alert("Aucun professeur à synchroniser avec les filtres sélectionnés");
        return;
      }

      await copierProfesseursVersNouvelleAnnee(previousYear.id, currentYear.id);
      alert(
        `${profsToSync.length} professeurs synchronisés avec succès depuis l'année ${previousYear.year} !`
      );
      setShowSyncModal(false);

      // Réinitialiser les filtres
      setSyncFilterClasse("");
      setSyncFilterSalle("");
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      alert("Erreur lors de la synchronisation des professeurs");
    } finally {
      setIsSyncing(false);
    }
  };
  // Obtenir les classes de l'année précédente (toutes)
  const getPreviousYearClassesOptions = () => {
    if (!previousYear) return [];

    return previousYear.classes.map((classe) => ({
      value: classe.id,
      label: classe.name,
    }));
  };
  // Obtenir le label d'une matière de l'année précédente
  const getPreviousYearMatiereLabel = useCallback(
    (matiereId: string) => {
      if (!previousYear) return matiereId;

      for (const classe of previousYear.classes) {
        for (const salle of classe.salles) {
          const matiere = salle.subjects.find((s) => s.id === matiereId);
          if (matiere) {
            return matiere.name;
          }
        }
      }
      return matiereId;
    },
    [previousYear]
  );
  // Obtenir les salles de l'année précédente selon la classe
  const getPreviousYearSallesOptions = (classeId?: string) => {
    if (!previousYear) return [];

    const salles = previousYear.classes
      .filter((classe) => !classeId || classe.id === classeId)
      .flatMap((classe) => classe.salles)
      .map((salle) => ({
        value: salle.id,
        label: salle.name,
      }));

    // Supprimer les doublons
    const uniqueSalles = salles.filter(
      (salle, index, self) =>
        index === self.findIndex((s) => s.value === salle.value)
    );

    return uniqueSalles;
  };

  // Filtrer les professeurs selon les critères du modal
  const getFilteredPreviousYearProfesseurs = () => {
    let filtered = previousYearProfesseurs;

    if (syncFilterClasse) {
      filtered = filtered.filter((prof) =>
        prof.sequences.some((seq) => seq.classe === syncFilterClasse)
      );
    }

    if (syncFilterSalle) {
      filtered = filtered.filter((prof) =>
        prof.sequences.some((seq) => seq.salle === syncFilterSalle)
      );
    }

    return filtered;
  };

  // Obtenir le statut de compatibilité pour un professeur
  const getProfCompatibilityStatus = (prof: Professeur) => {
    if (!previousYear) {
      return {
        isCompatible: false,
        compatibleSequencesCount: 0,
        totalSequences: prof.sequences.length,
      };
    }

    // Maps ID -> Name for previous year
    const prevClassIdToName = new Map(
      previousYear.classes.map((c) => [c.id, c.name])
    );
    const prevSalleIdToKey = new Map<string, string>();
    previousYear.classes.forEach((c) => {
      c.salles.forEach((s) => {
        prevSalleIdToKey.set(s.id, `${c.name}::${s.name}`);
      });
    });

    const hasCompatibleSequences = prof.sequences.some((seq) => {
      const className = prevClassIdToName.get(seq.classe);
      const salleKey = prevSalleIdToKey.get(seq.salle);
      return (
        !!className &&
        !!salleKey &&
        compatibilityInfo.commonClasses.includes(className) &&
        compatibilityInfo.commonSalles.includes(salleKey)
      );
    });

    const compatibleSequencesCount = prof.sequences.filter((seq) => {
      const className = prevClassIdToName.get(seq.classe);
      const salleKey = prevSalleIdToKey.get(seq.salle);
      return (
        !!className &&
        !!salleKey &&
        compatibilityInfo.commonClasses.includes(className) &&
        compatibilityInfo.commonSalles.includes(salleKey)
      );
    }).length;

    return {
      isCompatible: hasCompatibleSequences,
      compatibleSequencesCount,
      totalSequences: prof.sequences.length,
    };
  };
  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      date_embauche: "",
      nif_cin: "",
      sequences: [],
      diplomes: "",
      statut: "actif",
      type_contrat: "permanent",
      annee_scolaire_id: "",
    });
    setNouvelleSequence({
      classe: "",
      salle: "",
      matiere: "",
    });
  };

  // Générer un nouveau code professeur
  const generateProfCode = async () => {
    try {
      const newCode = await genererNouveauCode(currentYear?.id || "");
      return newCode;
    } catch (error) {
      console.error("Erreur lors de la génération du code:", error);
      // Fallback en cas d'erreur
      const lastCode = professeurs.reduce((max, prof) => {
        const num = parseInt(prof.code.replace("PROF", ""));
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      return `PROF${String(lastCode + 1).padStart(3, "0")}`;
    }
  };

  useEffect(() => {
    // Délais réduit pour réactivité
    const timer = setTimeout(() => {
      checkForAutoSync();
    }, 1200);
    return () => clearTimeout(timer);
  }, [checkForAutoSync, currentYear, previousYear, professeurs.length]);
  // Ouvrir modal
  const openModal = async (
    type: "add" | "edit" | "view" | "delete",
    prof: Professeur | null = null
  ) => {
    setModalType(type);
    setSelectedProf(prof);

    if (type === "add") {
      resetForm();
      const newCode = await generateProfCode();
      setFormData((prev) => ({ ...prev, code: newCode }));
    } else if (type === "edit" && prof) {
      setFormData({
        code: prof.code,
        nom: prof.nom,
        prenom: prof.prenom,
        email: prof.email,
        telephone: prof.telephone,
        adresse: prof.adresse,
        date_embauche: prof.date_embauche,
        nif_cin: prof.nif_cin,
        sequences: prof.sequences.map((s) => ({
          classe: s.classe,
          salle: s.salle,
          matiere: s.matiere,
          volume_horaire: s.volume_horaire,
          coefficient: s.coefficient,
          deleted: s.deleted,
        })),
        diplomes: prof.diplomes,
        statut: prof.statut,
        type_contrat: prof.type_contrat,
        annee_scolaire_id: prof.annee_scolaire_id,
      });
    }

    setShowModal(true);
  };

  // Fermer modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedProf(null);
    resetForm();
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert(
        "Veuillez remplir tous les champs obligatoires (nom, prénom, email)"
      );
      return;
    }

    if (formData.nif_cin && !validateNifCin(formData.nif_cin)) {
      alert("Le NIF/CIN doit contenir exactement 10 chiffres");
      return;
    }

    if (!currentYear) {
      alert(
        "Aucune année scolaire sélectionnée. Veuillez d'abord sélectionner une année scolaire."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Préparer les données du professeur avec les séquences à sauvegarder par le contexte
      const professeurData = {
        ...formData,
        annee_scolaire_id: currentYear.id,
        sequences: formData.sequences,
      };

      let professeurId: string;

      if (modalType === "add") {
        await ajouterProfesseur(professeurData);
        alert("Professeur ajouté avec succès!");
      } else if (modalType === "edit" && selectedProf) {
        await modifierProfesseur(selectedProf.id, professeurData);
        alert("Professeur modifié avec succès!");
      }

      closeModal();
    } catch (err) {
      console.error("Erreur lors de la soumission:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde. Veuillez réessayer.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer professeur
  const handleDelete = async () => {
    if (!selectedProf) return;

    try {
      setIsDeleting(true);
      await supprimerProfesseur(selectedProf.id);

      // Attendre un peu pour que l'interface se mette à jour
      setTimeout(() => {
        alert("Professeur supprimé avec succès!");
        closeModal();
      }, 100);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression du professeur");
    } finally {
      setIsDeleting(false);
    }
  };

  // Gérer les changements du formulaire
  const handleInputChange = (
    field: keyof ProfesseurFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Gérer les changements de la nouvelle séquence
  const handleSequenceChange = (
    field: keyof Omit<Sequence, "id" | "professeur_affectation_id">,
    value: string
  ) => {
    setNouvelleSequence((prev) => {
      const newSequence = { ...prev, [field]: value };

      // Si on change la classe, réinitialiser la salle et la matière
      if (field === "classe") {
        newSequence.salle = "";
        newSequence.matiere = "";
      }

      // Si on change la salle, réinitialiser la matière
      if (field === "salle") {
        newSequence.matiere = "";
      }

      return newSequence;
    });
  };

  // Ajouter une séquence (local pour le formulaire)
  const ajouterSequenceLocal = () => {
    if (
      !nouvelleSequence.classe ||
      !nouvelleSequence.salle ||
      !nouvelleSequence.matiere
    ) {
      alert("Veuillez sélectionner une classe, une salle et une matière");
      return;
    }

    // Vérifier si cette séquence existe déjà
    const sequenceExists = formData.sequences.some(
      (seq) =>
        seq.classe === nouvelleSequence.classe &&
        seq.salle === nouvelleSequence.salle &&
        seq.matiere === nouvelleSequence.matiere
    );

    if (sequenceExists) {
      alert(
        "Cette séquence (classe, salle, matière) existe déjà pour ce professeur"
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sequences: [...prev.sequences, { ...nouvelleSequence }],
    }));

    // Réinitialiser la nouvelle séquence
    setNouvelleSequence({
      classe: "",
      salle: "",
      matiere: "",
    });
  };

  // Supprimer une séquence (local pour le formulaire)
  const supprimerSequenceLocal = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sequences: prev.sequences.filter((_, i) => i !== index),
    }));
  };

  // Ouvrir modal de gestion des séquences
  const openSequenceModal = (type: "add" | "edit", sequence?: Sequence) => {
    setSequenceModalType(type);
    setSelectedSequence(sequence || null);
    setNouvelleSequence({
      classe: sequence?.classe || "",
      salle: sequence?.salle || "",
      matiere: sequence?.matiere || "",
    });
    setShowSequenceModal(true);
  };

  // Fermer modal de gestion des séquences
  const closeSequenceModal = () => {
    setShowSequenceModal(false);
    setSelectedSequence(null);
    setNouvelleSequence({
      classe: "",
      salle: "",
      matiere: "",
    });
  };

  // Ajouter une séquence à un professeur existant
  const handleAddSequence = async () => {
    if (
      !selectedProf ||
      !nouvelleSequence.classe ||
      !nouvelleSequence.salle ||
      !nouvelleSequence.matiere
    ) {
      alert("Veuillez remplir tous les champs de la séquence");
      return;
    }

    try {
      await ajouterSequence(selectedProf.id, nouvelleSequence);
      alert("Séquence ajoutée avec succès!");
      closeSequenceModal();
    } catch (err) {
      console.error("Erreur lors de l'ajout de la séquence:", err);
      alert("Erreur lors de l'ajout de la séquence");
    }
  };

  // Modifier une séquence existante
  const handleEditSequence = async () => {
    if (
      !selectedProf ||
      !selectedSequence ||
      !nouvelleSequence.classe ||
      !nouvelleSequence.salle ||
      !nouvelleSequence.matiere
    ) {
      alert("Veuillez remplir tous les champs de la séquence");
      return;
    }

    try {
      await modifierSequence(
        selectedProf.id,
        selectedSequence.id,
        nouvelleSequence
      );
      alert("Séquence modifiée avec succès!");
      closeSequenceModal();
    } catch (err) {
      console.error("Erreur lors de la modification de la séquence:", err);
      alert("Erreur lors de la modification de la séquence");
    }
  };

  // Supprimer une séquence d'un professeur existant
  const handleDeleteSequence = async (sequenceId: string) => {
    if (!selectedProf) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer cette séquence ?")) {
      try {
        await supprimerSequence(selectedProf.id, sequenceId);
        alert("Séquence supprimée avec succès!");
      } catch (err) {
        console.error("Erreur lors de la suppression de la séquence:", err);
        alert("Erreur lors de la suppression de la séquence");
      }
    }
  };

  // Filtrer les professeurs
  const filteredProfesseurs = (
    searchTerm ? rechercherProfesseurs(searchTerm) : professeurs
  ).filter((prof) => {
    // Filtre par classe/salle si définis
    const hasClasse = filterClasse
      ? prof.sequences.some((s) => s.classe === filterClasse)
      : true;
    const hasSalle = filterSalle
      ? prof.sequences.some((s) => s.salle === filterSalle)
      : true;
    const hasStatut = filterStatut ? prof.statut === filterStatut : true;
    return hasClasse && hasSalle && hasStatut;
  });

  // Obtenir les labels pour l'affichage
  const getLabels = (
    values: string[],
    sourceData: { value: string; label: string }[]
  ) => {
    return values
      .map(
        (value) =>
          sourceData.find((item) => item.value === value)?.label || value
      )
      .join(", ");
  };

  // Obtenir le label d'une matière par son ID
  const getMatiereLabel = (matiereId: string) => {
    if (currentYear) {
      for (const classe of currentYear.classes) {
        for (const salle of classe.salles) {
          const matiere = salle.subjects.find((s) => s.id === matiereId);
          if (matiere) return matiere.name;
        }
      }
    }
    if (previousYear) {
      for (const classe of previousYear.classes) {
        for (const salle of classe.salles) {
          const matiere = salle.subjects.find((s) => s.id === matiereId);
          if (matiere) return matiere.name;
        }
      }
    }
    return matiereId;
  };

  const getClasseLabel = (classeId: string) => {
    const cur = currentYear?.classes.find((c) => c.id === classeId)?.name;
    if (cur) return cur;
    const prev = previousYear?.classes.find((c) => c.id === classeId)?.name;
    return prev || classeId;
  };

  const getSalleLabel = (salleId: string) => {
    if (currentYear) {
      for (const classe of currentYear.classes) {
        const salle = classe.salles.find((s) => s.id === salleId);
        if (salle) return salle.name;
      }
    }
    if (previousYear) {
      for (const classe of previousYear.classes) {
        const salle = classe.salles.find((s) => s.id === salleId);
        if (salle) return salle.name;
      }
    }
    return salleId;
  };

  // Impression améliorée: génération HTML optimisée et print
  const handlePrint = () => {
    try {
      const list = filteredProfesseurs;

      if (!list || list.length === 0) {
        alert("Aucun professeur à imprimer");
        return;
      }

      // Configuration des colonnes
      const columns = getSelectedColumns();

      // Génération des données
      const rows = generateTableRows(list);

      // Génération du HTML complet
      const html = generatePrintHTML(columns, rows);

      // Ouverture et impression
      openPrintWindow(html);
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      alert("Erreur lors de la génération du document");
    }
  };

  // Fonction pour obtenir les colonnes sélectionnées
  const getSelectedColumns = (): {
    key: string;
    label: string;
    width?: string;
  }[] => {
    const columns: { key: string; label: string; width?: string }[] = [];

    if (printColumns.code)
      columns.push({ key: "code", label: "Code", width: "80px" });
    if (printColumns.nom)
      columns.push({ key: "nom", label: "Nom", width: "120px" });
    if (printColumns.prenom)
      columns.push({ key: "prenom", label: "Prénom", width: "120px" });
    if (printColumns.email)
      columns.push({ key: "email", label: "Email", width: "180px" });
    if (printColumns.telephone)
      columns.push({ key: "telephone", label: "Téléphone", width: "120px" });
    if (printColumns.nifcin)
      columns.push({ key: "nif_cin", label: "NIF/CIN", width: "100px" });
    if (printColumns.classe)
      columns.push({ key: "_classe", label: "Classe", width: "100px" });
    if (printColumns.salle)
      columns.push({ key: "_salle", label: "Salle", width: "100px" });

    return columns;
  };

  // Fonction pour générer les lignes du tableau
  const generateTableRows = (list: any[]) => {
    return list.map((p, index) => {
      // Pour classe/salle, on affiche la première séquence si disponible
      const seq = p.sequences?.[0];
      const classeLabel = seq
        ? classes.find((c) => c.value === seq.classe)?.label || seq.classe
        : "";
      const salleLabel = seq
        ? Object.values(sallesData)
            .flat()
            .find((s) => s.value === seq.salle)?.label || seq.salle
        : "";

      return {
        index: index + 1,
        code: p.code || "",
        nom: p.nom || "",
        prenom: p.prenom || "",
        email: p.email || "",
        telephone: p.telephone || "",
        nif_cin: (p as any).nif_cin || "",
        _classe: classeLabel,
        _salle: salleLabel,
      };
    });
  };

  // Styles CSS améliorés
  const getStyles = () => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .document {
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .company-info {
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .document-title {
      font-size: 16px;
      font-weight: bold;
      color: #374151;
      margin: 15px 0 5px 0;
      text-transform: uppercase;
    }
    
    .school-year {
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    
    .stats {
      text-align: right;
      margin-bottom: 15px;
      font-size: 11px;
      color: #6b7280;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
    }
    
    th {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #374151;
      font-weight: 600;
      padding: 12px 8px;
      text-align: left;
      border: 1px solid #d1d5db;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px 8px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
      font-size: 11px;
    }
    
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    tr:hover {
      background-color: #f3f4f6;
    }
    
    .index-col {
      width: 40px;
      text-align: center;
      font-weight: 600;
      color: #6b7280;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    
    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-box {
      width: 200px;
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #374151;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 10px;
      color: #6b7280;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .document {
        padding: 10px;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .no-print {
        display: none !important;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      tfoot {
        display: table-footer-group;
      }
    }
    
    @page {
      margin: 1cm;
      size: A4;
    }
  </style>
`;

  // Fonction pour générer le tableau
  const generateTable = (columns: any[], rows: any[]) => {
    const thead = `
    <thead>
      <tr>
        <th class="index-col">#</th>
        ${columns
          .map(
            (c) =>
              `<th style="${c.width ? `width: ${c.width}` : ""}">${
                c.label
              }</th>`
          )
          .join("")}
      </tr>
    </thead>
  `;

    const tbody = `
    <tbody>
      ${rows
        .map(
          (row) => `
        <tr>
          <td class="index-col">${row.index}</td>
          ${columns.map((c) => `<td>${row[c.key] || ""}</td>`).join("")}
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

    return `
    <div class="stats">
      Total: ${rows.length} professeur${rows.length > 1 ? "s" : ""} • 
      Généré le ${new Date().toLocaleDateString(
        "fr-FR"
      )} à ${new Date().toLocaleTimeString("fr-FR")}
    </div>
    <div class="table-container">
      <table>
        ${thead}
        ${tbody}
      </table>
    </div>
  `;
  };

  // Fonction pour générer le pied de page
  const generateFooter = () => `
  <div class="footer">
    <div>Document généré automatiquement le ${new Date().toLocaleDateString(
      "fr-FR"
    )} à ${new Date().toLocaleTimeString("fr-FR")}</div>
  </div>
  
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">Directeur</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Responsable RH</div>
    </div>
  </div>
`;

  // Fonction principale pour générer le HTML
  const generatePrintHTML = (columns: any[], rows: any[]) => {
    return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Liste des Professeurs - ${
          printHeader.companyName || "École"
        }</title>
        ${getStyles()}
      </head>
      <body>
        <div class="document">
         ${EntetIMFP(`Liste des Professeurs `)}
          ${generateTable(columns, rows)}
          ${generateFooter()}
        </div>
      </body>
    </html>
  `;
  };

  // Fonction pour ouvrir la fenêtre d'impression
  const openPrintWindow = (html: string) => {
    const printWindow = window.open("", "_blank", "width=1000,height=700");

    if (!printWindow) {
      alert(
        "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les paramètres de votre navigateur."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Fermer la fenêtre après impression (optionnel)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };
  };

  return (
    <div className={`${baseClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Professeurs</h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion du personnel enseignant - SIGEP
          </p>
          {currentYear && (
            <p
              className={`text-sm mt-2 ${
                isDarkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              Année scolaire courante : <strong>{currentYear.year}</strong>
            </p>
          )}
          {!currentYear && (
            <p
              className={`text-sm mt-2 ${
                isDarkMode ? "text-yellow-300" : "text-yellow-600"
              }`}
            >
              ⚠️ Aucune année scolaire sélectionnée. Veuillez d'abord
              sélectionner une année scolaire.
            </p>
          )}
        </div>

        {/* Barre d'actions */}
        <div className={`${cardClasses} rounded-lg shadow-sm border p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un professeur..."
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${buttonSecondaryClasses}`}
              aria-label="Afficher/masquer les filtres"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>

            <button
              onClick={() => openModal("add")}
              disabled={!currentYear}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                !currentYear
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : buttonPrimaryClasses
              }`}
            >
              <Plus className="h-4 w-4" />
              Ajouter un Professeur
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${buttonSecondaryClasses}`}
            >
              <Printer className="h-4 w-4" />
              Imprimer la liste
            </button>
          </div>
        </div>
        {/* Filtres Classe, Salle et Statut */}
        {showFilters && (
          <div className="mt-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            <div>
              <SelectWithSearch
                options={[
                  { value: "", label: "Toutes les classes" },
                  ...classes,
                ]}
                selectedValues={filterClasse ? [filterClasse] : [""]}
                onChange={(values) => {
                  setFilterClasse(values[0] || "");
                  setFilterSalle("");
                }}
                placeholder="Filtrer par classe"
                multiple={false}
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <SelectWithSearch
                options={
                  filterClasse
                    ? [
                        { value: "", label: "Toutes les salles" },
                        ...(sallesData[filterClasse] || []),
                      ]
                    : [{ value: "", label: "Toutes les salles" }]
                }
                selectedValues={filterSalle ? [filterSalle] : [""]}
                onChange={(values) => setFilterSalle(values[0] || "")}
                placeholder="Filtrer par salle"
                multiple={false}
                isDarkMode={isDarkMode}
                disabled={!filterClasse}
              />
            </div>
            <div>
              <SelectWithSearch
                options={[
                  { value: "", label: "Tous les statuts" },
                  { value: "actif", label: "Actif" },
                  { value: "inactif", label: "Inactif" },
                ]}
                selectedValues={filterStatut ? [filterStatut] : [""]}
                onChange={(values) => setFilterStatut(values[0] || "")}
                placeholder="Filtrer par statut"
                multiple={false}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-blue-900" : "bg-blue-100"
                }`}
              >
                <Users
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Total Professeurs
                </p>
                <p className="text-2xl font-bold">{professeurs.length}</p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-green-900" : "bg-green-100"
                }`}
              >
                <CheckCircle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Actifs
                </p>
                <p className="text-2xl font-bold">
                  {professeurs.filter((p) => p.statut === "actif").length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-red-900" : "bg-red-100"
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Inactifs
                </p>
                <p className="text-2xl font-bold">
                  {professeurs.filter((p) => p.statut === "inactif").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des professeurs */}
        <div className={`${cardClasses} rounded-lg shadow-sm border`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Liste des Professeurs ({filteredProfesseurs.length})
            </h2>

            {filteredProfesseurs.length === 0 ? (
              <div className="text-center py-12">
                <User
                  className={`h-16 w-16 mx-auto mb-4 ${
                    isDarkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Aucun professeur trouvé
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeaderClasses}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Professeur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Séquences (Classe - Salle - Matière)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${tableBorderClasses}`}>
                    {filteredProfesseurs.map((prof) => (
                      <tr key={prof.id} className={tableRowClasses}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                                }`}
                              >
                                <User
                                  className={`h-5 w-5 ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {prof.prenom} {prof.nom}
                              </div>
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {prof.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{prof.email}</div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {prof.telephone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {prof.sequences.map((seq) => {
                              const classeLabel = getClasseLabel(seq.classe);
                              const salleLabel = getSalleLabel(seq.salle);
                              const matiereLabel = getMatiereLabel(seq.matiere);
                              return (
                                <div
                                  key={seq.id}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-blue-900 text-blue-200"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {classeLabel}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-purple-900 text-purple-200"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {salleLabel}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-green-900 text-green-200"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {matiereLabel}
                                  </span>
                                </div>
                              );
                            })}
                            {prof.sequences.length === 0 && (
                              <span className="text-gray-500 italic">
                                Aucune séquence
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              prof.statut === "actif"
                                ? isDarkMode
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : isDarkMode
                                ? "bg-red-900 text-red-300"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {prof.statut === "actif" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal("view", prof)}
                              className={`${
                                isDarkMode
                                  ? "text-gray-400 hover:text-gray-200"
                                  : "text-gray-600 hover:text-gray-900"
                              } p-1`}
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("edit", prof)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("delete", prof)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    {modalType === "add" && "Ajouter un Professeur"}
                    {modalType === "edit" && "Modifier le Professeur"}
                    {modalType === "view" && "Détails du Professeur"}
                    {modalType === "delete" && "Confirmer la Suppression"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenu du modal */}
                {modalType === "delete" ? (
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <p
                      className={`mb-6 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Êtes-vous sûr de vouloir supprimer le professeur{" "}
                      <strong>
                        {selectedProf?.prenom} {selectedProf?.nom}
                      </strong>{" "}
                      ?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          isDeleting
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : buttonDangerClasses
                        }`}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isDeleting ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                ) : modalType === "view" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">
                          Informations personnelles
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <strong>Code:</strong> {selectedProf?.code}
                          </div>
                          <div>
                            <strong>Nom:</strong> {selectedProf?.nom}
                          </div>
                          <div>
                            <strong>Prénom:</strong> {selectedProf?.prenom}
                          </div>
                          <div>
                            <strong>Email:</strong> {selectedProf?.email}
                          </div>
                          <div>
                            <strong>Téléphone:</strong>{" "}
                            {selectedProf?.telephone}
                          </div>
                          <div>
                            <strong>Adresse:</strong> {selectedProf?.adresse}
                          </div>
                          <div>
                            <strong>NIF/CIN:</strong>{" "}
                            {selectedProf?.nif_cin || "Non renseigné"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">
                          Informations professionnelles
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <strong>Date d'embauche:</strong>{" "}
                            {selectedProf?.date_embauche
                              ? new Date(
                                  selectedProf.date_embauche
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div>
                            <strong>Statut:</strong>{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                selectedProf?.statut === "actif"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {selectedProf?.statut}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <strong>Séquences d'enseignement:</strong>
                              <button
                                onClick={() => openSequenceModal("add")}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                  isDarkMode
                                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                                Ajouter
                              </button>
                            </div>
                            <div className="mt-2 space-y-2">
                              {selectedProf &&
                              selectedProf.sequences.length > 0 ? (
                                selectedProf.sequences.map((seq) => {
                                  const classeLabel = getClasseLabel(
                                    seq.classe
                                  );
                                  const salleLabel = getSalleLabel(seq.salle);
                                  const matiereLabel = getMatiereLabel(
                                    seq.matiere
                                  );
                                  return (
                                    <div
                                      key={seq.id}
                                      className={`p-3 rounded border ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600"
                                          : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                              isDarkMode
                                                ? "bg-blue-900 text-blue-200"
                                                : "bg-blue-100 text-blue-800"
                                            }`}
                                          >
                                            {classeLabel}
                                          </span>
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                              isDarkMode
                                                ? "bg-purple-900 text-purple-200"
                                                : "bg-purple-100 text-purple-800"
                                            }`}
                                          >
                                            {salleLabel}
                                          </span>
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                              isDarkMode
                                                ? "bg-green-900 text-green-200"
                                                : "bg-green-100 text-green-800"
                                            }`}
                                          >
                                            {matiereLabel}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() =>
                                              openSequenceModal("edit", seq)
                                            }
                                            className={`p-1 rounded ${
                                              isDarkMode
                                                ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900"
                                                : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                            }`}
                                            title="Modifier cette séquence"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteSequence(seq.id)
                                            }
                                            className={`p-1 rounded ${
                                              isDarkMode
                                                ? "text-red-400 hover:text-red-300 hover:bg-red-900"
                                                : "text-red-600 hover:text-red-800 hover:bg-red-100"
                                            }`}
                                            title="Supprimer cette séquence"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Aucune séquence définie
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <strong>Diplômes:</strong> {selectedProf?.diplomes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations de base */}

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Statut *
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.statut}
                          onChange={(e) =>
                            handleInputChange(
                              "statut",
                              e.target.value as "actif" | "inactif"
                            )
                          }
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Nom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.nom}
                          onChange={(e) =>
                            handleInputChange("nom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Prénom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.prenom}
                          onChange={(e) =>
                            handleInputChange("prenom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.telephone}
                          onChange={(e) =>
                            handleInputChange("telephone", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Adresse
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.adresse}
                          onChange={(e) =>
                            handleInputChange("adresse", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Date d'embauche
                        </label>
                        <input
                          type="date"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.date_embauche}
                          onChange={(e) =>
                            handleInputChange("date_embauche", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          NIF/CIN
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 0024358933 ou 5784673767"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.nif_cin}
                          onChange={(e) => {
                            const formatted = formatNifCin(e.target.value);
                            handleInputChange("nif_cin", formatted);
                          }}
                          maxLength={13} // 10 chiffres + 3 tirets maximum
                        />
                        <p
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Saisissez exactement 10 chiffres. Si le numéro
                          commence par 0, il sera automatiquement formaté avec
                          des tirets.
                        </p>
                      </div>

                      {/* Système de séquences */}
                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-4 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Séquences d'enseignement (Classe - Salle - Matière)
                        </label>

                        {/* Formulaire pour ajouter une nouvelle séquence */}
                        <div
                          className={`p-4 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600"
                              : "bg-gray-50 border-gray-200"
                          } mb-4`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label
                                className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                1. Classe *
                              </label>
                              <SelectWithSearch
                                options={classes}
                                selectedValues={
                                  nouvelleSequence.classe
                                    ? [nouvelleSequence.classe]
                                    : []
                                }
                                onChange={(values) =>
                                  handleSequenceChange(
                                    "classe",
                                    values[0] || ""
                                  )
                                }
                                placeholder="Sélectionner une classe..."
                                multiple={false}
                                isDarkMode={isDarkMode}
                              />
                            </div>

                            <div>
                              <label
                                className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                2. Salle *
                              </label>
                              <SelectWithSearch
                                options={getAvailableSalles(
                                  nouvelleSequence.classe
                                )}
                                selectedValues={
                                  nouvelleSequence.salle
                                    ? [nouvelleSequence.salle]
                                    : []
                                }
                                onChange={(values) =>
                                  handleSequenceChange("salle", values[0] || "")
                                }
                                placeholder={
                                  !nouvelleSequence.classe
                                    ? "Sélectionnez d'abord une classe..."
                                    : "Sélectionner une salle..."
                                }
                                multiple={false}
                                isDarkMode={isDarkMode}
                                disabled={!nouvelleSequence.classe}
                              />
                            </div>

                            <div>
                              <label
                                className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                3. Matière *
                              </label>
                              <SelectWithSearch
                                options={getMatieresForSalle(
                                  nouvelleSequence.salle
                                )}
                                selectedValues={
                                  nouvelleSequence.matiere
                                    ? [nouvelleSequence.matiere]
                                    : []
                                }
                                onChange={(values) =>
                                  handleSequenceChange(
                                    "matiere",
                                    values[0] || ""
                                  )
                                }
                                placeholder={
                                  !nouvelleSequence.salle
                                    ? "Sélectionnez d'abord une salle..."
                                    : "Sélectionner une matière..."
                                }
                                multiple={false}
                                isDarkMode={isDarkMode}
                                disabled={!nouvelleSequence.salle}
                              />
                            </div>
                          </div>

                          <button
                            onClick={ajouterSequenceLocal}
                            disabled={
                              !nouvelleSequence.classe ||
                              !nouvelleSequence.salle ||
                              !nouvelleSequence.matiere
                            }
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                              !nouvelleSequence.classe ||
                              !nouvelleSequence.salle ||
                              !nouvelleSequence.matiere
                                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                                : buttonPrimaryClasses
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter cette séquence
                          </button>
                        </div>

                        {/* Liste des séquences ajoutées */}
                        <div className="space-y-2">
                          <h4
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Séquences ajoutées ({formData.sequences.length})
                          </h4>

                          {formData.sequences.length === 0 ? (
                            <p
                              className={`text-sm italic ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Aucune séquence ajoutée
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {formData.sequences.map((seq, index) => {
                                const classeLabel = getClasseLabel(seq.classe);
                                const salleLabel = getSalleLabel(seq.salle);
                                const matiereLabel = getMatiereLabel(
                                  seq.matiere
                                );

                                return (
                                  <div
                                    key={`${seq.classe}-${seq.salle}-${seq.matiere}-${index}`}
                                    className={`p-3 rounded border flex items-center justify-between ${
                                      isDarkMode
                                        ? "bg-gray-700 border-gray-600"
                                        : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          isDarkMode
                                            ? "bg-blue-900 text-blue-200"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {classeLabel}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          isDarkMode
                                            ? "bg-purple-900 text-purple-200"
                                            : "bg-purple-100 text-purple-800"
                                        }`}
                                      >
                                        {salleLabel}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          isDarkMode
                                            ? "bg-green-900 text-green-200"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {matiereLabel}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        supprimerSequenceLocal(index)
                                      }
                                      className={`p-1 rounded ${
                                        isDarkMode
                                          ? "text-red-400 hover:text-red-300 hover:bg-red-900"
                                          : "text-red-600 hover:text-red-800 hover:bg-red-100"
                                      }`}
                                      title="Supprimer cette séquence"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Diplômes et qualifications
                        </label>
                        <textarea
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.diplomes}
                          onChange={(e) =>
                            handleInputChange("diplomes", e.target.value)
                          }
                          placeholder="Ex: Licence en Mathématiques, Master en Sciences..."
                        />
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : buttonPrimaryClasses
                        }`}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSubmitting
                          ? "Sauvegarde..."
                          : modalType === "add"
                          ? "Ajouter"
                          : "Modifier"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de gestion des séquences */}
        {showSequenceModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    {sequenceModalType === "add" && "Ajouter une Séquence"}
                    {sequenceModalType === "edit" && "Modifier la Séquence"}
                  </h3>
                  <button
                    onClick={closeSequenceModal}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenu du modal */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        1. Classe *
                      </label>
                      <SelectWithSearch
                        options={classes}
                        selectedValues={
                          nouvelleSequence.classe
                            ? [nouvelleSequence.classe]
                            : []
                        }
                        onChange={(values) =>
                          handleSequenceChange("classe", values[0] || "")
                        }
                        placeholder="Sélectionner une classe..."
                        multiple={false}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        2. Salle *
                      </label>
                      <SelectWithSearch
                        options={getAvailableSalles(nouvelleSequence.classe)}
                        selectedValues={
                          nouvelleSequence.salle ? [nouvelleSequence.salle] : []
                        }
                        onChange={(values) =>
                          handleSequenceChange("salle", values[0] || "")
                        }
                        placeholder={
                          !nouvelleSequence.classe
                            ? "Sélectionnez d'abord une classe..."
                            : "Sélectionner une salle..."
                        }
                        multiple={false}
                        isDarkMode={isDarkMode}
                        disabled={!nouvelleSequence.classe}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        3. Matière *
                      </label>
                      <SelectWithSearch
                        options={getMatieresForSalle(nouvelleSequence.salle)}
                        selectedValues={
                          nouvelleSequence.matiere
                            ? [nouvelleSequence.matiere]
                            : []
                        }
                        onChange={(values) =>
                          handleSequenceChange("matiere", values[0] || "")
                        }
                        placeholder={
                          !nouvelleSequence.salle
                            ? "Sélectionnez d'abord une salle..."
                            : "Sélectionner une matière..."
                        }
                        multiple={false}
                        isDarkMode={isDarkMode}
                        disabled={!nouvelleSequence.salle}
                      />
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <button
                      onClick={closeSequenceModal}
                      className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={
                        sequenceModalType === "add"
                          ? handleAddSequence
                          : handleEditSequence
                      }
                      disabled={
                        !nouvelleSequence.classe ||
                        !nouvelleSequence.salle ||
                        !nouvelleSequence.matiere
                      }
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        !nouvelleSequence.classe ||
                        !nouvelleSequence.salle ||
                        !nouvelleSequence.matiere
                          ? "bg-gray-400 cursor-not-allowed text-gray-200"
                          : buttonPrimaryClasses
                      }`}
                    >
                      <Save className="h-4 w-4" />
                      {sequenceModalType === "add" ? "Ajouter" : "Modifier"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Impression */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    Préparer l'impression
                  </h3>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1  gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Colonnes à imprimer</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { key: "code", label: "Code" },
                        { key: "nom", label: "Nom" },
                        { key: "prenom", label: "Prénom" },
                        { key: "email", label: "Email" },
                        { key: "telephone", label: "Téléphone" },
                        { key: "nifcin", label: "NIF/CIN" },
                        { key: "classe", label: "Classe" },
                        { key: "salle", label: "Salle" },
                      ].map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(printColumns as any)[col.key]}
                            onChange={(e) =>
                              setPrintColumns({
                                ...printColumns,
                                [col.key]: e.target.checked,
                              })
                            }
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handlePrint()}
                    className={`px-4 py-2 rounded-lg ${buttonPrimaryClasses}`}
                  >
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Synchronisation Automatique */}
        {/* Modal de Synchronisation Automatique */}
        {/* Modal de Synchronisation Automatique */}
        {showSyncModal && previousYear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    Synchroniser les professeurs
                  </h3>
                  <button
                    onClick={() => {
                      setShowSyncModal(false);
                      setSyncFilterClasse("");
                      setSyncFilterSalle("");
                      setPreviousYearProfesseurs([]);
                      setCompatibilityInfo({
                        hasCommonClasses: false,
                        hasCommonSalles: false,
                        commonClasses: [],
                        commonSalles: [],
                        sameClassesCount: false,
                        sameSallesCount: false,
                      });
                    }}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Informations générales */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Aucun professeur trouvé pour l'année{" "}
                        <strong>{currentYear?.year}</strong>.
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <strong>{previousYearProfesseurs.length}</strong>{" "}
                        professeurs trouvés dans l'année{" "}
                        <strong>{previousYear.year}</strong>
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Vous pouvez filtrer et sélectionner les professeurs à
                        synchroniser
                      </p>
                    </div>
                  </div>

                  {/* Informations de compatibilité */}
                  <div
                    className={`p-4 rounded-lg border mb-6 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Analyse de compatibilité
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Classes communes</span>
                        <span className="text-lg font-bold text-green-600">
                          {compatibilityInfo.commonClasses.length}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Salles communes</span>
                        <span className="text-lg font-bold text-green-600">
                          {compatibilityInfo.commonSalles.length}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Même nombre de classes
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            compatibilityInfo.sameClassesCount
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {compatibilityInfo.sameClassesCount ? "Oui" : "Non"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Même nombre de salles
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            compatibilityInfo.sameSallesCount
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {compatibilityInfo.sameSallesCount ? "Oui" : "Non"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Professeurs compatibles
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {
                            previousYearProfesseurs.filter(
                              (prof) =>
                                getProfCompatibilityStatus(prof).isCompatible
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Total professeurs</span>
                        <span className="text-lg font-bold text-gray-600">
                          {previousYearProfesseurs.length}
                        </span>
                      </div>
                    </div>

                    {compatibilityInfo.commonClasses.length === 0 ||
                    compatibilityInfo.commonSalles.length === 0 ? (
                      <div
                        className={`mt-3 p-3 rounded border-l-4 border-yellow-400 ${
                          isDarkMode
                            ? "bg-yellow-900/20 text-yellow-300"
                            : "bg-yellow-50 text-yellow-800"
                        }`}
                      >
                        <p className="text-sm">
                          <strong>Attention :</strong> Aucune classe/salle
                          commune détectée. Les professeurs seront copiés mais
                          leurs séquences devront être mises à jour
                          manuellement.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`mt-3 p-3 rounded border-l-4 border-green-400 ${
                          isDarkMode
                            ? "bg-green-900/20 text-green-300"
                            : "bg-green-50 text-green-800"
                        }`}
                      >
                        <p className="text-sm">
                          <strong>Excellent :</strong> Classes et salles
                          communes détectées. Les professeurs compatibles
                          peuvent être synchronisés directement.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Filtres */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtrer par classe
                      </label>
                      <SelectWithSearch
                        options={[
                          { value: "", label: "Toutes les classes" },
                          ...getPreviousYearClassesOptions(),
                        ]}
                        selectedValues={
                          syncFilterClasse ? [syncFilterClasse] : [""]
                        }
                        onChange={(values) => {
                          setSyncFilterClasse(values[0] || "");
                          setSyncFilterSalle("");
                        }}
                        placeholder="Sélectionner une classe..."
                        multiple={false}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtrer par salle
                      </label>
                      <SelectWithSearch
                        options={[
                          { value: "", label: "Toutes les salles" },
                          ...getPreviousYearSallesOptions(syncFilterClasse),
                        ]}
                        selectedValues={
                          syncFilterSalle ? [syncFilterSalle] : [""]
                        }
                        onChange={(values) =>
                          setSyncFilterSalle(values[0] || "")
                        }
                        placeholder="Sélectionner une salle..."
                        multiple={false}
                        isDarkMode={isDarkMode}
                        disabled={!syncFilterClasse}
                      />
                    </div>
                  </div>

                  {/* Liste des professeurs */}
                  <div
                    className={`border rounded-lg ${
                      isDarkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-4 border-b ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      } ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Professeurs à synchroniser (
                          {getFilteredPreviousYearProfesseurs().length})
                        </h4>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Compatible</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Vérification requise</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {getFilteredPreviousYearProfesseurs().length === 0 ? (
                        <div className="p-8 text-center">
                          <User
                            className={`h-12 w-12 mx-auto mb-3 ${
                              isDarkMode ? "text-gray-600" : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Aucun professeur trouvé avec les filtres
                            sélectionnés
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            Modifiez les filtres pour voir plus de professeurs
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`divide-y ${
                            isDarkMode ? "divide-gray-600" : "divide-gray-200"
                          }`}
                        >
                          {getFilteredPreviousYearProfesseurs().map((prof) => {
                            const compatibilityStatus =
                              getProfCompatibilityStatus(prof);

                            return (
                              <div
                                key={prof.id}
                                className={`p-4 hover:${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  {/* Informations du professeur */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div
                                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                            isDarkMode
                                              ? "bg-gray-600"
                                              : "bg-gray-300"
                                          }`}
                                        >
                                          <User
                                            className={`h-5 w-5 ${
                                              isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-600"
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {prof.prenom} {prof.nom}
                                          </span>
                                          {compatibilityStatus.isCompatible ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Compatible
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Vérification requise
                                            </span>
                                          )}
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              prof.statut === "actif"
                                                ? isDarkMode
                                                  ? "bg-green-900 text-green-300"
                                                  : "bg-green-100 text-green-800"
                                                : isDarkMode
                                                ? "bg-red-900 text-red-300"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {prof.statut === "actif"
                                              ? "Actif"
                                              : "Inactif"}
                                          </span>
                                        </div>
                                        <div
                                          className={`text-sm ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {prof.code} • {prof.email}
                                        </div>
                                        {prof.telephone && (
                                          <div
                                            className={`text-sm ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            📞 {prof.telephone}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Séquences du professeur */}
                                    <div className="ml-13">
                                      <div className="mb-2">
                                        <span
                                          className={`text-sm font-medium ${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          Séquences ({prof.sequences.length})
                                          {compatibilityStatus.isCompatible && (
                                            <span className="text-green-600 ml-1">
                                              •{" "}
                                              {
                                                compatibilityStatus.compatibleSequencesCount
                                              }{" "}
                                              compatible(s)
                                            </span>
                                          )}
                                        </span>
                                      </div>

                                      {prof.sequences.length === 0 ? (
                                        <span
                                          className={`text-sm italic ${
                                            isDarkMode
                                              ? "text-gray-500"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          Aucune séquence définie
                                        </span>
                                      ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                          {prof.sequences.map((seq) => {
                                            const classeLabel =
                                              previousYear.classes.find(
                                                (c) => c.id === seq.classe
                                              )?.name || seq.classe;
                                            const salleLabel =
                                              previousYear.classes
                                                .flatMap((c) => c.salles)
                                                .find((s) => s.id === seq.salle)
                                                ?.name || seq.salle;
                                            const matiereLabel =
                                              getPreviousYearMatiereLabel(
                                                seq.matiere
                                              );

                                            const classNameForKey =
                                              previousYear.classes.find(
                                                (c) => c.id === seq.classe
                                              )?.name;
                                            const salleOwnerClassName =
                                              previousYear.classes.find((c) =>
                                                c.salles.some(
                                                  (s) => s.id === seq.salle
                                                )
                                              )?.name;
                                            const salleNameForKey =
                                              previousYear.classes
                                                .flatMap((c) => c.salles)
                                                .find(
                                                  (s) => s.id === seq.salle
                                                )?.name;
                                            const salleKey =
                                              salleOwnerClassName &&
                                              salleNameForKey
                                                ? `${salleOwnerClassName}::${salleNameForKey}`
                                                : undefined;
                                            const isCompatible =
                                              !!classNameForKey &&
                                              compatibilityInfo.commonClasses.includes(
                                                classNameForKey
                                              ) &&
                                              !!salleKey &&
                                              compatibilityInfo.commonSalles.includes(
                                                salleKey
                                              );

                                            return (
                                              <div
                                                key={seq.id}
                                                className={`p-2 rounded border flex items-center gap-2 ${
                                                  isCompatible
                                                    ? isDarkMode
                                                      ? "bg-green-900/20 border-green-700"
                                                      : "bg-green-50 border-green-200"
                                                    : isDarkMode
                                                    ? "bg-yellow-900/20 border-yellow-700"
                                                    : "bg-yellow-50 border-yellow-200"
                                                }`}
                                              >
                                                <div className="flex items-center gap-1 flex-wrap">
                                                  <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                      isDarkMode
                                                        ? "bg-blue-900 text-blue-200"
                                                        : "bg-blue-100 text-blue-800"
                                                    }`}
                                                  >
                                                    {classeLabel}
                                                  </span>
                                                  <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                      isDarkMode
                                                        ? "bg-purple-900 text-purple-200"
                                                        : "bg-purple-100 text-purple-800"
                                                    }`}
                                                  >
                                                    {salleLabel}
                                                  </span>
                                                  <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                      isDarkMode
                                                        ? "bg-green-900 text-green-200"
                                                        : "bg-green-100 text-green-800"
                                                    }`}
                                                  >
                                                    {matiereLabel}
                                                  </span>
                                                </div>
                                                {isCompatible && (
                                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                )}
                                                {!isCompatible && (
                                                  <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Informations supplémentaires */}
                                    {prof.diplomes && (
                                      <div className="ml-13 mt-2">
                                        <span
                                          className={`text-xs ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          🎓 {prof.diplomes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Résumé et boutons d'action */}
                <div
                  className={`border-t pt-6 ${
                    isDarkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <strong>
                        {getFilteredPreviousYearProfesseurs().length}
                      </strong>{" "}
                      professeur(s) sélectionné(s) pour la synchronisation
                      {getFilteredPreviousYearProfesseurs().length > 0 && (
                        <>
                          <br />
                          <span className="text-green-600">
                            {
                              getFilteredPreviousYearProfesseurs().filter(
                                (prof) =>
                                  getProfCompatibilityStatus(prof).isCompatible
                              ).length
                            }{" "}
                            compatible(s)
                          </span>
                          {" • "}
                          <span className="text-yellow-600">
                            {
                              getFilteredPreviousYearProfesseurs().filter(
                                (prof) =>
                                  !getProfCompatibilityStatus(prof).isCompatible
                              ).length
                            }{" "}
                            nécessitent une vérification
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setShowSyncModal(false);
                        setSyncFilterClasse("");
                        setSyncFilterSalle("");
                        setPreviousYearProfesseurs([]);
                        setCompatibilityInfo({
                          hasCommonClasses: false,
                          hasCommonSalles: false,
                          commonClasses: [],
                          commonSalles: [],
                          sameClassesCount: false,
                          sameSallesCount: false,
                        });
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        setShowSyncModal(false);
                        setSyncFilterClasse("");
                        setSyncFilterSalle("");
                        setPreviousYearProfesseurs([]);
                        setCompatibilityInfo({
                          hasCommonClasses: false,
                          hasCommonSalles: false,
                          commonClasses: [],
                          commonSalles: [],
                          sameClassesCount: false,
                          sameSallesCount: false,
                        });
                      }}
                      disabled={isSyncing}
                      className={`px-6 py-2 rounded-lg ${buttonSecondaryClasses}`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSyncAccept}
                      disabled={
                        isSyncing ||
                        getFilteredPreviousYearProfesseurs().length === 0
                      }
                      className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                        isSyncing ||
                        getFilteredPreviousYearProfesseurs().length === 0
                          ? "bg-gray-400 cursor-not-allowed text-gray-200"
                          : buttonPrimaryClasses
                      }`}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      {isSyncing
                        ? "Synchronisation en cours..."
                        : `Synchroniser ${
                            getFilteredPreviousYearProfesseurs().length
                          } professeur(s)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionProfesseurs;
