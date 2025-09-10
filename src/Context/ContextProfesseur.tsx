"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  SelectData,
  InsertData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
  DeleteDataMultiple,
} from "@/Config/SupabaseData";
import { useAnneeScolaire } from "./ContextAnneeScolaire";

// Types pour la gestion des professeurs (version simplifiée)
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
  nif_cin: string;
  sequences: Sequence[];
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfesseurFormData {
  enseignant_id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  sequences: Sequence[];
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
}

// Types pour Supabase (structure de base de données)
interface ProfesseurDB {
  id: string;
  enseignant_id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Structure simplifiée pour les séquences
interface SequenceDB {
  id: string;
  professeur_id: string;
  classe: string;
  salle: string;
  matiere: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface du Context
export interface ProfesseurContextType {
  // États
  professeurs: Professeur[];
  isLoading: boolean;
  error: string | null;

  // Fonctions CRUD Professeurs
  ajouterProfesseur: (professeur: ProfesseurFormData) => Promise<void>;
  modifierProfesseur: (
    id: string,
    professeur: Partial<ProfesseurFormData>
  ) => Promise<void>;
  supprimerProfesseur: (id: string) => Promise<void>;
  supprimerProfesseurDefinitif: (id: string) => Promise<void>;
  restaurerProfesseur: (id: string) => Promise<void>;

  // Fonctions de gestion des séquences
  ajouterSequence: (
    professeurId: string,
    sequence: Omit<Sequence, "id">
  ) => Promise<void>;
  modifierSequence: (
    professeurId: string,
    sequenceId: string,
    sequence: Partial<Sequence>
  ) => Promise<void>;
  supprimerSequence: (
    professeurId: string,
    sequenceId: string
  ) => Promise<void>;

  // Fonctions de recherche et filtrage
  rechercherProfesseurs: (terme: string) => Professeur[];
  obtenirProfesseurParId: (id: string) => Professeur | undefined;
  obtenirProfesseursParAnnee: (anneeId: string) => Professeur[];
  obtenirProfesseursActifs: (anneeId?: string) => Professeur[];
  obtenirProfesseursInactifs: (anneeId?: string) => Professeur[];
  obtenirProfesseursSupprimesLogiquement: (anneeId?: string) => Professeur[];

  // Fonctions utilitaires
  setError: (error: string | null) => void;
  rechargerProfesseurs: () => Promise<void>;
  chargerProfesseursParAnnee: (anneeId: string) => Promise<void>;
  validerCodeProfesseur: (
    code: string,
    professeurId?: string
  ) => Promise<boolean>;
  validerEmailProfesseur: (
    email: string,
    professeurId?: string
  ) => Promise<boolean>;
  genererNouveauCode: () => Promise<string>;

  // Actions par lots
  supprimerPlusieursProfesseurs: (ids: string[]) => Promise<void>;
  restaurerPlusieursProfesseurs: (ids: string[]) => Promise<void>;
}

// Context
const ProfesseurContext = createContext<ProfesseurContextType | undefined>(
  undefined
);

// Provider
export const ProfesseurProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // États
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contexte de l'année scolaire
  const { currentYear } = useAnneeScolaire();

  // Utilitaires
  const handleError = (message: string) => {
    setError(message);
    console.error(message);
  };

  // Convertir ProfesseurDB vers Professeur (version simplifiée)
  const convertToProfesseur = async (
    professeurDB: ProfesseurDB
  ): Promise<Professeur> => {
    try {
      // Charger les séquences pour ce professeur
      const sequencesData = await SelectData("sequences");
      const sequencesFiltered =
        sequencesData?.filter(
          (s: SequenceDB) => s.professeur_id === professeurDB.id && !s.deleted
        ) || [];

      const sequences: Sequence[] = sequencesFiltered.map(
        (sequenceDB: SequenceDB) => ({
          id: sequenceDB.id,
          classe: sequenceDB.classe,
          salle: sequenceDB.salle,
          matiere: sequenceDB.matiere,
          deleted: sequenceDB.deleted,
        })
      );

      return {
        id: professeurDB.id,
        enseignant_id: professeurDB.enseignant_id,
        code: professeurDB.code,
        nom: professeurDB.nom,
        prenom: professeurDB.prenom,
        email: professeurDB.email,
        telephone: professeurDB.telephone,
        adresse: professeurDB.adresse,
        date_embauche: professeurDB.date_embauche,
        nif_cin: professeurDB.nif_cin,
        sequences,
        diplomes: professeurDB.diplomes,
        statut: professeurDB.statut,
        annee_scolaire_id: professeurDB.annee_scolaire_id,
        deleted: professeurDB.deleted,
        created_at: professeurDB.created_at,
        updated_at: professeurDB.updated_at,
      };
    } catch (error) {
      console.error("Erreur lors de la conversion du professeur:", error);
      return {
        id: professeurDB.id,
        enseignant_id: professeurDB.enseignant_id,
        code: professeurDB.code,
        nom: professeurDB.nom,
        prenom: professeurDB.prenom,
        email: professeurDB.email,
        telephone: professeurDB.telephone,
        adresse: professeurDB.adresse,
        date_embauche: professeurDB.date_embauche,
        nif_cin: professeurDB.nif_cin,
        sequences: [],
        diplomes: professeurDB.diplomes,
        statut: professeurDB.statut,
        annee_scolaire_id: professeurDB.annee_scolaire_id,
        deleted: professeurDB.deleted,
        created_at: professeurDB.created_at,
        updated_at: professeurDB.updated_at,
      };
    }
  };

  // === CHARGEMENT DES PROFESSEURS ===
  const rechargerProfesseurs = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await SelectData("professeurs");
      if (data) {
        // Filtrer par année scolaire courante et exclure les professeurs supprimés logiquement
        const dataFiltered = currentYear
          ? data.filter(
              (p: ProfesseurDB) =>
                p.annee_scolaire_id === currentYear.id && !p.deleted
            )
          : data.filter((p: ProfesseurDB) => !p.deleted);

        const professeursConverted = await Promise.all(
          dataFiltered.map((professeurDB: ProfesseurDB) =>
            convertToProfesseur(professeurDB)
          )
        );
        setProfesseurs(professeursConverted);
      }
    } catch (err) {
      handleError("Erreur lors du chargement des professeurs");
    } finally {
      setIsLoading(false);
    }
  };

  const chargerProfesseursParAnnee = async (anneeId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await SelectData("professeurs");
      if (data) {
        const professeursFiltres = data.filter(
          (p: ProfesseurDB) => p.annee_scolaire_id === anneeId && !p.deleted
        );
        const professeursConverted = await Promise.all(
          professeursFiltres.map((professeurDB: ProfesseurDB) =>
            convertToProfesseur(professeurDB)
          )
        );
        setProfesseurs(professeursConverted);
      }
    } catch (err) {
      handleError("Erreur lors du chargement des professeurs par année");
    } finally {
      setIsLoading(false);
    }
  };

  // === CRUD PROFESSEURS ===
  const ajouterProfesseur = async (
    professeur: ProfesseurFormData
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Vérifier si le code professeur existe déjà
      const codeExists = await DataExsite(
        "professeurs",
        "code",
        professeur.code
      );
      if (codeExists) {
        throw new Error("Ce code professeur existe déjà");
      }

      // Vérifier si l'email existe déjà
      const emailExists = await DataExsite(
        "professeurs",
        "email",
        professeur.email
      );
      if (emailExists) {
        throw new Error("Cet email est déjà utilisé par un autre professeur");
      }

      // Vérifier si le téléphone existe déjà (si renseigné)
      if (professeur.telephone) {
        const phoneExists = await DataExsite(
          "professeurs",
          "telephone",
          professeur.telephone
        );
        if (phoneExists) {
          throw new Error(
            "Ce numéro de téléphone est déjà utilisé par un autre professeur"
          );
        }
      }

      // Vérifier si NIF/CIN existe déjà (si renseigné)
      if (professeur.nif_cin) {
        const nifExists = await DataExsite(
          "professeurs",
          "nif_cin",
          professeur.nif_cin
        );
        if (nifExists) {
          throw new Error(
            "Ce NIF/CIN est déjà utilisé par un autre professeur"
          );
        }
      }

      // Convertir vers le format DB (sans les séquences)
      const professeurDB: Omit<
        ProfesseurDB,
        "id" | "created_at" | "updated_at"
      > = {
        enseignant_id: professeur.enseignant_id,
        code: professeur.code,
        nom: professeur.nom,
        prenom: professeur.prenom,
        email: professeur.email,
        telephone: professeur.telephone,
        adresse: professeur.adresse,
        date_embauche: professeur.date_embauche,
        nif_cin: professeur.nif_cin,
        diplomes: professeur.diplomes,
        statut: professeur.statut,
        annee_scolaire_id: professeur.annee_scolaire_id,
        deleted: false,
      };

      const { success, rows, error } = await InsertDataReturn(
        "professeurs",
        professeurDB
      );

      if (!success || !rows || rows.length === 0) {
        throw new Error(
          error?.message || "Erreur lors de l'ajout du professeur"
        );
      }

      const newProfId = rows[0].id as string;

      if (professeur.sequences && professeur.sequences.length > 0) {
        for (const sequence of professeur.sequences) {
          const sequenceDB: Omit<
            SequenceDB,
            "id" | "created_at" | "updated_at"
          > = {
            professeur_id: newProfId,
            classe: sequence.classe,
            salle: sequence.salle,
            matiere: sequence.matiere,
            deleted: false,
          };
          const insertSeqResult = await InsertData("sequences", sequenceDB);
          if (insertSeqResult !== true) {
            const message =
              (insertSeqResult as any)?.message ||
              "Erreur lors de l'ajout d'une séquence";
            throw new Error(message);
          }
        }
      }

      await rechargerProfesseurs();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout du professeur";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierProfesseur = async (
    id: string,
    professeur: Partial<ProfesseurFormData>
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Si on modifie l'email, vérifier qu'il n'existe pas déjà
      if (professeur.email) {
        const data = await SelectData("professeurs");
        const emailExists = data?.some(
          (p: ProfesseurDB) => p.email === professeur.email && p.id !== id
        );
        if (emailExists) {
          throw new Error("Cet email est déjà utilisé par un autre professeur");
        }
      }

      // Si on modifie le téléphone, vérifier qu'il n'existe pas déjà
      if (professeur.telephone) {
        const data = await SelectData("professeurs");
        const phoneExists = data?.some(
          (p: ProfesseurDB) => p.telephone === professeur.telephone && p.id !== id
        );
        if (phoneExists) {
          throw new Error(
            "Ce numéro de téléphone est déjà utilisé par un autre professeur"
          );
        }
      }

      // Si on modifie le NIF/CIN, vérifier qu'il n'existe pas déjà
      if (professeur.nif_cin) {
        const data = await SelectData("professeurs");
        const nifExists = data?.some(
          (p: ProfesseurDB) => p.nif_cin === professeur.nif_cin && p.id !== id
        );
        if (nifExists) {
          throw new Error(
            "Ce NIF/CIN est déjà utilisé par un autre professeur"
          );
        }
      }

      // Préparer les données pour la mise à jour (exclure les séquences)
      const { sequences, ...professeurData } = professeur;

      const result = await UpdateData("professeurs", id, professeurData);

      if (result) {
        // Gérer les séquences si elles sont fournies
        if (sequences) {
          // Supprimer les anciennes séquences (suppression logique)
          const sequencesData = await SelectData("sequences");
          const anciennesSequences =
            sequencesData?.filter((s: SequenceDB) => s.professeur_id === id) ||
            [];

          for (const ancienneSequence of anciennesSequences) {
            await UpdateData("sequences", ancienneSequence.id, {
              deleted: true,
            });
          }

          // Ajouter les nouvelles séquences
          for (const sequence of sequences) {
            const sequenceDB: Omit<
              SequenceDB,
              "id" | "created_at" | "updated_at"
            > = {
              professeur_id: id,
              classe: sequence.classe,
              salle: sequence.salle,
              matiere: sequence.matiere,
              deleted: false,
            };
            await InsertData("sequences", sequenceDB);
          }
        }

        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de la modification du professeur");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du professeur";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerProfesseur = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Suppression logique du professeur
      const result = await UpdateData("professeurs", id, { deleted: true });

      if (result) {
        // Suppression logique des séquences associées
        const sequencesData = await SelectData("sequences");
        const sequences =
          sequencesData?.filter(
            (s: SequenceDB) => s.professeur_id === id && !s.deleted
          ) || [];

        // Supprimer logiquement toutes les séquences associées
        for (const sequence of sequences) {
          await UpdateData("sequences", sequence.id, { deleted: true });
        }

        // Mettre à jour l'état local immédiatement pour une meilleure UX
        setProfesseurs((prev) => prev.filter((p) => p.id !== id));

        // Recharger les données pour s'assurer de la cohérence
        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de la suppression du professeur");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du professeur";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerProfesseurDefinitif = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Supprimer définitivement toutes les séquences associées
      const sequencesData = await SelectData("sequences");
      const sequences =
        sequencesData?.filter((s: SequenceDB) => s.professeur_id === id) || [];

      for (const sequence of sequences) {
        await DeleteData("sequences", sequence.id);
      }

      // Supprimer définitivement le professeur
      const result = await DeleteData("professeurs", id);

      if (result) {
        await rechargerProfesseurs();
      } else {
        throw new Error(
          "Erreur lors de la suppression définitive du professeur"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression définitive du professeur";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerProfesseur = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Restaurer le professeur
      const result = await UpdateData("professeurs", id, { deleted: false });

      if (result) {
        // Restaurer les séquences associées
        const sequencesData = await SelectData("sequences");
        const sequences =
          sequencesData?.filter(
            (s: SequenceDB) => s.professeur_id === id && s.deleted
          ) || [];

        for (const sequence of sequences) {
          await UpdateData("sequences", sequence.id, { deleted: false });
        }

        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de la restauration du professeur");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la restauration du professeur";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // === GESTION DES SÉQUENCES (version simplifiée) ===
  const ajouterSequence = async (
    professeurId: string,
    sequence: Omit<Sequence, "id">
  ): Promise<void> => {
    try {
      console.log("Ajout de séquence:", { professeurId, sequence });

      const sequenceDB: Omit<SequenceDB, "id" | "created_at" | "updated_at"> = {
        professeur_id: professeurId,
        classe: sequence.classe,
        salle: sequence.salle,
        matiere: sequence.matiere,
        deleted: false,
      };

      console.log("Données à insérer:", sequenceDB);

      const result = await InsertData("sequences", sequenceDB);
      console.log("Résultat de l'insertion:", result);

      if (result === true) {
        await rechargerProfesseurs();
      } else {
        const message = (result as any)?.message ||
          "Erreur lors de l'ajout de la séquence";
        throw new Error(message);
      }
    } catch (err) {
      console.error("Erreur détaillée lors de l'ajout de la séquence:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout de la séquence";
      handleError(errorMessage);
      throw err;
    }
  };

  const modifierSequence = async (
    professeurId: string,
    sequenceId: string,
    sequence: Partial<Sequence>
  ): Promise<void> => {
    try {
      const sequenceUpdate: any = {};
      if (sequence.classe) sequenceUpdate.classe = sequence.classe;
      if (sequence.salle) sequenceUpdate.salle = sequence.salle;
      if (sequence.matiere) sequenceUpdate.matiere = sequence.matiere;
      if (sequence.deleted !== undefined)
        sequenceUpdate.deleted = sequence.deleted;

      const result = await UpdateData("sequences", sequenceId, sequenceUpdate);
      if (result) {
        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de la modification de la séquence");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la séquence";
      handleError(errorMessage);
      throw err;
    }
  };

  const supprimerSequence = async (
    professeurId: string,
    sequenceId: string
  ): Promise<void> => {
    try {
      const result = await UpdateData("sequences", sequenceId, {
        deleted: true,
      });
      if (result) {
        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de la suppression de la séquence");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la séquence";
      handleError(errorMessage);
      throw err;
    }
  };

  // === RECHERCHE ET FILTRAGE ===
  const rechercherProfesseurs = (terme: string): Professeur[] => {
    if (!terme.trim()) return professeurs;

    const termeMinuscule = terme.toLowerCase().trim();
    return professeurs.filter(
      (prof) =>
        prof.nom.toLowerCase().includes(termeMinuscule) ||
        prof.prenom.toLowerCase().includes(termeMinuscule) ||
        prof.email.toLowerCase().includes(termeMinuscule) ||
        prof.code.toLowerCase().includes(termeMinuscule) ||
        prof.enseignant_id.toLowerCase().includes(termeMinuscule) ||
        `${prof.prenom} ${prof.nom}`.toLowerCase().includes(termeMinuscule)
    );
  };

  const obtenirProfesseurParId = (id: string): Professeur | undefined => {
    return professeurs.find((prof) => prof.id === id);
  };

  const obtenirProfesseursParAnnee = (anneeId: string): Professeur[] => {
    return professeurs.filter(
      (prof) => prof.annee_scolaire_id === anneeId && !prof.deleted
    );
  };

  const obtenirProfesseursActifs = (anneeId?: string): Professeur[] => {
    return professeurs.filter((prof) => {
      const isActive = prof.statut === "actif" && !prof.deleted;
      return anneeId
        ? isActive && prof.annee_scolaire_id === anneeId
        : isActive;
    });
  };

  const obtenirProfesseursInactifs = (anneeId?: string): Professeur[] => {
    return professeurs.filter((prof) => {
      const isInactive = prof.statut === "inactif" && !prof.deleted;
      return anneeId
        ? isInactive && prof.annee_scolaire_id === anneeId
        : isInactive;
    });
  };

  const obtenirProfesseursSupprimesLogiquement = (
    anneeId?: string
  ): Professeur[] => {
    return professeurs.filter((prof) => {
      const isDeleted = prof.deleted === true;
      return anneeId
        ? isDeleted && prof.annee_scolaire_id === anneeId
        : isDeleted;
    });
  };

  // === FONCTIONS UTILITAIRES ===
  const validerCodeProfesseur = async (
    code: string,
    professeurId?: string
  ): Promise<boolean> => {
    try {
      const data = await SelectData("professeurs");
      const codeExists = data?.some(
        (p: ProfesseurDB) => p.code === code && p.id !== professeurId
      );
      return !codeExists;
    } catch (err) {
      handleError("Erreur lors de la validation du code professeur");
      return false;
    }
  };

  const validerEmailProfesseur = async (
    email: string,
    professeurId?: string
  ): Promise<boolean> => {
    try {
      const data = await SelectData("professeurs");
      const emailExists = data?.some(
        (p: ProfesseurDB) => p.email === email && p.id !== professeurId
      );
      return !emailExists;
    } catch (err) {
      handleError("Erreur lors de la validation de l'email");
      return false;
    }
  };

  const genererNouveauCode = async (): Promise<string> => {
    try {
      const data = await SelectData("professeurs");
      const codes = data?.map((p: ProfesseurDB) => p.code) || [];

      let numero = 1;
      let nouveauCode = `PROF${String(numero).padStart(3, "0")}`;

      while (codes.includes(nouveauCode)) {
        numero++;
        nouveauCode = `PROF${String(numero).padStart(3, "0")}`;
      }

      return nouveauCode;
    } catch (err) {
      handleError("Erreur lors de la génération du code professeur");
      return `PROF${String(Date.now()).slice(-3)}`;
    }
  };

  // === ACTIONS PAR LOTS ===
  const supprimerPlusieursProfesseurs = async (
    ids: string[]
  ): Promise<void> => {
    try {
      setIsLoading(true);

      for (const id of ids) {
        await supprimerProfesseur(id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression multiple";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerPlusieursProfesseurs = async (
    ids: string[]
  ): Promise<void> => {
    try {
      setIsLoading(true);

      for (const id of ids) {
        await restaurerProfesseur(id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la restauration multiple";
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialiser au montage et recharger quand l'année courante change
  useEffect(() => {
    rechargerProfesseurs();
  }, [currentYear]);

  return (
    <ProfesseurContext.Provider
      value={{
        // États
        professeurs,
        isLoading,
        error,

        // Fonctions CRUD Professeurs
        ajouterProfesseur,
        modifierProfesseur,
        supprimerProfesseur,
        supprimerProfesseurDefinitif,
        restaurerProfesseur,

        // Fonctions de gestion des séquences
        ajouterSequence,
        modifierSequence,
        supprimerSequence,

        // Fonctions de recherche et filtrage
        rechercherProfesseurs,
        obtenirProfesseurParId,
        obtenirProfesseursParAnnee,
        obtenirProfesseursActifs,
        obtenirProfesseursInactifs,
        obtenirProfesseursSupprimesLogiquement,

        // Fonctions utilitaires
        setError,
        rechargerProfesseurs,
        chargerProfesseursParAnnee,
        validerCodeProfesseur,
        validerEmailProfesseur,
        genererNouveauCode,

        // Actions par lots
        supprimerPlusieursProfesseurs,
        restaurerPlusieursProfesseurs,
      }}
    >
      {children}
    </ProfesseurContext.Provider>
  );
};

// Hook personnalisé
export const useProfesseur = () => {
  const context = useContext(ProfesseurContext);
  if (context === undefined) {
    throw new Error("useProfesseur must be used within a ProfesseurProvider");
  }
  return context;
};

// Types supplémentaires pour les composants
export interface ProfesseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view" | "delete";
  professeur?: Professeur;
  isDarkMode?: boolean;
}

export interface SequenceFormProps {
  professeurId: string;
  sequence?: Sequence;
  onSave: (sequence: Omit<Sequence, "id">) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export interface ProfesseurListProps {
  professeurs: Professeur[];
  onEdit: (professeur: Professeur) => void;
  onDelete: (professeur: Professeur) => void;
  onView: (professeur: Professeur) => void;
  isDarkMode?: boolean;
}
