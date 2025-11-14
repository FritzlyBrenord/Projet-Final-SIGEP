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
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
} from "@/Config/SupabaseData";
import { useAnneeScolaire } from "./ContextAnneeScolaire";

// ===========================
// TYPES (utiliser ceux définis précédemment)
// ===========================

// Types pour les tables DB
interface EnseignantDB {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  date_naissance?: string;
  diplomes: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProfesseurAffectationDB {
  id: string;
  enseignant_id: string;
  annee_scolaire_id: string;
  code: string;
  enseignant_code?: string;
  date_embauche?: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SequenceDB {
  id: string;
  professeur_affectation_id: string;
  classe: string;
  salle: string;
  matiere: string;
  volume_horaire?: number;
  coefficient?: number;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===========================
// TYPES POUR LES TABLES DE BASE DE DONNÉES
// ===========================

interface ClasseDB {
  id: string;
  annee_scolaire_id: string;
  nom: string;
  code: string;
  niveau: string;
  capacite_max: number;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SalleDB {
  id: string;
  annee_scolaire_id: string;
  nom: string;
  code: string;
  capacite: number;
  equipements: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface MatiereDB {
  id: string;
  annee_scolaire_id: string;
  nom: string;
  code: string;
  description: string;
  coefficient: number;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}
// Types pour l'interface
export interface Sequence {
  id: string;
  professeur_affectation_id: string;
  classe: string;
  salle: string;
  matiere: string;
  volume_horaire?: number;
  coefficient?: number;
  deleted?: boolean;
}

export interface Professeur {
  // Identifiants
  id: string; // ID de l'affectation
  enseignant_id: string;

  // Informations personnelles
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  diplomes: string;

  // Informations d'affectation
  code: string;
  enseignant_code?: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;

  // Séquences
  sequences: Sequence[];
}

export interface ProfesseurFormData {
  // Informations personnelles
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  diplomes: string;

  // Informations d'affectation
  code: string;
  enseignant_code?: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  annee_scolaire_id: string;

  // Séquences
  sequences: Omit<Sequence, "id" | "professeur_affectation_id">[];
}

// Interface du contexte
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
    sequence: Omit<Sequence, "id" | "professeur_affectation_id">
  ) => Promise<void>;
  modifierSequence: (
    professeurId: string,
    sequenceId: string,
    sequence: Partial<Omit<Sequence, "id" | "professeur_affectation_id">>
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
    professeurId?: string,
    anneeId?: string
  ) => Promise<boolean>;
  validerEmailEnseignant: (
    email: string,
    enseignantId?: string
  ) => Promise<boolean>;
  genererNouveauCode: (anneeId: string) => Promise<string>;

  // Actions par lots
  supprimerPlusieursProfesseurs: (ids: string[]) => Promise<void>;
  restaurerPlusieursProfesseurs: (ids: string[]) => Promise<void>;

  // Copie vers nouvelle année
  copierProfesseursVersNouvelleAnnee: (
    anneeSourceId: string,
    anneeDestinationId: string
  ) => Promise<void>;
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

  // ===========================
  // FONCTIONS DE RÉCUPÉRATION DES DONNÉES
  // ===========================

  // Récupérer toutes les données des 6 tables
  const recupererDonneesCompletes = async () => {
    try {
      const [
        enseignantsData,
        affectationsData,
        sequencesData,
        classesData,
        sallesData,
        matieresData,
      ] = await Promise.all([
        SelectData("enseignants"),
        SelectData("professeurs_affectations"),
        SelectData("sequences"),
        SelectData("classes"),
        SelectData("salles"),
        SelectData("matieres"),
      ]);

      return {
        enseignants: enseignantsData || [],
        affectations: affectationsData || [],
        sequences: sequencesData || [],
        classes: classesData || [],
        salles: sallesData || [],
        matieres: matieresData || [],
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      throw error;
    }
  };
  // Convertir les données DB vers le type Professeur
  const convertToProfesseur = (
    affectation: ProfesseurAffectationDB,
    enseignant: EnseignantDB,
    sequences: SequenceDB[]
  ): Professeur => {
    const sequencesFiltrees = sequences
      .filter(
        (s) => s.professeur_affectation_id === affectation.id && !s.deleted
      )
      .map((s) => ({
        id: s.id,
        professeur_affectation_id: s.professeur_affectation_id,
        classe: s.classe,
        salle: s.salle,
        matiere: s.matiere,
        volume_horaire: s.volume_horaire,
        coefficient: s.coefficient,
        deleted: s.deleted,
      }));

    return {
      // Identifiants
      id: affectation.id,
      enseignant_id: enseignant.id,

      // Informations personnelles
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      telephone: enseignant.telephone,
      adresse: enseignant.adresse,
      nif_cin: enseignant.nif_cin,
      diplomes: enseignant.diplomes,

      // Informations d'affectation
      code: affectation.code,
      enseignant_code: affectation.enseignant_code,
      date_embauche: affectation.date_embauche || "",
      date_fin_contrat: affectation.date_fin_contrat,
      statut: affectation.statut,
      type_contrat: affectation.type_contrat,
      salaire_base: affectation.salaire_base,
      notes_rh: affectation.notes_rh,
      annee_scolaire_id: affectation.annee_scolaire_id,
      deleted: affectation.deleted,
      created_at: affectation.created_at,
      updated_at: affectation.updated_at,

      // Séquences
      sequences: sequencesFiltrees,
    };
  };

  // ===========================
  // CHARGEMENT DES PROFESSEURS
  // ===========================

  const rechargerProfesseurs = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const { enseignants, affectations, sequences } =
        await recupererDonneesCompletes();

      // Filtrer par année courante et non supprimés
      const affectationsFiltrees = currentYear
        ? affectations.filter(
            (a: ProfesseurAffectationDB) =>
              a.annee_scolaire_id === currentYear.id && !a.deleted
          )
        : affectations.filter((a: ProfesseurAffectationDB) => !a.deleted);

      // Convertir en objets Professeur
      const professeursConverted: Professeur[] = [];

      for (const affectation of affectationsFiltrees) {
        const enseignant = enseignants.find(
          (e: EnseignantDB) => e.id === affectation.enseignant_id
        );
        if (enseignant) {
          const professeur = convertToProfesseur(
            affectation,
            enseignant,
            sequences
          );
          professeursConverted.push(professeur);
        }
      }

      setProfesseurs(professeursConverted);
    } catch (err) {
      handleError("Erreur lors du chargement des professeurs");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  const chargerProfesseursParAnnee = async (anneeId: string): Promise<void> => {
    try {
      setIsLoading(true);

      const { enseignants, affectations, sequences } =
        await recupererDonneesCompletes();

      const affectationsFiltrees = affectations.filter(
        (a: ProfesseurAffectationDB) =>
          a.annee_scolaire_id === anneeId && !a.deleted
      );

      const professeursConverted: Professeur[] = [];

      for (const affectation of affectationsFiltrees) {
        const enseignant = enseignants.find(
          (e: EnseignantDB) => e.id === affectation.enseignant_id
        );
        if (enseignant) {
          const professeur = convertToProfesseur(
            affectation,
            enseignant,
            sequences
          );
          professeursConverted.push(professeur);
        }
      }

      setProfesseurs(professeursConverted);
    } catch (err) {
      handleError("Erreur lors du chargement des professeurs par année");
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================
  // CRUD PROFESSEURS
  // ===========================

  const ajouterProfesseur = async (
    professeur: ProfesseurFormData
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Vérifications de base
      if (!professeur.nom || !professeur.prenom || !professeur.email) {
        throw new Error("Nom, prénom et email sont obligatoires");
      }

      if (!currentYear) {
        throw new Error("Aucune année scolaire sélectionnée");
      }

      // 1. Vérifier si l'enseignant existe déjà par email
      const enseignantsData = await SelectData("enseignants");
      let enseignantExistant = enseignantsData?.find(
        (e: EnseignantDB) => e.email === professeur.email
      );

      let enseignantId: string;

      if (enseignantExistant) {
        // 1a. Enseignant existe déjà - vérifier s'il n'a pas déjà une affectation cette année
        const affectationsData = await SelectData("professeurs_affectations");
        const affectationExistante = affectationsData?.find(
          (a: ProfesseurAffectationDB) =>
            a.enseignant_id === enseignantExistant.id &&
            a.annee_scolaire_id === professeur.annee_scolaire_id
        );

        if (affectationExistante) {
          throw new Error(
            "Cet enseignant a déjà une affectation pour cette année scolaire"
          );
        }

        enseignantId = enseignantExistant.id;

        // Mettre à jour les infos de l'enseignant si nécessaire
        const enseignantUpdate = {
          nom: professeur.nom,
          prenom: professeur.prenom,
          telephone: professeur.telephone,
          adresse: professeur.adresse,
          nif_cin: professeur.nif_cin,
          diplomes: professeur.diplomes,
        };

        await UpdateData("enseignants", enseignantId, enseignantUpdate);
      } else {
        // 1b. Créer un nouvel enseignant
        const nouvelEnseignant: Omit<
          EnseignantDB,
          "id" | "created_at" | "updated_at"
        > = {
          nom: professeur.nom,
          prenom: professeur.prenom,
          email: professeur.email,
          telephone: professeur.telephone,
          adresse: professeur.adresse,
          nif_cin: professeur.nif_cin,
          diplomes: professeur.diplomes,
        };

        const { success, rows, error } = await InsertDataReturn(
          "enseignants",
          nouvelEnseignant
        );

        if (!success || !rows || rows.length === 0) {
          throw new Error(
            error?.message || "Erreur lors de la création de l'enseignant"
          );
        }

        enseignantId = rows[0].id as string;
      }

      // 2. Vérifier l'unicité du code pour cette année
      const affectationsData = await SelectData("professeurs_affectations");
      const codeExists = affectationsData?.some(
        (a: ProfesseurAffectationDB) =>
          a.code === professeur.code &&
          a.annee_scolaire_id === professeur.annee_scolaire_id
      );

      if (codeExists) {
        throw new Error(
          "Ce code professeur existe déjà pour cette année scolaire"
        );
      }

      // 3. Créer l'affectation
      const nouvelleAffectation: Omit<
        ProfesseurAffectationDB,
        "id" | "created_at" | "updated_at"
      > = {
        enseignant_id: enseignantId,
        annee_scolaire_id: professeur.annee_scolaire_id,
        code: professeur.code,
        enseignant_code: professeur.enseignant_code,
        date_embauche: professeur.date_embauche,
        date_fin_contrat: professeur.date_fin_contrat,
        statut: professeur.statut,
        type_contrat: professeur.type_contrat,
        salaire_base: professeur.salaire_base,
        notes_rh: professeur.notes_rh,
        deleted: false,
      };

      const {
        success: affectationSuccess,
        rows: affectationRows,
        error: affectationError,
      } = await InsertDataReturn(
        "professeurs_affectations",
        nouvelleAffectation
      );

      if (
        !affectationSuccess ||
        !affectationRows ||
        affectationRows.length === 0
      ) {
        throw new Error(
          affectationError?.message ||
            "Erreur lors de la création de l'affectation"
        );
      }

      const nouvelleAffectationId = affectationRows[0].id as string;

      // 4. Ajouter les séquences
      if (professeur.sequences && professeur.sequences.length > 0) {
        for (const sequence of professeur.sequences) {
          const nouvelleSequence: Omit<
            SequenceDB,
            "id" | "created_at" | "updated_at"
          > = {
            professeur_affectation_id: nouvelleAffectationId,
            classe: sequence.classe,
            salle: sequence.salle,
            matiere: sequence.matiere,
            volume_horaire: sequence.volume_horaire,
            coefficient: sequence.coefficient,
            deleted: false,
          };

          const sequenceResult = await InsertData(
            "sequences",
            nouvelleSequence
          );
          if (sequenceResult !== true) {
            console.error(
              "Erreur lors de l'ajout d'une séquence:",
              sequenceResult
            );
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

      // Récupérer l'affectation existante
      const affectationsData = await SelectData("professeurs_affectations");
      const affectationExistante = affectationsData?.find(
        (a: ProfesseurAffectationDB) => a.id === id
      );

      if (!affectationExistante) {
        throw new Error("Affectation non trouvée");
      }

      // 1. Mettre à jour l'enseignant si nécessaire
      if (
        professeur.nom ||
        professeur.prenom ||
        professeur.email ||
        professeur.telephone ||
        professeur.adresse ||
        professeur.nif_cin ||
        professeur.diplomes
      ) {
        const enseignantUpdate: any = {};
        if (professeur.nom) enseignantUpdate.nom = professeur.nom;
        if (professeur.prenom) enseignantUpdate.prenom = professeur.prenom;
        if (professeur.email) enseignantUpdate.email = professeur.email;
        if (professeur.telephone)
          enseignantUpdate.telephone = professeur.telephone;
        if (professeur.adresse) enseignantUpdate.adresse = professeur.adresse;
        if (professeur.nif_cin) enseignantUpdate.nif_cin = professeur.nif_cin;
        if (professeur.diplomes)
          enseignantUpdate.diplomes = professeur.diplomes;

        // Vérifier l'unicité de l'email
        if (professeur.email) {
          const enseignantsData = await SelectData("enseignants");
          const emailExists = enseignantsData?.some(
            (e: EnseignantDB) =>
              e.email === professeur.email &&
              e.id !== affectationExistante.enseignant_id
          );
          if (emailExists) {
            throw new Error(
              "Cet email est déjà utilisé par un autre enseignant"
            );
          }
        }

        await UpdateData(
          "enseignants",
          affectationExistante.enseignant_id,
          enseignantUpdate
        );
      }

      // 2. Mettre à jour l'affectation
      const affectationUpdate: any = {};
      if (professeur.code) {
        // Vérifier l'unicité du code pour cette année
        const codeExists = affectationsData?.some(
          (a: ProfesseurAffectationDB) =>
            a.code === professeur.code &&
            a.annee_scolaire_id === affectationExistante.annee_scolaire_id &&
            a.id !== id
        );
        if (codeExists) {
          throw new Error(
            "Ce code professeur existe déjà pour cette année scolaire"
          );
        }
        affectationUpdate.code = professeur.code;
      }

      if (professeur.enseignant_code !== undefined)
        affectationUpdate.enseignant_code = professeur.enseignant_code;
      if (professeur.date_embauche)
        affectationUpdate.date_embauche = professeur.date_embauche;
      if (professeur.date_fin_contrat !== undefined)
        affectationUpdate.date_fin_contrat = professeur.date_fin_contrat;
      if (professeur.statut) affectationUpdate.statut = professeur.statut;
      if (professeur.type_contrat)
        affectationUpdate.type_contrat = professeur.type_contrat;
      if (professeur.salaire_base !== undefined)
        affectationUpdate.salaire_base = professeur.salaire_base;
      if (professeur.notes_rh !== undefined)
        affectationUpdate.notes_rh = professeur.notes_rh;

      if (Object.keys(affectationUpdate).length > 0) {
        await UpdateData("professeurs_affectations", id, affectationUpdate);
      }

      // 3. Gérer les séquences si fournies - CORRECTION ICI
      if (professeur.sequences) {
        const sequencesData = await SelectData("sequences");
        const anciennesSequences =
          sequencesData?.filter(
            (s: SequenceDB) => s.professeur_affectation_id === id && !s.deleted
          ) || [];

        // Créer des maps pour le matching
        const sequencesExistantesMap = new Map(
          anciennesSequences.map((seq) => [seq.id, seq])
        );

        const nouvellesSequencesMap = new Map(
          professeur.sequences.map((seq, index) => [
            // Utiliser l'ID existant si disponible, sinon créer une clé temporaire
            (seq as any).id || `temp-${index}`,
            seq,
          ])
        );

        // Traiter chaque séquence
        for (const [sequenceId, nouvelleSequence] of nouvellesSequencesMap) {
          if (sequencesExistantesMap.has(sequenceId)) {
            // Mettre à jour la séquence existante
            const sequenceUpdate: any = {
              classe: nouvelleSequence.classe,
              salle: nouvelleSequence.salle,
              matiere: nouvelleSequence.matiere,
              volume_horaire: nouvelleSequence.volume_horaire,
              coefficient: nouvelleSequence.coefficient,
            };

            await UpdateData("sequences", sequenceId, sequenceUpdate);
            sequencesExistantesMap.delete(sequenceId); // Marquer comme traité
          } else {
            // Nouvelle séquence (sans ID ou avec ID temporaire)
            const nouvelleSequenceDB: Omit<
              SequenceDB,
              "id" | "created_at" | "updated_at"
            > = {
              professeur_affectation_id: id,
              classe: nouvelleSequence.classe,
              salle: nouvelleSequence.salle,
              matiere: nouvelleSequence.matiere,
              volume_horaire: nouvelleSequence.volume_horaire,
              coefficient: nouvelleSequence.coefficient,
              deleted: false,
            };
            await InsertData("sequences", nouvelleSequenceDB);
          }
        }

        // Supprimer les séquences qui n'existent plus dans le nouveau formulaire
        for (const [sequenceId, ancienneSequence] of sequencesExistantesMap) {
          await UpdateData("sequences", sequenceId, { deleted: true });
        }
      }

      await rechargerProfesseurs();
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

      // Sécurité: ne supprimer que dans l'année scolaire courante
      if (!currentYear) {
        throw new Error("Aucune année scolaire sélectionnée");
      }
      const affectationsData = await SelectData("professeurs_affectations");
      const affectation = affectationsData?.find(
        (a: ProfesseurAffectationDB) => a.id === id
      );
      if (!affectation) {
        throw new Error("Affectation non trouvée");
      }
      if (affectation.annee_scolaire_id !== currentYear.id) {
        throw new Error(
          "Suppression refusée: l'affectation ne correspond pas à l'année sélectionnée"
        );
      }

      // Suppression logique de l'affectation
      const result = await UpdateData("professeurs_affectations", id, {
        deleted: true,
      });

      if (result) {
        // Suppression logique des séquences associées
        const sequencesData = await SelectData("sequences");
        const sequences =
          sequencesData?.filter(
            (s: SequenceDB) => s.professeur_affectation_id === id && !s.deleted
          ) || [];

        for (const sequence of sequences) {
          await UpdateData("sequences", sequence.id, { deleted: true });
        }

        // Mettre à jour l'état local
        setProfesseurs((prev) => prev.filter((p) => p.id !== id));
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

      // Sécurité: ne supprimer que dans l'année scolaire courante
      if (!currentYear) {
        throw new Error("Aucune année scolaire sélectionnée");
      }
      const affectationsData = await SelectData("professeurs_affectations");
      const affectation = affectationsData?.find(
        (a: ProfesseurAffectationDB) => a.id === id
      );
      if (!affectation) {
        throw new Error("Affectation non trouvée");
      }
      if (affectation.annee_scolaire_id !== currentYear.id) {
        throw new Error(
          "Suppression définitive refusée: l'affectation ne correspond pas à l'année sélectionnée"
        );
      }

      // Supprimer définitivement les séquences
      const sequencesData = await SelectData("sequences");
      const sequences =
        sequencesData?.filter(
          (s: SequenceDB) => s.professeur_affectation_id === id
        ) || [];

      for (const sequence of sequences) {
        await DeleteData("sequences", sequence.id);
      }

      // Supprimer définitivement l'affectation
      const result = await DeleteData("professeurs_affectations", id);

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

      // Sécurité: ne restaurer que dans l'année scolaire courante
      if (!currentYear) {
        throw new Error("Aucune année scolaire sélectionnée");
      }
      const affectationsData = await SelectData("professeurs_affectations");
      const affectation = affectationsData?.find(
        (a: ProfesseurAffectationDB) => a.id === id
      );
      if (!affectation) {
        throw new Error("Affectation non trouvée");
      }
      if (affectation.annee_scolaire_id !== currentYear.id) {
        throw new Error(
          "Restauration refusée: l'affectation ne correspond pas à l'année sélectionnée"
        );
      }

      // Restaurer l'affectation
      const result = await UpdateData("professeurs_affectations", id, {
        deleted: false,
      });

      if (result) {
        // Restaurer les séquences associées
        const sequencesData = await SelectData("sequences");
        const anciennesSequences =
          sequencesData?.filter(
            (s: SequenceDB) => s.professeur_affectation_id === id
          ) || [];

        for (const ancienneSequence of anciennesSequences) {
          await UpdateData("sequences", ancienneSequence.id, { deleted: true });
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

  // ===========================
  // GESTION DES SÉQUENCES
  // ===========================

  const ajouterSequence = async (
    professeurId: string,
    sequence: Omit<Sequence, "id" | "professeur_affectation_id">
  ): Promise<void> => {
    try {
      const nouvelleSequence: Omit<
        SequenceDB,
        "id" | "created_at" | "updated_at"
      > = {
        professeur_affectation_id: professeurId,
        classe: sequence.classe,
        salle: sequence.salle,
        matiere: sequence.matiere,
        volume_horaire: sequence.volume_horaire,
        coefficient: sequence.coefficient,
        deleted: false,
      };

      const result = await InsertData("sequences", nouvelleSequence);
      if (result === true) {
        await rechargerProfesseurs();
      } else {
        throw new Error("Erreur lors de l'ajout de la séquence");
      }
    } catch (err) {
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
    sequence: Partial<Omit<Sequence, "id" | "professeur_affectation_id">>
  ): Promise<void> => {
    try {
      const sequenceUpdate: any = {};
      if (sequence.classe) sequenceUpdate.classe = sequence.classe;
      if (sequence.salle) sequenceUpdate.salle = sequence.salle;
      if (sequence.matiere) sequenceUpdate.matiere = sequence.matiere;
      if (sequence.volume_horaire !== undefined)
        sequenceUpdate.volume_horaire = sequence.volume_horaire;
      if (sequence.coefficient !== undefined)
        sequenceUpdate.coefficient = sequence.coefficient;

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

  // ===========================
  // RECHERCHE ET FILTRAGE
  // ===========================

  const rechercherProfesseurs = (terme: string): Professeur[] => {
    if (!terme.trim()) return professeurs;

    const termeMinuscule = terme.toLowerCase().trim();
    return professeurs.filter(
      (prof) =>
        prof.nom.toLowerCase().includes(termeMinuscule) ||
        prof.prenom.toLowerCase().includes(termeMinuscule) ||
        prof.email.toLowerCase().includes(termeMinuscule) ||
        prof.code.toLowerCase().includes(termeMinuscule) ||
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

  // ===========================
  // FONCTIONS UTILITAIRES
  // ===========================

  const validerCodeProfesseur = async (
    code: string,
    professeurId?: string,
    anneeId?: string
  ): Promise<boolean> => {
    try {
      const affectationsData = await SelectData("professeurs_affectations");
      const codeExists = affectationsData?.some(
        (a: ProfesseurAffectationDB) =>
          a.code === code &&
          a.id !== professeurId &&
          (!anneeId || a.annee_scolaire_id === anneeId)
      );
      return !codeExists;
    } catch (err) {
      handleError("Erreur lors de la validation du code professeur");
      return false;
    }
  };

  const validerEmailEnseignant = async (
    email: string,
    enseignantId?: string
  ): Promise<boolean> => {
    try {
      const enseignantsData = await SelectData("enseignants");
      const emailExists = enseignantsData?.some(
        (e: EnseignantDB) => e.email === email && e.id !== enseignantId
      );
      return !emailExists;
    } catch (err) {
      handleError("Erreur lors de la validation de l'email");
      return false;
    }
  };

  const genererNouveauCode = async (anneeId: string): Promise<string> => {
    try {
      const affectationsData = await SelectData("professeurs_affectations");
      const codesAnnee =
        affectationsData
          ?.filter(
            (a: ProfesseurAffectationDB) => a.annee_scolaire_id === anneeId
          )
          .map((a: ProfesseurAffectationDB) => a.code) || [];

      let numero = 1;
      let nouveauCode = `PROF${String(numero).padStart(3, "0")}`;

      while (codesAnnee.includes(nouveauCode)) {
        numero++;
        nouveauCode = `PROF${String(numero).padStart(3, "0")}`;
      }

      return nouveauCode;
    } catch (err) {
      handleError("Erreur lors de la génération du code professeur");
      return `PROF${String(Date.now()).slice(-3)}`;
    }
  };

  // ===========================
  // ACTIONS PAR LOTS
  // ===========================

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

  // ===========================
  // COPIE VERS NOUVELLE ANNÉE SCOLAIRE
  // ===========================

  const copierProfesseursVersNouvelleAnnee = async (
    anneeSourceId: string,
    anneeDestinationId: string
  ): Promise<void> => {
    try {
      setIsLoading(true);

      console.log("=== DÉBUT COPIE PROFESSEURS ===");
      console.log("📅 Année source:", anneeSourceId);
      console.log("🎯 Année destination:", anneeDestinationId);

      // Récupérer toutes les données
      const { affectations, sequences, classes, salles, matieres } =
        await recupererDonneesCompletes();

      // ✅ CORRECTION: Récupérer les classes de l'année destination
      const classesDestination = classes.filter(
        (c: any) => c.annee_scolaire_id === anneeDestinationId && !c.deleted
      );

      console.log("📊 Classes destination:", classesDestination.length);
      console.log(
        "Classes destination:",
        classesDestination.map((c) => ({ id: c.id, nom: c.nom }))
      );

      // ✅ CORRECTION: Récupérer les salles des classes de l'année destination
      const classesDestinationIds = classesDestination.map((c) => c.id);
      const sallesDestination = salles.filter(
        (s: any) => classesDestinationIds.includes(s.classe_id) && !s.deleted
      );

      console.log("📊 Salles destination:", sallesDestination.length);
      console.log(
        "Salles destination:",
        sallesDestination.map((s) => ({
          id: s.id,
          nom: s.nom,
          classe_id: s.classe_id,
        }))
      );

      // ✅ CORRECTION: Récupérer les matières des salles de l'année destination
      const sallesDestinationIds = sallesDestination.map((s) => s.id);
      const matieresDestination = matieres.filter(
        (m: any) => sallesDestinationIds.includes(m.salle_id) && !m.deleted
      );

      console.log("📊 Matières destination:", matieresDestination.length);
      console.log(
        "Matières destination:",
        matieresDestination.map((m) => ({
          id: m.id,
          nom: m.nom,
          salle_id: m.salle_id,
        }))
      );

      // Vérification critique avec messages plus précis
      if (classesDestination.length === 0) {
        throw new Error(
          "❌ AUCUNE CLASSE trouvée dans l'année destination. " +
            "Créez d'abord les classes pour l'année " +
            anneeDestinationId
        );
      }

      if (sallesDestination.length === 0) {
        throw new Error(
          "❌ AUCUNE SALLE trouvée dans l'année destination. " +
            "Les classes existent mais n'ont pas de salles. " +
            "Créez d'abord les salles pour les classes de l'année " +
            anneeDestinationId
        );
      }

      if (matieresDestination.length === 0) {
        throw new Error(
          "❌ AUCUNE MATIÈRE trouvée dans l'année destination. " +
            "Les classes et salles existent mais n'ont pas de matières. " +
            "Créez d'abord les matières pour les salles de l'année " +
            anneeDestinationId
        );
      }

      // Récupérer les ressources de l'année source
      const classesSource = classes.filter(
        (c: any) => c.annee_scolaire_id === anneeSourceId && !c.deleted
      );
      const classesSourceIds = classesSource.map((c) => c.id);
      const sallesSource = salles.filter(
        (s: any) => classesSourceIds.includes(s.classe_id) && !s.deleted
      );
      const sallesSourceIds = sallesSource.map((s) => s.id);
      const matieresSource = matieres.filter(
        (m: any) => sallesSourceIds.includes(m.salle_id) && !m.deleted
      );

      console.log("📊 Ressources source:");
      console.log("- Classes:", classesSource.length);
      console.log("- Salles:", sallesSource.length);
      console.log("- Matières:", matieresSource.length);

      // Filtrer les affectations source
      const affectationsSource = affectations.filter(
        (a: ProfesseurAffectationDB) =>
          a.annee_scolaire_id === anneeSourceId && !a.deleted
      );

      if (affectationsSource.length === 0) {
        handleError("Aucune affectation trouvée dans l'année source");
        return;
      }

      console.log(
        `👨‍🏫 Affectations source trouvées: ${affectationsSource.length}`
      );

      // Vérifier les affectations existantes dans l'année destination
      const affectationsDestination = affectations.filter(
        (a: ProfesseurAffectationDB) =>
          a.annee_scolaire_id === anneeDestinationId && !a.deleted
      );

      const enseignantsDejaAffectes = affectationsDestination.map(
        (a) => a.enseignant_id
      );
      const codesDejaUtilises = affectationsDestination.map((a) => a.code);

      let professeursCopies = 0;
      let sequenceCopiees = 0;
      let professeursIgnores = 0;
      const erreurs: string[] = [];

      // Fonction pour trouver l'équivalent dans l'année destination
      const trouverEquivalentDestination = (
        sourceId: string,
        sourceData: any[],
        destData: any[],
        type: string
      ): string => {
        const sourceItem = sourceData.find((item) => item.id === sourceId);

        if (!sourceItem) {
          console.error(`❌ ${type} source non trouvé:`, sourceId);
          console.log(
            `📋 ${type}s source disponibles:`,
            sourceData.map((s) => ({ id: s.id, nom: s.nom, code: s.code }))
          );
          throw new Error(`${type} source non trouvé: ${sourceId}`);
        }

        // Chercher par NOM dans l'année destination
        let destItem = destData.find((item) => item.nom === sourceItem.nom);

        // Si pas trouvé par nom, chercher par code
        if (!destItem) {
          destItem = destData.find((item) => item.code === sourceItem.code);
        }

        // Si toujours pas trouvé, chercher par nom similaire
        if (!destItem) {
          destItem = destData.find(
            (item) =>
              item.nom.toLowerCase().includes(sourceItem.nom.toLowerCase()) ||
              sourceItem.nom.toLowerCase().includes(item.nom.toLowerCase())
          );
        }

        if (!destItem) {
          const message =
            `${type} "${sourceItem.nom}" non trouvé dans l'année destination. ` +
            `Disponibles: ${destData.map((d) => d.nom).join(", ")}`;
          console.error(`❌ ${message}`);
          throw new Error(message);
        }

        console.log(
          `✅ Correspondance ${type}: "${sourceItem.nom}" -> "${destItem.nom}"`
        );
        return destItem.id;
      };

      // Copier chaque affectation
      for (const affectationSource of affectationsSource) {
        try {
          console.log(
            `\n--- Traitement enseignant: ${affectationSource.code} ---`
          );

          // Vérifier si l'enseignant a déjà une affectation
          if (
            enseignantsDejaAffectes.includes(affectationSource.enseignant_id)
          ) {
            console.log(
              `↷ Enseignant ${affectationSource.enseignant_id} déjà affecté - ignoré`
            );
            professeursIgnores++;
            continue;
          }

          // Générer un code unique
          let nouveauCode = affectationSource.code;
          let compteur = 1;
          while (codesDejaUtilises.includes(nouveauCode)) {
            nouveauCode = `${affectationSource.code}_${compteur}`;
            compteur++;
          }
          codesDejaUtilises.push(nouveauCode);

          console.log(
            `📝 Création affectation: ${affectationSource.code} -> ${nouveauCode}`
          );

          // Créer la nouvelle affectation
          const nouvelleAffectation: Omit<
            ProfesseurAffectationDB,
            "id" | "created_at" | "updated_at"
          > = {
            enseignant_id: affectationSource.enseignant_id,
            annee_scolaire_id: anneeDestinationId,
            code: nouveauCode,
            enseignant_code: affectationSource.enseignant_code,
            date_embauche: affectationSource.date_embauche,
            date_fin_contrat: affectationSource.date_fin_contrat,
            statut: affectationSource.statut,
            type_contrat: affectationSource.type_contrat,
            salaire_base: affectationSource.salaire_base,
            notes_rh: affectationSource.notes_rh,
            deleted: false,
          };

          const insertResult = await InsertDataReturn(
            "professeurs_affectations",
            nouvelleAffectation
          );

          if (
            !insertResult.success ||
            !insertResult.rows ||
            insertResult.rows.length === 0
          ) {
            const errorMessage =
              insertResult.error?.message ||
              "Erreur lors de l'insertion de l'affectation";
            console.error(
              `❌ Erreur pour l'enseignant ${affectationSource.enseignant_id}:`,
              insertResult.error
            );
            erreurs.push(
              `Enseignant ${affectationSource.enseignant_id}: ${errorMessage}`
            );
            continue;
          }

          const nouvelleAffectationId = insertResult.rows[0].id as string;
          professeursCopies++;
          enseignantsDejaAffectes.push(affectationSource.enseignant_id);

          console.log(`✅ Affectation créée: ${nouvelleAffectationId}`);

          // Copier les séquences
          const sequencesSource = sequences.filter(
            (s: SequenceDB) =>
              s.professeur_affectation_id === affectationSource.id && !s.deleted
          );

          console.log(`📚 ${sequencesSource.length} séquence(s) à copier`);

          for (const sequenceSource of sequencesSource) {
            try {
              console.log(`  - Traitement séquence:`, {
                classe: sequenceSource.classe,
                salle: sequenceSource.salle,
                matiere: sequenceSource.matiere,
              });

              // Récupérer les IDs CORRECTS pour la nouvelle année
              const classeDestinationId = trouverEquivalentDestination(
                sequenceSource.classe,
                classesSource,
                classesDestination,
                "Classe"
              );

              const salleDestinationId = trouverEquivalentDestination(
                sequenceSource.salle,
                sallesSource,
                sallesDestination,
                "Salle"
              );

              const matiereDestinationId = trouverEquivalentDestination(
                sequenceSource.matiere,
                matieresSource,
                matieresDestination,
                "Matière"
              );

              console.log(`    ✅ IDs trouvés:`, {
                classe: classeDestinationId,
                salle: salleDestinationId,
                matiere: matiereDestinationId,
              });

              // Créer la nouvelle séquence avec les IDs de la NOUVELLE année
              const nouvelleSequence: Omit<
                SequenceDB,
                "id" | "created_at" | "updated_at"
              > = {
                professeur_affectation_id: nouvelleAffectationId,
                classe: classeDestinationId,
                salle: salleDestinationId,
                matiere: matiereDestinationId,
                volume_horaire: sequenceSource.volume_horaire,
                coefficient: sequenceSource.coefficient,
                deleted: false,
              };

              const sequenceResult = await InsertData(
                "sequences",
                nouvelleSequence
              );

              if (sequenceResult === true) {
                sequenceCopiees++;
                console.log(
                  `    ✅ Séquence copiée (${sequenceCopiees} total)`
                );
              } else {
                const errorMsg = `Échec insertion séquence: ${JSON.stringify(
                  sequenceResult
                )}`;
                console.error(`    ❌ ${errorMsg}`);
                erreurs.push(errorMsg);
              }
            } catch (sequenceError) {
              const errorMsg = `Séquence: ${sequenceError}`;
              console.error(`    ❌ ${errorMsg}`);
              erreurs.push(errorMsg);
            }
          }
        } catch (affectationError) {
          const errorMsg = `Affectation ${affectationSource.code}: ${affectationError}`;
          console.error(`❌ ${errorMsg}`);
          erreurs.push(errorMsg);
        }
      }

      // Recharger les données
      await rechargerProfesseurs();

      // Résumé final
      console.log("\n=== RÉSUMÉ FINAL DE LA COPIE ===");
      console.log(`✅ ${professeursCopies} professeur(s) copié(s)`);
      console.log(`✅ ${sequenceCopiees} séquence(s) copiée(s)`);
      console.log(`↷ ${professeursIgnores} professeur(s) ignoré(s)`);
      console.log(`❌ ${erreurs.length} erreur(s)`);

      if (erreurs.length > 0) {
        console.warn("Détails des erreurs:", erreurs);
        handleError(
          `Copie terminée avec ${erreurs.length} erreur(s). ` +
            `${professeursCopies} professeur(s) et ${sequenceCopiees} séquence(s) copié(s) avec succès.`
        );
      } else {
        handleError(
          `🎉 Copie réussie ! ${professeursCopies} professeur(s) et ${sequenceCopiees} séquence(s) copié(s).`
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la copie des professeurs";
      console.error("❌ ERREUR GLOBALE:", err);
      handleError(`❌ Échec de la copie: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  // Initialisation
  useEffect(() => {
    rechargerProfesseurs();
  }, [currentYear, rechargerProfesseurs]);

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
        validerEmailEnseignant,
        genererNouveauCode,

        // Actions par lots
        supprimerPlusieursProfesseurs,
        restaurerPlusieursProfesseurs,

        // Copie vers nouvelle année scolaire
        copierProfesseursVersNouvelleAnnee,
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
