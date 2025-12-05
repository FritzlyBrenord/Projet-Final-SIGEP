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
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Filter,
  Grid3x3,
  List,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  useAnneeScolaire,
  Subject,
  ScheduleItem,
  Salle,
  Classe,
  SchoolYear,
} from "@/Context/ContextAnneeScolaire";
import { useProfesseur } from "@/Context/ContextProfesseur";
import { notify } from "@/components/Notification";
import {
  generateClassesPrintContent,
  generateClassSchedulePrintContent,
  generateSchedulePrintContent,
} from "./PrintUtils";

// Type pour EmploiDuTempsDB (structure de base de données)
interface EmploiDuTempsDB {
  id?: string;
  jour: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";
  heure_debut: string;
  heure_fin: string;
  matiere_id: string;
  salle_id: string;
  professeur: string;
  created_at?: string;
}

interface GestionMatierePageProps {
  isDarkMode: boolean;
}

// Type pour matière locale (avant enregistrement)
interface LocalMatiere {
  tempId: string;
  name: string;
  coefficient: number;
  salleId: string;
  salleName: string;
  saved: boolean;
}

// Type pour emploi du temps local (avant enregistrement)
interface LocalSchedule {
  tempId: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  professeurId: string;
  professeurName: string;
  salleId: string;
  salleName: string;
  saved: boolean;
}

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const timeSlots = [
  "07:00 - 08:00",
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
];

// Liste de matières par défaut
const defaultSubjects = [
  { name: "Français", coefficient: 100 },
  { name: "Mathématiques", coefficient: 100 },
  { name: "Sciences", coefficient: 80 },
  { name: "Histoire", coefficient: 60 },
  { name: "Géographie", coefficient: 60 },
  { name: "Anglais", coefficient: 80 },
  { name: "Éducation Physique", coefficient: 40 },
  { name: "Arts", coefficient: 40 },
  { name: "Musique", coefficient: 40 },
  { name: "Informatique", coefficient: 60 },
  { name: "Philosophie", coefficient: 80 },
  { name: "Physique", coefficient: 80 },
  { name: "Chimie", coefficient: 80 },
  { name: "Biologie", coefficient: 80 },
  { name: "Économie", coefficient: 60 },
];

const GestionMatierePage: React.FC<GestionMatierePageProps> = ({
  isDarkMode,
}) => {
  // États principaux
  const [activeTab, setActiveTab] = useState<"matieres" | "emploi">("matieres");
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedSalle, setSelectedSalle] = useState<string>("");
  const [filteredClasses, setFilteredClasses] = useState<Classe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSalles, setExpandedSalles] = useState<Set<string>>(new Set());

  // États pour les données locales (avant enregistrement)
  const [localMatieres, setLocalMatieres] = useState<LocalMatiere[]>([]);
  const [localSchedules, setLocalSchedules] = useState<LocalSchedule[]>([]);

  // États pour les chargements
  const [savingMatieres, setSavingMatieres] = useState(false);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [deletingMatiere, setDeletingMatiere] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);

  // États pour les modals
  const [showAddMatiereModal, setShowAddMatiereModal] = useState(false);
  const [showEditMatiereModal, setShowEditMatiereModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Subject | null>(null);

  // États pour les formulaires
  const [matiereSearchTerm, setMatiereSearchTerm] = useState("");
  const [showMatiereDropdown, setShowMatiereDropdown] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<{
    name: string;
    coefficient: number;
  } | null>(null);

  const [professeurSearchTerm, setProfesseurSearchTerm] = useState("");
  const [showProfesseurDropdown, setShowProfesseurDropdown] = useState(false);
  const [selectedProfesseur, setSelectedProfesseur] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [newSubject, setNewSubject] = useState({
    name: "",
    coefficient: 100,
    salles: [] as string[],
  });

  const [scheduleForm, setScheduleForm] = useState<{
    day: string;
    timeSlot: string;
    subject: string;
    professeur: string;
  }>({
    day: "",
    timeSlot: "",
    subject: "",
    professeur: "",
  });

  const {
    schoolYears,
    loadSchoolYears,
    createMatiere,
    loadClasses,
    deleteMatiere,
    currentYear,
    updateMatiere,
    createEmploiDuTemps,
    deleteEmploiDuTemps,
  } = useAnneeScolaire();

  const { professeurs } = useProfesseur();

  // Charger les données
  useEffect(() => {
    const loadCurrentYearData = async () => {
      if (currentYear?.id) {
        await loadClasses(currentYear.id);
        await loadSchoolYears();
      }
    };
    loadCurrentYearData();
  }, [currentYear, loadClasses, loadSchoolYears]);

  // Fermer le dropdown de recherche quand on clique ailleurs
  // Fermer le dropdown de recherche quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".matiere-search-container")) {
        setShowMatiereDropdown(false);
      }
      // ✅ AJOUTER POUR LES PROFESSEURS
      if (!target.closest(".professeur-search-container")) {
        setShowProfesseurDropdown(false);
      }
    };

    if (showMatiereDropdown || showProfesseurDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMatiereDropdown, showProfesseurDropdown]); // ✅ Ajouter la dépendance

  // ✅ Auto-sélectionner le professeur unique quand une matière est choisie
  useEffect(() => {
    if (scheduleForm.subject && selectedClasse && selectedSalle) {
      // Récupérer les professeurs qui enseignent cette matière
      const professeursPourMatiere = professeurs.filter((prof) => {
        return prof.sequences.some((seq) => {
          return (
            seq.classe === selectedClasse &&
            seq.salle === selectedSalle &&
            seq.matiere === scheduleForm.subject &&
            !seq.deleted
          );
        });
      });

      // Si un seul professeur, le sélectionner automatiquement
      if (professeursPourMatiere.length === 1) {
        const prof = professeursPourMatiere[0];
        setSelectedProfesseur({
          id: prof.id,
          name: `${prof.prenom} ${prof.nom}`,
        });
        setProfesseurSearchTerm(`${prof.prenom} ${prof.nom}`);
        setScheduleForm((prev) => ({
          ...prev,
          professeur: prof.id,
        }));
      }
    }
  }, [scheduleForm.subject, selectedClasse, selectedSalle, professeurs]);

  // Filtrer les classes
  useEffect(() => {
    if (currentYear && schoolYears.length > 0) {
      const currentYearData = schoolYears.find(
        (year) => year.id === currentYear.id
      );
      if (currentYearData) {
        setFilteredClasses(currentYearData.classes || []);
      }
    }
  }, [currentYear, schoolYears]);

  // Fonctions utilitaires
  const getSallesForSelectedClasse = () => {
    if (!selectedClasse) return [];
    const classe = filteredClasses.find((c) => c.id === selectedClasse);
    return classe?.salles || [];
  };

  const getSelectedSalleData = () => {
    const salles = getSallesForSelectedClasse();
    return salles.find((s) => s.id === selectedSalle);
  };

  const toggleExpandSalle = (salleId: string) => {
    setExpandedSalles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(salleId)) {
        newSet.delete(salleId);
      } else {
        newSet.add(salleId);
      }
      return newSet;
    });
  };

  // ================ GESTION DES MATIÈRES LOCALES ================

  const handleAddMatiereToLocal = () => {
    if (!selectedMatiere || !selectedMatiere.name.trim()) {
      notify("error", "Veuillez sélectionner ou saisir un nom de matière");
      return;
    }

    if (newSubject.salles.length === 0) {
      notify("error", "Veuillez sélectionner au moins une salle");
      return;
    }

    // Ajouter les matières aux états locaux
    const newLocalMatieres: LocalMatiere[] = newSubject.salles.map(
      (salleId) => {
        const salle = getSallesForSelectedClasse().find(
          (s) => s.id === salleId
        );
        return {
          tempId: `temp-${Date.now()}-${Math.random()}`,
          name: selectedMatiere.name.trim(),
          coefficient: selectedMatiere.coefficient,
          salleId: salleId,
          salleName: salle?.name || "",
          saved: false,
        };
      }
    );

    setLocalMatieres((prev) => [...prev, ...newLocalMatieres]);

    notify(
      "success",
      `Matière "${selectedMatiere.name}" ajoutée localement à ${newSubject.salles.length} salle(s) !`
    );

    setNewSubject({ name: "", coefficient: 100, salles: [] });
    setSelectedMatiere(null);
    setMatiereSearchTerm("");
    setShowAddMatiereModal(false);
  };

  const handleSaveAllMatieres = async () => {
    const unsavedMatieres = localMatieres.filter((m) => !m.saved);

    if (unsavedMatieres.length === 0) {
      notify("info", "Aucune matière à enregistrer");
      return;
    }

    setSavingMatieres(true);

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const matiere of unsavedMatieres) {
        const success = await createMatiere({
          nom: matiere.name,
          code: undefined,
          coefficient: matiere.coefficient,
          description: undefined,
          salle_id: matiere.salleId,
        });

        if (success) {
          successCount++;
          // Marquer comme sauvegardé
          setLocalMatieres((prev) =>
            prev.map((m) =>
              m.tempId === matiere.tempId ? { ...m, saved: true } : m
            )
          );
        } else {
          failedCount++;
        }
      }

      if (successCount > 0) {
        notify(
          "success",
          `${successCount} matière(s) enregistrée(s) avec succès !`
        );

        // Recharger les données
        if (currentYear?.id) {
          await loadClasses(currentYear.id);
          await loadSchoolYears();
        }

        // Supprimer les matières sauvegardées après un délai
        setTimeout(() => {
          setLocalMatieres((prev) => prev.filter((m) => !m.saved));
        }, 2000);
      }

      if (failedCount > 0) {
        notify(
          "error",
          `${failedCount} matière(s) n'ont pas pu être enregistrée(s)`
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des matières:", error);
      notify("error", "Erreur lors de l'enregistrement des matières");
    } finally {
      setSavingMatieres(false);
    }
  };

  const handleRemoveLocalMatiere = (tempId: string) => {
    setLocalMatieres((prev) => prev.filter((m) => m.tempId !== tempId));
    notify("info", "Matière retirée de la liste locale");
  };

  // Filtrer les matières par défaut selon la recherche
  // Filtrer les matières par défaut selon la recherche
  const getFilteredDefaultSubjects = () => {
    if (!matiereSearchTerm) return defaultSubjects;
    return defaultSubjects.filter((subject) =>
      subject.name.toLowerCase().includes(matiereSearchTerm.toLowerCase())
    );
  };

  // ✅ FONCTION AMÉLIORÉE POUR FILTRER LES PROFESSEURS
  const getFilteredProfesseurs = () => {
    // Obtenir les données de la salle sélectionnée
    const salleData = getSelectedSalleData();
    if (!salleData || !selectedClasse) return professeurs;

    // Trouver la classe sélectionnée
    const classe = filteredClasses.find((c) => c.id === selectedClasse);
    if (!classe) return professeurs;

    // ✅ LES SÉQUENCES UTILISENT DES IDS, PAS DES NOMS !
    // seq.classe → ID de classe
    // seq.salle → ID de salle
    // seq.matiere → ID de matière

    // 1. Filtrer les professeurs qui ont des séquences dans cette classe et salle
    let professeursFiltres = professeurs.filter((prof) => {
      return prof.sequences.some((seq) => {
        return (
          seq.classe === selectedClasse &&
          seq.salle === selectedSalle &&
          !seq.deleted
        );
      });
    });

    // 2. Si une matière est sélectionnée, essayer de filtrer par matière
    if (scheduleForm.subject) {
      if (professeursFiltres.length > 0) {
        // Chercher les professeurs qui enseignent cette matière dans cette classe/salle
        const profsAvecMatiere = professeursFiltres.filter((prof) => {
          return prof.sequences.some((seq) => {
            return (
              seq.classe === selectedClasse &&
              seq.salle === selectedSalle &&
              seq.matiere === scheduleForm.subject &&
              !seq.deleted
            );
          });
        });

        // Si on trouve des professeurs pour cette matière, les utiliser
        if (profsAvecMatiere.length > 0) {
          professeursFiltres = profsAvecMatiere;
        }
        // Sinon, garder tous les professeurs de la classe/salle
      }
    }

    // 3. Si aucun professeur trouvé avec les filtres stricts, utiliser un fallback
    if (professeursFiltres.length === 0) {
      // Fallback: afficher tous les professeurs qui enseignent dans cette classe (sans filtrer par salle)
      professeursFiltres = professeurs.filter((prof) => {
        return prof.sequences.some((seq) => {
          return seq.classe === selectedClasse && !seq.deleted;
        });
      });

      // Si toujours aucun, afficher tous les professeurs de l'année scolaire
      if (professeursFiltres.length === 0) {
        professeursFiltres = professeurs;
      }
    }

    // 4. Appliquer le filtre de recherche par nom si présent
    if (professeurSearchTerm) {
      const searchLower = professeurSearchTerm.toLowerCase();
      professeursFiltres = professeursFiltres.filter((prof) => {
        const fullName = `${prof.prenom} ${prof.nom}`.toLowerCase();
        const reverseName = `${prof.nom} ${prof.prenom}`.toLowerCase();
        return (
          fullName.includes(searchLower) || reverseName.includes(searchLower)
        );
      });
    }

    return professeursFiltres;
  };

  // ✅ FONCTION POUR GÉNÉRER LE MESSAGE DE FILTRAGE
  const getProfesseurFilterMessage = () => {
    const salleData = getSelectedSalleData();
    const classe = filteredClasses.find((c) => c.id === selectedClasse);

    if (!salleData || !classe) return "";

    // Vérifier les différents niveaux de filtrage AVEC LES IDS
    const profsClasseSalle = professeurs.filter((prof) =>
      prof.sequences.some((seq) => {
        return seq.classe === selectedClasse && seq.salle === selectedSalle && !seq.deleted;
      })
    );

    const profsClasse = professeurs.filter((prof) =>
      prof.sequences.some((seq) => {
        return seq.classe === selectedClasse && !seq.deleted;
      })
    );

    // Si une matière est sélectionnée
    if (scheduleForm.subject) {
      const selectedSubject = salleData.subjects.find(
        (s) => s.id === scheduleForm.subject
      );

      if (selectedSubject) {
        // Vérifier si on a des profs qui enseignent cette matière
        const profsAvecMatiere = profsClasseSalle.filter((prof) =>
          prof.sequences.some((seq) => {
            return (
              seq.classe === selectedClasse &&
              seq.salle === selectedSalle &&
              seq.matiere === scheduleForm.subject &&
              !seq.deleted
            );
          })
        );

        if (profsAvecMatiere.length > 0) {
          return `Enseignent "${selectedSubject.name}" dans ${classe.name} - ${salleData.name}`;
        } else if (profsClasseSalle.length > 0) {
          return `Aucun prof. pour "${selectedSubject.name}" - Tous les profs. de ${classe.name} - ${salleData.name}`;
        } else if (profsClasse.length > 0) {
          return `Tous les professeurs de ${classe.name}`;
        } else {
          return `Tous les professeurs disponibles`;
        }
      }
    }

    // Si aucune matière sélectionnée
    if (profsClasseSalle.length > 0) {
      return `Professeurs de ${classe.name} - ${salleData.name}`;
    } else if (profsClasse.length > 0) {
      return `Tous les professeurs de ${classe.name}`;
    } else {
      return `Tous les professeurs disponibles`;
    }
  };

  // ✅ FONCTION POUR SÉLECTIONNER UN PROFESSEUR
  const handleSelectProfesseur = (prof: {
    id: string;
    prenom: string;
    nom: string;
  }) => {
    const profData = {
      id: prof.id,
      name: `${prof.prenom} ${prof.nom}`,
    };
    setSelectedProfesseur(profData);
    setProfesseurSearchTerm(profData.name);
    setShowProfesseurDropdown(false);

    // Mettre à jour le formulaire
    setScheduleForm((prev) => ({
      ...prev,
      professeur: prof.id,
    }));
  };

  // ✅ FONCTION POUR EFFACER LA SÉLECTION
  const handleClearProfesseur = () => {
    setSelectedProfesseur(null);
    setProfesseurSearchTerm("");
    setScheduleForm((prev) => ({
      ...prev,
      professeur: "",
    }));
  };

  // Gérer la sélection d'une matière
  const handleSelectMatiere = (subject: {
    name: string;
    coefficient: number;
  }) => {
    setSelectedMatiere(subject);
    setMatiereSearchTerm(subject.name);
    setShowMatiereDropdown(false);
  };

  // Gérer la création d'une nouvelle matière personnalisée
  const handleCreateCustomMatiere = () => {
    if (!matiereSearchTerm.trim()) {
      notify("error", "Veuillez saisir un nom de matière");
      return;
    }
    setSelectedMatiere({
      name: matiereSearchTerm.trim(),
      coefficient: 100,
    });
    setShowMatiereDropdown(false);
  };

  const handleUpdateMatiere = async () => {
    if (!editingMatiere) return;

    try {
      const success = await updateMatiere(editingMatiere.id, {
        nom: editingMatiere.name,
        coefficient: editingMatiere.coefficient,
      });

      if (success) {
        notify("success", "Matière mise à jour avec succès !");
        setShowEditMatiereModal(false);
        setEditingMatiere(null);

        if (currentYear?.id) {
          await loadClasses(currentYear.id);
        }
      } else {
        notify("error", "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la matière:", error);
      notify("error", "Erreur lors de la mise à jour de la matière");
    }
  };

  const handleDeleteMatiere = async (subjectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) return;

    setDeletingMatiere(subjectId);

    try {
      const success = await deleteMatiere(subjectId);
      if (success) {
        notify("success", "Matière supprimée avec succès !");
        if (currentYear?.id) {
          await loadClasses(currentYear.id);
        }
      } else {
        notify("error", "Erreur lors de la suppression");
      }
    } catch (error) {
      notify("error", "Erreur lors de la suppression de la matière");
    } finally {
      setDeletingMatiere(null);
    }
  };

  // ================ GESTION DES EMPLOIS DU TEMPS LOCAUX ================

  // Vérifier si un professeur est déjà occupé à cet horaire
  const checkProfesseurConflict = (
    professeurId: string,
    day: string,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ): { hasConflict: boolean; conflictDetails?: string } => {
    if (!professeurId) {
      return { hasConflict: false };
    }

    // Vérifier dans les emplois du temps déjà sauvegardés (toutes les classes)
    for (const classe of filteredClasses) {
      for (const salle of classe.salles) {
        for (const schedule of salle.schedule) {
          // Ignorer le cours en cours de modification
          if (excludeScheduleId && schedule.id === excludeScheduleId) {
            continue;
          }

          if (
            schedule.teacherId === professeurId &&
            schedule.day === day &&
            schedule.startTime === startTime &&
            schedule.endTime === endTime
          ) {
            const prof = professeurs.find((p) => p.id === professeurId);
            return {
              hasConflict: true,
              conflictDetails: `Le professeur ${prof?.prenom} ${prof?.nom} enseigne déjà à ${classe.name} - ${salle.name} (${schedule.subject}) le ${day} de ${startTime} à ${endTime}`,
            };
          }
        }
      }
    }

    // Vérifier dans les emplois du temps locaux (non encore sauvegardés)
    // Vérifier dans les emplois du temps locaux (non encore sauvegardés)
    for (const localSchedule of localSchedules) {
      if (
        localSchedule.tempId !== excludeScheduleId && // ✅ AJOUTER CETTE LIGNE
        localSchedule.professeurId === professeurId &&
        localSchedule.day === day &&
        localSchedule.startTime === startTime &&
        localSchedule.endTime === endTime &&
        !localSchedule.saved
      ) {
        return {
          hasConflict: true,
          conflictDetails: `Le professeur ${localSchedule.professeurName} est déjà prévu à ${localSchedule.salleName} (${localSchedule.subjectName}) le ${day} de ${startTime} à ${endTime} (non encore enregistré)`,
        };
      }
    }

    return { hasConflict: false };
  };

  const handleAddScheduleToLocal = () => {
    if (!scheduleForm.day || !scheduleForm.timeSlot || !scheduleForm.subject) {
      notify("error", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!selectedSalle) {
      notify("error", "Veuillez sélectionner une salle");
      return;
    }

    const [startTime, endTime] = scheduleForm.timeSlot.split(" - ");

    // Vérifier les conflits de professeur
    if (scheduleForm.professeur) {
      const conflict = checkProfesseurConflict(
        scheduleForm.professeur,
        scheduleForm.day,
        startTime,
        endTime
      );

      if (conflict.hasConflict) {
        notify(
          "error",
          conflict.conflictDetails || "Conflit d'horaire détecté"
        );
        return;
      }
    }

    // Vérifier si le créneau n'est pas déjà pris dans cette salle
    const salleData = getSelectedSalleData();
    const existingSchedule = salleData?.schedule.find(
      (s) =>
        s.day === scheduleForm.day &&
        s.startTime === startTime &&
        s.endTime === endTime
    );

    if (existingSchedule) {
      notify("error", "Ce créneau horaire est déjà occupé dans cette salle");
      return;
    }

    // Vérifier dans les emplois du temps locaux
    const existingLocalSchedule = localSchedules.find(
      (s) =>
        s.salleId === selectedSalle &&
        s.day === scheduleForm.day &&
        s.startTime === startTime &&
        s.endTime === endTime &&
        !s.saved
    );

    if (existingLocalSchedule) {
      notify("error", "Ce créneau horaire est déjà prévu dans cette salle");
      return;
    }

    const subject = salleData?.subjects.find(
      (s) => s.id === scheduleForm.subject
    );
    const professeur = professeurs.find(
      (p) => p.id === scheduleForm.professeur
    );
    const salle = getSallesForSelectedClasse().find(
      (s) => s.id === selectedSalle
    );

    const newLocalSchedule: LocalSchedule = {
      tempId: `temp-${Date.now()}-${Math.random()}`,
      day: scheduleForm.day,
      timeSlot: scheduleForm.timeSlot,
      startTime,
      endTime,
      subjectId: scheduleForm.subject,
      subjectName: subject?.name || "",
      professeurId: scheduleForm.professeur,
      professeurName: professeur
        ? `${professeur.prenom} ${professeur.nom}`
        : "Non assigné",
      salleId: selectedSalle,
      salleName: salle?.name || "",
      saved: false,
    };

    setLocalSchedules((prev) => [...prev, newLocalSchedule]);

    notify("success", "Cours ajouté localement à l'emploi du temps !");

    // Réinitialiser le formulaire
    setScheduleForm({ day: "", timeSlot: "", subject: "", professeur: "" });
    setShowAddScheduleModal(false);
  };

  const handleSaveAllSchedules = async () => {
    const unsavedSchedules = localSchedules.filter((s) => !s.saved);

    if (unsavedSchedules.length === 0) {
      notify("info", "Aucun emploi du temps à enregistrer");
      return;
    }

    setSavingSchedules(true);

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const schedule of unsavedSchedules) {
        // ✅ PAS DE REVÉRIFICATION DES CONFLITS
        // Les conflits ont déjà été vérifiés lors de l'ajout

        // ✅ TROUVER LE NOM COMPLET DU PROFESSEUR
        const prof = professeurs.find((p) => p.id === schedule.professeurId);
        const professeurNomComplet = prof
          ? `${prof.prenom} ${prof.nom}`
          : "Non assigné";

        const emploiData: Omit<EmploiDuTempsDB, "id"> = {
          jour: schedule.day as
            | "Lundi"
            | "Mardi"
            | "Mercredi"
            | "Jeudi"
            | "Vendredi",
          heure_debut: schedule.startTime,
          heure_fin: schedule.endTime,
          matiere_id: schedule.subjectId,
          salle_id: schedule.salleId,
          professeur: professeurNomComplet, // ✅ STOCKER LE NOM COMPLET
        };

        console.log("📤 Enregistrement emploi du temps:", emploiData);

        const success = await createEmploiDuTemps(emploiData);

        if (success) {
          successCount++;
          console.log("✅ Emploi du temps enregistré");

          // Marquer comme sauvegardé
          setLocalSchedules((prev) =>
            prev.map((s) =>
              s.tempId === schedule.tempId ? { ...s, saved: true } : s
            )
          );
        } else {
          failedCount++;
          console.error("❌ Échec enregistrement emploi du temps");
        }
      }

      if (successCount > 0) {
        notify(
          "success",
          `${successCount} emploi(s) du temps enregistré(s) avec succès !`
        );

        console.log("🔄 Rechargement des données...");

        // Recharger les données
        if (currentYear?.id) {
          await loadClasses(currentYear.id);
          await loadSchoolYears();
        }

        // Supprimer les emplois du temps sauvegardés après un délai
        setTimeout(() => {
          setLocalSchedules((prev) => prev.filter((s) => !s.saved));
        }, 2000);
      }

      if (failedCount > 0) {
        notify(
          "error",
          `${failedCount} emploi(s) du temps n'ont pas pu être enregistré(s)`
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement des emplois du temps:",
        error
      );
      notify("error", "Erreur lors de l'enregistrement des emplois du temps");
    } finally {
      setSavingSchedules(false);
    }
  };
  const handleRemoveLocalSchedule = (tempId: string) => {
    setLocalSchedules((prev) => prev.filter((s) => s.tempId !== tempId));
    notify("info", "Emploi du temps retiré de la liste locale");
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;

    setDeletingSchedule(scheduleId);

    try {
      const success = await deleteEmploiDuTemps(scheduleId);

      if (success) {
        notify("success", "Cours supprimé avec succès !");

        if (currentYear?.id) {
          await loadClasses(currentYear.id);
          await loadSchoolYears();
        }
      } else {
        notify("error", "Erreur lors de la suppression du cours");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du cours:", error);
      notify("error", "Erreur lors de la suppression du cours");
    } finally {
      setDeletingSchedule(null);
    }
  };

  // Fonctions d'impression
  // Fonctions d'impression
  const handlePrintMatieres = () => {
    if (!selectedClasse) {
      notify("error", "Veuillez sélectionner une classe");
      return;
    }

    const classe = filteredClasses.find((c) => c.id === selectedClasse);
    if (!classe) return;

    // ✅ ADAPTER LA STRUCTURE POUR L'IMPRESSION
    const levelsForPrint = [
      {
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
        })),
      },
    ] as any;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateClassesPrintContent(levelsForPrint);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const handlePrintSchedule = () => {
    if (!selectedSalle) {
      notify("error", "Veuillez sélectionner une salle");
      return;
    }

    const salle = getSelectedSalleData();
    if (!salle) return;

    const classe = filteredClasses.find((c) => c.id === selectedClasse);
    if (!classe) return;

    // ✅ ADAPTER LA STRUCTURE POUR L'IMPRESSION
    const clsForPrint = {
      id: salle.id,
      name: `${classe.name} - ${salle.name}`,
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

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateClassSchedulePrintContent(
        clsForPrint,
        classe.name
      );
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  // Filtrer les salles selon la recherche
  const getFilteredSalles = () => {
    const salles = getSallesForSelectedClasse();
    if (!searchTerm) return salles;

    return salles.filter(
      (salle) =>
        salle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salle.subjects.some((subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  };

  // Obtenir les matières locales pour une salle spécifique
  const getLocalMatieresForSalle = (salleId: string) => {
    return localMatieres.filter((m) => m.salleId === salleId && !m.saved);
  };

  // Obtenir les emplois du temps locaux pour une salle spécifique
  const getLocalSchedulesForSalle = (salleId: string) => {
    return localSchedules.filter((s) => s.salleId === salleId && !s.saved);
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            } mb-2`}
          >
            Gestion des Matières & Emploi du Temps
          </h1>
          <p
            className={`text-lg ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Année scolaire :{" "}
            <span className="font-semibold text-blue-600">
              {currentYear?.year || "Non définie"}
            </span>
          </p>
        </div>

        {/* Barre d'outils */}
        <div
          className={`rounded-lg shadow-lg p-6 mb-8 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sélection de classe */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Classe
              </label>
              <select
                value={selectedClasse}
                onChange={(e) => {
                  setSelectedClasse(e.target.value);
                  setSelectedSalle("");
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Sélectionner une classe</option>
                {filteredClasses.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recherche */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <Search size={16} className="inline mr-2" />
                Rechercher
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une salle ou matière..."
                  className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
                <Search
                  size={18}
                  className={`absolute left-3 top-3.5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Statistiques */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <Grid3x3 size={16} className="inline mr-2" />
                Statistiques
              </label>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {selectedClasse
                    ? `${getSallesForSelectedClasse().length} salle(s)`
                    : `${filteredClasses.length} classe(s)`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Actions rapides
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMatiereModal(true)}
                  disabled={!selectedClasse}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Matière
                </button>
                <button
                  onClick={handlePrintMatieres}
                  disabled={!selectedClasse}
                  className={`p-3 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Boutons d'enregistrement */}
          {(localMatieres.some((m) => !m.saved) ||
            localSchedules.some((s) => !s.saved)) && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex flex-wrap gap-4">
                {localMatieres.some((m) => !m.saved) && (
                  <button
                    onClick={handleSaveAllMatieres}
                    disabled={savingMatieres}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingMatieres ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Enregistrement des matières...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Enregistrer{" "}
                        {localMatieres.filter((m) => !m.saved).length}{" "}
                        matière(s)
                      </>
                    )}
                  </button>
                )}

                {localSchedules.some((s) => !s.saved) && (
                  <button
                    onClick={handleSaveAllSchedules}
                    disabled={savingSchedules}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingSchedules ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Enregistrement des emplois du temps...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Enregistrer{" "}
                        {localSchedules.filter((s) => !s.saved).length}{" "}
                        emploi(s) du temps
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Onglets */}
        <div
          className={`rounded-lg shadow-lg overflow-hidden mb-8 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("matieres")}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "matieres"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Book size={20} />
              Gestion des Matières
            </button>
            <button
              onClick={() => setActiveTab("emploi")}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "emploi"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Calendar size={20} />
              Emploi du Temps
            </button>
          </div>

          <div className="p-6">
            {/* Contenu Matières */}
            {activeTab === "matieres" && (
              <div>
                {selectedClasse ? (
                  <div className="space-y-4">
                    {getFilteredSalles().map((salle) => {
                      const localMatieresForSalle = getLocalMatieresForSalle(
                        salle.id
                      );

                      return (
                        <div
                          key={salle.id}
                          className={`border rounded-lg overflow-hidden ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          {/* En-tête de salle */}
                          <div
                            className={`p-4 cursor-pointer ${
                              isDarkMode
                                ? "bg-gray-700 hover:bg-gray-650"
                                : "bg-gray-50 hover:bg-gray-100"
                            } transition-colors`}
                            onClick={() => toggleExpandSalle(salle.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedSalles.has(salle.id) ? (
                                  <ChevronDown
                                    size={20}
                                    className="text-blue-600"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={20}
                                    className="text-gray-400"
                                  />
                                )}
                                <div>
                                  <h3
                                    className={`font-semibold text-lg ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {salle.name}
                                  </h3>
                                  <p
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {salle.maxStudents} élèves max •{" "}
                                    {salle.subjects.length} matière(s)
                                    {localMatieresForSalle.length > 0 &&
                                      ` • ${localMatieresForSalle.length} en attente`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    salle.subjects.length > 0
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                  }`}
                                >
                                  {salle.subjects.length} matière(s)
                                </span>
                                {localMatieresForSalle.length > 0 && (
                                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                    {localMatieresForSalle.length} en attente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contenu de salle (matières) */}
                          {expandedSalles.has(salle.id) && (
                            <div className="p-4">
                              {/* Matières locales (non sauvegardées) */}
                              {localMatieresForSalle.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle
                                      size={18}
                                      className="text-orange-500"
                                    />
                                    <h4
                                      className={`font-semibold ${
                                        isDarkMode
                                          ? "text-orange-400"
                                          : "text-orange-600"
                                      }`}
                                    >
                                      Matières en attente d'enregistrement
                                    </h4>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr
                                          className={`border-b ${
                                            isDarkMode
                                              ? "border-gray-700"
                                              : "border-gray-200"
                                          }`}
                                        >
                                          <th
                                            className={`text-left py-3 px-4 font-medium ${
                                              isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            Matière
                                          </th>
                                          <th
                                            className={`text-left py-3 px-4 font-medium ${
                                              isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            Coefficient
                                          </th>
                                          <th
                                            className={`text-right py-3 px-4 font-medium ${
                                              isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {localMatieresForSalle.map(
                                          (matiere) => (
                                            <tr
                                              key={matiere.tempId}
                                              className={`border-b ${
                                                isDarkMode
                                                  ? "border-gray-700 bg-orange-900/10"
                                                  : "border-gray-200 bg-orange-50"
                                              }`}
                                            >
                                              <td
                                                className={`py-3 px-4 ${
                                                  isDarkMode
                                                    ? "text-white"
                                                    : "text-gray-900"
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Clock
                                                    size={16}
                                                    className="text-orange-500"
                                                  />
                                                  <span className="font-medium">
                                                    {matiere.name}
                                                  </span>
                                                </div>
                                              </td>
                                              <td
                                                className={`py-3 px-4 ${
                                                  isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                                                  {matiere.coefficient}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-right">
                                                <button
                                                  onClick={() =>
                                                    handleRemoveLocalMatiere(
                                                      matiere.tempId
                                                    )
                                                  }
                                                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                  title="Retirer"
                                                >
                                                  <X size={16} />
                                                </button>
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Matières sauvegardées */}
                              {salle.subjects.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr
                                        className={`border-b ${
                                          isDarkMode
                                            ? "border-gray-700"
                                            : "border-gray-200"
                                        }`}
                                      >
                                        <th
                                          className={`text-left py-3 px-4 font-medium ${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          Matière
                                        </th>
                                        <th
                                          className={`text-left py-3 px-4 font-medium ${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          Coefficient
                                        </th>
                                        <th
                                          className={`text-right py-3 px-4 font-medium ${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {salle.subjects.map((subject) => (
                                        <tr
                                          key={subject.id}
                                          className={`border-b ${
                                            isDarkMode
                                              ? "border-gray-700"
                                              : "border-gray-200"
                                          } hover:bg-gray-700/30 transition-colors`}
                                        >
                                          <td
                                            className={`py-3 px-4 ${
                                              isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Book
                                                size={16}
                                                className="text-blue-500"
                                              />
                                              <span className="font-medium">
                                                {subject.name}
                                              </span>
                                            </div>
                                          </td>
                                          <td
                                            className={`py-3 px-4 ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                                              {subject.coefficient}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                onClick={() => {
                                                  setEditingMatiere(subject);
                                                  setShowEditMatiereModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Modifier"
                                              >
                                                <Edit size={16} />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteMatiere(
                                                    subject.id
                                                  )
                                                }
                                                disabled={
                                                  deletingMatiere === subject.id
                                                }
                                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                title="Supprimer"
                                              >
                                                {deletingMatiere ===
                                                subject.id ? (
                                                  <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                  />
                                                ) : (
                                                  <Trash2 size={16} />
                                                )}
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                !localMatieresForSalle.length && (
                                  <div
                                    className={`text-center py-8 ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <Book
                                      size={48}
                                      className="mx-auto mb-4 opacity-50"
                                    />
                                    <p>Aucune matière dans cette salle</p>
                                    <button
                                      onClick={() =>
                                        setShowAddMatiereModal(true)
                                      }
                                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      + Ajouter une matière
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {getFilteredSalles().length === 0 && (
                      <div
                        className={`text-center py-12 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Users size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">
                          {searchTerm
                            ? "Aucune salle ou matière trouvée"
                            : "Aucune salle dans cette classe"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-center py-12 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <Users size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      Veuillez sélectionner une classe pour voir les matières
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contenu Emploi du Temps */}
            {activeTab === "emploi" && (
              <div>
                {selectedClasse ? (
                  <div className="space-y-6">
                    {/* Sélection de salle pour emploi du temps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <Grid3x3 size={16} className="inline mr-2" />
                          Sélectionner une salle
                        </label>
                        <select
                          value={selectedSalle}
                          onChange={(e) => setSelectedSalle(e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "border-gray-300 text-gray-900"
                          }`}
                        >
                          <option value="">Choisir une salle...</option>
                          {getSallesForSelectedClasse().map((salle) => (
                            <option key={salle.id} value={salle.id}>
                              {salle.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedSalle && (
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => setShowAddScheduleModal(true)}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            Ajouter un cours
                          </button>
                          <button
                            onClick={handlePrintSchedule}
                            className={`p-3 rounded-lg border transition-colors ${
                              isDarkMode
                                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Grille d'emploi du temps */}
                    {selectedSalle ? (
                      <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                          <div className="grid grid-cols-6 gap-2">
                            {/* En-tête */}
                            <div
                              className={`p-3 font-medium text-center ${
                                isDarkMode
                                  ? "bg-gray-700 text-gray-300"
                                  : "bg-gray-100 text-gray-700"
                              } rounded-lg`}
                            >
                              Horaires
                            </div>
                            {days.map((day) => (
                              <div
                                key={day}
                                className={`p-3 font-medium text-center ${
                                  isDarkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-100 text-gray-700"
                                } rounded-lg`}
                              >
                                {day}
                              </div>
                            ))}

                            {/* Lignes de l'emploi du temps */}
                            {timeSlots.map((timeSlot) => (
                              <React.Fragment key={timeSlot}>
                                <div
                                  className={`p-3 text-sm font-medium text-center ${
                                    isDarkMode
                                      ? "bg-gray-700 text-gray-300"
                                      : "bg-gray-100 text-gray-700"
                                  } rounded-lg flex items-center justify-center`}
                                >
                                  {timeSlot}
                                </div>
                                {days.map((day) => {
                                  const salleData = getSelectedSalleData();
                                  const [startTime, endTime] =
                                    timeSlot.split(" - ");

                                  // Vérifier les cours sauvegardés
                                  const schedule = salleData?.schedule.find(
                                    (s) =>
                                      s.day === day &&
                                      `${s.startTime} - ${s.endTime}` ===
                                        timeSlot
                                  );

                                  // Vérifier les cours locaux (non sauvegardés)
                                  const localSchedule = localSchedules.find(
                                    (s) =>
                                      s.salleId === selectedSalle &&
                                      s.day === day &&
                                      s.startTime === startTime &&
                                      s.endTime === endTime &&
                                      !s.saved
                                  );

                                  const hasContent = schedule || localSchedule;

                                  return (
                                    <div
                                      key={`${day}-${timeSlot}`}
                                      className={`p-3 min-h-[80px] border-2 border-dashed rounded-lg ${
                                        localSchedule
                                          ? "bg-orange-900/30 border-orange-700"
                                          : schedule
                                          ? isDarkMode
                                            ? "bg-blue-900/30 border-blue-700"
                                            : "bg-blue-50 border-blue-300"
                                          : isDarkMode
                                          ? "border-gray-700 hover:border-gray-600"
                                          : "border-gray-200 hover:border-gray-300"
                                      } transition-colors`}
                                    >
                                      {localSchedule ? (
                                        <div className="h-full flex flex-col justify-between">
                                          <div>
                                            <div className="flex items-center gap-1 mb-1">
                                              <Clock
                                                size={12}
                                                className="text-orange-500"
                                              />
                                              <p
                                                className={`font-medium text-sm ${
                                                  isDarkMode
                                                    ? "text-white"
                                                    : "text-gray-900"
                                                }`}
                                              >
                                                {localSchedule.subjectName}
                                              </p>
                                            </div>
                                            {localSchedule.professeurName !==
                                              "Non assigné" && (
                                              <p
                                                className={`text-xs ${
                                                  isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {localSchedule.professeurName}
                                              </p>
                                            )}
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                              En attente
                                            </p>
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleRemoveLocalSchedule(
                                                localSchedule.tempId
                                              )
                                            }
                                            className="mt-2 p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors self-end"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ) : schedule ? (
                                        <div className="h-full flex flex-col justify-between">
                                          <div>
                                            <p
                                              className={`font-medium text-sm mb-1 ${
                                                isDarkMode
                                                  ? "text-white"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {schedule.subject}
                                            </p>
                                            {schedule.teacherName && (
                                              <p
                                                className={`text-xs ${
                                                  isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {schedule.teacherName}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleDeleteSchedule(schedule.id)
                                            }
                                            disabled={
                                              deletingSchedule === schedule.id
                                            }
                                            className="mt-2 p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors self-end disabled:opacity-50"
                                          >
                                            {deletingSchedule ===
                                            schedule.id ? (
                                              <Loader2
                                                size={14}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <Trash2 size={14} />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <div
                                          className={`h-full flex items-center justify-center text-xs ${
                                            isDarkMode
                                              ? "text-gray-600"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          Libre
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`text-center py-12 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Calendar
                          size={64}
                          className="mx-auto mb-4 opacity-50"
                        />
                        <p className="text-lg">
                          Veuillez sélectionner une salle pour voir son emploi
                          du temps
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-center py-12 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <Calendar size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      Veuillez sélectionner une classe pour gérer les emplois du
                      temps
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajouter Matière */}
      {showAddMatiereModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Ajouter une Matière
                </h2>
                <button
                  onClick={() => {
                    setShowAddMatiereModal(false);
                    setNewSubject({ name: "", coefficient: 100, salles: [] });
                    setSelectedMatiere(null);
                    setMatiereSearchTerm("");
                    setShowMatiereDropdown(false);
                  }}
                  className={`p-2 rounded-lg ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Barre de recherche intelligente */}
                <div className="matiere-search-container">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <Search size={16} className="inline mr-2" />
                    Rechercher ou créer une matière *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matiereSearchTerm}
                      onChange={(e) => {
                        setMatiereSearchTerm(e.target.value);
                        setShowMatiereDropdown(true);
                        setSelectedMatiere(null);
                      }}
                      onFocus={() => setShowMatiereDropdown(true)}
                      placeholder="Tapez pour rechercher ou créer une matière..."
                      className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                    <Search
                      size={18}
                      className={`absolute left-3 top-3.5 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    />

                    {/* Dropdown de suggestions */}
                    {showMatiereDropdown && (
                      <div
                        className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {getFilteredDefaultSubjects().length > 0 ? (
                          <>
                            <div
                              className={`px-3 py-2 text-xs font-semibold uppercase ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Matières suggérées
                            </div>
                            {getFilteredDefaultSubjects().map(
                              (subject, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSelectMatiere(subject)}
                                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  <div>
                                    <p className="font-medium">
                                      {subject.name}
                                    </p>
                                    <p
                                      className={`text-sm ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      Coefficient: {subject.coefficient}
                                    </p>
                                  </div>
                                  <Book size={16} className="text-blue-500" />
                                </button>
                              )
                            )}
                          </>
                        ) : null}

                        {/* Option pour créer une nouvelle matière */}
                        {matiereSearchTerm.trim() && (
                          <>
                            <div
                              className={`px-3 py-2 text-xs font-semibold uppercase border-t ${
                                isDarkMode
                                  ? "text-gray-400 border-gray-600"
                                  : "text-gray-600 border-gray-200"
                              }`}
                            >
                              Créer une nouvelle matière
                            </div>
                            <button
                              onClick={handleCreateCustomMatiere}
                              className={`w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              <Plus size={18} className="text-green-500" />
                              <div>
                                <p className="font-medium">
                                  Créer "{matiereSearchTerm.trim()}"
                                </p>
                                <p
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Nouvelle matière avec coefficient par défaut
                                  (100)
                                </p>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Matière sélectionnée */}
                  {selectedMatiere && (
                    <div
                      className={`mt-3 p-4 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-blue-900/20 border-blue-700"
                          : "bg-blue-50 border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            ✓ Matière sélectionnée : {selectedMatiere.name}
                          </p>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Coefficient: {selectedMatiere.coefficient}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Modifier le coefficient */}
                          <input
                            type="number"
                            min="1"
                            value={selectedMatiere.coefficient}
                            onChange={(e) =>
                              setSelectedMatiere((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      coefficient:
                                        parseInt(e.target.value) || 100,
                                    }
                                  : null
                              )
                            }
                            className={`w-20 p-2 border rounded text-center ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Salles concernées * ({newSubject.salles.length}{" "}
                    sélectionnée(s))
                  </label>
                  <div
                    className={`border rounded-lg p-4 max-h-60 overflow-y-auto ${
                      isDarkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  >
                    <div className="space-y-2">
                      {getSallesForSelectedClasse().map((salle) => (
                        <label
                          key={salle.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                            newSubject.salles.includes(salle.id)
                              ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                              : isDarkMode
                              ? "hover:bg-gray-700 border-2 border-transparent"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          } transition-colors`}
                        >
                          <input
                            type="checkbox"
                            checked={newSubject.salles.includes(salle.id)}
                            onChange={(e) => {
                              setNewSubject((prev) => ({
                                ...prev,
                                salles: e.target.checked
                                  ? [...prev.salles, salle.id]
                                  : prev.salles.filter((id) => id !== salle.id),
                              }));
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <span
                              className={`font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {salle.name}
                            </span>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {salle.maxStudents} élèves max
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddMatiereModal(false);
                    setNewSubject({ name: "", coefficient: 100, salles: [] });
                    setSelectedMatiere(null);
                    setMatiereSearchTerm("");
                    setShowMatiereDropdown(false);
                  }}
                  className={`flex-1 py-3 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddMatiereToLocal}
                  disabled={!selectedMatiere || newSubject.salles.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter aux {newSubject.salles.length} salle(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier Matière */}
      {showEditMatiereModal && editingMatiere && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg shadow-xl max-w-md w-full ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Modifier la Matière
                </h2>
                <button
                  onClick={() => {
                    setShowEditMatiereModal(false);
                    setEditingMatiere(null);
                  }}
                  className={`p-2 rounded-lg ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nom de la matière
                  </label>
                  <input
                    type="text"
                    value={editingMatiere.name}
                    onChange={(e) =>
                      setEditingMatiere((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Coefficient
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingMatiere.coefficient}
                    onChange={(e) =>
                      setEditingMatiere((prev) =>
                        prev
                          ? {
                              ...prev,
                              coefficient: parseInt(e.target.value) || 100,
                            }
                          : null
                      )
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditMatiereModal(false);
                    setEditingMatiere(null);
                  }}
                  className={`flex-1 py-3 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateMatiere}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Cours */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg shadow-xl max-w-md w-full ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Ajouter un Cours
                </h2>
                <button
                  onClick={() => {
                    setShowAddScheduleModal(false);
                    setScheduleForm({
                      day: "",
                      timeSlot: "",
                      subject: "",
                      professeur: "",
                    });
                    setProfesseurSearchTerm("");
                    setSelectedProfesseur(null);
                    setShowProfesseurDropdown(false);
                  }}
                  className={`p-2 rounded-lg ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Jour *
                  </label>
                  <select
                    value={scheduleForm.day}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        day: e.target.value,
                      }))
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Sélectionner un jour</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Horaire *
                  </label>
                  <select
                    value={scheduleForm.timeSlot}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        timeSlot: e.target.value,
                      }))
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Sélectionner un horaire</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Matière *
                  </label>
                  <select
                    value={scheduleForm.subject}
                    onChange={(e) => {
                      // Réinitialiser le professeur quand on change de matière
                      setScheduleForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                        professeur: "", // Réinitialiser le professeur
                      }));
                      setSelectedProfesseur(null);
                      setProfesseurSearchTerm("");
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Sélectionner une matière</option>
                    {getSelectedSalleData()?.subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <Users size={16} className="inline mr-2" />
                    Professeur (optionnel)
                  </label>

                  {/* ✅ NOUVEAU COMPOSANT DE RECHERCHE */}
                  <div className="professeur-search-container">
                    <div className="relative">
                      <input
                        type="text"
                        value={professeurSearchTerm}
                        onChange={(e) => {
                          setProfesseurSearchTerm(e.target.value);
                          setShowProfesseurDropdown(true);
                          if (!e.target.value) {
                            handleClearProfesseur();
                          }
                        }}
                        onFocus={() => setShowProfesseurDropdown(true)}
                        placeholder="Rechercher un professeur..."
                        className={`w-full p-3 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                      <Search
                        size={18}
                        className={`absolute left-3 top-3.5 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      />

                      {/* Bouton pour effacer */}
                      {professeurSearchTerm && (
                        <button
                          type="button"
                          onClick={handleClearProfesseur}
                          className={`absolute right-3 top-3.5 ${
                            isDarkMode
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <X size={18} />
                        </button>
                      )}

                      {/* Dropdown de suggestions */}
                      {showProfesseurDropdown && (
                        <div
                          className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {getFilteredProfesseurs().length > 0 ? (
                            <>
                              <div
                                className={`px-3 py-2 text-xs sticky top-0 border-b ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div
                                  className={`font-semibold uppercase ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {getFilteredProfesseurs().length}{" "}
                                  professeur(s) trouvé(s)
                                </div>
                                <div
                                  className={`text-xs mt-1 italic ${
                                    isDarkMode
                                      ? "text-blue-400"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {getProfesseurFilterMessage()}
                                </div>
                              </div>

                              {/* Option "Aucun professeur" */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleClearProfesseur();
                                  setShowProfesseurDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3 border-b ${
                                  isDarkMode
                                    ? "text-gray-300 border-gray-600"
                                    : "text-gray-700 border-gray-200"
                                }`}
                              >
                                <X size={16} className="text-red-500" />
                                <span className="italic">
                                  Aucun professeur assigné
                                </span>
                              </button>

                              {/* Liste des professeurs */}
                              {getFilteredProfesseurs().map((prof) => {
                                // Récupérer les matières enseignées dans cette classe/salle
                                const salleData = getSelectedSalleData();

                                // Fonction pour convertir l'ID de matière en nom
                                const getMatiereNameById = (matiereId: string): string => {
                                  if (!salleData) return matiereId;
                                  const matiere = salleData.subjects.find((s) => s.id === matiereId);
                                  return matiere ? matiere.name : matiereId;
                                };

                                // Récupérer les matières enseignées par ce professeur dans cette classe/salle
                                const matieresEnseignees = salleData
                                  ? prof.sequences
                                      .filter((seq) => {
                                        return (
                                          seq.classe === selectedClasse &&
                                          seq.salle === selectedSalle &&
                                          !seq.deleted
                                        );
                                      })
                                      .map((seq) => getMatiereNameById(seq.matiere))
                                  : [];

                                return (
                                  <button
                                    key={prof.id}
                                    type="button"
                                    onClick={() => handleSelectProfesseur(prof)}
                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between ${
                                      scheduleForm.professeur === prof.id
                                        ? "bg-blue-100 dark:bg-blue-900/30"
                                        : ""
                                    } ${
                                      isDarkMode ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <Users
                                        size={16}
                                        className="text-blue-500 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium">
                                          {prof.prenom} {prof.nom}
                                        </p>
                                        {prof.email && (
                                          <p
                                            className={`text-xs ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {prof.email}
                                          </p>
                                        )}
                                        {matieresEnseignees.length > 0 && (
                                          <p
                                            className={`text-xs mt-1 ${
                                              isDarkMode
                                                ? "text-green-400"
                                                : "text-green-600"
                                            }`}
                                          >
                                            📚 {matieresEnseignees.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {scheduleForm.professeur === prof.id && (
                                      <Check
                                        size={16}
                                        className="text-blue-500"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </>
                          ) : (
                            <div
                              className={`px-4 py-8 text-center ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              <Users
                                size={48}
                                className="mx-auto mb-2 opacity-50"
                              />
                              <p>Aucun professeur trouvé</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Professeur sélectionné */}
                    {selectedProfesseur && (
                      <div
                        className={`mt-3 p-4 rounded-lg border-2 ${
                          isDarkMode
                            ? "bg-blue-900/20 border-blue-700"
                            : "bg-blue-50 border-blue-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            <span
                              className={`font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedProfesseur.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearProfesseur}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <X size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avertissement de conflit */}
                {scheduleForm.professeur &&
                  scheduleForm.day &&
                  scheduleForm.timeSlot &&
                  (() => {
                    const [startTime, endTime] =
                      scheduleForm.timeSlot.split(" - ");
                    const conflict = checkProfesseurConflict(
                      scheduleForm.professeur,
                      scheduleForm.day,
                      startTime,
                      endTime
                    );
                    return (
                      conflict.hasConflict && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                          <AlertCircle
                            size={18}
                            className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                          />
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {conflict.conflictDetails}
                          </p>
                        </div>
                      )
                    );
                  })()}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddScheduleModal(false);
                    setScheduleForm({
                      day: "",
                      timeSlot: "",
                      subject: "",
                      professeur: "",
                    });
                    setProfesseurSearchTerm("");
                    setSelectedProfesseur(null);
                    setShowProfesseurDropdown(false);
                  }}
                  className={`flex-1 py-3 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddScheduleToLocal}
                  disabled={
                    !scheduleForm.day ||
                    !scheduleForm.timeSlot ||
                    !scheduleForm.subject
                  }
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMatierePage;
