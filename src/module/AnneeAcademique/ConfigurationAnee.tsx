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
import {
  generateClassSchedulePrintContent,
  generateSchedulePrintContent,
  generateClassesPrintContent,
} from "./module/PrintUtils";

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

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

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
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
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
  } = useAnneeScolaire();
  const { professeurs } = useProfesseur();

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

  const defaultSubjects: Subject[] = [
    { id: "1", name: "Français", coefficient: 100 },
    { id: "2", name: "Mathématiques", coefficient: 100 },
    { id: "3", name: "Sciences", coefficient: 80 },
    { id: "4", name: "Histoire", coefficient: 60 },
    { id: "5", name: "Géographie", coefficient: 60 },
    { id: "6", name: "Anglais", coefficient: 80 },
    { id: "7", name: "Éducation Physique", coefficient: 40 },
    { id: "8", name: "Arts", coefficient: 40 },
    { id: "9", name: "Musique", coefficient: 40 },
    { id: "10", name: "Informatique", coefficient: 60 },
    { id: "11", name: "Philosophie", coefficient: 80 },
    { id: "12", name: "Physique", coefficient: 80 },
    { id: "13", name: "Chimie", coefficient: 80 },
    { id: "14", name: "Biologie", coefficient: 80 },
    { id: "15", name: "Économie", coefficient: 60 },
  ];
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [yearError, setYearError] = useState("");
  const [useTemplate, setUseTemplate] = useState<"empty" | "copy">("empty");
  const [selectedTemplateYear, setSelectedTemplateYear] = useState("");

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

  // Validation des heures (7h-17h)
  const validateTime = (time: string): boolean => {
    const [hours] = time.split(":").map(Number);
    return hours >= 7 && hours <= 17;
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

  // Validation des conflits d'horaires
  const hasTimeConflict = (
    classeId: string,
    salleId: string,
    day: string,
    startTime: string,
    endTime: string,
    teacherId?: string,
    teacherName?: string
  ): { hasConflict: boolean; conflictMessage: string } => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    if (!classe) return { hasConflict: false, conflictMessage: "" };

    // Convertir les heures en minutes pour la comparaison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    // Vérifier si l'heure de fin est après l'heure de début
    if (newEnd <= newStart) {
      return {
        hasConflict: true,
        conflictMessage: "L'heure de fin doit être après l'heure de début",
      };
    }

    // Conflit même salle (même jour) si chevauchement de temps, ou exact même slot
    const salleCourante = classe.salles.find((s) => s.id === salleId);
    if (salleCourante) {
      for (const item of salleCourante.schedule) {
        if (item.day !== day) continue;
        const existingStart = timeToMinutes(item.startTime);
        const existingEnd = timeToMinutes(item.endTime);
        if (newStart < existingEnd && newEnd > existingStart) {
          return {
            hasConflict: true,
            conflictMessage: `Conflit dans ${salleCourante.name}: ${item.subject} (${item.startTime}-${item.endTime})`,
          };
        }
      }
    }

    // Conflit professeur à travers les salles (même jour + chevauchement)
    if (teacherId || teacherName) {
      for (const salle of classe.salles) {
        for (const scheduleItem of salle.schedule) {
          if (salle.id === salleId && scheduleItem.day === day) {
            // déjà couvert ci-dessus pour la même salle
          }
          if (scheduleItem.day !== day) continue;
          const sameTeacher =
            (teacherId && scheduleItem.teacherId === teacherId) ||
            (!teacherId &&
              teacherName &&
              scheduleItem.teacherName === teacherName);
          if (!sameTeacher) continue;
          const existingStart = timeToMinutes(scheduleItem.startTime);
          const existingEnd = timeToMinutes(scheduleItem.endTime);
          if (newStart < existingEnd && newEnd > existingStart) {
            return {
              hasConflict: true,
              conflictMessage: `Conflit professeur: ${
                scheduleItem.teacherName || "Professeur"
              } est déjà planifié (${scheduleItem.startTime}-${
                scheduleItem.endTime
              }) dans ${salle.name}`,
            };
          }
        }
      }
    }

    return { hasConflict: false, conflictMessage: "" };
  };

  // Création de l'année scolaire
  const handleCreateYear = async () => {
    if (!validateYear(localSchoolYear.year)) {
      return;
    }

    setIsCreating(true);
    try {
      // Création côté serveur de l'année scolaire (sans copie de config pour la DB)
      if (mode === "create") {
        const created = await createSchoolYear({
          year: localSchoolYear.year,
          description: localSchoolYear.description,
          created: true,
          classes: [],
          configurationSaved: false,
        });
        if (!created) {
          setIsCreating(false);
          return;
        }
        await loadSchoolYears();
      } else if (mode === "edit" && schoolYear?.id) {
        await updateSchoolYear(schoolYear.id, {
          year: localSchoolYear.year,
          description: localSchoolYear.description,
        });
        await loadSchoolYears();
      }

      // Préparer l'état local (avec éventuelle copie de template mais IDs locales)
      let updatedSchoolYear = { ...localSchoolYear };
      if (mode === "create" && useTemplate === "copy" && selectedTemplateYear) {
        const templateYear = availableYears.find(
          (y) => y.year === selectedTemplateYear
        );
        if (templateYear) {
          updatedSchoolYear = {
            ...deepClone(templateYear),
            id: updatedSchoolYear.id || "",
            year: localSchoolYear.year,
            description: localSchoolYear.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }

      updatedSchoolYear = {
        ...updatedSchoolYear,
        created: true,
        updatedAt: new Date().toISOString(),
      };

      setLocalSchoolYear(updatedSchoolYear);
      setCurrentStep(2);
      showNotification("success", "Année scolaire créée avec succès !");
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
    showNotification(
      "success",
      `Classe ${selectedClasse} ajoutée avec succès !`
    );
  };

  // Suppression d'une classe
  const handleRemoveClasse = (classeId: string) => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    if (
      classe &&
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la classe "${classe.name}" et toutes ses salles ?`
      )
    ) {
      setLocalSchoolYear((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== classeId),
      }));
      showNotification("success", "Classe supprimée avec succès !");
    }
  };

  // Ajout d'une salle à une classe
  const handleAddSalle = (
    classeId: string,
    salleName: string,
    maxStudents: number
  ) => {
    if (salleExists(classeId, salleName)) {
      showNotification(
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

    showNotification("success", `Salle ${salleName} ajoutée avec succès !`);
  };

  // Suppression d'une salle
  const handleRemoveSalle = (classeId: string, salleId: string) => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    const salle = classe?.salles.find((s) => s.id === salleId);

    if (
      salle &&
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la salle "${salle.name}" ?`
      )
    ) {
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
      showNotification("success", "Salle supprimée avec succès !");
    }
  };

  // Ajout d'une matière à une salle
  const handleAddSubjectToSalle = (
    classeId: string,
    salleId: string,
    subjectName: string,
    coefficient: number
  ) => {
    const professeur = findTeacherForSubject(classeId, salleId, subjectName);

    const newSubject: Subject = {
      id: `subj_${Date.now()}`,
      name: subjectName,
      coefficient,
      teacher: professeur
        ? { id: professeur.id, name: `${professeur.prenom} ${professeur.nom}` }
        : undefined,
    };

    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: prev.classes.map((classe) =>
        classe.id === classeId
          ? {
              ...classe,
              salles: classe.salles.map((salle) =>
                salle.id === salleId
                  ? { ...salle, subjects: [...salle.subjects, newSubject] }
                  : salle
              ),
            }
          : classe
      ),
    }));

    showNotification("success", `Matière ${subjectName} ajoutée avec succès !`);
  };

  // Trouver le professeur pour une matière dans une salle spécifique
  const findTeacherForSubject = (
    classeId: string,
    salleId: string,
    subjectName: string
  ) => {
    const classe = localSchoolYear.classes.find((c) => c.id === classeId);
    const salle = classe?.salles.find((s) => s.id === salleId);

    if (!classe || !salle) return null;

    return professeurs.find((prof) =>
      prof.sequences.some(
        (seq) =>
          seq.classe === classe.name &&
          seq.salle === salle.name &&
          seq.matiere === subjectName
      )
    );
  };

  // Suppression d'une matière d'une salle
  const handleRemoveSubjectFromSalle = (
    classeId: string,
    salleId: string,
    subjectId: string
  ) => {
    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: prev.classes.map((classe) =>
        classe.id === classeId
          ? {
              ...classe,
              salles: classe.salles.map((salle) =>
                salle.id === salleId
                  ? {
                      ...salle,
                      subjects: salle.subjects.filter(
                        (subj) => subj.id !== subjectId
                      ),
                    }
                  : salle
              ),
            }
          : classe
      ),
    }));
  };

  // Modification du coefficient d'une matière
  const handleUpdateSubjectCoefficient = (
    classeId: string,
    salleId: string,
    subjectId: string,
    newCoefficient: number
  ) => {
    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: prev.classes.map((classe) =>
        classe.id === classeId
          ? {
              ...classe,
              salles: classe.salles.map((salle) =>
                salle.id === salleId
                  ? {
                      ...salle,
                      subjects: salle.subjects.map((subj) =>
                        subj.id === subjectId
                          ? { ...subj, coefficient: newCoefficient }
                          : subj
                      ),
                    }
                  : salle
              ),
            }
          : classe
      ),
    }));
  };

  // Enregistrement de la configuration
  const handleSaveConfiguration = async () => {
    if (localSchoolYear.classes.length === 0) {
      showNotification(
        "error",
        "Veuillez ajouter au moins une classe avant d'enregistrer !"
      );
      return;
    }

    const hasEmptyClasses = localSchoolYear.classes.some(
      (classe) => classe.salles.length === 0
    );
    if (hasEmptyClasses) {
      showNotification(
        "error",
        "Certaines classes n'ont pas de salles. Veuillez les configurer !"
      );
      return;
    }
    setIsSavingConfig(true);
    try {
      // Récupérer l'ID de l'année en base
      const annee = schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!annee) {
        await loadSchoolYears();
      }
      const anneeRef =
        annee || schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!anneeRef) {
        showNotification("error", "Année introuvable côté serveur");
        return;
      }

      // 1) Créer/assurer les classes
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

      // 2) Créer/assurer les salles
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

      // Recharger salles et construire maps salle -> id
      const salleNameToIdByClasse: Record<string, Record<string, string>> = {};
      await Promise.all(
        Object.entries(classeNameToId).map(async ([classeName, classeId]) => {
          const sallesDB = await loadSalles(classeId);
          salleNameToIdByClasse[classeName] = {};
          sallesDB.forEach(
            (s) => (salleNameToIdByClasse[classeName][s.name] = s.id)
          );
        })
      );

      // 3) Créer/assurer les matières
      const createMatiereTasks: Promise<boolean>[] = [];
      localSchoolYear.classes.forEach((classe) => {
        const mapSalle = salleNameToIdByClasse[classe.name] || {};
        classe.salles.forEach((salle) => {
          const salleId = mapSalle[salle.name];
          if (!salleId) return;
          salle.subjects.forEach((subj) => {
            createMatiereTasks.push(
              createMatiere({
                nom: subj.name,
                code: undefined,
                coefficient: subj.coefficient,
                description: undefined,
                salle_id: salleId,
              })
            );
          });
        });
      });
      await Promise.all(createMatiereTasks);

      setLocalSchoolYear((prev) => ({ ...prev, configurationSaved: true }));
      showNotification(
        "success",
        "Configuration des classes, salles et matières enregistrée !"
      );
    } catch (e) {
      showNotification(
        "error",
        "Erreur lors de l'enregistrement de la configuration"
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Ajout d'un créneau à l'emploi du temps
  const handleAddScheduleItem = (
    classeId: string,
    salleId: string,
    scheduleItem: Omit<ScheduleItem, "id">
  ) => {
    // Validation des heures
    if (
      !validateTime(scheduleItem.startTime) ||
      !validateTime(scheduleItem.endTime)
    ) {
      showNotification("error", "Les heures doivent être entre 07h00 et 17h00");
      return;
    }

    // Vérification des conflits
    const { hasConflict, conflictMessage } = hasTimeConflict(
      classeId,
      salleId,
      scheduleItem.day,
      scheduleItem.startTime,
      scheduleItem.endTime,
      scheduleItem.teacherId,
      scheduleItem.teacherName
    );

    if (hasConflict) {
      showNotification("error", conflictMessage);
      return;
    }

    const newScheduleItem: ScheduleItem = {
      ...scheduleItem,
      id: `schedule_${Date.now()}`,
    };

    setLocalSchoolYear((prev) => ({
      ...prev,
      classes: prev.classes.map((classe) =>
        classe.id === classeId
          ? {
              ...classe,
              salles: classe.salles.map((salle) =>
                salle.id === salleId
                  ? { ...salle, schedule: [...salle.schedule, newScheduleItem] }
                  : salle
              ),
            }
          : classe
      ),
    }));

    showNotification("success", "Créneau ajouté à l'emploi du temps !");
  };

  // Enregistrement des emplois du temps
  const handleSaveSchedules = async () => {
    setIsSavingSchedules(true);
    try {
      // Récupérer références IDs: année -> classes -> salles -> matières
      const annee = schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!annee) {
        await loadSchoolYears();
      }
      const anneeRef =
        annee || schoolYears.find((y) => y.year === localSchoolYear.year);
      if (!anneeRef) {
        showNotification("error", "Année introuvable côté serveur");
        return;
      }

      const classesDB = await loadClasses(anneeRef.id);
      const classeNameToId: Record<string, string> = {};
      classesDB.forEach((c) => (classeNameToId[c.name] = c.id));

      const salleNameToIdByClasse: Record<string, Record<string, string>> = {};
      await Promise.all(
        Object.entries(classeNameToId).map(async ([classeName, classeId]) => {
          const sallesDB = await loadSalles(classeId);
          salleNameToIdByClasse[classeName] = {};
          sallesDB.forEach(
            (s) => (salleNameToIdByClasse[classeName][s.name] = s.id)
          );
        })
      );

      const matiereNameToIdBySalle: Record<string, Record<string, string>> = {};
      await Promise.all(
        Object.entries(salleNameToIdByClasse).flatMap(
          ([classeName, salleMap]) =>
            Object.entries(salleMap).map(async ([salleName, salleId]) => {
              const matieresDB = await loadMatieres(salleId);
              matiereNameToIdBySalle[salleId] = {};
              matieresDB.forEach(
                (m) => (matiereNameToIdBySalle[salleId][m.name] = m.id)
              );
            })
        )
      );

      const createEmploiTasks: Promise<boolean>[] = [];
      localSchoolYear.classes.forEach((classe) => {
        const mapSalle = salleNameToIdByClasse[classe.name] || {};
        classe.salles.forEach((salle) => {
          const salleId = mapSalle[salle.name];
          if (!salleId) return;
          const matiereMap = matiereNameToIdBySalle[salleId] || {};
          salle.schedule.forEach((item) => {
            const matiereId = matiereMap[item.subject];
            createEmploiTasks.push(
              createEmploiDuTemps({
                jour: item.day as any,
                heure_debut: item.startTime,
                heure_fin: item.endTime,
                matiere_id: matiereId || item.subject,
                salle_id: salleId,
                professeur: item.teacherName || "",
              })
            );
          });
        });
      });
      await Promise.all(createEmploiTasks);

      showNotification("success", "Emplois du temps enregistrés avec succès !");
    } catch (e) {
      showNotification(
        "error",
        "Erreur lors de l'enregistrement des emplois du temps"
      );
    } finally {
      setIsSavingSchedules(false);
    }
  };

  // Notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fonctions d'impression via PrintUtils
  const handlePrintSalleSchedule = (salle: Salle, classeName: string) => {
    const clsForPrint = {
      id: salle.id,
      name: `${classeName} - ${salle.name}`,
      maxStudents: salle.maxStudents,
      subjects: salle.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        coefficient: s.coefficient,
      })),
      schedule: salle.schedule.map((i) => ({
        id: i.id,
        day: i.day,
        startTime: i.startTime,
        endTime: i.endTime,
        subject: i.subject,
        teacherName: i.teacherName,
      })),
    } as any;
    const w = window.open("", "_blank");
    if (w) {
      const html = generateClassSchedulePrintContent(clsForPrint, classeName);
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const handlePrintAllSchedules = () => {
    const levels = localSchoolYear.classes.map((classe) => ({
      id: classe.id,
      name: classe.name,
      classes: classe.salles.map((salle) => ({
        id: salle.id,
        name: salle.name,
        maxStudents: salle.maxStudents,
        subjects: salle.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          coefficient: s.coefficient,
        })),
        schedule: salle.schedule.map((i) => ({
          id: i.id,
          day: i.day,
          startTime: i.startTime,
          endTime: i.endTime,
          subject: i.subject,
          teacherName: i.teacherName,
        })),
      })),
    }));
    const w = window.open("", "_blank");
    if (w) {
      const html = generateSchedulePrintContent(levels as any);
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const handlePrintSubjectsList = (salle: Salle) => {
    // Construit une structure Level -> Class pour generateClassesPrintContent
    const levelLike = [
      {
        id: salle.id,
        name: salle.name,
        classes: [
          {
            id: salle.id,
            name: salle.name,
            maxStudents: salle.maxStudents,
            subjects: salle.subjects.map((s) => ({
              id: s.id,
              name: s.name,
              coefficient: s.coefficient,
            })),
          },
        ],
      },
    ] as any;
    const w = window.open("", "_blank");
    if (w) {
      const html = generateClassesPrintContent(levelLike);
      w.document.write(html);
      w.document.close();
      w.print();
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
                  Étape {currentStep} sur 4
                </div>
                <div
                  className={`w-64 rounded-full h-2 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 4) * 100}%` }}
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

        {/* Notification */}
        {notification && (
          <div
            className={`absolute top-20 right-6 p-4 rounded-lg shadow-lg z-60 flex items-center gap-2 ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {notification.message}
          </div>
        )}

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
                {mode === "create" && (
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
                        <div className="ml-6">
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
                              className={`mt-2 p-3 rounded border ${
                                isDarkMode
                                  ? "bg-blue-900/20 border-blue-800"
                                  : "bg-blue-50 border-blue-200"
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
                                  Toute la configuration sera copiée : classes,
                                  salles, matières et emplois du temps
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

                <button
                  onClick={handleCreateYear}
                  disabled={
                    !localSchoolYear.year ||
                    !!yearError ||
                    isCreating ||
                    (mode === "create" &&
                      useTemplate === "copy" &&
                      !selectedTemplateYear)
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Création en cours...
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
          {currentStep === 2 && localSchoolYear.created && (
            <div className="space-y-6">
              <h2
                className={`text-2xl font-bold mb-6 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Étape 2: Gestion des Classes et Salles
              </h2>

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
              <div className="space-y-6">
                {localSchoolYear.classes.map((classe) => (
                  <ClasseSection
                    key={classe.id}
                    classe={classe}
                    onAddSalle={handleAddSalle}
                    onRemoveClasse={handleRemoveClasse}
                    onRemoveSalle={handleRemoveSalle}
                    defaultSubjects={defaultSubjects}
                    onAddSubjectToSalle={handleAddSubjectToSalle}
                    onRemoveSubjectFromSalle={handleRemoveSubjectFromSalle}
                    onUpdateSubjectCoefficient={handleUpdateSubjectCoefficient}
                    isDarkMode={isDarkMode}
                    salleExists={salleExists}
                  />
                ))}
              </div>

              {localSchoolYear.classes.length > 0 && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleSaveConfiguration}
                    disabled={isSavingConfig}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isSavingConfig ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Enregistrer Classes, Salles et Matières
                      </>
                    )}
                  </button>

                  {localSchoolYear.configurationSaved && (
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <Check size={20} />
                      Continuer vers les Emplois du Temps
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Emplois du temps */}
          {currentStep === 3 && localSchoolYear.configurationSaved && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Étape 3: Emplois du Temps (7h - 17h)
                </h2>
                <button
                  onClick={handleSaveSchedules}
                  disabled={isSavingSchedules}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isSavingSchedules ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Enregistrer les emplois du temps
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {localSchoolYear.classes.map((classe) => (
                  <ScheduleClasseSection
                    key={classe.id}
                    classe={classe}
                    onAddScheduleItem={handleAddScheduleItem}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-6 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Étape 4: Gestion et impression */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Options d'impression */}
              <div>
                <h2
                  className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  <Printer className="text-green-600" />
                  Options d'Impression
                </h2>

                <div className="space-y-6">
                  {localSchoolYear.classes.map((classe) => (
                    <div
                      key={classe.id}
                      className={`border rounded-lg p-4 ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <h3
                        className={`text-lg font-semibold mb-4 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {classe.name}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classe.salles.map((salle) => (
                          <div
                            key={salle.id}
                            className={`border rounded-lg p-4 ${
                              isDarkMode ? "border-gray-600" : "border-gray-100"
                            }`}
                          >
                            <h4
                              className={`font-medium mb-3 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {salle.name}
                            </h4>
                            <div className="space-y-2">
                              <button
                                onClick={() =>
                                  handlePrintSalleSchedule(salle, classe.name)
                                }
                                className={`w-full px-3 py-2 rounded text-sm hover:bg-blue-200 flex items-center gap-2 transition-colors ${
                                  isDarkMode
                                    ? "bg-blue-900/30 text-blue-300"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                <Clock size={16} />
                                Emploi du temps
                              </button>
                              <button
                                onClick={() => handlePrintSubjectsList(salle)}
                                className={`w-full px-3 py-2 rounded text-sm hover:bg-green-200 flex items-center gap-2 transition-colors ${
                                  isDarkMode
                                    ? "bg-green-900/30 text-green-300"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                <Book size={16} />
                                Liste matières
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handlePrintAllSchedules}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
                  >
                    <FileText size={20} />
                    Imprimer tous les emplois du temps
                  </button>
                </div>
              </div>

              {/* Bouton de finalisation */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    handleFinalSave();
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <Save size={20} />
                  Finaliser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Utilisation exacte des composants de votre code existant
function ClasseSection({
  classe,
  onAddSalle,
  onRemoveClasse,
  onRemoveSalle,
  defaultSubjects,
  onAddSubjectToSalle,
  onRemoveSubjectFromSalle,
  onUpdateSubjectCoefficient,
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
  defaultSubjects: Subject[];
  onAddSubjectToSalle: (
    classeId: string,
    salleId: string,
    subjectName: string,
    coefficient: number
  ) => void;
  onRemoveSubjectFromSalle: (
    classeId: string,
    salleId: string,
    subjectId: string
  ) => void;
  onUpdateSubjectCoefficient: (
    classeId: string,
    salleId: string,
    subjectId: string,
    coefficient: number
  ) => void;
  isDarkMode: boolean;
  salleExists: (classeId: string, salleName: string) => boolean;
}) {
  const [showAddSalle, setShowAddSalle] = useState(false);
  const [newSalle, setNewSalle] = useState({ name: "", maxStudents: 30 });
  const [expandedSalle, setExpandedSalle] = useState<string | null>(null);
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
              <SalleSection
                key={salle.id}
                salle={salle}
                classeId={classe.id}
                onRemoveSalle={onRemoveSalle}
                defaultSubjects={defaultSubjects}
                onAddSubjectToSalle={onAddSubjectToSalle}
                onRemoveSubjectFromSalle={onRemoveSubjectFromSalle}
                onUpdateSubjectCoefficient={onUpdateSubjectCoefficient}
                isDarkMode={isDarkMode}
                expanded={expandedSalle === salle.id}
                onToggleExpanded={() =>
                  setExpandedSalle(expandedSalle === salle.id ? null : salle.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SalleSection({
  salle,
  classeId,
  onRemoveSalle,
  defaultSubjects,
  onAddSubjectToSalle,
  onRemoveSubjectFromSalle,
  onUpdateSubjectCoefficient,
  isDarkMode,
  expanded,
  onToggleExpanded,
}: {
  salle: Salle;
  classeId: string;
  onRemoveSalle: (classeId: string, salleId: string) => void;
  defaultSubjects: Subject[];
  onAddSubjectToSalle: (
    classeId: string,
    salleId: string,
    subjectName: string,
    coefficient: number
  ) => void;
  onRemoveSubjectFromSalle: (
    classeId: string,
    salleId: string,
    subjectId: string
  ) => void;
  onUpdateSubjectCoefficient: (
    classeId: string,
    salleId: string,
    subjectId: string,
    coefficient: number
  ) => void;
  isDarkMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newSubject, setNewSubject] = useState({ name: "", coefficient: 100 });
  const [editingCoefficient, setEditingCoefficient] = useState<string | null>(
    null
  );

  const filteredSubjects = defaultSubjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !salle.subjects.some((s) => s.name === subject.name)
  );

  const handleAddSubject = (subjectName: string, coefficient: number = 100) => {
    onAddSubjectToSalle(classeId, salle.id, subjectName, coefficient);
    setSearchTerm("");
    setNewSubject({ name: "", coefficient: 100 });
  };

  const handleAddCustomSubject = () => {
    if (
      newSubject.name.trim() &&
      !salle.subjects.some((s) => s.name === newSubject.name.trim())
    ) {
      handleAddSubject(newSubject.name.trim(), newSubject.coefficient);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 ${
        isDarkMode
          ? "border-gray-600 bg-gray-700/30"
          : "border-gray-300 bg-gray-50"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <button onClick={onToggleExpanded} className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
            Max: {salle.maxStudents} élèves | Matières: {salle.subjects.length}
          </span>
        </button>
        <button
          onClick={() => onRemoveSalle(classeId, salle.id)}
          className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Recherche et ajout de matières */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une matière..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Résultats de recherche */}
            {searchTerm && filteredSubjects.length > 0 && (
              <div
                className={`max-h-32 overflow-y-auto border rounded-lg ${
                  isDarkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                {filteredSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() =>
                      handleAddSubject(subject.name, subject.coefficient)
                    }
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {subject.name} (Coef: {subject.coefficient})
                  </button>
                ))}
              </div>
            )}

            {/* Ajout de matière personnalisée */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nouvelle matière..."
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
              <input
                type="number"
                value={newSubject.coefficient}
                onChange={(e) =>
                  setNewSubject((prev) => ({
                    ...prev,
                    coefficient: parseInt(e.target.value) || 100,
                  }))
                }
                placeholder="Coef"
                min="1"
                className={`w-20 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <button
                onClick={handleAddCustomSubject}
                disabled={!newSubject.name.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Liste des matières */}
          <div className="space-y-2">
            {salle.subjects.map((subject) => (
              <div
                key={subject.id}
                className={`flex items-center justify-between p-3 rounded transition-colors ${
                  isDarkMode ? "bg-gray-600/50" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Book size={16} className="text-blue-500" />
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {subject.name}
                  </span>
                  {subject.teacher && (
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        isDarkMode
                          ? "bg-green-900/30 text-green-300"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {subject.teacher.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingCoefficient === subject.id ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        className={`w-20 p-1 border rounded text-center text-sm ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        defaultValue={subject.coefficient}
                        onBlur={(e) => {
                          onUpdateSubjectCoefficient(
                            classeId,
                            salle.id,
                            subject.id,
                            parseInt(e.target.value) || 100
                          );
                          setEditingCoefficient(null);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            onUpdateSubjectCoefficient(
                              classeId,
                              salle.id,
                              subject.id,
                              parseInt(e.currentTarget.value) || 100
                            );
                            setEditingCoefficient(null);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingCoefficient(null)}
                        className={`text-gray-500 hover:text-gray-700`}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Coef: {subject.coefficient}
                      </span>
                      <button
                        onClick={() => setEditingCoefficient(subject.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          onRemoveSubjectFromSalle(
                            classeId,
                            salle.id,
                            subject.id
                          )
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleClasseSection({
  classe,
  onAddScheduleItem,
  isDarkMode,
}: {
  classe: Classe;
  onAddScheduleItem: (
    classeId: string,
    salleId: string,
    scheduleItem: Omit<ScheduleItem, "id">
  ) => void;
  isDarkMode: boolean;
}) {
  const [expandedClasse, setExpandedClasse] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 ${
        isDarkMode ? "border-gray-600" : "border-gray-200"
      }`}
    >
      <button
        onClick={() => setExpandedClasse(!expandedClasse)}
        className="flex items-center gap-2 w-full text-left"
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

      {expandedClasse && (
        <div className="mt-4 space-y-4">
          {classe.salles.map((salle) => (
            <ScheduleSalleSection
              key={salle.id}
              classe={classe}
              salle={salle}
              onAddScheduleItem={onAddScheduleItem}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleSalleSection({
  classe,
  salle,
  onAddScheduleItem,
  isDarkMode,
}: {
  classe: Classe;
  salle: Salle;
  onAddScheduleItem: (
    classeId: string,
    salleId: string,
    scheduleItem: Omit<ScheduleItem, "id">
  ) => void;
  isDarkMode: boolean;
}) {
  const { professeurs } = useProfesseur();
  const safeProfesseurs = Array.isArray(professeurs)
    ? professeurs.filter((p) => !p.deleted)
    : [];
  const [showSchedule, setShowSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    day: "",
    startTime: "07:00",
    endTime: "08:00",
    subject: "",
    teacherId: "",
  });

  const hasSchedule = salle.schedule.length > 0;

  const handleAddSchedule = () => {
    if (
      newSchedule.day &&
      newSchedule.startTime &&
      newSchedule.endTime &&
      newSchedule.subject
    ) {
      const teacher = safeProfesseurs.find((p) => p.id === newSchedule.teacherId);
      onAddScheduleItem(classe.id, salle.id, {
        day: newSchedule.day,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        subject: newSchedule.subject,
        teacherName: teacher ? `${teacher.prenom} ${teacher.nom}` : undefined,
        teacherId: newSchedule.teacherId || undefined,
      });
      setNewSchedule({
        day: "",
        startTime: "07:00",
        endTime: "08:00",
        subject: "",
        teacherId: "",
      });
    }
  };

  // Trouver le professeur pour une matière spécifique
  const getTeacherForSubject = (subjectName: string) => {
    return safeProfesseurs.find((prof) =>
      prof.sequences.some(
        (seq) =>
          !seq.deleted &&
          seq.classe === classe.id &&
          seq.salle === salle.id &&
          seq.matiere ===
            (salle.subjects.find((s) => s.name === subjectName)?.id || subjectName)
      )
    );
  };

  // Gérer le changement de matière
  const handleSubjectChange = (subjectName: string) => {
    setNewSchedule((prev) => ({ ...prev, subject: subjectName }));

    // Vérifier si la matière a un professeur assigné selon les séquences
    const assignedTeacher = getTeacherForSubject(subjectName);
    if (assignedTeacher) {
      setNewSchedule((prev) => ({ ...prev, teacherId: assignedTeacher.id }));
    } else {
      setNewSchedule((prev) => ({ ...prev, teacherId: "" }));
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 ${
        isDarkMode ? "border-gray-600" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-2"
        >
          {showSchedule ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <Users className="text-green-500" size={16} />
          <span
            className={`font-medium ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {salle.name}
          </span>
          {hasSchedule && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isDarkMode
                  ? "bg-green-900/30 text-green-300"
                  : "bg-green-100 text-green-700"
              }`}
            >
              ✓ Configuré
            </span>
          )}
          <span
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Créneaux: {salle.schedule.length}
          </span>
        </button>
      </div>

      {showSchedule && (
        <div className="space-y-4">
          {/* Formulaire d'ajout de créneau */}
          <div
            className={`border rounded-lg p-4 transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h5
              className={`font-medium mb-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Ajouter un créneau (7h-17h)
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <select
                value={newSchedule.day}
                onChange={(e) =>
                  setNewSchedule((prev) => ({ ...prev, day: e.target.value }))
                }
                className={`p-2 border rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Jour</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={newSchedule.startTime}
                min="07:00"
                max="17:00"
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className={`p-2 border rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              />

              <input
                type="time"
                value={newSchedule.endTime}
                min="07:00"
                max="17:00"
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                className={`p-2 border rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              />

              <select
                value={newSchedule.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className={`p-2 border rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Matière</option>
                {salle.subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>

              <select
                value={newSchedule.teacherId}
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    teacherId: e.target.value,
                  }))
                }
                className={`p-2 border rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
                disabled={!newSchedule.subject}
              >
                <option value="">Professeur</option>
                {safeProfesseurs.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.prenom} {teacher.nom}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddSchedule}
              disabled={
                !newSchedule.day ||
                !newSchedule.startTime ||
                !newSchedule.endTime ||
                !newSchedule.subject
              }
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4 disabled:opacity-50 transition-colors"
            >
              Ajouter le créneau
            </button>
          </div>

          {/* Emploi du temps actuel */}
          <div className="grid grid-cols-5 gap-2 text-sm">
            {days.map((day) => (
              <div
                key={day}
                className={`border rounded transition-all duration-300 ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div
                  className={`p-2 text-center font-medium ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {day}
                </div>
                <div className="p-2 space-y-2">
                  {salle.schedule
                    .filter((item) => item.day === day)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded p-2 transition-all duration-300 ${
                          isDarkMode
                            ? "bg-blue-900/30 border-blue-800"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            isDarkMode ? "text-blue-300" : "text-blue-900"
                          }`}
                        >
                          {item.startTime}-{item.endTime}
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-blue-200" : "text-blue-700"
                          }`}
                        >
                          {item.subject}
                        </div>
                        {item.teacherName && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            {item.teacherName}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigurationAnnee;
