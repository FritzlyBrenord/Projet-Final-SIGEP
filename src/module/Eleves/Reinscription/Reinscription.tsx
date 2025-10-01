import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Search,
  Filter,
  ArrowRight,
  Users,
  GraduationCap,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useEleves } from "@/Context/ContextEleves";
import { useNotes } from "@/Context/ContextNotes";
import { useDecisionFinAnnee } from "@/Context/ContextDecisionFinAnnee";
import { SelectData, UpdateData } from "@/Config/SupabaseData";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";
import {
  EleveAffiche,
  ElevePermanent,
  EleveInscription,
  ReinscriptionData,
} from "@/types/EleveTypeV2";
import { DecisionFinAnnee } from "@/types/DecisionFinAnneeType";

interface ReenrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface StudentWithDecision extends EleveAffiche {
  decision?: DecisionFinAnnee | null;
  classeActuelleNom: string;
  salleActuelleNom: string;
  currentClasseId?: string;
  currentSalleId?: string;
  currentClasseNom?: string;
  currentSalleNom?: string;
}

const ReenrollmentModal: React.FC<ReenrollmentModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  const { currentYear, schoolYears } = useAnneeScolaire();
  const { reinscrireEleve } = useEleves();
  const {
    calculateMoyenneGeneraleAnnuelle,
    calculateMoyenneGeneraleTrimestre,
  } = useNotes();
  const { getDecisionByEleve } = useDecisionFinAnnee();
  const { addActivity } = useRecentActivities();

  const [studentsPrevYear, setStudentsPrevYear] = useState<
    StudentWithDecision[]
  >([]);
  const [selectedStudents, setSelectedStudents] = useState<
    StudentWithDecision[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSalle, setFilterSalle] = useState("");
  const [filterDecision, setFilterDecision] = useState(""); // Nouveau filtre par décision
  const [selectedNewClass, setSelectedNewClass] = useState("");
  const [selectedNewSalle, setSelectedNewSalle] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudentsForMultiple, setSelectedStudentsForMultiple] =
    useState<Set<string>>(new Set()); // Sélection multiple
  const [alreadyReenrolledIds, setAlreadyReenrolledIds] = useState<Set<string>>(
    new Set()
  );
  const [alreadyReenrolledStudents, setAlreadyReenrolledStudents] = useState<
    StudentWithDecision[]
  >([]);
  // Retirer showAlreadyReenrolled et alreadyGrouped - plus nécessaires
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filtres pour les élèves déjà réinscrits
  const [reenrolledFilterClass, setReenrolledFilterClass] = useState("");
  const [reenrolledFilterSalle, setReenrolledFilterSalle] = useState("");
  const [reenrolledShowFilters, setReenrolledShowFilters] = useState(false);

  // États pour afficher/cacher les sections
  const [showStudentsToReenroll, setShowStudentsToReenroll] = useState(true);
  const [showAlreadyReenrolledModal, setShowAlreadyReenrolledModal] =
    useState(false);

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

  // Obtenir l'année précédente
  const previousYear = useMemo(() => {
    if (!currentYear || !schoolYears) return null;

    return schoolYears
      .slice()
      .sort((a, b) => a.year.localeCompare(b.year))
      .filter((y) => y.year < currentYear.year)
      .pop();
  }, [currentYear, schoolYears]);

  const calculateMoyenneTrimestrielleForYear = useCallback(
    (
      eleveId: string,
      trimestre: 1 | 2 | 3,
      year: any,
      notesOfYear: any[]
    ): number => {
      if (!year) return 0;

      let totalPoints = 0;
      let totalCoefficient = 0;

      for (const classe of year.classes) {
        for (const salle of classe.salles) {
          for (const matiere of salle.subjects) {
            const note = notesOfYear.find(
              (n) =>
                n.eleve_id === eleveId &&
                n.matiere_id === matiere.id &&
                n.trimestre === trimestre &&
                !n.deleted &&
                n.annee_scolaire_id === year.id
            );
            if (note) {
              totalPoints += note.note;
              totalCoefficient += matiere.coefficient;
            }
          }
        }
      }

      if (totalCoefficient === 0) return 0;
      return (totalPoints / totalCoefficient) * 10;
    },
    [] // Ajoutez des dépendances si nécessaire
  );

  const calculateMoyenneAnnuelleForYear = useCallback(
    (eleveId: string, year: any, notesOfYear: any[]): number => {
      const t1 =
        calculateMoyenneTrimestrielleForYear(eleveId, 1, year, notesOfYear) ||
        0;
      const t2 =
        calculateMoyenneTrimestrielleForYear(eleveId, 2, year, notesOfYear) ||
        0;
      const t3 =
        calculateMoyenneTrimestrielleForYear(eleveId, 3, year, notesOfYear) ||
        0;
      return (t1 + t2 + t3) / 3;
    },
    [calculateMoyenneTrimestrielleForYear]
  );

  // Normaliser la valeur de décision depuis la base
  const normalizeDecisionValue = (
    value: any
  ): "ADMIS" | "REDOUBLER" | "EXPULSER" | null => {
    if (!value) return null;
    const v = String(value).trim().toUpperCase();
    if (v === "ADMIS") return "ADMIS";
    if (v === "REDOUBLER" || v === "REDOUBLE" || v === "REDOUBLANT")
      return "REDOUBLER";
    if (
      v === "EXPULSER" ||
      v === "EXPULSE" ||
      v === "EXCLU" ||
      v === "EXCLUSION"
    )
      return "EXPULSER";
    return null;
  };

  // Chargement élèves année précédente
  useEffect(() => {
    const loadPreviousYearStudents = async () => {
      if (!isOpen || !currentYear || !previousYear) {
        setStudentsPrevYear([]);
        return;
      }

      // Reset des filtres et sélections
      setSearchTerm("");
      setFilterClass("");
      setFilterSalle("");
      setSelectedStudents([]);
      setSelectedNewClass("");
      setSelectedNewSalle("");
      setShowFilters(false);
      setReenrolledFilterClass("");
      setReenrolledFilterSalle("");
      setReenrolledShowFilters(false);

      try {
        // Récupérer tous les élèves, inscriptions, notes et décisions (une seule fois)
        const [elevesRows, inscriptionsRows, notesRows, decisionsRows] =
          await Promise.all([
            SelectData("eleves"),
            SelectData("eleves_inscriptions"),
            SelectData("notes"),
            SelectData("decision_de_fin_annee"),
          ]);

        // Filtrer les inscriptions de l'année précédente
        const inscriptionsPrevYear = (inscriptionsRows || []).filter(
          (i: EleveInscription) =>
            !i.deleted && i.annee_scolaire_id === previousYear.id
        );

        // Filtrer les notes de l'année précédente uniquement
        const notesPrevYear = (notesRows || []).filter(
          (n: any) => !n.deleted && n.annee_scolaire_id === previousYear.id
        );

        // Filtrer les décisions de l'année précédente uniquement et choisir la plus récente par élève
        const decisionsPrevYear = (decisionsRows || [])
          .filter(
            (d: any) => !d.deleted && d.annee_scolaire_id === previousYear.id
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.date_decision).getTime() -
              new Date(a.date_decision).getTime()
          )
          .reduce((acc: Record<string, any>, d: any) => {
            if (!acc[d.eleve_id]) acc[d.eleve_id] = d;
            return acc;
          }, {} as Record<string, any>);

        // Créer la liste des élèves avec leurs informations
        const studentsWithData: StudentWithDecision[] = inscriptionsPrevYear
          .map((inscription: EleveInscription) => {
            const eleve = (elevesRows || []).find(
              (e: ElevePermanent) => e.id === inscription.eleve_id && !e.deleted
            );
            if (!eleve) return null;

            // Trouver la classe et salle depuis l'année précédente
            let classeActuelleNom = "";
            let salleActuelleNom = "";

            if (previousYear) {
              const classe = previousYear.classes.find(
                (c: any) => c.id === inscription.classe_id
              );
              if (classe) {
                classeActuelleNom = classe.name;
                const salle = classe.salles.find(
                  (s: any) => s.id === inscription.salle_id
                );
                if (salle) {
                  salleActuelleNom = salle.name;
                }
              }
            }

            // Obtenir la décision de fin d'année pour cet élève (année précédente, depuis la base)
            const decisionRecord = decisionsPrevYear[eleve.id] || null;
            const normalized = decisionRecord
              ? normalizeDecisionValue(decisionRecord.decision)
              : null;
            const decision: DecisionFinAnnee | null =
              decisionRecord && normalized
                ? {
                    id: decisionRecord.id,
                    eleve_id: decisionRecord.eleve_id,
                    annee_scolaire_id: decisionRecord.annee_scolaire_id,
                    observation: decisionRecord.observation,
                    decision: normalized,
                    date_decision: decisionRecord.date_decision,
                    created_at: decisionRecord.created_at,
                    updated_at: decisionRecord.updated_at,
                    deleted: decisionRecord.deleted,
                  }
                : null;

            // Calculer la moyenne générale sur l'année précédente, en se basant sur les notes de cette année
            const moyenneGenerale =
              calculateMoyenneAnnuelleForYear(
                eleve.id,
                previousYear,
                notesPrevYear
              ) ||
              eleve.moyenne_generale ||
              0;

            // Créer l'objet EleveAffiche avec les données d'inscription
            const eleveAffiche: EleveAffiche = {
              ...eleve,
              inscription_id: inscription.id,
              statut: inscription.statut,
              date_inscription: inscription.date_inscription,
              observations_inscription: inscription.observations,
              annee_scolaire_id: inscription.annee_scolaire_id,
              classe_id: inscription.classe_id,
              salle_id: inscription.salle_id,
              moyenne_generale: moyenneGenerale,
            };

            return {
              ...eleveAffiche,
              decision,
              classeActuelleNom,
              salleActuelleNom,
            };
          })
          .filter(Boolean) as StudentWithDecision[];

        // Identifier les élèves déjà réinscrits dans l'année actuelle
        const inscriptionsCurrentYear = (inscriptionsRows || []).filter(
          (i: EleveInscription) =>
            !i.deleted && i.annee_scolaire_id === currentYear.id
        );
        const currentYearEleveIds = new Set(
          inscriptionsCurrentYear.map((i: EleveInscription) => i.eleve_id)
        );

        setAlreadyReenrolledIds(currentYearEleveIds);

        // Construire la liste des élèves déjà réinscrits (pour affichage/annulation)
        const already = studentsWithData.filter((s) =>
          currentYearEleveIds.has(s.id)
        );

        // Ajouter les informations de classe/salle actuelles pour les élèves déjà réinscrits
        const alreadyWithCurrentInfo = already.map((student) => {
          const currentInscription = inscriptionsCurrentYear.find(
            (i: EleveInscription) => i.eleve_id === student.id
          );

          if (currentInscription && currentYear) {
            const currentClasse = currentYear.classes.find(
              (c: any) => c.id === currentInscription.classe_id
            );
            const currentSalle = currentClasse?.salles.find(
              (s: any) => s.id === currentInscription.salle_id
            );

            return {
              ...student,
              currentClasseId: currentInscription.classe_id,
              currentSalleId: currentInscription.salle_id,
              currentClasseNom: currentClasse?.name || "?",
              currentSalleNom: currentSalle?.name || "?",
            };
          }

          return student;
        });

        setAlreadyReenrolledStudents(alreadyWithCurrentInfo);

        // Conserver uniquement les élèves non encore réinscrits dans la liste disponible
        setStudentsPrevYear(
          studentsWithData.filter((s) => !currentYearEleveIds.has(s.id))
        );
      } catch (error) {
        console.error("Erreur lors du chargement des élèves:", error);
        setStudentsPrevYear([]);
      }
    };

    loadPreviousYearStudents();
  }, [
    isOpen,
    currentYear,
    previousYear,
    getDecisionByEleve,
    calculateMoyenneGeneraleAnnuelle,
    calculateMoyenneAnnuelleForYear,
  ]);

  // Filtrer les élèves déjà réinscrits selon les critères
  const filteredAlreadyReenrolled = alreadyReenrolledStudents.filter(
    (student) => {
      // Utiliser les informations de la classe/salle actuelle pour le filtrage
      if (
        reenrolledFilterClass &&
        student.currentClasseId !== reenrolledFilterClass
      )
        return false;
      if (
        reenrolledFilterSalle &&
        student.currentSalleId !== reenrolledFilterSalle
      )
        return false;
      return true;
    }
  );

  // Fonction pour déterminer la décision de fin d'année
  const getAcademicDecision = (student: StudentWithDecision) => {
    // Utiliser exclusivement la décision enregistrée en base pour l'année précédente
    if (student.decision) {
      switch (student.decision.decision) {
        case "ADMIS":
          return {
            type: "ADMIS" as const,
            label: "Admis",
            color: "text-green-600",
            bgColor: "bg-green-100",
            canReenroll: true,
          };
        case "REDOUBLER":
          return {
            type: "REDOUBLER" as const,
            label: "Redouble",
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            canReenroll: true,
          };
        case "EXPULSER":
          return {
            type: "EXPULSER" as const,
            label: "Expulsé",
            color: "text-red-600",
            bgColor: "bg-red-100",
            canReenroll: false,
          };
      }
    }

    // Aucune décision enregistrée
    return {
      type: "INCONNUE" as const,
      label: "Décision manquante",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      canReenroll: false,
    };
  };

  // Décision système basée sur la moyenne annuelle
  const getSystemDecision = (moyenne: number) => {
    if (moyenne >= 5.5) {
      return {
        type: "REUSSIT" as const,
        label: "Réussit",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }
    if (moyenne >= 3.0 && moyenne <= 4.49) {
      return {
        type: "ECHOUER" as const,
        label: "Échouer",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      };
    }
    if (moyenne <= 2.99) {
      return {
        type: "TRES_MAL" as const,
        label: "Très mal",
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    }
    // Cas intermédiaire 4.5 - 5.49
    return {
      type: "AVERTISSEMENT" as const,
      label: "Avertissement",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    };
  };

  // Proposer automatiquement la classe/salle cible pour un élève admis
  const suggestNextClassAndSalle = (
    student: StudentWithDecision
  ): { classId: string | null; salleId: string | null } => {
    if (!currentYear) return { classId: null, salleId: null };

    // Déterminer prochain niveau à partir du nom de classe actuel (ex. "1", "1ère", "2ème", etc.)
    const currentName = student.classeActuelleNom || "";
    const numberMatch = currentName.match(/(\d+)/);
    const currentNum = numberMatch ? parseInt(numberMatch[1], 10) : NaN;

    let targetClass = null as any;
    if (!isNaN(currentNum)) {
      // Chercher une classe dont le nom contient le nombre suivant
      const nextNum = currentNum + 1;
      targetClass = currentYear.classes.find((c) =>
        new RegExp(`(^|\\D)${nextNum}(\\D|$)`).test(c.name)
      );
    }

    // Si non trouvé, tenter par heuristic: même nom avec remplacement des mots clés 1er→2eme, 2eme→3eme etc.
    if (!targetClass) {
      const replacements: [RegExp, string][] = [
        [/1\s?e?r?e?/i, "2eme"],
        [/2\s?e?m?e?/i, "3eme"],
        [/3\s?e?m?e?/i, "4eme"],
      ];
      let candidate = currentName;
      for (const [from, to] of replacements) {
        if (from.test(currentName)) {
          candidate = currentName.replace(from, to);
          break;
        }
      }
      targetClass = currentYear.classes.find(
        (c) => c.name.toLowerCase() === candidate.toLowerCase()
      );
    }

    // Si toujours pas, prendre la classe suivante dans l'ordre trié par nom
    if (!targetClass) {
      const sorted = currentYear.classes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      const idx = sorted.findIndex((c) => c.name === student.classeActuelleNom);
      targetClass =
        idx >= 0 && idx + 1 < sorted.length ? sorted[idx + 1] : null;
    }

    if (!targetClass) return { classId: null, salleId: null };

    // Choisir Salle B si disponible, sinon la 2ème salle, sinon la première
    let targetSalle =
      targetClass.salles.find((s: any) => /\bB\b/i.test(s.name)) ||
      (targetClass.salles.length > 1
        ? targetClass.salles[1]
        : targetClass.salles[0]) ||
      null;

    return {
      classId: targetClass.id,
      salleId: targetSalle ? targetSalle.id : null,
    };
  };

  // Filtrer les élèves disponibles (partie droite)
  const availableStudents = studentsPrevYear.filter((student) => {
    // Exclure ceux déjà réinscrits (sécurité supplémentaire)
    if (alreadyReenrolledIds.has(student.id)) return false;
    // Exclure les élèves déjà sélectionnés
    if (selectedStudents.some((s) => s.id === student.id)) return false;

    // Filtres de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !student.nom.toLowerCase().includes(searchLower) &&
        !student.prenom.toLowerCase().includes(searchLower) &&
        !student.code.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Filtres par classe et salle
    if (filterClass && student.classe_id !== filterClass) return false;
    if (filterSalle && student.salle_id !== filterSalle) return false;

    // Filtre par décision académique
    if (filterDecision) {
      const decision = getAcademicDecision(student);
      if (filterDecision === "ADMIS" && decision.type !== "ADMIS") return false;
      if (filterDecision === "REDOUBLER" && decision.type !== "REDOUBLER")
        return false;
      if (filterDecision === "EXPULSER" && decision.type !== "EXPULSER")
        return false;
      if (filterDecision === "INCONNUE" && decision.type !== "INCONNUE")
        return false;
    }

    return true;
  });

  // Ajouter un élève à la liste de réinscription
  const addStudentToReenrollment = (student: StudentWithDecision) => {
    const academicDecision = getAcademicDecision(student);

    if (!academicDecision.canReenroll) {
      alert(
        academicDecision.type === "EXPULSER"
          ? "Cet élève ne peut pas être réinscrit (expulsé)"
          : "Décision académique manquante ou non favorable"
      );
      return;
    }

    // Pré-remplir la classe/salle cible: si redouble, même classe/salle; sinon proposer classe suivante
    if (!selectedNewClass || !selectedNewSalle) {
      if (academicDecision.type === "REDOUBLER") {
        setSelectedNewClass(student.classe_id);
        setSelectedNewSalle(student.salle_id);
      } else {
        const suggestion = suggestNextClassAndSalle(student);
        if (suggestion.classId) setSelectedNewClass(suggestion.classId);
        if (suggestion.salleId) setSelectedNewSalle(suggestion.salleId);
      }
    }

    setSelectedStudents((prev) => [...prev, student]);
  };

  // Fonctions pour la sélection multiple
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentsForMultiple((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAllByDecision = (
    decisionType: "ADMIS" | "REDOUBLER" | "EXPULSER" | "INCONNUE"
  ) => {
    const studentsWithDecision = availableStudents.filter((student) => {
      const decision = getAcademicDecision(student);
      return decision.type === decisionType;
    });

    const studentIds = new Set(studentsWithDecision.map((s) => s.id));
    setSelectedStudentsForMultiple(studentIds);
  };

  const clearAllSelections = () => {
    setSelectedStudentsForMultiple(new Set());
  };

  const addSelectedStudentsToReenrollment = () => {
    if (selectedStudentsForMultiple.size === 0) {
      alert("Aucun élève sélectionné");
      return;
    }

    // Récupérer les élèves sélectionnés
    const studentsToAdd = availableStudents.filter((s) =>
      selectedStudentsForMultiple.has(s.id)
    );

    // Vérifier que tous ont la même décision
    const decisions = studentsToAdd.map((s) => getAcademicDecision(s).type);
    const uniqueDecisions = [...new Set(decisions)];

    if (uniqueDecisions.length > 1) {
      alert(
        "Tous les élèves sélectionnés doivent avoir la même décision académique (Admis, Redoubler ou Expulsé)"
      );
      return;
    }

    // Vérifier que tous peuvent être réinscrits
    const cannotReenroll = studentsToAdd.filter(
      (s) => !getAcademicDecision(s).canReenroll
    );
    if (cannotReenroll.length > 0) {
      alert(
        `${cannotReenroll.length} élève(s) ne peuvent pas être réinscrits (expulsés ou décision manquante)`
      );
      return;
    }

    // Déterminer la classe/salle cible pour le premier élève (logique de référence)
    const firstStudent = studentsToAdd[0];
    const firstDecision = getAcademicDecision(firstStudent);

    if (!selectedNewClass || !selectedNewSalle) {
      if (firstDecision.type === "REDOUBLER") {
        setSelectedNewClass(firstStudent.classe_id);
        setSelectedNewSalle(firstStudent.salle_id);
      } else {
        const suggestion = suggestNextClassAndSalle(firstStudent);
        if (suggestion.classId) setSelectedNewClass(suggestion.classId);
        if (suggestion.salleId) setSelectedNewSalle(suggestion.salleId);
      }
    }

    // Ajouter tous les élèves sélectionnés
    setSelectedStudents((prev) => [...prev, ...studentsToAdd]);

    // Nettoyer la sélection multiple
    setSelectedStudentsForMultiple(new Set());
  };

  // Retirer un élève de la liste de réinscription
  const removeStudentFromReenrollment = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Confirmer la réinscription
  const confirmReenrollment = async () => {
    setIsConfirming(true);
    if (!selectedNewClass || !selectedNewSalle) {
      alert(
        "Veuillez sélectionner une classe et une salle pour la réinscription"
      );
      setIsConfirming(false);
      return;
    }

    if (selectedStudents.length === 0) {
      alert("Aucun élève sélectionné pour la réinscription");
      setIsConfirming(false);
      return;
    }

    if (!currentYear) {
      alert("Aucune année scolaire sélectionnée");
      setIsConfirming(false);
      return;
    }

    try {
      // Réinscrire chaque élève sélectionné
      for (const student of selectedStudents) {
        const decision = getAcademicDecision(student);

        let targetClassId = selectedNewClass;
        let targetSalleId = selectedNewSalle;

        // Si l'élève redouble, il reste dans sa classe/salle actuelle
        // Pour cela, on doit trouver la classe équivalente dans l'année actuelle
        if (decision.type === "REDOUBLER") {
          // Chercher une classe avec le même nom dans l'année actuelle
          const currentEquivalentClass = currentYear.classes.find(
            (c) => c.name === student.classeActuelleNom
          );
          if (currentEquivalentClass) {
            targetClassId = currentEquivalentClass.id;
            // Chercher une salle avec le même nom
            const currentEquivalentSalle = currentEquivalentClass.salles.find(
              (s) => s.name === student.salleActuelleNom
            );
            if (currentEquivalentSalle) {
              targetSalleId = currentEquivalentSalle.id;
            }
          }
        }

        const reinscriptionData: ReinscriptionData = {
          eleve_id: student.id,
          statut: "actif",
          observations: `Réinscription automatique - ${decision.label}`,
          annee_scolaire_id: currentYear.id,
          classe_id: targetClassId,
          salle_id: targetSalleId,
        };

        await reinscrireEleve(reinscriptionData);

        // Journaliser la réinscription
        await addActivity({
          action: "reinscription",
          module: "Gestion Élèves",
          title: "Réinscription d'élève",
          details: `${student.prenom} ${student.nom} réinscrit (${decision.label}).`,
          source_table: "eleves_inscriptions",
          entity_id: student.id,
        });
      }

      alert(`${selectedStudents.length} élève(s) réinscrit(s) avec succès!`);

      // Reset
      setSelectedStudents([]);
      setSelectedNewClass("");
      setSelectedNewSalle("");
      onClose();
    } catch (error) {
      console.error("Erreur lors de la réinscription:", error);
      alert("Erreur lors de la réinscription. Veuillez réessayer.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Annuler la réinscription pour un élève (année actuelle): marquer l'inscription comme supprimée
  const cancelReenrollment = async (studentId: string) => {
    if (!currentYear) return;
    try {
      setCancellingId(studentId);
      const inscriptions = await SelectData("eleves_inscriptions");
      const current = (inscriptions || []).find(
        (i: EleveInscription) =>
          i.eleve_id === studentId &&
          i.annee_scolaire_id === currentYear.id &&
          !i.deleted
      );
      if (!current) {
        alert("Aucune réinscription trouvée à annuler");
        return;
      }
      const ok = await UpdateData("eleves_inscriptions", current.id, {
        deleted: true,
      });
      if (!ok) throw new Error("Échec de l'annulation");
      // Journaliser l'annulation de réinscription (suppression soft)
      await addActivity({
        action: "suppression",
        module: "Gestion Élèves",
        title: "Annulation de réinscription",
        details: `Réinscription annulée pour l'élève ${studentId}.`,
        source_table: "eleves_inscriptions",
        entity_id: studentId,
      });
      // Recharger la liste
      setAlreadyReenrolledIds((prev) => {
        const copy = new Set(prev);
        copy.delete(studentId);
        return copy;
      });
      // Recharger via effet
      // Option: rafraîchir en rappelant loadPreviousYearStudents en forçant dépendances
      // Ici, on met simplement à jour l'état local pour réapparaître dans la liste disponible
      const restored = alreadyReenrolledStudents.find(
        (s) => s.id === studentId
      );
      if (restored) {
        setStudentsPrevYear((prev) => [...prev, restored]);
        setAlreadyReenrolledStudents((prev) =>
          prev.filter((s) => s.id !== studentId)
        );
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'annulation de la réinscription");
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen) return null;

  const modalClasses = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
      <div
        className={`${modalClasses} rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col`}
      >
        {/* En-tête */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Réinscription des Élèves</h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                De {previousYear?.year || "Année précédente"} vers{" "}
                {currentYear?.year || "Année actuelle"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Partie Droite - Liste des élèves disponibles */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Élèves Disponibles ({availableStudents.length})
                {selectedStudentsForMultiple.size > 0 && (
                  <span className="ml-2 text-sm text-blue-600">
                    {selectedStudentsForMultiple.size} sélectionné(s)
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                {selectedStudentsForMultiple.size > 0 && (
                  <>
                    <button
                      onClick={addSelectedStudentsToReenrollment}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Ajouter sélection ({selectedStudentsForMultiple.size})
                    </button>
                    <button
                      onClick={clearAllSelections}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      Tout déselectionner
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${inputClasses}`}
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filtres */}
            {showFilters && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterClass}
                    onChange={(e) => {
                      setFilterClass(e.target.value);
                      setFilterSalle("");
                    }}
                  >
                    <option value="">Toutes les classes</option>
                    {previousYear?.classes.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterSalle}
                    onChange={(e) => setFilterSalle(e.target.value)}
                    disabled={!filterClass}
                  >
                    <option value="">Toutes les salles</option>
                    {filterClass &&
                      previousYear?.classes
                        .find((c) => c.id === filterClass)
                        ?.salles.map((salle) => (
                          <option key={salle.id} value={salle.id}>
                            {salle.name}
                          </option>
                        ))}
                  </select>

                  <select
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterDecision}
                    onChange={(e) => setFilterDecision(e.target.value)}
                  >
                    <option value="">Toutes les décisions</option>
                    <option value="ADMIS">Admis</option>
                    <option value="REDOUBLER">Redoubler</option>
                    <option value="EXPULSER">Expulsé</option>
                    <option value="INCONNUE">Décision manquante</option>
                  </select>
                </div>

                {/* Boutons de sélection rapide par décision */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2 flex items-center">
                    Sélection rapide :
                  </div>
                  <button
                    onClick={() => selectAllByDecision("ADMIS")}
                    className="px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                  >
                    Tous les Admis
                  </button>
                  <button
                    onClick={() => selectAllByDecision("REDOUBLER")}
                    className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm"
                  >
                    Tous les Redoublants
                  </button>
                  <button
                    onClick={() => selectAllByDecision("EXPULSER")}
                    className="px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                  >
                    Tous les Expulsés
                  </button>
                  <button
                    onClick={() => selectAllByDecision("INCONNUE")}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                  >
                    Décisions manquantes
                  </button>
                </div>
              </div>
            )}

            {/* Liste des élèves */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {availableStudents.map((student) => {
                const decision = getAcademicDecision(student);
                const systemDecision = getSystemDecision(
                  student.moyenne_generale || 0
                );
                const isSelected = selectedStudentsForMultiple.has(student.id);

                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border ${cardClasses} ${
                      isSelected ? "ring-2 ring-blue-500 border-blue-300" : ""
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Checkbox pour sélection multiple */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={!decision.canReenroll}
                        />

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">
                              {student.prenom} {student.nom}
                            </div>
                            <button
                              onClick={() => addStudentToReenrollment(student)}
                              disabled={!decision.canReenroll}
                              className={`p-2 rounded-full transition-colors ${
                                decision.canReenroll
                                  ? "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                              title={
                                decision.canReenroll
                                  ? "Ajouter individuellement à la réinscription"
                                  : "Ne peut pas être réinscrit"
                              }
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>

                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            } mb-2`}
                          >
                            {student.code} • {student.classeActuelleNom} -{" "}
                            {student.salleActuelleNom}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">
                                {student.moyenne_generale.toFixed(2)}/10
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${systemDecision.bgColor} ${systemDecision.color}`}
                              >
                                {systemDecision.label}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${decision.bgColor} ${decision.color}`}
                              >
                                {decision.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mb-4" />
                  <p>Aucun élève trouvé selon les critères de filtrage</p>
                </div>
              )}
            </div>
          </div>

          {/* Partie Gauche - Nouvelle classe et élèves sélectionnés + DÉJÀ RÉINSCRITS */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">
              Réinscription vers {currentYear?.year}
            </h3>

            {/* Sélection de la nouvelle classe */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Classe
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={selectedNewClass}
                  onChange={(e) => {
                    setSelectedNewClass(e.target.value);
                    setSelectedNewSalle("");
                  }}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => (
                    <option key={classe.value} value={classe.value}>
                      {classe.label}
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
                  Salle
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={selectedNewSalle}
                  onChange={(e) => setSelectedNewSalle(e.target.value)}
                  disabled={!selectedNewClass}
                >
                  <option value="">Sélectionner une salle</option>
                  {selectedNewClass &&
                    sallesByClass[selectedNewClass]?.map((salle) => (
                      <option key={salle.value} value={salle.value}>
                        {salle.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Section élèves sélectionnés (à réinscrire) */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() =>
                      setShowStudentsToReenroll(!showStudentsToReenroll)
                    }
                    className="flex items-center gap-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showStudentsToReenroll ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    Élèves à réinscrire ({selectedStudents.length})
                  </button>
                </div>

                {showStudentsToReenroll &&
                  (selectedStudents.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedStudents.map((student) => {
                        const decision = getAcademicDecision(student);
                        const systemDecision = getSystemDecision(
                          student.moyenne_generale || 0
                        );
                        let targetClassName = "";

                        if (decision.type === "REDOUBLER") {
                          targetClassName = student.classeActuelleNom;
                        } else {
                          targetClassName =
                            classes.find((c) => c.value === selectedNewClass)
                              ?.label || "?";
                        }

                        return (
                          <div
                            key={student.id}
                            className={`p-4 rounded-lg border ${cardClasses}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold">
                                {student.prenom} {student.nom}
                              </div>
                              <button
                                onClick={() =>
                                  removeStudentFromReenrollment(student.id)
                                }
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              } mb-2`}
                            >
                              {student.code} • {student.classeActuelleNom} →{" "}
                              {targetClassName}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">
                                  {student.moyenne_generale.toFixed(2)}/10
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${systemDecision.bgColor} ${systemDecision.color}`}
                                >
                                  {systemDecision.label}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${decision.bgColor} ${decision.color}`}
                                >
                                  {decision.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <RotateCcw className="h-12 w-12 mb-2" />
                      <p className="text-sm">Aucun élève sélectionné</p>
                    </div>
                  ))}
              </div>

              {/* Bouton pour voir les élèves déjà réinscrits */}
              {alreadyReenrolledStudents.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowAlreadyReenrolledModal(true)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${cardClasses} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-left">
                          Voir les élèves déjà réinscrits
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {alreadyReenrolledStudents.length} élève(s) dans{" "}
                          {currentYear?.year}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={confirmReenrollment}
                disabled={
                  isConfirming ||
                  selectedStudents.length === 0 ||
                  !selectedNewClass ||
                  !selectedNewSalle
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConfirming
                  ? "Confirmation..."
                  : `Confirmer (${selectedStudents.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal des élèves déjà réinscrits */}
      {showAlreadyReenrolledModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
          <div
            className={`${modalClasses} rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col`}
          >
            {/* En-tête du modal */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold">Élèves Déjà Réinscrits</h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {alreadyReenrolledStudents.length} élève(s) dans{" "}
                    {currentYear?.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlreadyReenrolledModal(false)}
                className={`p-2 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${
                  isDarkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              {/* Filtres */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {filteredAlreadyReenrolled.length} élève(s) affiché(s)
                </div>
                <button
                  onClick={() =>
                    setReenrolledShowFilters(!reenrolledShowFilters)
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${inputClasses}`}
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      reenrolledShowFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {reenrolledShowFilters && (
                <div
                  className={`mb-4 p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Classe
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                        value={reenrolledFilterClass}
                        onChange={(e) => {
                          setReenrolledFilterClass(e.target.value);
                          setReenrolledFilterSalle("");
                        }}
                      >
                        <option value="">Toutes les classes</option>
                        {classes.map((classe) => (
                          <option key={classe.value} value={classe.value}>
                            {classe.label}
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
                        Salle
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                        value={reenrolledFilterSalle}
                        onChange={(e) =>
                          setReenrolledFilterSalle(e.target.value)
                        }
                        disabled={!reenrolledFilterClass}
                      >
                        <option value="">Toutes les salles</option>
                        {reenrolledFilterClass &&
                          sallesByClass[reenrolledFilterClass]?.map((salle) => (
                            <option key={salle.value} value={salle.value}>
                              {salle.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des élèves */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {filteredAlreadyReenrolled.map((student) => {
                  const decision = getAcademicDecision(student);
                  const systemDecision = getSystemDecision(
                    student.moyenne_generale || 0
                  );

                  return (
                    <div
                      key={student.id}
                      className={`p-4 rounded-lg border ${cardClasses}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">
                          {student.prenom} {student.nom}
                        </div>
                        <button
                          onClick={() => cancelReenrollment(student.id)}
                          disabled={cancellingId === student.id}
                          className="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm"
                        >
                          {cancellingId === student.id
                            ? "Annulation..."
                            : "Annuler réinscription"}
                        </button>
                      </div>

                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        } mb-3`}
                      >
                        {student.code} • Classe: {student.currentClasseNom} -{" "}
                        {student.currentSalleNom}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {student.moyenne_generale.toFixed(2)}/10
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${systemDecision.bgColor} ${systemDecision.color}`}
                          >
                            {systemDecision.label}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${decision.bgColor} ${decision.color}`}
                          >
                            {decision.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredAlreadyReenrolled.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mb-4" />
                    <p>
                      {alreadyReenrolledStudents.length === 0
                        ? "Aucun élève déjà réinscrit cette année"
                        : "Aucun élève trouvé selon les critères de filtrage"}
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton de fermeture */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAlreadyReenrolledModal(false)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReenrollmentModal;
