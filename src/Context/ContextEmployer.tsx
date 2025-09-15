"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAnneeScolaire } from "./ContextAnneeScolaire";
import {
  SelectData,
  InsertData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
} from "@/Config/SupabaseData";
import { Employer, EmployerFormData } from "../types/EmployerType";

interface EmployerDB {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  diplomes?: string;
  responsabilites?: string;
  fonction?: string;
  departement?: string;
  departement_preciser?: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployerContextType {
  employes: Employer[];
  isLoading: boolean;
  error: string | null;

  ajouterEmployer: (employer: EmployerFormData) => Promise<void>;
  modifierEmployer: (id: string, employer: Partial<EmployerFormData>) => Promise<void>;
  supprimerEmployer: (id: string) => Promise<void>; // suppression logique
  supprimerEmployerDefinitif: (id: string) => Promise<void>;
  restaurerEmployer: (id: string) => Promise<void>;

  rechercherEmployes: (terme: string) => Employer[];
  obtenirEmployerParId: (id: string) => Employer | undefined;

  setError: (error: string | null) => void;
  rechargerEmployes: () => Promise<void>;
  chargerEmployesParAnnee: (anneeId: string) => Promise<void>;
  genererNouveauCode: () => Promise<string>; // EMP###
}

const EmployerContext = createContext<EmployerContextType | undefined>(undefined);

export const EmployerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employes, setEmployes] = useState<Employer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentYear } = useAnneeScolaire();

  const handleError = (message: string) => {
    setError(message);
    console.error(message);
  };

  const convertToEmployer = (row: EmployerDB): Employer => ({
    id: row.id,
    code: row.code,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    telephone: row.telephone,
    adresse: row.adresse,
    date_embauche: row.date_embauche,
    nif_cin: row.nif_cin,
    diplomes: row.diplomes,
    responsabilites: row.responsabilites,
    fonction: row.fonction,
    departement: row.departement,
    departement_preciser: row.departement_preciser,
    statut: row.statut,
    annee_scolaire_id: row.annee_scolaire_id,
    deleted: row.deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });

  const rechargerEmployes = async () => {
    try {
      setIsLoading(true);
      const data = await SelectData("employes");
      const filtered = currentYear
        ? (data || []).filter((r: EmployerDB) => r.annee_scolaire_id === currentYear.id && !r.deleted)
        : (data || []).filter((r: EmployerDB) => !r.deleted);
      setEmployes(filtered.map(convertToEmployer));
    } catch (e) {
      handleError("Erreur lors du chargement des employés");
    } finally {
      setIsLoading(false);
    }
  };

  const chargerEmployesParAnnee = async (anneeId: string) => {
    try {
      setIsLoading(true);
      const data = await SelectData("employes");
      const filtered = (data || []).filter((r: EmployerDB) => r.annee_scolaire_id === anneeId && !r.deleted);
      setEmployes(filtered.map(convertToEmployer));
    } catch (e) {
      handleError("Erreur lors du chargement des employés par année");
    } finally {
      setIsLoading(false);
    }
  };

  const genererNouveauCode = async (): Promise<string> => {
    try {
      const data = await SelectData("employes");
      const codes = (data || []).map((r: EmployerDB) => r.code);
      let numero = 1;
      let code = `EMP${String(numero).padStart(3, "0")}`;
      while (codes.includes(code)) {
        numero++;
        code = `EMP${String(numero).padStart(3, "0")}`;
      }
      return code;
    } catch (e) {
      return `EMP${String(Date.now()).slice(-3)}`;
    }
  };

  const ajouterEmployer = async (employer: EmployerFormData) => {
    try {
      setIsLoading(true);
      // unicité code/email/téléphone/nif
      if (await DataExsite("employes", "code", employer.code)) {
        throw new Error("Ce code employé existe déjà");
      }
      if (await DataExsite("employes", "email", employer.email)) {
        throw new Error("Cet email est déjà utilisé par un autre employé");
      }
      if (employer.telephone && (await DataExsite("employes", "telephone", employer.telephone))) {
        throw new Error("Ce numéro est déjà utilisé par un autre employé");
      }
      if (employer.nif_cin && (await DataExsite("employes", "nif_cin", employer.nif_cin))) {
        throw new Error("Ce NIF/CIN est déjà utilisé par un autre employé");
      }

      const payload: Omit<EmployerDB, "id" | "created_at" | "updated_at"> = {
        code: employer.code,
        nom: employer.nom,
        prenom: employer.prenom,
        email: employer.email,
        telephone: employer.telephone,
        adresse: employer.adresse,
        date_embauche: employer.date_embauche,
        nif_cin: employer.nif_cin,
        diplomes: employer.diplomes || "",
        responsabilites: employer.responsabilites || "",
        fonction: employer.fonction || "",
        departement: employer.departement || "",
        departement_preciser: employer.departement_preciser || "",
        statut: employer.statut,
        annee_scolaire_id: employer.annee_scolaire_id,
        deleted: false,
      };

      const { success, rows, error } = await InsertDataReturn("employes", payload);
      if (!success || !rows || rows.length === 0) {
        throw new Error(error?.message || "Erreur lors de l'ajout de l'employé");
      }
      await rechargerEmployes();
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Erreur lors de l'ajout de l'employé");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierEmployer = async (id: string, employer: Partial<EmployerFormData>) => {
    try {
      setIsLoading(true);
      // vérifs basiques de collision
      if (employer.email) {
        const data = await SelectData("employes");
        if ((data || []).some((r: EmployerDB) => r.email === employer.email && r.id !== id)) {
          throw new Error("Cet email est déjà utilisé par un autre employé");
        }
      }
      if (employer.telephone) {
        const data = await SelectData("employes");
        if ((data || []).some((r: EmployerDB) => r.telephone === employer.telephone && r.id !== id)) {
          throw new Error("Ce numéro est déjà utilisé par un autre employé");
        }
      }
      if (employer.nif_cin) {
        const data = await SelectData("employes");
        if ((data || []).some((r: EmployerDB) => r.nif_cin === employer.nif_cin && r.id !== id)) {
          throw new Error("Ce NIF/CIN est déjà utilisé par un autre employé");
        }
      }

      const result = await UpdateData("employes", id, employer);
      if (!result) throw new Error("Erreur lors de la modification de l'employé");
      await rechargerEmployes();
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Erreur lors de la modification de l'employé");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEmployer = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("employes", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression de l'employé");
      setEmployes((prev) => prev.filter((e) => e.id !== id));
      await rechargerEmployes();
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Erreur lors de la suppression de l'employé");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEmployerDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("employes", id);
      if (!ok) throw new Error("Erreur lors de la suppression définitive de l'employé");
      await rechargerEmployes();
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Erreur lors de la suppression définitive de l'employé");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerEmployer = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("employes", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration de l'employé");
      await rechargerEmployes();
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Erreur lors de la restauration de l'employé");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const rechercherEmployes = (terme: string): Employer[] => {
    if (!terme.trim()) return employes;
    const q = terme.toLowerCase().trim();
    return employes.filter((e) =>
      [e.nom, e.prenom, e.email, e.code, `${e.prenom} ${e.nom}`]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  };

  const obtenirEmployerParId = (id: string) => employes.find((e) => e.id === id);

  useEffect(() => {
    rechargerEmployes();
  }, [currentYear]);

  return (
    <EmployerContext.Provider
      value={{
        employes,
        isLoading,
        error,
        ajouterEmployer,
        modifierEmployer,
        supprimerEmployer,
        supprimerEmployerDefinitif,
        restaurerEmployer,
        rechercherEmployes,
        obtenirEmployerParId,
        setError,
        rechargerEmployes,
        chargerEmployesParAnnee,
        genererNouveauCode,
      }}
    >
      {children}
    </EmployerContext.Provider>
  );
};

export const useEmployer = () => {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error("useEmployer must be used within an EmployerProvider");
  return ctx;
};


