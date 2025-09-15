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
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
  DataObjectExiste,
} from "@/Config/SupabaseData";

// Types TypeScript
export interface TypeFrais {
  id: string;
  nom: string;
  montant_defaut: number;
  description?: string;
  obligatoire: boolean;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FraisParClasse {
  id: string;
  classe: string;
  type_frais_id: string;
  montant: number;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paiement {
  id: string;
  eleve_id: string;
  type_frais_id: string;
  montant_du: number;
  montant_paye: number;
  date_paiement: string;
  heure_paiement: string;
  remarques?: string;
  numero_recu: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types pour les formulaires
export interface TypeFraisFormData {
  nom: string;
  montant_defaut: number;
  description?: string;
  obligatoire: boolean;
  annee_scolaire_id: string;
}

export interface FraisParClasseFormData {
  classe: string;
  type_frais_id: string;
  montant: number;
  annee_scolaire_id: string;
}

export interface PaiementFormData {
  eleve_id: string;
  type_frais_id: string;
  montant_du: number;
  montant_paye: number;
  remarques?: string;
  annee_scolaire_id: string;
}

// Types avec détails joints
export interface PaiementWithDetails extends Paiement {
  eleve_nom: string;
  eleve_prenom: string;
  eleve_code: string;
  type_frais_nom: string;
  classe_nom: string;
  salle_nom: string;
}

export interface TypeFraisWithStats extends TypeFrais {
  total_du: number;
  total_paye: number;
  nombre_paiements: number;
}

// Types DB (pour la conversion depuis la base)
interface TypeFraisDB {
  id: string;
  nom: string;
  montant_defaut: number;
  description?: string;
  obligatoire: boolean;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FraisParClasseDB {
  id: string;
  classe: string;
  type_frais_id: string;
  montant: number;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PaiementDB {
  id: string;
  eleve_id: string;
  type_frais_id: string;
  montant_du: number;
  montant_paye: number;
  date_paiement: string;
  heure_paiement: string;
  remarques?: string;
  numero_recu: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface du contexte
export interface FraisScolariteContextType {
  // États
  typesFrais: TypeFrais[];
  fraisParClasse: FraisParClasse[];
  paiements: Paiement[];
  isLoading: boolean;
  error: string | null;

  // Gestion des types de frais
  ajouterTypeFrais: (data: TypeFraisFormData) => Promise<void>;
  modifierTypeFrais: (
    id: string,
    data: Partial<TypeFraisFormData>
  ) => Promise<void>;
  supprimerTypeFrais: (id: string) => Promise<void>; // logique
  supprimerTypeFraisDefinitif: (id: string) => Promise<void>; // hard
  restaurerTypeFrais: (id: string) => Promise<void>;

  // Gestion des frais par classe
  ajouterFraisParClasse: (data: FraisParClasseFormData) => Promise<void>;
  modifierFraisParClasse: (
    id: string,
    data: Partial<FraisParClasseFormData>
  ) => Promise<void>;
  supprimerFraisParClasse: (id: string) => Promise<void>;
  supprimerFraisParClasseDefinitif: (id: string) => Promise<void>;
  restaurerFraisParClasse: (id: string) => Promise<void>;

  // Gestion des paiements
  ajouterPaiement: (data: PaiementFormData) => Promise<void>;
  modifierPaiement: (
    id: string,
    data: Partial<PaiementFormData>
  ) => Promise<void>;
  supprimerPaiement: (id: string) => Promise<void>; // logique
  supprimerPaiementDefinitif: (id: string) => Promise<void>; // hard
  restaurerPaiement: (id: string) => Promise<void>;

  // Fonctions utilitaires
  getPaiementsByEleve: (eleveId: string) => Paiement[];
  getPaiementsByTypeFrais: (typeFraisId: string) => Paiement[];
  getPaiementsByClasse: (classe: string) => Paiement[];
  getFraisForClasse: (classe: string, typeFraisId: string) => number;
  getStudentBalance: (eleveId: string) => {
    totalDu: number;
    totalPaye: number;
    solde: number;
  };
  getPaiementsWithDetails: () => PaiementWithDetails[];
  getTypesFraisWithStats: () => TypeFraisWithStats[];
  generateReceiptNumber: () => string;
  rechargerDonnees: () => Promise<void>;
}

const FraisScolariteContext = createContext<
  FraisScolariteContextType | undefined
>(undefined);

export const FraisScolariteProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>([]);
  const [fraisParClasse, setFraisParClasse] = useState<FraisParClasse[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAnneeScolaire();

  // Fonctions de conversion
  const toTypeFrais = (r: TypeFraisDB): TypeFrais => ({
    id: r.id,
    nom: r.nom,
    montant_defaut: r.montant_defaut,
    description: r.description,
    obligatoire: r.obligatoire,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  const toFraisParClasse = (r: FraisParClasseDB): FraisParClasse => ({
    id: r.id,
    classe: r.classe,
    type_frais_id: r.type_frais_id,
    montant: r.montant,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  const toPaiement = (r: PaiementDB): Paiement => ({
    id: r.id,
    eleve_id: r.eleve_id,
    type_frais_id: r.type_frais_id,
    montant_du: r.montant_du,
    montant_paye: r.montant_paye,
    date_paiement: r.date_paiement,
    heure_paiement: r.heure_paiement,
    remarques: r.remarques,
    numero_recu: r.numero_recu,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  // Fonction de rechargement des données
  const rechargerDonnees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentYear) {
        setTypesFrais([]);
        setFraisParClasse([]);
        setPaiements([]);
        return;
      }

      const [typesFraisData, fraisParClasseData, paiementsData] =
        await Promise.all([
          SelectData("types_frais"),
          SelectData("frais_par_classe"),
          SelectData("paiements"),
        ]);

      // Filtrer par année scolaire et par deleted
      const typesFraisFiltered = (typesFraisData || []).filter(
        (r: TypeFraisDB) => !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      const fraisParClasseFiltered = (fraisParClasseData || []).filter(
        (r: FraisParClasseDB) =>
          !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      const paiementsFiltered = (paiementsData || []).filter(
        (r: PaiementDB) => !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      setTypesFrais(typesFraisFiltered.map(toTypeFrais));
      setFraisParClasse(fraisParClasseFiltered.map(toFraisParClasse));
      setPaiements(paiementsFiltered.map(toPaiement));
    } catch (e) {
      setError("Erreur lors du chargement des données de frais");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES TYPES DE FRAIS =====
  const ajouterTypeFrais = async (data: TypeFraisFormData) => {
    try {
      setIsLoading(true);

      // Validations
      if (!data.nom?.trim())
        throw new Error("Le nom du type de frais est requis");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");
      if (data.montant_defaut < 0)
        throw new Error("Le montant ne peut pas être négatif");

      // Vérifier l'unicité du nom dans l'année
      const existe = await DataObjectExiste("types_frais", {
        nom: data.nom.trim(),
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });

      if (existe) {
        throw new Error(
          "Un type de frais avec ce nom existe déjà pour cette année"
        );
      }

      const payload: Omit<TypeFraisDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        nom: data.nom.trim(),
        deleted: false,
      };

      if (!payload.description?.trim()) {
        delete (payload as any).description;
      }

      const res = await InsertDataReturn("types_frais", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout du type de frais"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de l'ajout du type de frais"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierTypeFrais = async (
    id: string,
    data: Partial<TypeFraisFormData>
  ) => {
    try {
      setIsLoading(true);

      if (data.montant_defaut !== undefined && data.montant_defaut < 0) {
        throw new Error("Le montant ne peut pas être négatif");
      }

      if (data.nom?.trim()) {
        data.nom = data.nom.trim();
      }

      const ok = await UpdateData("types_frais", id, data);
      if (!ok)
        throw new Error("Erreur lors de la modification du type de frais");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification du type de frais"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerTypeFrais = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("types_frais", id, { deleted: true });
      if (!ok)
        throw new Error("Erreur lors de la suppression du type de frais");

      setTypesFrais((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression du type de frais"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerTypeFraisDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("types_frais", id);
      if (!ok)
        throw new Error(
          "Erreur lors de la suppression définitive du type de frais"
        );

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive du type de frais"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerTypeFrais = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("types_frais", id, { deleted: false });
      if (!ok)
        throw new Error("Erreur lors de la restauration du type de frais");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration du type de frais"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES FRAIS PAR CLASSE =====
  const ajouterFraisParClasse = async (data: FraisParClasseFormData) => {
    try {
      setIsLoading(true);

      if (!data.classe?.trim()) throw new Error("La classe est requise");
      if (!data.type_frais_id) throw new Error("Le type de frais est requis");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");
      if (data.montant < 0)
        throw new Error("Le montant ne peut pas être négatif");

      // Vérifier l'unicité classe/type_frais
      const existe = await DataObjectExiste("frais_par_classe", {
        classe: data.classe.trim(),
        type_frais_id: data.type_frais_id,
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });

      if (existe) {
        throw new Error(
          "Un frais existe déjà pour cette classe et ce type de frais"
        );
      }

      const payload: Omit<
        FraisParClasseDB,
        "id" | "created_at" | "updated_at"
      > = {
        ...data,
        classe: data.classe.trim(),
        deleted: false,
      };

      const res = await InsertDataReturn("frais_par_classe", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout du frais par classe"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de l'ajout du frais par classe"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierFraisParClasse = async (
    id: string,
    data: Partial<FraisParClasseFormData>
  ) => {
    try {
      setIsLoading(true);

      if (data.montant !== undefined && data.montant < 0) {
        throw new Error("Le montant ne peut pas être négatif");
      }

      if (data.classe?.trim()) {
        data.classe = data.classe.trim();
      }

      const ok = await UpdateData("frais_par_classe", id, data);
      if (!ok)
        throw new Error("Erreur lors de la modification du frais par classe");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification du frais par classe"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerFraisParClasse = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("frais_par_classe", id, { deleted: true });
      if (!ok)
        throw new Error("Erreur lors de la suppression du frais par classe");

      setFraisParClasse((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression du frais par classe"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerFraisParClasseDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("frais_par_classe", id);
      if (!ok)
        throw new Error(
          "Erreur lors de la suppression définitive du frais par classe"
        );

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive du frais par classe"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerFraisParClasse = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("frais_par_classe", id, { deleted: false });
      if (!ok)
        throw new Error("Erreur lors de la restauration du frais par classe");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration du frais par classe"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES PAIEMENTS =====
  const generateReceiptNumber = (): string => {
    return "REC" + Date.now().toString().slice(-8);
  };

  const ajouterPaiement = async (data: PaiementFormData) => {
    try {
      setIsLoading(true);

      // Validations
      if (!data.eleve_id) throw new Error("L'élève est requis");
      if (!data.type_frais_id) throw new Error("Le type de frais est requis");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");
      if (data.montant_du < 0)
        throw new Error("Le montant dû ne peut pas être négatif");
      if (data.montant_paye < 0)
        throw new Error("Le montant payé ne peut pas être négatif");

      const now = new Date();
      const payload: Omit<PaiementDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        date_paiement: now.toISOString().split("T")[0],
        heure_paiement: now.toTimeString().split(" ")[0],
        numero_recu: generateReceiptNumber(),
        deleted: false,
      };

      if (!payload.remarques?.trim()) {
        delete (payload as any).remarques;
      }

      const res = await InsertDataReturn("paiements", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout du paiement"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout du paiement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierPaiement = async (
    id: string,
    data: Partial<PaiementFormData>
  ) => {
    try {
      setIsLoading(true);

      if (data.montant_du !== undefined && data.montant_du < 0) {
        throw new Error("Le montant dû ne peut pas être négatif");
      }

      if (data.montant_paye !== undefined && data.montant_paye < 0) {
        throw new Error("Le montant payé ne peut pas être négatif");
      }

      const ok = await UpdateData("paiements", id, data);
      if (!ok) throw new Error("Erreur lors de la modification du paiement");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification du paiement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerPaiement = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("paiements", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression du paiement");

      setPaiements((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression du paiement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerPaiementDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("paiements", id);
      if (!ok)
        throw new Error("Erreur lors de la suppression définitive du paiement");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive du paiement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerPaiement = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("paiements", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration du paiement");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration du paiement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FONCTIONS UTILITAIRES =====
  const getPaiementsByEleve = (eleveId: string): Paiement[] => {
    return paiements.filter((p) => p.eleve_id === eleveId);
  };

  const getPaiementsByTypeFrais = (typeFraisId: string): Paiement[] => {
    return paiements.filter((p) => p.type_frais_id === typeFraisId);
  };

  const getPaiementsByClasse = (classe: string): Paiement[] => {
    // Cette fonction nécessiterait de joindre avec les données des élèves
    // pour filtrer par classe. Pour l'instant, retourne tous les paiements.
    return paiements;
  };

  const getFraisForClasse = (classe: string, typeFraisId: string): number => {
    const frais = fraisParClasse.find(
      (f) => f.classe === classe && f.type_frais_id === typeFraisId
    );

    if (frais) return frais.montant;

    // Si pas de frais spécifique pour la classe, retourner le montant par défaut
    const typeFrais = typesFrais.find((t) => t.id === typeFraisId);
    return typeFrais ? typeFrais.montant_defaut : 0;
  };

  const getStudentBalance = (eleveId: string) => {
    const studentPaiements = getPaiementsByEleve(eleveId);
    const totalDu = studentPaiements.reduce((sum, p) => sum + p.montant_du, 0);
    const totalPaye = studentPaiements.reduce(
      (sum, p) => sum + p.montant_paye,
      0
    );

    return {
      totalDu,
      totalPaye,
      solde: totalDu - totalPaye,
    };
  };

  const getPaiementsWithDetails = (): PaiementWithDetails[] => {
    // Cette fonction nécessiterait de joindre avec les données des élèves
    // Pour l'instant, retourne les paiements avec des champs vides
    return paiements.map((paiement) => ({
      ...paiement,
      eleve_nom: "",
      eleve_prenom: "",
      eleve_code: "",
      type_frais_nom:
        typesFrais.find((t) => t.id === paiement.type_frais_id)?.nom || "",
      classe_nom: "",
      salle_nom: "",
    }));
  };

  const getTypesFraisWithStats = (): TypeFraisWithStats[] => {
    return typesFrais.map((typeFrais) => {
      const paiementsType = getPaiementsByTypeFrais(typeFrais.id);
      const totalDu = paiementsType.reduce((sum, p) => sum + p.montant_du, 0);
      const totalPaye = paiementsType.reduce(
        (sum, p) => sum + p.montant_paye,
        0
      );

      return {
        ...typeFrais,
        total_du: totalDu,
        total_paye: totalPaye,
        nombre_paiements: paiementsType.length,
      };
    });
  };

  // Charger les données au montage et quand l'année change
  useEffect(() => {
    rechargerDonnees();
  }, [currentYear]);

  return (
    <FraisScolariteContext.Provider
      value={{
        // États
        typesFrais,
        fraisParClasse,
        paiements,
        isLoading,
        error,

        // Gestion des types de frais
        ajouterTypeFrais,
        modifierTypeFrais,
        supprimerTypeFrais,
        supprimerTypeFraisDefinitif,
        restaurerTypeFrais,

        // Gestion des frais par classe
        ajouterFraisParClasse,
        modifierFraisParClasse,
        supprimerFraisParClasse,
        supprimerFraisParClasseDefinitif,
        restaurerFraisParClasse,

        // Gestion des paiements
        ajouterPaiement,
        modifierPaiement,
        supprimerPaiement,
        supprimerPaiementDefinitif,
        restaurerPaiement,

        // Fonctions utilitaires
        getPaiementsByEleve,
        getPaiementsByTypeFrais,
        getPaiementsByClasse,
        getFraisForClasse,
        getStudentBalance,
        getPaiementsWithDetails,
        getTypesFraisWithStats,
        generateReceiptNumber,
        rechargerDonnees,
      }}
    >
      {children}
    </FraisScolariteContext.Provider>
  );
};

export const useFraisScolarite = () => {
  const ctx = useContext(FraisScolariteContext);
  if (!ctx) {
    throw new Error(
      "useFraisScolarite must be used within a FraisScolariteProvider"
    );
  }
  return ctx;
};
