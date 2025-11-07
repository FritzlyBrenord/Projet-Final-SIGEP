import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Book,
  Clock,
  Users,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  ArrowLeft,
  Check,
  Copy,
  Loader,
} from "lucide-react";

import {
  useAnneeScolaire,
  Subject,
  ScheduleItem,
  Salle,
  Classe,
  SchoolYear,
  Sequence,
  Professeur,
} from "@/Context/ContextAnneeScolaire";
import { useProfesseur } from "@/Context/ContextProfesseur";
import { useEmployer } from "@/Context/ContextEmployer";
import { notify } from "@/components/Notification";
import { InsertData, SelectData } from "@/Config/SupabaseData";
import Spinner from "@/utils/Spinner/Spinner";

interface ConfigurationAnneeProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  mode: "create" | "edit";
  existingYears: string[];
  availableYears: SchoolYear[];
  schoolYear?: SchoolYear | null;
  onSave: (schoolYear: SchoolYear) => void;
}

// Interface pour la sélection des données à copier
interface CopySelection {
  classes: boolean;
  salles: boolean;
  matieres: boolean;
  emploisDuTemps: boolean;
  employes: boolean;
  professeurs: boolean;
}

// Interface pour le suivi de la progression
interface CopyProgress {
  isInProgress: boolean;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  currentStepIndex: number;
}

const ConfigurationAnnee: React.FC<ConfigurationAnneeProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  mode,
  existingYears,
  availableYears,
  schoolYear,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localSchoolYear, setLocalSchoolYear] = useState<SchoolYear>({
    id: "",
    year: "",
    description:
      "Année académique pour l'enseignement fondamental et secondaire à l'Institution Mixte Faustin Première",
    created: false,
    classes: [],
    configurationSaved: false,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState("");

  const {
    schoolYears,
    createSchoolYear,
    updateSchoolYear,
    loadSchoolYears,
    createClasse,
    createSalle,
    createMatiere,
    loadClasses,
    loadSalles,
    loadMatieres,
    createEmploiDuTemps,
    deleteSalle,
    deleteClasse,
    deleteMatiere,
  } = useAnneeScolaire();

  const { copierProfesseursVersNouvelleAnnee } = useProfesseur();
  const { employes } = useEmployer();

  const availableClasses = [
    "1ère Année Fondamentale",
    "2e Année Fondamentale",
    "3e Année Fondamentale",
    "4e Année Fondamentale",
    "5e Année Fondamentale",
    "6e Année Fondamentale",
    "7e Année Fondamentale",
    "8e Année Fondamentale",
    "9e Année Fondamentale",
    "NSI",
    "NSII",
    "NSIII",
    "NSIV",
  ];

  const [yearError, setYearError] = useState("");
  const [useTemplate, setUseTemplate] = useState<"empty" | "copy">("empty");
  const [selectedTemplateYear, setSelectedTemplateYear] = useState("");

  // États pour la sélection des données à copier
  const [copySelection, setCopySelection] = useState<CopySelection>({
    classes: true,
    salles: true,
    matieres: true,
    emploisDuTemps: true,
    employes: true,
    professeurs: true,
  });

  // État pour la progression de la copie
  const [copyProgress, setCopyProgress] = useState<CopyProgress>({
    isInProgress: false,
    currentStep: "",
    completedSteps: [],
    totalSteps: 0,
    currentStepIndex: 0,
  });

  // Initialiser avec les données de l'année à éditer
  useEffect(() => {
    if (mode === "edit" && schoolYear) {
      setLocalSchoolYear(schoolYear);
      setCurrentStep(schoolYear.configurationSaved ? 2 : 1);
    } else {
      setLocalSchoolYear({
        id: "",
        year: "",
        description:
          "Année académique pour l'enseignement fondamental et secondaire à l'Institution Mixte Faustin Première",
        created: false,
        classes: [],
        configurationSaved: false,
      });
      setCurrentStep(1);
    }
  }, [mode, schoolYear, isOpen]);

  // Validation stricte de l'année scolaire
  const validateYear = (year: string): boolean => {
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(year)) {
      setYearError("Format invalide. Utilisez YYYY-YYYY (ex: 2024-2025)");
      return false;
    }

    const [startYear, endYear] = year.split("-").map(Number);
    if (endYear !== startYear + 1) {
      setYearError(
        `L'année suivante doit être ${startYear + 1}, pas ${endYear}`
      );
      return false;
    }

    if (mode === "create" && existingYears.includes(year)) {
      setYearError("Cette année existe déjà");
      return false;
    }

    if (
      mode === "edit" &&
      schoolYear &&
      year !== schoolYear.year &&
      existingYears.includes(year)
    ) {
      setYearError("Cette année existe déjà");
      return false;
    }

    setYearError("");
    return true;
  };

  // Deep clone pour copier configuration
  const deepClone = (obj: any): any => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => deepClone(item));

    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  };

  // Vérifier si assez d'années pour activer la copie
  const canUseCopyMode = availableYears.length >= 2;

  // Vérifier les dépendances pour copier les professeurs
  const canCopyProfesseurs =
    copySelection.classes && copySelection.salles && copySelection.matieres;

  // Handler pour les checkboxes de sélection
  const handleCopySelectionChange = (key: keyof CopySelection) => {
    setCopySelection((prev) => {
      const newSelection = { ...prev, [key]: !prev[key] };

      // Si on décoche classes/salles/matières, décocher automatiquement professeurs
      if (
        (key === "classes" || key === "salles" || key === "matieres") &&
        !newSelection[key]
      ) {
        newSelection.professeurs = false;
      }

      return newSelection;
    });
  };

  // Fonction pour copier les données avec animation
  // Fonction pour copier les données avec animation
  const copyDataWithProgress = async (
    sourceYearId: string,
    destinationYearId: string
  ) => {
    const steps: string[] = [];

    if (copySelection.classes) steps.push("Classes");
    if (copySelection.salles) steps.push("Salles");
    if (copySelection.matieres) steps.push("Matières");
    if (copySelection.emploisDuTemps) steps.push("Emplois du temps");
    if (copySelection.employes) steps.push("Employés");
    if (copySelection.professeurs) steps.push("Professeurs");

    setCopyProgress({
      isInProgress: true,
      currentStep: "",
      completedSteps: [],
      totalSteps: steps.length,
      currentStepIndex: 0,
    });

    try {
      const sourceYear = availableYears.find((y) => y.year === sourceYearId);
      if (!sourceYear) throw new Error("Année source introuvable");

      let currentIndex = 0;

      // Copier les classes
      if (copySelection.classes) {
        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des classes...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (const classe of sourceYear.classes) {
          await createClasse({
            nom: classe.name,
            niveau: classe.name,
            capacite_max: classe.salles.reduce(
              (acc, s) => acc + (s.maxStudents || 0),
              0
            ),
            annee_scolaire_id: destinationYearId,
          });
        }

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Classes"],
        }));
        currentIndex++;
      }

      // ✅ ATTENDRE que les classes soient bien insérées et récupérer leurs IDs
      const classesDB = await loadClasses(destinationYearId);
      const classeNameToId: Record<string, string> = {};
      classesDB.forEach((c) => (classeNameToId[c.name] = c.id));

      console.log("✅ Classes créées:", Object.keys(classeNameToId));

      // Copier les salles
      if (copySelection.salles && copySelection.classes) {
        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des salles...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (const classe of sourceYear.classes) {
          const classeId = classeNameToId[classe.name];
          if (classeId) {
            for (const salle of classe.salles) {
              await createSalle({
                nom: salle.name,
                capacite: salle.maxStudents,
                type: undefined,
                classe_id: classeId,
              });
            }
          }
        }

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Salles"],
        }));
        currentIndex++;
      }

      // ✅ ATTENDRE que les salles soient bien insérées et récupérer leurs IDs
      const salleNameToIdByClasse: Record<string, Record<string, string>> = {};
      for (const [classeName, classeId] of Object.entries(classeNameToId)) {
        const sallesDB = await loadSalles(classeId);
        salleNameToIdByClasse[classeName] = {};
        sallesDB.forEach(
          (s) => (salleNameToIdByClasse[classeName][s.name] = s.id)
        );
      }

      console.log("✅ Salles créées:", salleNameToIdByClasse);

      // Copier les matières
      if (
        copySelection.matieres &&
        copySelection.classes &&
        copySelection.salles
      ) {
        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des matières...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (const classe of sourceYear.classes) {
          const mapSalle = salleNameToIdByClasse[classe.name] || {};
          for (const salle of classe.salles) {
            const salleId = mapSalle[salle.name];
            if (salleId) {
              for (const matiere of salle.subjects) {
                await createMatiere({
                  nom: matiere.name,
                  code: undefined,
                  coefficient: matiere.coefficient,
                  description: undefined,
                  salle_id: salleId,
                });
              }
            }
          }
        }

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Matières"],
        }));
        currentIndex++;
      }

      // ✅ ATTENDRE que les matières soient bien insérées et récupérer leurs IDs
      const matiereNameToIdBySalle: Record<string, Record<string, string>> = {};
      for (const [classeName, salleMap] of Object.entries(
        salleNameToIdByClasse
      )) {
        for (const [salleName, salleId] of Object.entries(salleMap)) {
          const matieresDB = await loadMatieres(salleId);
          matiereNameToIdBySalle[salleId] = {};
          matieresDB.forEach(
            (m) => (matiereNameToIdBySalle[salleId][m.name] = m.id)
          );
        }
      }

      console.log("✅ Matières créées:", matiereNameToIdBySalle);

      // Copier les emplois du temps
      if (copySelection.emploisDuTemps && copySelection.matieres) {
        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des emplois du temps...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (const classe of sourceYear.classes) {
          const mapSalle = salleNameToIdByClasse[classe.name] || {};
          for (const salle of classe.salles) {
            const salleId = mapSalle[salle.name];
            if (salleId) {
              const matiereMap = matiereNameToIdBySalle[salleId] || {};
              for (const schedule of salle.schedule) {
                const matiereId = matiereMap[schedule.subject];
                if (matiereId) {
                  await createEmploiDuTemps({
                    jour: schedule.day as any,
                    heure_debut: schedule.startTime,
                    heure_fin: schedule.endTime,
                    matiere_id: matiereId,
                    salle_id: salleId,
                    professeur: schedule.teacherName || "",
                  });
                }
              }
            }
          }
        }

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Emplois du temps"],
        }));
        currentIndex++;
      }

      // Copier les employés
      if (copySelection.employes) {
        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des employés...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const employesSource = employes.filter(
          (emp) => emp.annee_scolaire_id === sourceYear.id && !emp.deleted
        );

        for (const emp of employesSource) {
          try {
            // Générer un nouveau code si nécessaire
            const employesData = await SelectData("employes");
            let nouveauCode = emp.code;
            let compteur = 1;
            while (employesData?.some((e: any) => e.code === nouveauCode)) {
              nouveauCode = `${emp.code}_${compteur}`;
              compteur++;
            }

            await InsertData("employes", {
              code: nouveauCode,
              nom: emp.nom,
              prenom: emp.prenom,
              email: emp.email,
              telephone: emp.telephone,
              adresse: emp.adresse,
              date_embauche: emp.date_embauche,
              nif_cin: emp.nif_cin,
              diplomes: emp.diplomes,
              responsabilites: emp.responsabilites,
              fonction: emp.fonction,
              departement: emp.departement,
              statut: emp.statut,
              annee_scolaire_id: destinationYearId,
              deleted: false,
            });
          } catch (error) {
            console.error("Erreur copie employé:", error);
          }
        }

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Employés"],
        }));
        currentIndex++;
      }

      // ✅ VÉRIFICATION FINALE avant de copier les professeurs
      if (copySelection.professeurs && canCopyProfesseurs) {
        // ✅ Vérifier que toutes les ressources sont bien créées
        const classesExist = classesDB.length > 0;
        const sallesExist = Object.keys(salleNameToIdByClasse).length > 0;
        const matieresExist = Object.keys(matiereNameToIdBySalle).length > 0;

        console.log("🔍 Vérification finale des ressources:");
        console.log("- Classes:", classesExist, classesDB.length);
        console.log(
          "- Salles:",
          sallesExist,
          Object.keys(salleNameToIdByClasse).length
        );
        console.log(
          "- Matières:",
          matieresExist,
          Object.keys(matiereNameToIdBySalle).length
        );

        if (!classesExist || !sallesExist || !matieresExist) {
          throw new Error(
            "Ressources manquantes pour copier les professeurs. " +
              "Vérifiez que les classes, salles et matières ont bien été créées."
          );
        }

        setCopyProgress((prev) => ({
          ...prev,
          currentStep: "Copie des professeurs...",
          currentStepIndex: currentIndex + 1,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // ✅ Maintenant on peut copier les professeurs en toute sécurité
        console.log("🚀 Lancement de la copie des professeurs...");
        await copierProfesseursVersNouvelleAnnee(
          sourceYear.id,
          destinationYearId
        );

        setCopyProgress((prev) => ({
          ...prev,
          completedSteps: [...prev.completedSteps, "Professeurs"],
        }));
        currentIndex++;
      }

      // Terminer
      setCopyProgress((prev) => ({
        ...prev,
        currentStep: "Copie terminée !",
        isInProgress: false,
      }));

      await new Promise((resolve) => setTimeout(resolve, 1000));

      notify("success", "Données copiées avec succès !");
    } catch (error) {
      console.error("❌ Erreur lors de la copie:", error);
      notify(
        "error",
        error instanceof Error
          ? error.message
          : "Erreur lors de la copie des données"
      );
      setCopyProgress((prev) => ({ ...prev, isInProgress: false }));
    }
  };

  // Création de l'année scolaire
  // Création de l'année scolaire
  // Création de l'année scolaire
  const handleCreateYear = async () => {
    if (!validateYear(localSchoolYear.year)) {
      return;
    }

    setIsCreating(true);
    try {
      let createdYearId: string | null = null;

      if (mode === "create") {
        // ✅ Récupérer directement l'ID
        createdYearId = await createSchoolYear({
          year: localSchoolYear.year,
          description: localSchoolYear.description,
          created: true,
          classes: [],
          configurationSaved: false,
        });

        if (!createdYearId) {
          setIsCreating(false);
          return;
        }
      } else if (mode === "edit" && schoolYear?.id) {
        const success = await updateSchoolYear(schoolYear.id, {
          year: localSchoolYear.year,
          description: localSchoolYear.description,
        });

        if (!success) {
          setIsCreating(false);
          return;
        }

        createdYearId = schoolYear.id;
      } else {
        notify("error", "Mode invalide");
        setIsCreating(false);
        return;
      }

      // Si mode copie, lancer la copie des données
      if (
        mode === "create" &&
        useTemplate === "copy" &&
        selectedTemplateYear &&
        createdYearId
      ) {
        await copyDataWithProgress(selectedTemplateYear, createdYearId);
      }

      // ✅ Recharger complètement les données depuis la base
      await loadSchoolYears();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ✅ Récupérer l'année complète avec toutes ses données
      const freshSchoolYears = await SelectData("annees_scolaires");
      const createdAnneeDB = freshSchoolYears?.find(
        (a: any) => a.id === createdYearId
      );

      if (createdAnneeDB) {
        // ✅ Charger les classes de cette année
        const classesDB = await loadClasses(createdYearId);
        const classes: Classe[] = [];

        for (const classeDB of classesDB) {
          // Charger les salles de chaque classe
          const sallesDB = await loadSalles(classeDB.id);
          const salles: Salle[] = sallesDB.map((salleDB) => ({
            id: salleDB.id,
            name: salleDB.name,
            maxStudents: salleDB.maxStudents || 30,
            subjects: [], // Sera chargé si nécessaire
            schedule: [], // Sera chargé si nécessaire
          }));

          classes.push({
            id: classeDB.id,
            name: classeDB.name,
            salles,
          });
        }

        // ✅ Mettre à jour localSchoolYear avec toutes les données
        setLocalSchoolYear({
          id: createdYearId,
          year: localSchoolYear.year,
          description: localSchoolYear.description,
          created: true, // ✅ IMPORTANT
          classes,
          configurationSaved: classes.length > 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log("✅ Année chargée avec:", classes.length, "classes");
      }

      // ✅ Passer à l'étape 2
      setCurrentStep(2);
      notify("success", "Année scolaire créée avec succès !");
    } catch (error) {
      console.error("Erreur:", error);
      notify(
        "error",
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de l'année"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Vérification si le nom de salle existe déjà
  const salleExists = (classeId: string, salleName: string): boolean => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    return classe
      ? classe.salles.some(
          (s) => s.name.toLowerCase() === salleName.toLowerCase()
        )
      : false;
  };

  // Ajout d'une classe
  const handleAddClasse = () => {
    if (!selectedClasse) return;

    const newClasse: Classe = {
      id: `classe_${Date.now()}`,
      name: selectedClasse,
      salles: [],
    };

    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: [...prev.classes, newClasse],
    }));

    setSelectedClasse("");
    notify("success", `Classe ${selectedClasse} ajoutée avec succès !`);
  };

  // Suppression d'une classe
  const handleRemoveClasse = async (classeId: string) => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    if (!classe) return;

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer la classe "${classe.name}" et toutes ses salles ?`
      )
    ) {
      return;
    }

    try {
      const deleteSalleTasks = classe.salles.map((salle) =>
        deleteSalle(salle.id)
      );
      await Promise.all(deleteSalleTasks);

      const success = await deleteClasse(classeId);

      if (success) {
        setLocalSchoolYear((prev) => ({
          ...prev,
          classes: prev.classes.filter((c) => c.id !== classeId),
        }));
        notify("success", "Classe supprimée avec succès !");
      } else {
        notify("error", "Erreur lors de la suppression de la classe");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      notify("error", "Erreur lors de la suppression de la classe");
    }
  };

  // Ajout d'une salle à une classe
  const handleAddSalle = (
    classeId: string,
    salleName: string,
    maxStudents: number
  ) => {
    if (salleExists(classeId, salleName)) {
      notify(
        "error",
        `La salle "${salleName}" existe déjà dans cette classe !`
      );
      return;
    }

    const newSalle: Salle = {
      id: `salle_${Date.now()}`,
      name: salleName,
      maxStudents,
      subjects: [],
      schedule: [],
    };

    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: prev.classes.map((classe) =>
        classe.id === classeId
          ? { ...classe, salles: [...classe.salles, newSalle] }
          : classe
      ),
    }));

    notify("success", `Salle ${salleName} ajoutée avec succès !`);
  };

  // Suppression d'une salle
  const handleRemoveSalle = async (classeId: string, salleId: string) => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    const salle = classe?.salles.find((s) => s.id === salleId);

    if (!salle) return;

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer la salle "${salle.name}" ?`
      )
    ) {
      return;
    }

    try {
      const success = await deleteSalle(salleId);

      if (success) {
        setLocalSchoolYear((prev) => ({
          ...prev,
          classes: prev.classes.map((classe) =>
            classe.id === classeId
              ? {
                  ...classe,
                  salles: classe.salles.filter((s) => s.id !== salleId),
                }
              : classe
          ),
        }));
        notify("success", "Salle supprimée avec succès !");
      } else {
        notify("error", "Erreur lors de la suppression de la salle");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      notify("error", "Erreur lors de la suppression de la salle");
    }
  };

  // Enregistrement de la configuration
  const handleSaveConfiguration = async () => {
    if (localSchoolYear.classes.length === 0) {
      notify(
        "error",
        "Veuillez ajouter au moins une classe avant d'enregistrer !"
      );
      return;
    }

    const hasEmptyClasses = localSchoolYear.classes.some(
      (classe) => classe.salles.length === 0
    );
    if (hasEmptyClasses) {
      notify(
        "error",
        "Certaines classes n'ont pas de salles. Veuillez les configurer !"
      );
      return;
    }

    setIsSavingConfig(true);
    try {
      const annee = schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!annee) {
        await loadSchoolYears();
      }
      const anneeRef =
        annee || schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!anneeRef) {
        notify("error", "Année introuvable côté serveur");
        return;
      }

      // Créer les classes
      const createClassePromises = localSchoolYear.classes.map((classe) =>
        createClasse({
          nom: classe.name,
          niveau: classe.name,
          capacite_max: Math.max(
            0,
            classe.salles.reduce((acc, s) => acc + (s.maxStudents || 0), 0)
          ),
          annee_scolaire_id: anneeRef.id,
        })
      );
      await Promise.all(createClassePromises);

      // Recharger pour obtenir IDs des classes
      const classesDB = await loadClasses(anneeRef.id);
      const classeNameToId: Record<string, string> = {};
      classesDB.forEach((c) => (classeNameToId[c.name] = c.id));

      // Créer les salles
      const createSalleTasks: Promise<boolean>[] = [];
      localSchoolYear.classes.forEach((classe) => {
        const classeId = classeNameToId[classe.name];
        if (!classeId) return;
        classe.salles.forEach((salle) => {
          createSalleTasks.push(
            createSalle({
              nom: salle.name,
              capacite: salle.maxStudents,
              type: undefined,
              classe_id: classeId,
            })
          );
        });
      });
      await Promise.all(createSalleTasks);

      setLocalSchoolYear((prev) => ({ ...prev, configurationSaved: true }));
      notify("success", "Configuration des classes et salles enregistrée !");
    } catch (e) {
      notify("error", "Erreur lors de l'enregistrement de la configuration");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Navigation
  const handleGoBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Sauvegarder et fermer
  const handleFinalSave = () => {
    const finalSchoolYear = {
      ...localSchoolYear,
      updatedAt: new Date().toISOString(),
    };
    onSave(finalSchoolYear);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50">
      <div
        className={`w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl flex flex-col ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            {currentStep > 1 && (
              <button
                onClick={handleGoBack}
                className={`p-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {mode === "create"
                  ? "Créer une Nouvelle Année Académique"
                  : `Modifier l'Année ${schoolYear?.year}`}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Étape {currentStep} sur 2
                </div>
                <div
                  className={`w-64 rounded-full h-2 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 2) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Étape 1: Création de l'année scolaire */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Étape 1: Créer l'Année Scolaire
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Année Scolaire <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="2024-2025"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900"
                    } ${yearError ? "border-red-500" : ""}`}
                    value={localSchoolYear.year}
                    onChange={(e) => {
                      setLocalSchoolYear((prev) => ({
                        ...prev,
                        year: e.target.value,
                      }));
                      if (yearError) validateYear(e.target.value);
                    }}
                    onBlur={() => validateYear(localSchoolYear.year)}
                  />
                  {yearError && (
                    <p className="text-red-500 text-sm mt-1">{yearError}</p>
                  )}
                  <p
                    className={`text-sm mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Format: YYYY-YYYY (ex: 2024-2025). L'année suivante doit
                    être +1.
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900"
                    }`}
                    value={localSchoolYear.description}
                    onChange={(e) =>
                      setLocalSchoolYear((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Options de création (uniquement en mode création) */}
                {mode === "create" && canUseCopyMode && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Configuration
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="template"
                          value="empty"
                          checked={useTemplate === "empty"}
                          onChange={(e) =>
                            setUseTemplate(e.target.value as "empty" | "copy")
                          }
                          className="text-blue-600"
                        />
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-900"
                          }
                        >
                          Année vide (configuration depuis zéro)
                        </span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="template"
                          value="copy"
                          checked={useTemplate === "copy"}
                          onChange={(e) =>
                            setUseTemplate(e.target.value as "empty" | "copy")
                          }
                          className="text-blue-600"
                        />
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-900"
                          }
                        >
                          Copier la configuration d'une année existante
                        </span>
                      </label>

                      {useTemplate === "copy" && (
                        <div className="ml-6 space-y-4">
                          <select
                            value={selectedTemplateYear}
                            onChange={(e) =>
                              setSelectedTemplateYear(e.target.value)
                            }
                            className={`w-full p-2 border rounded-lg transition-colors ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="">
                              Sélectionner une année à copier
                            </option>
                            {availableYears.map((availableYear) => (
                              <option
                                key={availableYear.id}
                                value={availableYear.year}
                              >
                                {availableYear.year} -{" "}
                                {availableYear.classes.length} classe(s),{" "}
                                {availableYear.classes.reduce(
                                  (acc, c) => acc + c.salles.length,
                                  0
                                )}{" "}
                                salle(s)
                              </option>
                            ))}
                          </select>

                          {selectedTemplateYear && (
                            <div
                              className={`p-4 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <h4
                                className={`font-medium mb-3 ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                Sélectionner les données à copier :
                              </h4>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.classes}
                                    onChange={() =>
                                      handleCopySelectionChange("classes")
                                    }
                                    className="rounded"
                                  />
                                  <span
                                    className={
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }
                                  >
                                    Classes
                                  </span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.salles}
                                    onChange={() =>
                                      handleCopySelectionChange("salles")
                                    }
                                    disabled={!copySelection.classes}
                                    className="rounded disabled:opacity-50"
                                  />
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    } ${
                                      !copySelection.classes ? "opacity-50" : ""
                                    }`}
                                  >
                                    Salles
                                    {!copySelection.classes && (
                                      <span className="text-xs ml-2 text-orange-500">
                                        (nécessite Classes)
                                      </span>
                                    )}
                                  </span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.matieres}
                                    onChange={() =>
                                      handleCopySelectionChange("matieres")
                                    }
                                    disabled={
                                      !copySelection.classes ||
                                      !copySelection.salles
                                    }
                                    className="rounded disabled:opacity-50"
                                  />
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    } ${
                                      !copySelection.classes ||
                                      !copySelection.salles
                                        ? "opacity-50"
                                        : ""
                                    }`}
                                  >
                                    Matières
                                    {(!copySelection.classes ||
                                      !copySelection.salles) && (
                                      <span className="text-xs ml-2 text-orange-500">
                                        (nécessite Classes et Salles)
                                      </span>
                                    )}
                                  </span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.emploisDuTemps}
                                    onChange={() =>
                                      handleCopySelectionChange(
                                        "emploisDuTemps"
                                      )
                                    }
                                    disabled={!copySelection.matieres}
                                    className="rounded disabled:opacity-50"
                                  />
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    } ${
                                      !copySelection.matieres
                                        ? "opacity-50"
                                        : ""
                                    }`}
                                  >
                                    Emplois du temps
                                    {!copySelection.matieres && (
                                      <span className="text-xs ml-2 text-orange-500">
                                        (nécessite Matières)
                                      </span>
                                    )}
                                  </span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.employes}
                                    onChange={() =>
                                      handleCopySelectionChange("employes")
                                    }
                                    className="rounded"
                                  />
                                  <span
                                    className={
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }
                                  >
                                    Employés
                                  </span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={copySelection.professeurs}
                                    onChange={() =>
                                      handleCopySelectionChange("professeurs")
                                    }
                                    disabled={!canCopyProfesseurs}
                                    className="rounded disabled:opacity-50"
                                  />
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    } ${
                                      !canCopyProfesseurs ? "opacity-50" : ""
                                    }`}
                                  >
                                    Professeurs
                                    {!canCopyProfesseurs && (
                                      <span className="text-xs ml-2 text-orange-500">
                                        (nécessite Classes, Salles et Matières)
                                      </span>
                                    )}
                                  </span>
                                </label>
                              </div>

                              <div
                                className={`mt-3 p-3 rounded ${
                                  isDarkMode ? "bg-blue-900/20" : "bg-blue-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Copy size={16} className="text-blue-600" />
                                  <span
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-blue-300"
                                        : "text-blue-700"
                                    }`}
                                  >
                                    Les données sélectionnées seront copiées
                                    automatiquement
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Message si pas assez d'années pour copier */}
                {mode === "create" && !canUseCopyMode && (
                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-orange-900/20 border-orange-800"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={20} className="text-orange-600" />
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-orange-300" : "text-orange-700"
                        }`}
                      >
                        La copie d'année nécessite au moins 2 années scolaires
                        existantes.
                      </span>
                    </div>
                  </div>
                )}

                {localSchoolYear.year && !yearError && (
                  <div
                    className={`border rounded-lg p-4 ${
                      isDarkMode
                        ? "bg-blue-900/20 border-blue-800"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-blue-300" : "text-blue-900"
                      }`}
                    >
                      Année Académique {localSchoolYear.year}
                    </h3>
                    <p
                      className={`mt-1 ${
                        isDarkMode ? "text-blue-200" : "text-blue-700"
                      }`}
                    >
                      {localSchoolYear.description}
                    </p>
                  </div>
                )}

                {/* Animation de progression */}
                {copyProgress.isInProgress && (
                  <div
                    className={`border rounded-lg p-6 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Loader
                        className="animate-spin text-blue-600"
                        size={24}
                      />
                      <h4
                        className={`text-lg font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Copie en cours...
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {copyProgress.currentStep}
                      </div>

                      <div
                        className={`w-full rounded-full h-3 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (copyProgress.currentStepIndex /
                                copyProgress.totalSteps) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>

                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Étape {copyProgress.currentStepIndex} sur{" "}
                        {copyProgress.totalSteps}
                      </div>

                      {copyProgress.completedSteps.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {copyProgress.completedSteps.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle
                                size={16}
                                className="text-green-600"
                              />
                              <span
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {step} copié{step.endsWith("s") ? "s" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateYear}
                  disabled={
                    !localSchoolYear.year ||
                    !!yearError ||
                    isCreating ||
                    copyProgress.isInProgress ||
                    (mode === "create" &&
                      useTemplate === "copy" &&
                      !selectedTemplateYear)
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isCreating || copyProgress.isInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {copyProgress.isInProgress
                        ? "Copie en cours..."
                        : "Création en cours..."}
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      {mode === "create"
                        ? "Créer l'Année Scolaire"
                        : "Continuer"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Gestion des classes et salles */}
          {/* Étape 2: Gestion des classes et salles */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2
                className={`text-2xl font-bold mb-6 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Étape 2: Gestion des Classes et Salles
              </h2>

              {/* Message d'information si des classes ont été copiées */}
              {localSchoolYear.classes.length > 0 && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "bg-green-900/20 border-green-800"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      {localSchoolYear.classes.length} classe(s) et{" "}
                      {localSchoolYear.classes.reduce(
                        (acc, c) => acc + c.salles.length,
                        0
                      )}{" "}
                      salle(s) chargée(s)
                    </span>
                  </div>
                </div>
              )}

              {/* Ajout de classe */}
              <div
                className={`border rounded-lg p-4 mb-6 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Ajouter une Classe
                </h3>
                <div className="flex gap-4">
                  <select
                    value={selectedClasse}
                    onChange={(e) => setSelectedClasse(e.target.value)}
                    className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Sélectionner une classe</option>
                    {availableClasses
                      .filter(
                        (classe) =>
                          !localSchoolYear.classes.some(
                            (c) => c.name === classe
                          )
                      )
                      .map((classe) => (
                        <option key={classe} value={classe}>
                          {classe}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddClasse}
                    disabled={!selectedClasse}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Liste des classes et salles */}
              {localSchoolYear.classes.length > 0 ? (
                <div className="space-y-6">
                  {localSchoolYear.classes.map((classe) => (
                    <ClasseSection
                      key={classe.id}
                      classe={classe}
                      onAddSalle={handleAddSalle}
                      onRemoveClasse={handleRemoveClasse}
                      onRemoveSalle={handleRemoveSalle}
                      isDarkMode={isDarkMode}
                      salleExists={salleExists}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`p-6 rounded-lg border-2 border-dashed text-center ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700/30"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <GraduationCap
                    size={48}
                    className={`mx-auto mb-3 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Aucune classe configurée
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Commencez par ajouter des classes ci-dessus
                  </p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-4 mt-6">
                {localSchoolYear.classes.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        handleSaveConfiguration();
                        notify("success", "Configuration enregistrée !");
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                      disabled={isSavingConfig}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {isSavingConfig ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Sauvegarder...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Sauvegarder et Quitter
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Bouton Quitter (toujours visible) */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant ClasseSection simplifié
function ClasseSection({
  classe,
  onAddSalle,
  onRemoveClasse,
  onRemoveSalle,
  isDarkMode,
  salleExists,
}: {
  classe: Classe;
  onAddSalle: (
    classeId: string,
    salleName: string,
    maxStudents: number
  ) => void;
  onRemoveClasse: (classeId: string) => void;
  onRemoveSalle: (classeId: string, salleId: string) => void;
  isDarkMode: boolean;
  salleExists: (classeId: string, salleName: string) => boolean;
}) {
  const [showAddSalle, setShowAddSalle] = useState(false);
  const [newSalle, setNewSalle] = useState({ name: "", maxStudents: 30 });
  const [salleError, setSalleError] = useState("");
  const [expandedClasse, setExpandedClasse] = useState(false);

  const handleAddSalle = () => {
    if (!newSalle.name.trim()) {
      setSalleError("Le nom de la salle est requis");
      return;
    }

    if (salleExists(classe.id, newSalle.name.trim())) {
      setSalleError(`La salle "${newSalle.name}" existe déjà`);
      return;
    }

    if (newSalle.maxStudents > 0) {
      onAddSalle(classe.id, newSalle.name.trim(), newSalle.maxStudents);
      setNewSalle({ name: "", maxStudents: 30 });
      setShowAddSalle(false);
      setSalleError("");
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setExpandedClasse(!expandedClasse)}
          className="flex items-center gap-2"
        >
          {expandedClasse ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
          <GraduationCap className="text-blue-500" size={20} />
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {classe.name}
          </h3>
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {classe.salles.length} salle{classe.salles.length !== 1 ? "s" : ""}
          </span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSalle(!showAddSalle)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Ajouter une salle
          </button>
          <button
            onClick={() => onRemoveClasse(classe.id)}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expandedClasse && (
        <>
          {/* Formulaire d'ajout de salle */}
          {showAddSalle && (
            <div
              className={`border rounded-lg p-4 mb-4 ${
                isDarkMode
                  ? "bg-gray-700/50 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nom de la salle
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Salle A1"
                    className={`w-full p-2 border rounded transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900"
                    } ${salleError ? "border-red-500" : ""}`}
                    value={newSalle.name}
                    onChange={(e) => {
                      setNewSalle((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      setSalleError("");
                    }}
                  />
                  {salleError && (
                    <p className="text-red-500 text-sm mt-1">{salleError}</p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nombre max d'élèves
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full p-2 border rounded transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                    value={newSalle.maxStudents}
                    onChange={(e) =>
                      setNewSalle((prev) => ({
                        ...prev,
                        maxStudents: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddSalle}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowAddSalle(false);
                    setSalleError("");
                  }}
                  className={`px-4 py-2 rounded transition-colors ${
                    isDarkMode
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des salles */}
          <div className="space-y-4">
            {classe.salles.map((salle) => (
              <div
                key={salle.id}
                className={`border rounded-lg p-4 flex justify-between items-center ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700/30"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="text-green-500" size={16} />
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {salle.name}
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      isDarkMode
                        ? "bg-gray-600 text-gray-300"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    Max: {salle.maxStudents} élèves
                  </span>
                </div>
                <button
                  onClick={() => onRemoveSalle(classe.id, salle.id)}
                  className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ConfigurationAnnee;
