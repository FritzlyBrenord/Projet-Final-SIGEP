"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

export interface ElevesContextType {
  eleves: EleveAffiche[];
  isLoading: boolean;
  error: string | null;

  // Fonctions existantes (maintenues pour compatibilité)
  ajouterEleve: (data: EleveFormData) => Promise<void>;
  modifierEleve: (id: string, data: Partial<EleveFormData>) => Promise<void>;
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
}

const ElevesContext = createContext<ElevesContextType | undefined>(undefined);

export const ElevesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [eleves, setEleves] = useState<EleveAffiche[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAnneeScolaire();

  const toEleveAffiche = (eleveData: any): EleveAffiche => ({
    id: eleveData.id,
    code: eleveData.code,
    nom: eleveData.nom,
    prenom: eleveData.prenom,
    date_naissance: eleveData.date_naissance,
    lieu_naissance: eleveData.lieu_naissance,
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

  const rechargerEleves = async () => {
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
  };

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

  const ajouterEleve = async (data: EleveFormData) => {
    try {
      setIsLoading(true);

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
        lieu_naissance: data.lieu_naissance,
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

  const modifierEleve = async (id: string, data: Partial<EleveFormData>) => {
    try {
      setIsLoading(true);

      // Séparer les champs permanents et d'inscription
      const permanentFields: Array<keyof EleveFormData> = [
        "nom",
        "prenom",
        "date_naissance",
        "lieu_naissance",
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
        if (!ok) throw new Error("Erreur lors de la modification des données permanentes");
      }

      // Mettre à jour l'inscription de l'année courante si nécessaire
      if (Object.keys(payloadInscription).length > 0) {
        if (!currentYear) throw new Error("Année scolaire non sélectionnée");

        const inscriptions = await SelectData("eleves_inscriptions");
        const currentInscription = (inscriptions || []).find(
          (i: EleveInscription) =>
            i.eleve_id === id &&
            i.annee_scolaire_id === (payloadInscription.annee_scolaire_id || currentYear.id) &&
            !i.deleted
        );
        if (!currentInscription) {
          throw new Error("Inscription non trouvée pour l'année courante");
        }

        const okIns = await UpdateData(
          "eleves_inscriptions",
          currentInscription.id,
          {
            statut: payloadInscription.statut,
            observations: payloadInscription.observations,
            annee_scolaire_id:
              payloadInscription.annee_scolaire_id || currentYear.id,
            classe_id: payloadInscription.classe_id,
            salle_id: payloadInscription.salle_id,
          }
        );
        if (!okIns)
          throw new Error("Erreur lors de la modification de l'inscription");
      }

      await rechargerEleves();
    } catch (e) {
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
        throw new Error("Aucune inscription trouvée pour cet élève dans l'année courante");
      }

      // Supprimer uniquement l'inscription de l'année courante
      const ok = await UpdateData("eleves_inscriptions", currentInscription.id, {
        deleted: true,
      });
      
      if (!ok) {
        throw new Error("Erreur lors de la suppression de l'inscription de l'élève");
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
        await UpdateData("eleves_inscriptions", inscription.id, { deleted: true });
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
        await UpdateData("eleves_inscriptions", inscription.id, { deleted: true });
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
      const query = `
        SELECT 
          e.id, e.code, e.nom, e.prenom, e.date_naissance, e.lieu_naissance,
          e.telephone_parents, e.nif_parents,
          a.libelle as annee_scolaire, c.nom as classe, i.statut
        FROM eleves e
        JOIN eleves_inscriptions i ON e.id = i.eleve_id
        JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
        JOIN classes c ON i.classe_id = c.id
        WHERE e.deleted = false 
        AND i.deleted = false
        AND e.nom = $1 
        AND e.prenom = $2 
        AND e.lieu_naissance = $3
        AND (e.telephone_parents = $4 OR e.nif_parents = $5)
      `;

      const result = await SelectData("eleves");

      return result || [];
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
        lieu_naissance: data.lieu_naissance,
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
        const ok = await UpdateData("eleves_inscriptions", anyInscriptionSameYear.id, {
          statut: data.statut,
          observations: data.observations,
          classe_id: data.classe_id,
          salle_id: data.salle_id,
        });
        if (!ok) throw new Error("Erreur lors de la mise à jour de l'inscription existante");
      } else if (anyInscriptionSameYear && anyInscriptionSameYear.deleted) {
        // Réactiver l'inscription supprimée pour éviter la contrainte unique
        const ok = await UpdateData("eleves_inscriptions", anyInscriptionSameYear.id, {
          deleted: false,
          statut: data.statut,
          observations: data.observations,
          classe_id: data.classe_id,
          salle_id: data.salle_id,
          date_inscription: new Date().toISOString().split("T")[0],
        });
        if (!ok) throw new Error("Erreur lors de la réactivation de l'inscription existante");
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

  useEffect(() => {
    rechargerEleves();
  }, [currentYear]);

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
