"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import {
  SelectData,
  InsertData,
  UpdateData,
  DeleteData,
  DataExsite,
  DeleteDataMultiple,
  InsertDataReturn,
} from "@/Config/SupabaseData";
import { notify } from "@/components/Notification";

// Types basés sur votre code existant
export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  teacher?: {
    id: string;
    name: string;
  };
}

export interface ScheduleItem {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName?: string;
  teacherId?: string;
}

export interface Salle {
  id: string;
  name: string;
  maxStudents: number;
  subjects: Subject[];
  schedule: ScheduleItem[];
}

export interface Classe {
  id: string;
  name: string;
  salles: Salle[];
  shortName?: string;
}

export interface SchoolYear {
  id: string;
  year: string;
  description: string;
  created: boolean;
  classes: Classe[];
  configurationSaved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sequence {
  id: string;
  classe: string;
  salle: string;
  matiere: string;
  deleted?: boolean;
}

export interface Professeur {
  id: string;
  enseignant_id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  sequences: Sequence[];
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types pour Supabase (structure de base de données)
interface AnneeScolaireDB {
  id: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ClasseDB {
  id: string;
  nom: string;
  niveau: string;
  capacite_max: number;
  annee_scolaire_id: string;
  created_at?: string;
}

interface SalleDB {
  id: string;
  nom: string;
  capacite: number;
  type?: string;
  classe_id: string;
  created_at?: string;
}

interface MatiereDB {
  id: string;
  nom: string;
  code?: string;
  coefficient: number;
  description?: string;
  salle_id: string;
  created_at?: string;
}

interface EmploiDuTempsDB {
  id: string;
  jour: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";
  heure_debut: string;
  heure_fin: string;
  matiere_id: string;
  salle_id: string;
  professeur: string;
  created_at?: string;
}

// Interface du Context
interface AnneeScolaireContextType {
  // États
  schoolYears: SchoolYear[];
  currentYear: SchoolYear | null;
  loading: boolean;
  error: string | null;

  // Actions Années Scolaires

  loadSchoolYears: () => Promise<void>;
  setCurrentYear: (year: SchoolYear | null) => void;

  createSchoolYear: (
    schoolYear: Omit<SchoolYear, "id">
  ) => Promise<string | null>; // ← Retourne ID
  updateSchoolYear: (
    id: string,
    updates: Partial<Omit<SchoolYear, "id">>
  ) => Promise<boolean>;

  deleteSchoolYear: (id: string) => Promise<boolean>;

  // Actions Classes
  loadClasses: (anneeId: string) => Promise<Classe[]>;
  createClasse: (classe: Omit<ClasseDB, "id">) => Promise<boolean>;
  updateClasse: (id: string, classe: Partial<ClasseDB>) => Promise<boolean>;
  deleteClasse: (id: string) => Promise<boolean>;

  // Actions Salles
  loadSalles: (classeId: string) => Promise<Salle[]>;
  createSalle: (salle: Omit<SalleDB, "id">) => Promise<boolean>;
  updateSalle: (id: string, salle: Partial<SalleDB>) => Promise<boolean>;
  deleteSalle: (id: string) => Promise<boolean>;

  // Actions Matières
  loadMatieres: (salleId: string) => Promise<Subject[]>;
  createMatiere: (matiere: Omit<MatiereDB, "id">) => Promise<boolean>;
  updateMatiere: (id: string, matiere: Partial<MatiereDB>) => Promise<boolean>;
  deleteMatiere: (id: string) => Promise<boolean>;

  //id
  getClassNameById: (classId: string) => string;
  getSubjectNameById: (subjectId: string) => string;
  getRoomNameById: (roomId: string) => string;
  getYearNameById: (yearId: string) => string;

  // Actions Emplois du Temps
  loadEmploisDuTemps: (salleId: string) => Promise<ScheduleItem[]>;
  createEmploiDuTemps: (
    emploi: Omit<EmploiDuTempsDB, "id">
  ) => Promise<boolean>;
  updateEmploiDuTemps: (
    id: string,
    emploi: Partial<EmploiDuTempsDB>
  ) => Promise<boolean>;
  deleteEmploiDuTemps: (id: string) => Promise<boolean>;

  // Utilitaires
  convertToSchoolYear: (anneeDB: AnneeScolaireDB) => Promise<SchoolYear>;
  validateYear: (
    year: string,
    existingYears: string[],
    mode: "create" | "edit",
    currentYear?: string
  ) => boolean;
  getNextAvailableYear: () => string;
  resetError: () => void;
  clearLocalStorage: () => void;
}

// Context
const AnneeScolaireContext = createContext<
  AnneeScolaireContextType | undefined
>(undefined);

// Provider
export const AnneeScolaireProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // États
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentYear, setCurrentYearState] = useState<SchoolYear | null>(null);
  // Supprimé: professeurs en local. Utilisez le contexte Professeur directement dans les composants UI si nécessaire.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ordre des classes de NSIV à 1ère
  const CLASSES_ORDER = useMemo(
    () => [
      "NSIV",
      "NSIII",
      "NSII",
      "NSI",
      "9e Année Fondamentale",
      "8e Année Fondamentale",
      "7e Année Fondamentale",
      "6e Année Fondamentale",
      "5e Année Fondamentale",
      "4e Année Fondamentale",
      "3e Année Fondamentale",
      "2e Année Fondamentale",
      "1ère Année Fondamentale",
    ],
    []
  );

  const sortClasses = useCallback(
    (classes: Classe[]): Classe[] => {
      return [...classes].sort((a, b) => {
        const indexA = CLASSES_ORDER.indexOf(a.name);
        const indexB = CLASSES_ORDER.indexOf(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    },
    [CLASSES_ORDER]
  );

  // Formatage lisible des noms de classes
  const formatClassDisplay = (rawName: string): string => {
    if (!rawName) return rawName;

    // Gérer les formes comme "1ère Année Fondamentale" ou "5e Année Fondamentale"
    const fondamentaleRegex = /^(\d+(?:er|ère|e))\s+Année\s+Fondamentale$/i;
    const m = rawName.match(fondamentaleRegex);
    if (m) {
      // Exemple: "1ère" ou "5e" -> "1ère A.F" / "5e A.F"
      return `${m[1]} A.F`;
    }

    // Par défaut, retourner tel quel (NSIV, NSIII, NSII, NSI, etc.)
    return rawName;
  };

  // Utilitaires
  const resetError = () => setError(null);

  // Fonction pour nettoyer le localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("currentSchoolYear");
      console.log("localStorage nettoyé");
    } catch (error) {
      console.error("Erreur lors du nettoyage du localStorage:", error);
    }
  };

  const handleError = (message: string) => {
    setError(message);
    console.error(message);
  };

  // Validation de l'année scolaire
  const validateYear = (
    year: string,
    existingYears: string[],
    mode: "create" | "edit",
    currentYear?: string
  ): boolean => {
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(year)) {
      handleError("Format invalide. Utilisez YYYY-YYYY (ex: 2024-2025)");
      return false;
    }

    const [startYear, endYear] = year.split("-").map(Number);
    if (endYear !== startYear + 1) {
      handleError(
        `L'année suivante doit être ${startYear + 1}, pas ${endYear}`
      );
      return false;
    }

    if (mode === "create" && existingYears.includes(year)) {
      handleError("Cette année existe déjà");
      return false;
    }

    if (
      mode === "edit" &&
      currentYear &&
      year !== currentYear &&
      existingYears.includes(year)
    ) {
      handleError("Cette année existe déjà");
      return false;
    }

    return true;
  };

  // Obtenir la prochaine année disponible
  const getNextAvailableYear = (): string => {
    if (schoolYears.length === 0) return "2024-2025";

    const latestYear = schoolYears
      .map((y) => parseInt(y.year.split("-")[0]))
      .sort((a, b) => b - a)[0];

    return `${latestYear + 1}-${latestYear + 2}`;
  };

  // Convertir AnneeScolaireDB vers SchoolYear
  const convertToSchoolYear = useCallback(
    async (anneeDB: AnneeScolaireDB): Promise<SchoolYear> => {
      try {
        // Charger les classes
        const classesData = await SelectData("classes");
        const classesFiltered =
          classesData?.filter(
            (c: ClasseDB) => c.annee_scolaire_id === anneeDB.id
          ) || [];

        const classes: Classe[] = await Promise.all(
          classesFiltered.map(async (classeDB: ClasseDB) => {
            // Charger les salles pour cette classe
            const sallesData = await SelectData("salles");
            const sallesFiltered =
              sallesData?.filter((s: SalleDB) => s.classe_id === classeDB.id) ||
              [];

            const salles: Salle[] = await Promise.all(
              sallesFiltered.map(async (salleDB: SalleDB) => {
                // Charger les matières pour cette salle
                const matieresData = await SelectData("matieres");
                const matieresFiltered =
                  matieresData?.filter(
                    (m: MatiereDB) => m.salle_id === salleDB.id
                  ) || [];

                const subjects: Subject[] = matieresFiltered.map(
                  (matiereDB: MatiereDB) => {
                    // Plus de résolution d'enseignant dans ce contexte

                    return {
                      id: matiereDB.id,
                      name: matiereDB.nom,
                      coefficient: matiereDB.coefficient,
                      teacher: undefined,
                    };
                  }
                );

                // Charger les emplois du temps pour cette salle
                // Charger les emplois du temps pour cette salle
                // Charger les emplois du temps pour cette salle
                const emploisData = await SelectData("emplois_du_temps");
                const emploisFiltered =
                  emploisData?.filter(
                    (e: EmploiDuTempsDB) => e.salle_id === salleDB.id
                  ) || [];

                // ✅ FONCTION POUR NORMALISER LES HEURES
                const normalizeTime = (time: string) => {
                  return time.substring(0, 5); // "07:00:00" -> "07:00"
                };

                const schedule: ScheduleItem[] = emploisFiltered.map(
                  (emploiDB: EmploiDuTempsDB) => ({
                    id: emploiDB.id,
                    day: emploiDB.jour,
                    startTime: normalizeTime(emploiDB.heure_debut),
                    endTime: normalizeTime(emploiDB.heure_fin),
                    subject:
                      subjects.find((s) => s.id === emploiDB.matiere_id)
                        ?.name || emploiDB.matiere_id,
                    teacherName: emploiDB.professeur || "Non assigné", // ✅ NOM DIRECT
                    teacherId: emploiDB.professeur,
                  })
                );

                return {
                  id: salleDB.id,
                  name: salleDB.nom,
                  maxStudents: salleDB.capacite,
                  subjects,
                  schedule,
                };
              })
            );

            return {
              id: classeDB.id,
              name: classeDB.nom,
              shortName: formatClassDisplay(classeDB.nom),
              salles,
            };
          })
        );

        return {
          id: anneeDB.id,
          year: anneeDB.nom,
          description: anneeDB.description || "",
          created: true,
          classes: sortClasses(classes),
          configurationSaved: classes.length > 0,
          createdAt: anneeDB.created_at,
          updatedAt: anneeDB.updated_at,
        };
      } catch (error) {
        console.error("Erreur lors de la conversion:", error);
        return {
          id: anneeDB.id,
          year: anneeDB.nom,
          description: anneeDB.description || "",
          created: true,
          classes: [],
          configurationSaved: false,
          createdAt: anneeDB.created_at,
          updatedAt: anneeDB.updated_at,
        };
      }
    },
    [sortClasses]
  );

  // === ANNÉES SCOLAIRES ===
  const loadSchoolYears = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Chargement des années scolaires...");

      const data = await SelectData("annees_scolaires");

      if (!data || data.length === 0) {
        console.log("⚠️ Aucune année scolaire trouvée");
        setSchoolYears([]);
        setCurrentYearState(null);
        localStorage.removeItem("currentSchoolYear");
        return;
      }

      console.log(`✅ ${data.length} année(s) chargée(s)`);

      // Convertir toutes les années
      const schoolYearsConverted = await Promise.all(
        data.map((anneeDB: AnneeScolaireDB) => convertToSchoolYear(anneeDB))
      );

      // Trier par année (plus récente en premier)
      schoolYearsConverted.sort((a, b) => b.year.localeCompare(a.year));

      setSchoolYears(schoolYearsConverted);

      // ===== GESTION DE L'ANNÉE COURANTE =====

      // 1. Essayer de récupérer l'année sauvegardée dans localStorage
      const savedYearId = localStorage.getItem("currentSchoolYearId");

      let yearToSet: SchoolYear | null = null;

      if (savedYearId) {
        // Vérifier si l'année sauvegardée existe toujours
        yearToSet =
          schoolYearsConverted.find((y) => y.id === savedYearId) || null;

        if (yearToSet) {
          console.log(
            `✅ Année restaurée depuis localStorage: ${yearToSet.year}`
          );
        } else {
          console.log(
            "⚠️ Année sauvegardée introuvable, recherche d'une année active..."
          );
          localStorage.removeItem("currentSchoolYearId");
        }
      }

      // 2. Si pas d'année sauvegardée ou introuvable, chercher l'année active
      if (!yearToSet) {
        const anneeActive = data.find((a: AnneeScolaireDB) => a.active);

        if (anneeActive) {
          yearToSet =
            schoolYearsConverted.find((y) => y.id === anneeActive.id) || null;

          if (yearToSet) {
            console.log(`✅ Année active trouvée: ${yearToSet.year}`);
          }
        }
      }

      // 3. Si toujours pas d'année, prendre la plus récente
      if (!yearToSet && schoolYearsConverted.length > 0) {
        yearToSet = schoolYearsConverted[0];
        console.log(
          `✅ Utilisation de l'année la plus récente: ${yearToSet.year}`
        );
      }

      // 4. Définir l'année courante et sauvegarder
      if (yearToSet) {
        setCurrentYearState(yearToSet);
        localStorage.setItem("currentSchoolYearId", yearToSet.id);
        console.log(
          `💾 Année courante définie: ${yearToSet.year} (ID: ${yearToSet.id})`
        );
      } else {
        console.log("⚠️ Aucune année courante définie");
        setCurrentYearState(null);
        localStorage.removeItem("currentSchoolYearId");
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement des années scolaires:", err);
      handleError("Erreur lors du chargement des années scolaires");
      setSchoolYears([]);
      setCurrentYearState(null);
    } finally {
      setLoading(false);
    }
  }, [convertToSchoolYear, setCurrentYearState]);

  const createSchoolYear = async (
    schoolYear: Omit<SchoolYear, "id">
  ): Promise<string | null> => {
    // ✅ Retourner l'ID créé
    try {
      setLoading(true);

      // Vérifier si l'année existe déjà
      const exists = await DataExsite(
        "annees_scolaires",
        "nom",
        schoolYear.year
      );

      if (exists) {
        handleError("Cette année scolaire existe déjà");
        notify("error", "Cette année scolaire existe déjà");
        return null;
      }

      // Extraire les années et valider
      const [startYear, endYear] = schoolYear.year.split("-").map(Number);

      if (!startYear || !endYear || endYear !== startYear + 1) {
        handleError(
          "Format d'année invalide. Utilisez YYYY-YYYY (ex: 2024-2025)"
        );
        notify("error", "Format d'année invalide");
        return null;
      }

      // ✅ Convertir vers le format DB
      const anneeDB: Omit<AnneeScolaireDB, "id" | "created_at" | "updated_at"> =
        {
          nom: schoolYear.year, // "2024-2025"
          description: schoolYear.description || "",
          date_debut: `${startYear}-09-01`, // Début septembre
          date_fin: `${endYear}-07-31`, // Fin juillet année suivante
          active: true, // Toujours active à la création
        };

      console.log("📤 Création année scolaire:", anneeDB);

      // ✅ Utiliser InsertDataReturn pour récupérer l'ID
      const { success, rows, error } = await InsertDataReturn(
        "annees_scolaires",
        anneeDB
      );

      console.log("📥 Résultat insertion:", { success, rows, error });

      if (!success || !rows || rows.length === 0) {
        const errorMessage =
          error?.message || "Erreur lors de la création de l'année scolaire";
        console.error("❌ Erreur création:", error);
        handleError(errorMessage);
        notify("error", errorMessage);
        return null;
      }

      const createdId = rows[0].id as string;
      console.log("✅ Année créée avec ID:", createdId);

      // Recharger les années scolaires
      await loadSchoolYears();

      notify(
        "success",
        `Année scolaire ${schoolYear.year} créée avec succès !`
      );

      return createdId; // ✅ Retourner l'ID
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'année scolaire";
      console.error("❌ Exception création année:", err);
      handleError(errorMessage);
      notify("error", errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  const updateSchoolYear = async (
    id: string,
    schoolYear: Partial<SchoolYear>
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const updateData: Partial<
        Omit<AnneeScolaireDB, "id" | "created_at" | "updated_at">
      > = {};

      // ✅ Si on change l'année, vérifier l'unicité et recalculer les dates
      if (schoolYear.year) {
        // Vérifier que le format est correct
        const yearPattern = /^\d{4}-\d{4}$/;
        if (!yearPattern.test(schoolYear.year)) {
          handleError(
            "Format d'année invalide. Utilisez YYYY-YYYY (ex: 2024-2025)"
          );
          notify("error", "Format d'année invalide");
          return false;
        }

        const [startYear, endYear] = schoolYear.year.split("-").map(Number);
        if (endYear !== startYear + 1) {
          handleError(
            `L'année suivante doit être ${startYear + 1}, pas ${endYear}`
          );
          notify("error", "Format d'année invalide");
          return false;
        }

        // Vérifier l'unicité
        const allAnnees = await SelectData("annees_scolaires");
        const exists = allAnnees?.find(
          (a: AnneeScolaireDB) => a.nom === schoolYear.year && a.id !== id
        );

        if (exists) {
          handleError("Cette année scolaire existe déjà");
          notify("error", "Cette année scolaire existe déjà");
          return false;
        }

        // Mapper le nom et recalculer les dates
        updateData.nom = schoolYear.year;
        updateData.date_debut = `${startYear}-09-01`;
        updateData.date_fin = `${endYear}-07-31`;
      }

      // ✅ Mapper la description
      if (schoolYear.description !== undefined) {
        updateData.description = schoolYear.description;
      }

      // ✅ Mapper created → active
      if (schoolYear.created !== undefined) {
        updateData.active = schoolYear.created;
      }

      // Vérifier qu'il y a quelque chose à mettre à jour
      if (Object.keys(updateData).length === 0) {
        console.log("⚠️ Aucune donnée à mettre à jour");
        return true;
      }

      console.log("📤 Mise à jour année scolaire:", { id, updateData });

      const result = await UpdateData("annees_scolaires", id, updateData);

      if (result) {
        console.log("✅ Année mise à jour avec succès");
        await loadSchoolYears();
        notify("success", "Année scolaire mise à jour avec succès !");
        return true;
      } else {
        console.error("❌ Échec de la mise à jour");
        handleError("Erreur lors de la modification de l'année scolaire");
        notify("error", "Erreur lors de la modification de l'année scolaire");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de l'année scolaire";
      console.error("❌ Exception mise à jour année:", err);
      handleError(errorMessage);
      notify("error", errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSchoolYear = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await DeleteData("annees_scolaires", id);
      if (result) {
        await loadSchoolYears();
        return true;
      } else {
        handleError("Erreur lors de la suppression de l'année scolaire");
        return false;
      }
    } catch (err) {
      handleError("Erreur lors de la suppression de l'année scolaire");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setCurrentYear = useCallback((year: SchoolYear | null) => {
    setCurrentYearState(year);

    if (year) {
      // Sauvegarder seulement l'ID (plus léger que l'objet complet)
      localStorage.setItem("currentSchoolYearId", year.id);
      console.log(`💾 Année courante changée: ${year.year} (ID: ${year.id})`);
    } else {
      localStorage.removeItem("currentSchoolYearId");
      console.log("🗑️ Année courante supprimée du localStorage");
    }
  }, []);

  // Fonction pour mettre à jour l'année active dans la base de données
  const updateActiveYearInDatabase = async (yearId: string) => {
    try {
      // Désactiver toutes les années
      const allYears = await SelectData("annees_scolaires");
      if (allYears) {
        for (const year of allYears) {
          if (year.id !== yearId) {
            await UpdateData("annees_scolaires", year.id, { active: false });
          }
        }
        // Activer l'année sélectionnée
        await UpdateData("annees_scolaires", yearId, { active: true });
        console.log(
          `Année ${yearId} définie comme active dans la base de données`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'année active:", error);
    }
  };

  // === CLASSES ===
  const loadClasses = async (anneeId: string): Promise<Classe[]> => {
    try {
      const data = await SelectData("classes");
      const classesFiltered =
        data?.filter((c: ClasseDB) => c.annee_scolaire_id === anneeId) || [];

      const classes: Classe[] = await Promise.all(
        classesFiltered.map(async (classeDB: ClasseDB) => {
          const salles = await loadSalles(classeDB.id);
          return {
            id: classeDB.id,
            name: classeDB.nom,
            salles,
          };
        })
      );

      return sortClasses(classes); // ← AJOUTER sortClasses()
    } catch (err) {
      handleError("Erreur lors du chargement des classes");
      return [];
    }
  };

  const createClasse = async (
    classe: Omit<ClasseDB, "id">
  ): Promise<boolean> => {
    try {
      const result = await InsertData("classes", classe);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la création de la classe");
      return false;
    }
  };

  const updateClasse = async (
    id: string,
    classe: Partial<ClasseDB>
  ): Promise<boolean> => {
    try {
      const result = await UpdateData("classes", id, classe);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la modification de la classe");
      return false;
    }
  };

  const deleteClasse = async (id: string): Promise<boolean> => {
    try {
      const result = await DeleteData("classes", id);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la suppression de la classe");
      return false;
    }
  };

  // === SALLES ===
  const loadSalles = async (classeId: string): Promise<Salle[]> => {
    try {
      const data = await SelectData("salles");
      const sallesFiltered =
        data?.filter((s: SalleDB) => s.classe_id === classeId) || [];

      const salles: Salle[] = await Promise.all(
        sallesFiltered.map(async (salleDB: SalleDB) => {
          const subjects = await loadMatieres(salleDB.id);
          const schedule = await loadEmploisDuTemps(salleDB.id);

          return {
            id: salleDB.id,
            name: salleDB.nom,
            maxStudents: salleDB.capacite,
            subjects,
            schedule,
          };
        })
      );

      return salles;
    } catch (err) {
      handleError("Erreur lors du chargement des salles");
      return [];
    }
  };
  // === FONCTIONS POUR RÉCUPÉRER LES NOMS PAR ID ===
  const getClassNameById = useCallback(
    (classId: string): string => {
      if (!currentYear) return "Classe non trouvée";
      const classe = currentYear.classes.find((c) => c.id === classId);
      if (!classe) return "Classe non trouvée";
      // Retourner le shortName si présent, sinon le nom complet
      return classe.shortName || classe.name;
    },
    [currentYear]
  );

  const getYearNameById = useCallback(
    (yearId: string): string => {
      if (!yearId) return "Année inconnue";

      // Chercher dans les années scolaires chargées
      const year = schoolYears.find((y) => y.id === yearId);
      if (year) {
        return year.year;
      }

      // Si pas trouvé, chercher dans currentYear (au cas où)
      if (currentYear && currentYear.id === yearId) {
        return currentYear.year;
      }

      console.warn(`Année scolaire avec ID ${yearId} non trouvée`);
      return "Année inconnue";
    },
    [schoolYears, currentYear]
  );

  const getSubjectNameById = useCallback(
    (subjectId: string): string => {
      if (!currentYear) return "Matière non trouvée";
      for (const classe of currentYear.classes) {
        for (const salle of classe.salles) {
          const subject = salle.subjects.find((s) => s.id === subjectId);
          if (subject) return subject.name;
        }
      }
      return "Matière non trouvée";
    },
    [currentYear]
  );

  const getRoomNameById = useCallback(
    (roomId: string): string => {
      if (!currentYear) return "Salle non trouvée";
      for (const classe of currentYear.classes) {
        const salle = classe.salles.find((s) => s.id === roomId);
        if (salle) return salle.name;
      }
      return "Salle non trouvée";
    },
    [currentYear]
  );
  const createSalle = async (salle: Omit<SalleDB, "id">): Promise<boolean> => {
    try {
      const result = await InsertData("salles", salle);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la création de la salle");
      return false;
    }
  };

  const updateSalle = async (
    id: string,
    salle: Partial<SalleDB>
  ): Promise<boolean> => {
    try {
      const result = await UpdateData("salles", id, salle);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la modification de la salle");
      return false;
    }
  };

  const deleteSalle = async (id: string): Promise<boolean> => {
    try {
      const result = await DeleteData("salles", id);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la suppression de la salle");
      return false;
    }
  };

  // === MATIÈRES ===
  const loadMatieres = async (salleId: string): Promise<Subject[]> => {
    try {
      const data = await SelectData("matieres");
      const matieresFiltered =
        data?.filter((m: MatiereDB) => m.salle_id === salleId) || [];

      const subjects: Subject[] = matieresFiltered.map(
        (matiereDB: MatiereDB) => ({
          id: matiereDB.id,
          name: matiereDB.nom,
          coefficient: matiereDB.coefficient,
        })
      );

      return subjects;
    } catch (err) {
      handleError("Erreur lors du chargement des matières");
      return [];
    }
  };

  const createMatiere = async (
    matiere: Omit<MatiereDB, "id">
  ): Promise<boolean> => {
    try {
      const result = await InsertData("matieres", matiere);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la création de la matière");
      return false;
    }
  };

  const updateMatiere = async (
    id: string,
    matiere: Partial<MatiereDB>
  ): Promise<boolean> => {
    try {
      const result = await UpdateData("matieres", id, matiere);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la modification de la matière");
      return false;
    }
  };

  const deleteMatiere = async (id: string): Promise<boolean> => {
    try {
      const result = await DeleteData("matieres", id);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la suppression de la matière");
      return false;
    }
  };

  // === EMPLOIS DU TEMPS ===
  const loadEmploisDuTemps = async (
    salleId: string
  ): Promise<ScheduleItem[]> => {
    try {
      const data = await SelectData("emplois_du_temps");
      const emploisFiltered =
        data?.filter((e: EmploiDuTempsDB) => e.salle_id === salleId) || [];

      // Charger les matières pour résoudre les noms
      const matieres = await loadMatieres(salleId);

      // ✅ FONCTION POUR NORMALISER LES HEURES
      const normalizeTime = (time: string) => {
        return time.substring(0, 5); // "07:00:00" -> "07:00"
      };

      const schedule: ScheduleItem[] = emploisFiltered.map(
        (emploiDB: EmploiDuTempsDB) => {
          const matiere = matieres.find((m) => m.id === emploiDB.matiere_id);

          return {
            id: emploiDB.id,
            day: emploiDB.jour,
            startTime: normalizeTime(emploiDB.heure_debut),
            endTime: normalizeTime(emploiDB.heure_fin),
            subject: matiere?.name || "Matière inconnue",
            teacherName: emploiDB.professeur || "Non assigné", // ✅ DIRECTEMENT LE NOM
            teacherId: emploiDB.professeur, // Pour compatibilité
          };
        }
      );

      console.log("✅ Emplois du temps chargés:", schedule);
      return schedule;
    } catch (err) {
      console.error("❌ Erreur chargement emplois du temps:", err);
      handleError("Erreur lors du chargement des emplois du temps");
      return [];
    }
  };

  const createEmploiDuTemps = async (
    emploi: Omit<EmploiDuTempsDB, "id">
  ): Promise<boolean> => {
    try {
      const result = await InsertData("emplois_du_temps", emploi);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la création de l'emploi du temps");
      return false;
    }
  };

  const updateEmploiDuTemps = async (
    id: string,
    emploi: Partial<EmploiDuTempsDB>
  ): Promise<boolean> => {
    try {
      const result = await UpdateData("emplois_du_temps", id, emploi);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la modification de l'emploi du temps");
      return false;
    }
  };

  const deleteEmploiDuTemps = async (id: string): Promise<boolean> => {
    try {
      const result = await DeleteData("emplois_du_temps", id);
      return result === true;
    } catch (err) {
      handleError("Erreur lors de la suppression de l'emploi du temps");
      return false;
    }
  };

  // Charger l'année courante depuis localStorage au démarrage
  useEffect(() => {
    const loadCurrentYearFromStorage = () => {
      try {
        const savedYear = localStorage.getItem("currentSchoolYear");
        if (savedYear) {
          const parsedYear = JSON.parse(savedYear);

          // Valider la structure de l'année scolaire
          if (
            parsedYear &&
            typeof parsedYear.id === "string" &&
            typeof parsedYear.year === "string" &&
            typeof parsedYear.description === "string" &&
            Array.isArray(parsedYear.classes)
          ) {
            setCurrentYearState(parsedYear);
            console.log(
              `Année scolaire ${parsedYear.year} chargée depuis localStorage`
            );
          } else {
            console.warn(
              "Données d'année scolaire invalides dans localStorage, suppression..."
            );
            localStorage.removeItem("currentSchoolYear");
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'année courante depuis localStorage:",
          error
        );
        localStorage.removeItem("currentSchoolYear");
      }
    };

    loadCurrentYearFromStorage();
  }, []);

  // Initialiser au montage
  useEffect(() => {
    loadSchoolYears();
  }, [loadSchoolYears]);

  return (
    <AnneeScolaireContext.Provider
      value={{
        // États
        schoolYears,
        currentYear,
        loading,
        error,

        // Actions Années Scolaires
        loadSchoolYears,
        setCurrentYear,

        createSchoolYear,
        updateSchoolYear,
        deleteSchoolYear,

        // Actions Classes
        loadClasses,
        createClasse,
        updateClasse,
        deleteClasse,

        // Actions Salles
        loadSalles,
        createSalle,
        updateSalle,
        deleteSalle,

        // Actions Matières
        loadMatieres,
        createMatiere,
        updateMatiere,
        deleteMatiere,

        // Actions Emplois du Temps
        loadEmploisDuTemps,
        createEmploiDuTemps,
        updateEmploiDuTemps,
        deleteEmploiDuTemps,
        getYearNameById,
        //class ,salle, matiere
        getClassNameById,
        getSubjectNameById,
        getRoomNameById,
        // Utilitaires
        convertToSchoolYear,
        validateYear,
        getNextAvailableYear,
        resetError,
        clearLocalStorage,
      }}
    >
      {children}
    </AnneeScolaireContext.Provider>
  );
};

// Hook personnalisé
export const useAnneeScolaire = () => {
  const context = useContext(AnneeScolaireContext);
  if (context === undefined) {
    throw new Error(
      "useAnneeScolaire must be used within an AnneeScolaireProvider"
    );
  }
  return context;
};
