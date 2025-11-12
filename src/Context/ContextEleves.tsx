"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useAnneeScolaire } from "./ContextAnneeScolaire";
import {
  ElevePermanent,
  EleveInscription,
  EleveAffiche,
  ReinscriptionData,
  DoublonEleve,
  EleveFormData,
} from "../types/EleveTypeV2";
import {
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
} from "@/Config/SupabaseData";

export interface ParcoursAcademique {
  // Informations personnelles de l'élève
  eleve: {
    id: string;
    code: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    pays_naissance: string;
    region_naissance: string;
    ville_naissance: string;
    section_naissance: string;
    sexe: "M" | "F";
    adresse_actuelle: string;
    telephone_parents: string;
    adresse_parents: string;
    nif_parents: string;
    etablissement_precedent: string;
    photo_url?: string;
    created_at?: string;
  };

  // Historique par année scolaire
  historique: {
    annee_scolaire_id: string;
    annee_scolaire_libelle: string;
    date_inscription: string;
    statut: "actif" | "inactif" | "suspendu";
    classe_nom: string;
    salle_nom: string;
    observations?: string;

    // Notes par trimestre
    notes: {
      trimestre_1: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      trimestre_2: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      trimestre_3: {
        notes_par_matiere: {
          matiere_nom: string;
          coefficient: number;
          note: number;
          observation?: string;
        }[];
        moyenne_generale: number;
      };
      moyenne_annuelle: number;
    };

    // Décision de fin d'année
    decision_fin_annee?: {
      decision: "ADMIS" | "REDOUBLER" | "EXPULSER";
      observation?: string;
      date_decision: string;
    };

    // Frais et paiements
    frais: {
      type_frais: string;
      montant_du: number;
      montant_paye: number;
      solde: number;
      paiements: {
        date_paiement: string;
        heure_paiement: string;
        montant_paye: number;
        numero_recu: string;
        remarques?: string;
      }[];
    }[];

    total_frais_du: number;
    total_frais_paye: number;
    solde_total: number;
  }[];

  // Statistiques globales
  statistiques: {
    nombre_annees_scolaires: number;
    moyenne_generale_cumulative: number;
    total_frais_du_global: number;
    total_frais_paye_global: number;
    solde_global: number;
    annees_admis: number;
    annees_redouble: number;
    annees_expulse: number;
  };
}

export interface ElevesContextType {
  eleves: EleveAffiche[];
  isLoading: boolean;
  error: string | null;

  // Fonctions existantes (maintenues pour compatibilité)
  ajouterEleve: (data: EleveFormData) => Promise<void>;
  modifierEleve: (
    id: string,
    data: Partial<EleveFormData>,
    inscriptionId?: string
  ) => Promise<void>;
  supprimerEleve: (id: string) => Promise<void>; // Supprime uniquement de l'année courante
  supprimerEleveDefinitif: (id: string) => Promise<void>; // Supprime définitivement de toutes les années
  supprimerEleveDeToutesAnnees: (id: string) => Promise<void>; // Supprime de toutes les années mais garde l'élève
  restaurerEleve: (id: string) => Promise<void>;
  rechercherEleves: (terme: string) => EleveAffiche[];
  genererNouveauCode: (nom?: string, prenom?: string) => Promise<string>;
  rechargerEleves: () => Promise<void>;

  // Nouvelles fonctions pour la gestion des deux tables
  verifierDoublons: (data: EleveFormData) => Promise<DoublonEleve[]>;
  ajouterNouvelEleve: (
    data: EleveFormData
  ) => Promise<{ eleve: EleveAffiche; doublons: DoublonEleve[] }>;
  reinscrireEleve: (data: ReinscriptionData) => Promise<void>;
  getHistoriqueEleve: (eleveId: string) => Promise<EleveInscription[]>;
  getParcoursAcademique: (eleveId: string) => Promise<ParcoursAcademique>;
}

const ElevesContext = createContext<ElevesContextType | undefined>(undefined);

export const ElevesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [eleves, setEleves] = useState<EleveAffiche[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear, getYearNameById } = useAnneeScolaire();

  const toEleveAffiche = (eleveData: any): EleveAffiche => ({
    id: eleveData.id,
    code: eleveData.code,
    nom: eleveData.nom,
    prenom: eleveData.prenom,
    date_naissance: eleveData.date_naissance,
    pays_naissance: eleveData.pays_naissance,
    region_naissance: eleveData.region_naissance,
    ville_naissance: eleveData.ville_naissance,
    section_naissance: eleveData.section_naissance,
    sexe: eleveData.sexe,
    adresse_actuelle: eleveData.adresse_actuelle,
    telephone_parents: eleveData.telephone_parents,
    adresse_parents: eleveData.adresse_parents,
    nif_parents: eleveData.nif_parents,
    moyenne_generale: eleveData.moyenne_generale,
    etablissement_precedent: eleveData.etablissement_precedent,
    photo_url: eleveData.photo_url,
    deleted: eleveData.deleted,
    created_at: eleveData.created_at,
    updated_at: eleveData.updated_at,
    // Données d'inscription
    inscription_id: eleveData.inscription_id,
    statut: eleveData.statut,
    date_inscription: eleveData.date_inscription,
    observations_inscription: eleveData.observations_inscription,
    annee_scolaire_id: eleveData.annee_scolaire_id,
    classe_id: eleveData.classe_id,
    salle_id: eleveData.salle_id,
  });

  const rechargerEleves = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!currentYear) {
        setEleves([]);
        return;
      }

      // Récupérer les deux tables et recomposer côté client
      const [elevesRows, inscriptionsRows] = await Promise.all([
        SelectData("eleves"),
        SelectData("eleves_inscriptions"),
      ]);

      const inscriptionsActuelles = (inscriptionsRows || []).filter(
        (i: EleveInscription) =>
          !i.deleted && i.annee_scolaire_id === currentYear.id
      );

      const elevesActifs = (elevesRows || []).filter(
        (e: ElevePermanent) => !e.deleted
      );

      const elevesAffiches: EleveAffiche[] = elevesActifs
        .map((e: ElevePermanent) => {
          const inscr = inscriptionsActuelles.find(
            (i: EleveInscription) => i.eleve_id === e.id
          );
          if (!inscr) return null;
          return toEleveAffiche({
            ...e,
            inscription_id: inscr.id,
            statut: inscr.statut,
            date_inscription: inscr.date_inscription,
            observations_inscription: inscr.observations,
            annee_scolaire_id: inscr.annee_scolaire_id,
            classe_id: inscr.classe_id,
            salle_id: inscr.salle_id,
          });
        })
        .filter(Boolean) as EleveAffiche[];

      setEleves(elevesAffiches);
    } catch (e) {
      setError("Erreur lors du chargement des élèves");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  const genererNouveauCode = async (
    nom?: string,
    prenom?: string
  ): Promise<string> => {
    const initialNom = (nom || "").trim().toUpperCase().slice(0, 1) || "X";
    const initialPrenom =
      (prenom || "").trim().toUpperCase().slice(0, 1) || "X";
    const rand1 = Math.floor(Math.random() * 10); // 0-9
    const rand2 = Math.floor(Math.random() * 100);
    const rand2Str = String(rand2).padStart(2, "0");
    // Format: EL + N + P + d + _ + dd  ex: ELJS4_79
    return `EL${initialNom}${initialPrenom}${rand1}_${rand2Str}`;
  };

  const verifierCapaciteSalle = async (
    salleId: string,
    anneeScolaireId: string
  ): Promise<{ isValid: boolean; message: string }> => {
    try {
      // 1. Récupérer les informations de la salle
      const salles = await SelectData("salles");
      const salle = salles?.find((s: any) => s.id === salleId);

      if (!salle) {
        return { isValid: false, message: "Salle introuvable" };
      }

      const capaciteMax = salle.capacite;

      // 2. Compter le nombre d'élèves actuellement inscrits dans cette salle pour l'année courante
      const inscriptions = await SelectData("eleves_inscriptions");
      const inscriptionsActives =
        inscriptions?.filter(
          (i: any) =>
            i.salle_id === salleId &&
            i.annee_scolaire_id === anneeScolaireId &&
            !i.deleted
        ) || [];

      const nombreElevesActuels = inscriptionsActives.length;

      // 3. Vérifier si la capacité est dépassée
      if (nombreElevesActuels >= capaciteMax) {
        return {
          isValid: false,
          message: `La salle est pleine (${nombreElevesActuels}/${capaciteMax} élèves). Veuillez choisir une autre salle.`,
        };
      }

      return {
        isValid: true,
        message: `Capacité disponible : ${nombreElevesActuels}/${capaciteMax} élèves`,
      };
    } catch (error) {
      console.error("Erreur lors de la vérification de capacité:", error);
      return {
        isValid: false,
        message: "Erreur lors de la vérification de la capacité",
      };
    }
  };

  const ajouterEleve = async (data: EleveFormData) => {
    try {
      setIsLoading(true);

      const capaciteCheck = await verifierCapaciteSalle(
        data.salle_id,
        data.annee_scolaire_id
      );

      if (!capaciteCheck.isValid) {
        setError(capaciteCheck.message);
        throw new Error(capaciteCheck.message);
      }

      // Toujours générer un code (EleveFormData V2 n'inclut pas le code)
      const code = await genererNouveauCode(data.nom, data.prenom);

      if (await DataExsite("eleves", "code", code))
        throw new Error("Ce code élève existe déjà");

      // 1. Insérer dans la table eleves
      const elevePayload: Omit<
        ElevePermanent,
        "id" | "created_at" | "updated_at"
      > = {
        code,
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: data.date_naissance,
        pays_naissance: data.pays_naissance,
        region_naissance: data.region_naissance,
        ville_naissance: data.ville_naissance,
        section_naissance: data.section_naissance,
        sexe: data.sexe,
        adresse_actuelle: data.adresse_actuelle,
        telephone_parents: data.telephone_parents,
        adresse_parents: data.adresse_parents,
        nif_parents: data.nif_parents,
        moyenne_generale: data.moyenne_generale,
        etablissement_precedent: data.etablissement_precedent,
        photo_url: data.photo_url,
        deleted: false,
      };

      const eleveResult = await InsertDataReturn("eleves", elevePayload);
      if (!eleveResult.success)
        throw new Error(
          eleveResult.error?.message || "Erreur lors de l'ajout de l'élève"
        );

      // 2. Insérer dans la table eleves_inscriptions
      const inscriptionPayload: Omit<
        EleveInscription,
        "id" | "created_at" | "updated_at"
      > = {
        eleve_id: eleveResult.rows?.[0]?.id || "",
        statut: data.statut,
        date_inscription: new Date().toISOString().split("T")[0],
        observations: data.observations,
        annee_scolaire_id: data.annee_scolaire_id,
        classe_id: data.classe_id,
        salle_id: data.salle_id,
        deleted: false,
      };

      const inscriptionResult = await InsertDataReturn(
        "eleves_inscriptions",
        inscriptionPayload
      );
      if (!inscriptionResult.success)
        throw new Error(
          inscriptionResult.error?.message ||
            "Erreur lors de l'inscription de l'élève"
        );

      await rechargerEleves();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout de l'élève"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierEleve = async (
    id: string,
    data: Partial<EleveFormData>,
    inscriptionId?: string
  ) => {
    try {
      setIsLoading(true);

      // Séparer les champs permanents et d'inscription
      const permanentFields: Array<keyof EleveFormData> = [
        "nom",
        "prenom",
        "date_naissance",
        "pays_naissance",
        "region_naissance",
        "ville_naissance",
        "section_naissance",
        "sexe",
        "adresse_actuelle",
        "telephone_parents",
        "adresse_parents",
        "nif_parents",
        "moyenne_generale",
        "etablissement_precedent",
        "photo_url",
      ];

      const inscriptionFields: Array<keyof EleveFormData> = [
        "statut",
        "observations",
        "annee_scolaire_id",
        "classe_id",
        "salle_id",
      ];

      const payloadPermanent: Record<string, any> = {};
      const payloadInscription: Record<string, any> = {};

      Object.entries(data).forEach(([key, value]) => {
        if ((permanentFields as string[]).includes(key)) {
          payloadPermanent[key] = value;
        }
        if ((inscriptionFields as string[]).includes(key)) {
          payloadInscription[key] = value;
        }
      });

      // Mettre à jour la table eleves si nécessaire
      if (Object.keys(payloadPermanent).length > 0) {
        const ok = await UpdateData("eleves", id, payloadPermanent);
        if (!ok)
          throw new Error(
            "Erreur lors de la modification des données permanentes"
          );
      }

      // Mettre à jour l'inscription
      if (Object.keys(payloadInscription).length > 0) {
        if (!currentYear) throw new Error("Année scolaire non sélectionnée");

        let currentInscription;

        // SI inscription_id est fourni, l'utiliser directement
        if (inscriptionId) {
          const inscriptions = await SelectData("eleves_inscriptions");
          currentInscription = (inscriptions || []).find(
            (i: EleveInscription) => i.id === inscriptionId && !i.deleted
          );
        } else {
          // SINON, chercher par eleve_id (comportement par défaut)
          const inscriptions = await SelectData("eleves_inscriptions");
          currentInscription = (inscriptions || []).find(
            (i: EleveInscription) =>
              i.eleve_id === id &&
              i.annee_scolaire_id === currentYear.id &&
              !i.deleted
          );
        }

        if (!currentInscription) {
          throw new Error("Inscription non trouvée pour l'année courante");
        }

        // Mettre à jour avec l'ID de l'inscription trouvée
        const okIns = await UpdateData(
          "eleves_inscriptions",
          currentInscription.id,
          payloadInscription
        );

        if (!okIns)
          throw new Error("Erreur lors de la modification de l'inscription");
      }

      await rechargerEleves();
    } catch (e) {
      console.error("Erreur modifierEleve:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification de l'élève"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEleve = async (id: string) => {
    try {
      setIsLoading(true);

      if (!currentYear) {
        throw new Error("Aucune année scolaire sélectionnée");
      }

      // Trouver l'inscription de l'année courante pour cet élève
      const inscriptions = await SelectData("eleves_inscriptions");
      const currentInscription = (inscriptions || []).find(
        (i: EleveInscription) =>
          i.eleve_id === id &&
          i.annee_scolaire_id === currentYear.id &&
          !i.deleted
      );

      if (!currentInscription) {
        throw new Error(
          "Aucune inscription trouvée pour cet élève dans l'année courante"
        );
      }

      // Supprimer uniquement l'inscription de l'année courante
      const ok = await UpdateData(
        "eleves_inscriptions",
        currentInscription.id,
        {
          deleted: true,
        }
      );

      if (!ok) {
        throw new Error(
          "Erreur lors de la suppression de l'inscription de l'élève"
        );
      }

      // Recharger les données pour mettre à jour l'affichage
      await rechargerEleves();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de l'élève"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEleveDefinitif = async (id: string) => {
    try {
      setIsLoading(true);

      // Supprimer toutes les inscriptions de cet élève
      const inscriptions = await SelectData("eleves_inscriptions");
      const eleveInscriptions = (inscriptions || []).filter(
        (i: EleveInscription) => i.eleve_id === id
      );

      // Marquer toutes les inscriptions comme supprimées
      for (const inscription of eleveInscriptions) {
        await UpdateData("eleves_inscriptions", inscription.id, {
          deleted: true,
        });
      }

      // Supprimer définitivement l'élève de la table principale
      const ok = await DeleteData("eleves", id);
      if (!ok) {
        throw new Error("Erreur lors de la suppression définitive de l'élève");
      }

      await rechargerEleves();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive de l'élève"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEleveDeToutesAnnees = async (id: string) => {
    try {
      setIsLoading(true);

      // Supprimer toutes les inscriptions de cet élève (toutes années)
      const inscriptions = await SelectData("eleves_inscriptions");
      const eleveInscriptions = (inscriptions || []).filter(
        (i: EleveInscription) => i.eleve_id === id && !i.deleted
      );

      // Marquer toutes les inscriptions comme supprimées
      for (const inscription of eleveInscriptions) {
        await UpdateData("eleves_inscriptions", inscription.id, {
          deleted: true,
        });
      }

      // L'élève reste dans la table principale mais n'apparaît plus dans aucune année
      await rechargerEleves();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de l'élève de toutes les années"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerEleve = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("eleves", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration de l'élève");
      await rechargerEleves();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration de l'élève"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const rechercherEleves = (terme: string): EleveAffiche[] => {
    if (!terme.trim()) return eleves;
    const q = terme.toLowerCase().trim();
    return eleves.filter((e) =>
      [e.code, e.nom, e.prenom, `${e.prenom} ${e.nom}`]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  };

  // Vérifier les doublons avant ajout
  const verifierDoublons = async (
    data: EleveFormData
  ): Promise<DoublonEleve[]> => {
    try {
      // Récupérer tous les élèves existants et les données de référence
      const [
        elevesRows,
        inscriptionsRows,
        anneesRows,
        classesRows,
        sallesRows,
      ] = await Promise.all([
        SelectData("eleves"),
        SelectData("eleves_inscriptions"),
        SelectData("annees_scolaires"),
        SelectData("classes"),
        SelectData("salles"),
      ]);

      const elevesActifs = (elevesRows || []).filter((e: any) => !e.deleted);

      const inscriptionsActuelles = (inscriptionsRows || []).filter(
        (i: any) => !i.deleted
      );

      // Créer des maps pour les noms
      const anneesMap = new Map(
        (anneesRows || []).map((a: any) => [a.id, a.year])
      );
      const classesMap = new Map(
        (classesRows || []).map((c: any) => [c.id, c.nom])
      );
      const sallesMap = new Map(
        (sallesRows || []).map((s: any) => [s.id, s.nom])
      );

      // Normaliser les données pour la comparaison
      const normalizeString = (str: string) =>
        str?.trim().toLowerCase().replace(/\s+/g, " ") || "";

      const normalizeNIF = (nif: string) => nif?.replace(/\D/g, "") || "";

      const normalizePhone = (phone: string) => phone?.replace(/\D/g, "") || "";

      const newData = {
        nom: normalizeString(data.nom),
        prenom: normalizeString(data.prenom),
        date_naissance: data.date_naissance,
        pays_naissance: normalizeString(data.pays_naissance),
        region_naissance: normalizeString(data.region_naissance),
        ville_naissance: normalizeString(data.ville_naissance),
        telephone_parents: normalizePhone(data.telephone_parents),
        nif_parents: normalizeNIF(data.nif_parents),
      };

      // Chercher les doublons potentiels
      const doublons: DoublonEleve[] = [];

      for (const eleve of elevesActifs) {
        const existingData = {
          nom: normalizeString(eleve.nom),
          prenom: normalizeString(eleve.prenom),
          date_naissance: eleve.date_naissance,
          pays_naissance: normalizeString(eleve.pays_naissance),
          region_naissance: normalizeString(eleve.region_naissance),
          ville_naissance: normalizeString(eleve.ville_naissance),
          telephone_parents: normalizePhone(eleve.telephone_parents),
          nif_parents: normalizeNIF(eleve.nif_parents),
        };

        // Critères de doublon : nom + prénom + date de naissance + lieu de naissance complet
        // ET (même téléphone OU même NIF)
        const isDuplicate =
          existingData.nom === newData.nom &&
          existingData.prenom === newData.prenom &&
          existingData.date_naissance === newData.date_naissance &&
          existingData.pays_naissance === newData.pays_naissance &&
          existingData.region_naissance === newData.region_naissance &&
          existingData.ville_naissance === newData.ville_naissance &&
          ((newData.telephone_parents &&
            existingData.telephone_parents === newData.telephone_parents) ||
            (newData.nif_parents &&
              existingData.nif_parents === newData.nif_parents));

        if (isDuplicate) {
          // Trouver l'inscription actuelle de cet élève
          const currentInscription = inscriptionsActuelles.find(
            (i: any) => i.eleve_id === eleve.id
          );

          if (currentInscription) {
            // Récupérer les noms des classes et salles
            const classeName =
              classesMap.get(currentInscription.classe_id) ||
              currentInscription.classe_id;
            const salleName =
              sallesMap.get(currentInscription.salle_id) ||
              currentInscription.salle_id;
            const anneeName =
              anneesMap.get(currentInscription.annee_scolaire_id) ||
              currentInscription.annee_scolaire_id;

            doublons.push({
              id: eleve.id,
              code: eleve.code,
              nom: eleve.nom,
              prenom: eleve.prenom,
              date_naissance: eleve.date_naissance,
              pays_naissance: eleve.pays_naissance,
              region_naissance: eleve.region_naissance,
              ville_naissance: eleve.ville_naissance,
              section_naissance: eleve.section_naissance,
              telephone_parents: eleve.telephone_parents,
              nif_parents: eleve.nif_parents,
              annee_scolaire: anneeName,
              classe: `${classeName} - ${salleName}`,
              statut: currentInscription.statut,
            });
          }
        }
      }

      return doublons;
    } catch (error) {
      console.error("Erreur lors de la vérification des doublons:", error);
      return [];
    }
  };

  // Ajouter un nouvel élève avec vérification des doublons
  const ajouterNouvelEleve = async (
    data: EleveFormData
  ): Promise<{ eleve: EleveAffiche; doublons: DoublonEleve[] }> => {
    try {
      setIsLoading(true);
      const capaciteCheck = await verifierCapaciteSalle(
        data.salle_id,
        data.annee_scolaire_id
      );

      if (!capaciteCheck.isValid) {
        setError(capaciteCheck.message);
        throw new Error(capaciteCheck.message);
      }

      // Vérifier les doublons
      const doublons = await verifierDoublons(data);

      // Générer le code
      const code = await genererNouveauCode(data.nom, data.prenom);

      // Insérer dans la table eleves
      const eleveData: Omit<
        ElevePermanent,
        "id" | "created_at" | "updated_at"
      > = {
        code,
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: data.date_naissance,
        pays_naissance: data.pays_naissance,
        region_naissance: data.region_naissance,
        ville_naissance: data.ville_naissance,
        section_naissance: data.section_naissance,
        sexe: data.sexe,
        adresse_actuelle: data.adresse_actuelle,
        telephone_parents: data.telephone_parents,
        adresse_parents: data.adresse_parents,
        nif_parents: data.nif_parents,
        moyenne_generale: data.moyenne_generale,
        etablissement_precedent: data.etablissement_precedent,
        photo_url: data.photo_url,
        deleted: false,
      };

      const eleveResult = await InsertDataReturn("eleves", eleveData);
      if (!eleveResult.success)
        throw new Error(
          eleveResult.error?.message || "Erreur lors de l'ajout de l'élève"
        );

      // Insérer dans la table eleves_inscriptions
      const inscriptionData: Omit<
        EleveInscription,
        "id" | "created_at" | "updated_at"
      > = {
        eleve_id: eleveResult.rows?.[0]?.id || "",
        statut: data.statut,
        date_inscription: new Date().toISOString().split("T")[0],
        observations: data.observations,
        annee_scolaire_id: data.annee_scolaire_id,
        classe_id: data.classe_id,
        salle_id: data.salle_id,
        deleted: false,
      };

      const inscriptionResult = await InsertDataReturn(
        "eleves_inscriptions",
        inscriptionData
      );
      if (!inscriptionResult.success)
        throw new Error(
          inscriptionResult.error?.message || "Erreur lors de l'inscription"
        );

      // Recharger les données
      await rechargerEleves();

      // Créer l'objet EleveAffiche
      const nouvelEleve: EleveAffiche = {
        ...eleveResult.rows?.[0],
        inscription_id: inscriptionResult.rows?.[0]?.id || "",
        statut: data.statut,
        date_inscription: inscriptionData.date_inscription,
        observations_inscription: data.observations,
        annee_scolaire_id: data.annee_scolaire_id,
        classe_id: data.classe_id,
        salle_id: data.salle_id,
      };

      return { eleve: nouvelEleve, doublons };
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout de l'élève"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Réinscrire un élève existant
  const reinscrireEleve = async (data: ReinscriptionData): Promise<void> => {
    try {
      setIsLoading(true);
      const capaciteCheck = await verifierCapaciteSalle(
        data.salle_id,
        data.annee_scolaire_id
      );

      if (!capaciteCheck.isValid) {
        setError(capaciteCheck.message);
        throw new Error(capaciteCheck.message);
      }

      // Vérifier s'il existe déjà une inscription pour cet élève et cette année (incluant supprimée)
      const allInscriptions = await SelectData("eleves_inscriptions");
      const anyInscriptionSameYear = (allInscriptions || []).find(
        (i: EleveInscription) =>
          i.eleve_id === data.eleve_id &&
          i.annee_scolaire_id === data.annee_scolaire_id
      );

      if (anyInscriptionSameYear && !anyInscriptionSameYear.deleted) {
        // Si la même classe/salle est déjà enregistrée, rien à faire
        const samePlacement =
          anyInscriptionSameYear.classe_id === data.classe_id &&
          anyInscriptionSameYear.salle_id === data.salle_id;

        // Mettre à jour l'inscription existante (statut, observations, classe, salle)
        const ok = await UpdateData(
          "eleves_inscriptions",
          anyInscriptionSameYear.id,
          {
            statut: data.statut,
            observations: data.observations,
            classe_id: data.classe_id,
            salle_id: data.salle_id,
          }
        );
        if (!ok)
          throw new Error(
            "Erreur lors de la mise à jour de l'inscription existante"
          );
      } else if (anyInscriptionSameYear && anyInscriptionSameYear.deleted) {
        // Réactiver l'inscription supprimée pour éviter la contrainte unique
        const ok = await UpdateData(
          "eleves_inscriptions",
          anyInscriptionSameYear.id,
          {
            deleted: false,
            statut: data.statut,
            observations: data.observations,
            classe_id: data.classe_id,
            salle_id: data.salle_id,
            date_inscription: new Date().toISOString().split("T")[0],
          }
        );
        if (!ok)
          throw new Error(
            "Erreur lors de la réactivation de l'inscription existante"
          );
      } else {
        // Insérer la nouvelle inscription pour l'année cible
        const inscriptionData: Omit<
          EleveInscription,
          "id" | "created_at" | "updated_at"
        > = {
          eleve_id: data.eleve_id,
          statut: data.statut,
          date_inscription: new Date().toISOString().split("T")[0],
          observations: data.observations,
          annee_scolaire_id: data.annee_scolaire_id,
          classe_id: data.classe_id,
          salle_id: data.salle_id,
          deleted: false,
        };

        const result = await InsertDataReturn(
          "eleves_inscriptions",
          inscriptionData
        );
        if (!result.success)
          throw new Error(
            result.error?.message || "Erreur lors de la réinscription"
          );
      }

      await rechargerEleves();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réinscription"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir l'historique d'un élève
  const getHistoriqueEleve = async (
    eleveId: string
  ): Promise<EleveInscription[]> => {
    try {
      const result = await SelectData("eleves_inscriptions");

      return result || [];
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return [];
    }
  };

  const getParcoursAcademique = async (
    eleveId: string
  ): Promise<ParcoursAcademique> => {
    try {
      // 1. Récupérer toutes les données nécessaires
      const [
        elevesData,
        inscriptionsData,
        anneesData,
        classesData,
        sallesData,
        matieresData,
        notesData,
        decisionsData,
        typesFraisData,
        paiementsData,
      ] = await Promise.all([
        SelectData("eleves"),
        SelectData("eleves_inscriptions"),
        SelectData("annees_scolaires"),
        SelectData("classes"),
        SelectData("salles"),
        SelectData("matieres"),
        SelectData("notes"),
        SelectData("decision_de_fin_annee"),
        SelectData("types_frais"),
        SelectData("paiements"),
      ]);

      // 2. Trouver l'élève
      const eleve = (elevesData || []).find(
        (e: any) => e.id === eleveId && !e.deleted
      );
      if (!eleve) {
        throw new Error("Élève introuvable");
      }

      // 3. Créer des maps pour les références rapides
      const anneesMap = new Map((anneesData || []).map((a: any) => [a.id, a]));
      const classesMap = new Map(
        (classesData || []).map((c: any) => [c.id, c])
      );
      const sallesMap = new Map((sallesData || []).map((s: any) => [s.id, s]));
      const matieresMap = new Map(
        (matieresData || []).map((m: any) => [m.id, m])
      );
      const typesFraisMap = new Map(
        (typesFraisData || []).map((t: any) => [t.id, t])
      );

      // 4. Récupérer toutes les inscriptions de cet élève (triées par année)
      const inscriptions = (inscriptionsData || [])
        .filter((i: any) => i.eleve_id === eleveId && !i.deleted)
        .sort((a: any, b: any) => {
          const anneeA = anneesMap.get(a.annee_scolaire_id);
          const anneeB = anneesMap.get(b.annee_scolaire_id);
          return (anneeA?.year || "").localeCompare(anneeB?.year || "");
        });

      // 5. Construire l'historique pour chaque année
      const historique = await Promise.all(
        inscriptions.map(async (inscription: any) => {
          const annee = anneesMap.get(inscription.annee_scolaire_id);
          const classe = classesMap.get(inscription.classe_id);
          const salle = sallesMap.get(inscription.salle_id);

          // Récupérer les notes pour cette année
          const notesAnnee = (notesData || []).filter(
            (n: any) =>
              n.eleve_id === eleveId &&
              n.annee_scolaire_id === inscription.annee_scolaire_id &&
              !n.deleted
          );

          // Organiser les notes par trimestre
          const notesTrimestre1 = notesAnnee.filter(
            (n: any) => n.trimestre === 1
          );
          const notesTrimestre2 = notesAnnee.filter(
            (n: any) => n.trimestre === 2
          );
          const notesTrimestre3 = notesAnnee.filter(
            (n: any) => n.trimestre === 3
          );

          const calculerNotesMatiere = (notesT: any[]) => {
            return notesT.map((note: any) => {
              const matiere = matieresMap.get(note.matiere_id);
              return {
                matiere_nom: matiere?.nom || "Matière inconnue",
                coefficient: matiere?.coefficient || 1,
                note: note.note,
                observation: note.observation,
              };
            });
          };

          const calculerMoyenneTrimestre = (notesMatiere: any[]) => {
            if (notesMatiere.length === 0) return 0;
            const totalPoints = notesMatiere.reduce(
              (sum, n) => sum + n.note,
              0
            );
            const totalCoeff = notesMatiere.reduce(
              (sum, n) => sum + n.coefficient,
              0
            );
            return totalCoeff > 0 ? totalPoints / (totalCoeff / 10) : 0;
          };

          const notesT1 = calculerNotesMatiere(notesTrimestre1);
          const notesT2 = calculerNotesMatiere(notesTrimestre2);
          const notesT3 = calculerNotesMatiere(notesTrimestre3);

          const moyenneT1 = calculerMoyenneTrimestre(notesT1);
          const moyenneT2 = calculerMoyenneTrimestre(notesT2);
          const moyenneT3 = calculerMoyenneTrimestre(notesT3);

          const moyennesValides = [moyenneT1, moyenneT2, moyenneT3].filter(
            (m) => m > 0
          );
          const moyenneAnnuelle =
            moyennesValides.length > 0
              ? moyennesValides.reduce((sum, m) => sum + m, 0) /
                moyennesValides.length
              : 0;

          // Récupérer la décision de fin d'année
          const decision = (decisionsData || []).find(
            (d: any) =>
              d.eleve_id === eleveId &&
              d.annee_scolaire_id === inscription.annee_scolaire_id &&
              !d.deleted
          );

          // Récupérer les paiements pour cette année
          const paiementsAnnee = (paiementsData || []).filter(
            (p: any) =>
              p.eleve_id === eleveId &&
              p.annee_scolaire_id === inscription.annee_scolaire_id &&
              !p.deleted
          );

          // Organiser les frais par type
          const fraisParType = new Map<string, any>();

          paiementsAnnee.forEach((paiement: any) => {
            const typeFrais = typesFraisMap.get(paiement.type_frais_id);
            const typeFraisNom = typeFrais?.nom || "Frais inconnu";

            if (!fraisParType.has(paiement.type_frais_id)) {
              fraisParType.set(paiement.type_frais_id, {
                type_frais: typeFraisNom,
                montant_du: 0,
                montant_paye: 0,
                solde: 0,
                paiements: [],
              });
            }

            const fraisInfo = fraisParType.get(paiement.type_frais_id);
            fraisInfo.montant_du += paiement.montant_du;
            fraisInfo.montant_paye += paiement.montant_paye;
            fraisInfo.paiements.push({
              date_paiement: paiement.date_paiement,
              heure_paiement: paiement.heure_paiement,
              montant_paye: paiement.montant_paye,
              numero_recu: paiement.numero_recu,
              remarques: paiement.remarques,
            });
          });

          const frais = Array.from(fraisParType.values()).map((f) => ({
            ...f,
            solde: f.montant_du - f.montant_paye,
          }));

          const totalFraisDu = frais.reduce((sum, f) => sum + f.montant_du, 0);
          const totalFraisPaye = frais.reduce(
            (sum, f) => sum + f.montant_paye,
            0
          );

          return {
            annee_scolaire_id: inscription.annee_scolaire_id,
            annee_scolaire_libelle: getYearNameById(
              inscription.annee_scolaire_id
            ),
            date_inscription: inscription.date_inscription,
            statut: inscription.statut,
            classe_nom: classe?.nom || "Classe inconnue",
            salle_nom: salle?.nom || "Salle inconnue",
            observations: inscription.observations,
            notes: {
              trimestre_1: {
                notes_par_matiere: notesT1,
                moyenne_generale: moyenneT1,
              },
              trimestre_2: {
                notes_par_matiere: notesT2,
                moyenne_generale: moyenneT2,
              },
              trimestre_3: {
                notes_par_matiere: notesT3,
                moyenne_generale: moyenneT3,
              },
              moyenne_annuelle: moyenneAnnuelle,
            },
            decision_fin_annee: decision
              ? {
                  decision: decision.decision,
                  observation: decision.observation,
                  date_decision: decision.date_decision,
                }
              : undefined,
            frais,
            total_frais_du: totalFraisDu,
            total_frais_paye: totalFraisPaye,
            solde_total: totalFraisDu - totalFraisPaye,
          };
        })
      );

      // 6. Calculer les statistiques globales
      const moyennes = historique
        .map((h) => h.notes.moyenne_annuelle)
        .filter((m) => m > 0);

      const statistiques = {
        nombre_annees_scolaires: historique.length,
        moyenne_generale_cumulative:
          moyennes.length > 0
            ? moyennes.reduce((sum, m) => sum + m, 0) / moyennes.length
            : 0,
        total_frais_du_global: historique.reduce(
          (sum, h) => sum + h.total_frais_du,
          0
        ),
        total_frais_paye_global: historique.reduce(
          (sum, h) => sum + h.total_frais_paye,
          0
        ),
        solde_global: historique.reduce((sum, h) => sum + h.solde_total, 0),
        annees_admis: historique.filter(
          (h) => h.decision_fin_annee?.decision === "ADMIS"
        ).length,
        annees_redouble: historique.filter(
          (h) => h.decision_fin_annee?.decision === "REDOUBLER"
        ).length,
        annees_expulse: historique.filter(
          (h) => h.decision_fin_annee?.decision === "EXPULSER"
        ).length,
      };

      // 7. Retourner le parcours complet
      return {
        eleve: {
          id: eleve.id,
          code: eleve.code,
          nom: eleve.nom,
          prenom: eleve.prenom,
          date_naissance: eleve.date_naissance,
          pays_naissance: eleve.pays_naissance,
          region_naissance: eleve.region_naissance,
          ville_naissance: eleve.ville_naissance,
          section_naissance: eleve.section_naissance,
          sexe: eleve.sexe,
          adresse_actuelle: eleve.adresse_actuelle,
          telephone_parents: eleve.telephone_parents,
          adresse_parents: eleve.adresse_parents,
          nif_parents: eleve.nif_parents,
          etablissement_precedent: eleve.etablissement_precedent,
          photo_url: eleve.photo_url,
          created_at: eleve.created_at,
        },
        historique,
        statistiques,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du parcours académique:",
        error
      );
      throw error;
    }
  };

  useEffect(() => {
    rechargerEleves();
  }, [currentYear, rechargerEleves]);

  return (
    <ElevesContext.Provider
      value={{
        eleves,
        isLoading,
        error,
        ajouterEleve,
        modifierEleve,
        supprimerEleve,
        supprimerEleveDefinitif,
        supprimerEleveDeToutesAnnees,
        restaurerEleve,
        rechercherEleves,
        genererNouveauCode,
        rechargerEleves,
        getParcoursAcademique,
        verifierDoublons,
        ajouterNouvelEleve,
        reinscrireEleve,
        getHistoriqueEleve,
      }}
    >
      {children}
    </ElevesContext.Provider>
  );
};

export const useEleves = () => {
  const ctx = useContext(ElevesContext);
  if (!ctx) throw new Error("useEleves must be used within an ElevesProvider");
  return ctx;
};
