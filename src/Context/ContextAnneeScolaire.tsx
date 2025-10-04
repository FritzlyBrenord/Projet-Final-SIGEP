"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  SelectData,
  InsertData,
  UpdateData,
  DeleteData,
  DataExsite,
  DeleteDataMultiple,
} from "@/Config/SupabaseData";

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
  createSchoolYear: (schoolYear: Omit<SchoolYear, "id">) => Promise<boolean>;
  updateSchoolYear: (
    id: string,
    schoolYear: Partial<SchoolYear>
  ) => Promise<boolean>;
  deleteSchoolYear: (id: string) => Promise<boolean>;
  setCurrentYear: (schoolYear: SchoolYear) => void;

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
                const emploisData = await SelectData("emplois_du_temps");
                const emploisFiltered =
                  emploisData?.filter(
                    (e: EmploiDuTempsDB) => e.salle_id === salleDB.id
                  ) || [];

                const schedule: ScheduleItem[] = emploisFiltered.map(
                  (emploiDB: EmploiDuTempsDB) => ({
                    id: emploiDB.id,
                    day: emploiDB.jour,
                    startTime: emploiDB.heure_debut,
                    endTime: emploiDB.heure_fin,
                    subject:
                      subjects.find((s) => s.id === emploiDB.matiere_id)
                        ?.name || emploiDB.matiere_id,
                    teacherName: emploiDB.professeur,
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
              salles,
            };
          })
        );

        return {
          id: anneeDB.id,
          year: anneeDB.nom,
          description: anneeDB.description || "",
          created: true,
          classes,
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
    []
  );

  // === ANNÉES SCOLAIRES ===
  const loadSchoolYears = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SelectData("annees_scolaires");
      if (data) {
        const schoolYearsConverted = await Promise.all(
          data.map((anneeDB: AnneeScolaireDB) => convertToSchoolYear(anneeDB))
        );
        setSchoolYears(schoolYearsConverted);

        // Vérifier s'il y a une année courante dans localStorage
        const savedYear = localStorage.getItem("currentSchoolYear");
        if (savedYear) {
          try {
            const parsedYear = JSON.parse(savedYear);
            // Vérifier si l'année sauvegardée existe encore dans la base de données
            const yearExists = schoolYearsConverted.find(
              (y) => y.id === parsedYear.id
            );
            if (yearExists) {
              setCurrentYearState(parsedYear);
              console.log(
                `Année scolaire ${parsedYear.year} restaurée depuis localStorage`
              );
            } else {
              // Si l'année n'existe plus, utiliser l'année active de la base de données
              const anneeActive = data.find((a: AnneeScolaireDB) => a.active);
              if (anneeActive) {
                const currentYearConverted = await convertToSchoolYear(
                  anneeActive
                );
                setCurrentYearState(currentYearConverted);
                // Mettre à jour le localStorage
                localStorage.setItem(
                  "currentSchoolYear",
                  JSON.stringify(currentYearConverted)
                );
                console.log(
                  `Année scolaire ${currentYearConverted.year} mise à jour dans localStorage`
                );
              }
            }
          } catch (error) {
            console.error(
              "Erreur lors de la validation de l'année sauvegardée:",
              error
            );
            localStorage.removeItem("currentSchoolYear");
          }
        } else {
          // Définir l'année active comme année courante si pas de sauvegarde localStorage
          const anneeActive = data.find((a: AnneeScolaireDB) => a.active);
          if (anneeActive) {
            const currentYearConverted = await convertToSchoolYear(anneeActive);
            setCurrentYearState(currentYearConverted);
            // Sauvegarder dans localStorage
            localStorage.setItem(
              "currentSchoolYear",
              JSON.stringify(currentYearConverted)
            );
            console.log(
              `Année scolaire ${currentYearConverted.year} sauvegardée dans localStorage`
            );
          }
        }
      }
    } catch (err) {
      handleError("Erreur lors du chargement des années scolaires");
    } finally {
      setLoading(false);
    }
  }, [convertToSchoolYear]);

  const createSchoolYear = async (
    schoolYear: Omit<SchoolYear, "id">
  ): Promise<boolean> => {
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
        return false;
      }

      // Convertir vers le format DB
      const anneeDB: Omit<AnneeScolaireDB, "id"> = {
        nom: schoolYear.year,
        description: schoolYear.description,
        date_debut: `${schoolYear.year.split("-")[0]}-09-01`,
        date_fin: `${schoolYear.year.split("-")[1]}-06-30`,
        active: true,
      };

      const result = await InsertData("annees_scolaires", anneeDB);
      if (result === true) {
        await loadSchoolYears();
        return true;
      } else {
        handleError("Erreur lors de la création de l'année scolaire");
        return false;
      }
    } catch (err) {
      handleError("Erreur lors de la création de l'année scolaire");
      return false;
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

      const updateData: Partial<AnneeScolaireDB> = {};
      if (schoolYear.year) updateData.nom = schoolYear.year;
      if (schoolYear.description)
        updateData.description = schoolYear.description;

      const result = await UpdateData("annees_scolaires", id, updateData);
      if (result) {
        await loadSchoolYears();
        return true;
      } else {
        handleError("Erreur lors de la modification de l'année scolaire");
        return false;
      }
    } catch (err) {
      handleError("Erreur lors de la modification de l'année scolaire");
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

  const setCurrentYear = async (schoolYear: SchoolYear) => {
    try {
      setCurrentYearState(schoolYear);

      // Stocker dans localStorage avec gestion d'erreurs
      localStorage.setItem("currentSchoolYear", JSON.stringify(schoolYear));
      console.log(
        `Année scolaire ${schoolYear.year} sauvegardée dans localStorage`
      );

      // Mettre à jour l'année active dans la base de données
      await updateActiveYearInDatabase(schoolYear.id);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'année scolaire:", error);
      handleError("Erreur lors de la sauvegarde de l'année scolaire");
    }
  };

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

      return classes;
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

      const schedule: ScheduleItem[] = emploisFiltered.map(
        (emploiDB: EmploiDuTempsDB) => ({
          id: emploiDB.id,
          day: emploiDB.jour,
          startTime: emploiDB.heure_debut,
          endTime: emploiDB.heure_fin,
          subject: emploiDB.matiere_id, // À remplacer par le nom de la matière si nécessaire
          teacherName: emploiDB.professeur,
        })
      );

      return schedule;
    } catch (err) {
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
        createSchoolYear,
        updateSchoolYear,
        deleteSchoolYear,
        setCurrentYear,

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
