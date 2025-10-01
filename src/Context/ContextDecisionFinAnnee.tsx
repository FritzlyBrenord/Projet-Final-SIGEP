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
  DecisionFinAnnee,
  DecisionFinAnneeFormData,
  DecisionFinAnneeWithDetails,
} from "../types/DecisionFinAnneeType";
import {
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
  DataObjectExiste,
} from "@/Config/SupabaseData";

interface DecisionFinAnneeDB {
  id: string;
  eleve_id: string;
  annee_scolaire_id: string;
  observation?: string;
  decision: string;
  date_decision: string;
  created_at?: string;
  updated_at?: string;
  deleted: boolean;
}

export interface DecisionFinAnneeContextType {
  decisions: DecisionFinAnnee[];
  isLoading: boolean;
  error: string | null;

  // Gestion des décisions
  ajouterDecision: (data: DecisionFinAnneeFormData) => Promise<void>;
  modifierDecision: (
    id: string,
    data: Partial<DecisionFinAnneeFormData>
  ) => Promise<void>;
  supprimerDecision: (id: string) => Promise<void>; // logique
  supprimerDecisionDefinitif: (id: string) => Promise<void>; // hard
  restaurerDecision: (id: string) => Promise<void>;

  // Fonctions utilitaires
  getDecisionByEleve: (eleveId: string) => DecisionFinAnnee | null;
  getDecisionsByAnneeScolaire: (anneeScolaireId: string) => DecisionFinAnnee[];
  getDecisionsWithDetails: () => DecisionFinAnneeWithDetails[];
  rechargerDecisions: () => Promise<void>;
}

const DecisionFinAnneeContext = createContext<
  DecisionFinAnneeContextType | undefined
>(undefined);

export const DecisionFinAnneeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [decisions, setDecisions] = useState<DecisionFinAnnee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAnneeScolaire();

  const toDecision = (r: DecisionFinAnneeDB): DecisionFinAnnee => ({
    id: r.id,
    eleve_id: r.eleve_id,
    annee_scolaire_id: r.annee_scolaire_id,
    observation: r.observation,
    decision: r.decision as "ADMIS" | "REDOUBLER" | "EXPULSER",
    date_decision: r.date_decision,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted: r.deleted,
  });

  const rechargerDecisions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await SelectData("decision_de_fin_annee");
      const list = (data || []).filter(
        (r: DecisionFinAnneeDB) =>
          !r.deleted && (!currentYear || r.annee_scolaire_id === currentYear.id)
      );
      setDecisions(list.map(toDecision));
    } catch (e) {
      setError("Erreur lors du chargement des décisions");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  // Gestion des décisions
  const ajouterDecision = async (data: DecisionFinAnneeFormData) => {
    try {
      setIsLoading(true);

      // Valider contraintes NOT NULL / FK
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");
      if (!data.eleve_id) throw new Error("Élève requis");
      if (!data.decision) throw new Error("Décision requise");

      // Vérifier si une décision existe déjà pour cet élève et cette année scolaire
      const existingDecision = await DataObjectExiste("decision_de_fin_annee", {
        eleve_id: data.eleve_id,
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });

      if (existingDecision) {
        throw new Error(
          "Une décision existe déjà pour cet élève pour cette année scolaire"
        );
      }

      const payload: Omit<
        DecisionFinAnneeDB,
        "id" | "created_at" | "updated_at"
      > = {
        ...data,
        date_decision:
          data.date_decision || new Date().toISOString().split("T")[0],
        deleted: false,
      } as DecisionFinAnneeDB;

      if (!payload.observation) delete (payload as any).observation;

      const res = await InsertDataReturn("decision_de_fin_annee", payload);
      if (!res.success)
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout de la décision"
        );
      await rechargerDecisions();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout de la décision"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierDecision = async (
    id: string,
    data: Partial<DecisionFinAnneeFormData>
  ) => {
    try {
      setIsLoading(true);

      const ok = await UpdateData("decision_de_fin_annee", id, data);
      if (!ok) throw new Error("Erreur lors de la modification de la décision");
      await rechargerDecisions();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification de la décision"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerDecision = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("decision_de_fin_annee", id, {
        deleted: true,
      });
      if (!ok) throw new Error("Erreur lors de la suppression de la décision");
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de la décision"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerDecisionDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("decision_de_fin_annee", id);
      if (!ok)
        throw new Error(
          "Erreur lors de la suppression définitive de la décision"
        );
      await rechargerDecisions();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive de la décision"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerDecision = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("decision_de_fin_annee", id, {
        deleted: false,
      });
      if (!ok) throw new Error("Erreur lors de la restauration de la décision");
      await rechargerDecisions();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration de la décision"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions utilitaires
  const getDecisionByEleve = (eleveId: string): DecisionFinAnnee | null => {
    return decisions.find((d) => d.eleve_id === eleveId) || null;
  };

  const getDecisionsByAnneeScolaire = (
    anneeScolaireId: string
  ): DecisionFinAnnee[] => {
    return decisions.filter((d) => d.annee_scolaire_id === anneeScolaireId);
  };

  const getDecisionsWithDetails = (): DecisionFinAnneeWithDetails[] => {
    if (!currentYear) return [];

    return decisions.map((decision) => {
      // Trouver l'élève dans l'année courante
      let eleve_nom = "";
      let eleve_prenom = "";
      let eleve_code = "";
      let classe_nom = "";
      let salle_nom = "";

      for (const classe of currentYear.classes) {
        for (const salle of classe.salles) {
          // Note: Ici on devrait avoir accès aux élèves, mais pour l'instant on laisse vide
          // Il faudra intégrer avec le contexte des élèves
          break;
        }
      }

      return {
        ...decision,
        eleve_nom,
        eleve_prenom,
        eleve_code,
        classe_nom,
        salle_nom,
      };
    });
  };

  useEffect(() => {
    rechargerDecisions();
  }, [currentYear, rechargerDecisions]);

  return (
    <DecisionFinAnneeContext.Provider
      value={{
        decisions,
        isLoading,
        error,
        ajouterDecision,
        modifierDecision,
        supprimerDecision,
        supprimerDecisionDefinitif,
        restaurerDecision,
        getDecisionByEleve,
        getDecisionsByAnneeScolaire,
        getDecisionsWithDetails,
        rechargerDecisions,
      }}
    >
      {children}
    </DecisionFinAnneeContext.Provider>
  );
};

export const useDecisionFinAnnee = () => {
  const ctx = useContext(DecisionFinAnneeContext);
  if (!ctx)
    throw new Error(
      "useDecisionFinAnnee must be used within a DecisionFinAnneeProvider"
    );
  return ctx;
};
