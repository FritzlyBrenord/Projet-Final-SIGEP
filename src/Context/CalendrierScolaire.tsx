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

// Types TypeScript pour les événements
export interface Evenement {
  id: string;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  heure_debut?: string;
  heure_fin?: string;
  type:
    | "exam"
    | "vacation"
    | "holiday"
    | "school-start"
    | "activity"
    | "reunion"
    | "formation";
  matiere?: string;
  classe?: string;
  salle?: string;
  organisateur?: string;
  participants?: string[];
  couleur?: string;
  rappel?: boolean;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types pour les horaires/emplois du temps
export interface Horaire {
  id: string;
  nom: string;
  classe: string;
  salle: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Créneaux horaires détaillés
export interface CreneauHoraire {
  id: string;
  horaire_id: string;
  jour_semaine?: number; // 0 = Dimanche, 1 = Lundi, etc.
  date_specifique?: string; // Pour des horaires sur des dates précises
  heure_debut: string;
  heure_fin: string;
  matieres: string[]; // Tableau de matières
  professeur?: string;
  salle_specifique?: string; // Peut override la salle de l'horaire principal
  notes?: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types pour les jours fériés (cachés localement depuis l'API)
export interface JourFerie {
  date: string;
  nom: string;
  nom_local: string;
  type: "holiday";
  annee: number;
}

// Types de formulaires
export interface EvenementFormData {
  titre: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  heure_debut?: string;
  heure_fin?: string;
  type: Evenement["type"];
  matiere?: string;
  classe?: string;
  salle?: string;
  organisateur?: string;
  participants?: string[];
  couleur?: string;
  rappel?: boolean;
  annee_scolaire_id: string;
}

export interface HoraireFormData {
  nom: string;
  classe: string;
  salle: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: string;
}

export interface CreneauHoraireFormData {
  horaire_id: string;
  jour_semaine?: number;
  date_specifique?: string;
  heure_debut: string;
  heure_fin: string;
  matieres: string[];
  professeur?: string;
  salle_specifique?: string;
  notes?: string;
  annee_scolaire_id: string;
}

// Types avec détails joints
export interface EvenementWithDetails extends Evenement {
  conflits?: ConflitHoraire[];
  participants_details?: any[];
}

export interface HoraireWithCreneaux extends Horaire {
  creneaux: CreneauHoraire[];
  nombre_creneaux: number;
  heures_total: number;
}

export interface ConflitHoraire {
  type: "classe" | "salle" | "professeur";
  message: string;
  evenement_conflit?: Evenement;
  creneau_conflit?: CreneauHoraire;
}

// Types DB pour conversion
interface EvenementDB {
  id: string;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  heure_debut?: string;
  heure_fin?: string;
  type: string;
  matiere?: string;
  classe?: string;
  salle?: string;
  organisateur?: string;
  participants?: string;
  couleur?: string;
  rappel?: boolean;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface HoraireDB {
  id: string;
  nom: string;
  classe: string;
  salle: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CreneauHoraireDB {
  id: string;
  horaire_id: string;
  jour_semaine?: number;
  date_specifique?: string;
  heure_debut: string;
  heure_fin: string;
  matieres: any;
  professeur?: string;
  salle_specifique?: string;
  notes?: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface du contexte
export interface CalendrierScolaireContextType {
  // États
  evenements: Evenement[];
  horaires: Horaire[];
  creneauxHoraires: CreneauHoraire[];
  joursFeries: JourFerie[];
  isLoading: boolean;
  error: string | null;

  // Gestion des événements
  ajouterEvenement: (data: EvenementFormData) => Promise<void>;
  modifierEvenement: (
    id: string,
    data: Partial<EvenementFormData>
  ) => Promise<void>;
  supprimerEvenement: (id: string) => Promise<void>;
  supprimerEvenementDefinitif: (id: string) => Promise<void>;
  restaurerEvenement: (id: string) => Promise<void>;

  // Gestion des horaires
  ajouterHoraire: (data: HoraireFormData) => Promise<void>;
  ajouterHoraireReturn: (data: HoraireFormData) => Promise<Horaire>;
  modifierHoraire: (
    id: string,
    data: Partial<HoraireFormData>
  ) => Promise<void>;
  supprimerHoraire: (id: string) => Promise<void>;
  supprimerHoraireDefinitif: (id: string) => Promise<void>;
  restaurerHoraire: (id: string) => Promise<void>;

  // Gestion des créneaux horaires
  ajouterCreneauHoraire: (data: CreneauHoraireFormData) => Promise<void>;
  modifierCreneauHoraire: (
    id: string,
    data: Partial<CreneauHoraireFormData>
  ) => Promise<void>;
  supprimerCreneauHoraire: (id: string) => Promise<void>;
  supprimerCreneauHoraireDefinitif: (id: string) => Promise<void>;
  restaurerCreneauHoraire: (id: string) => Promise<void>;

  // Gestion des jours fériés
  chargerJoursFeries: (annee: number) => Promise<void>;

  // Fonctions utilitaires
  getEvenementsByDate: (date: string) => Evenement[];
  getEvenementsByClasse: (classe: string) => Evenement[];
  getEvenementsByMois: (annee: number, mois: number) => Evenement[];
  getHorairesByClasse: (classe: string) => Horaire[];
  getCreneauxByHoraire: (horaireId: string) => CreneauHoraire[];
  getCreneauxByDate: (date: string) => CreneauHoraire[];
  getHorairesWithCreneaux: () => HoraireWithCreneaux[];
  verifierConflitHoraire: (
    classe: string,
    salle: string,
    dateDebut: string,
    dateFin: string,
    heureDebut: string,
    heureFin: string,
    excludeId?: string
  ) => ConflitHoraire[];
  getEvenementsWithDetails: () => EvenementWithDetails[];
  getStatistiquesCalendrier: () => {
    totalEvenements: number;
    totalHoraires: number;
    totalCreneaux: number;
    evenementsParType: Record<string, number>;
    prochainEvenement?: Evenement;
  };
  rechargerDonnees: () => Promise<void>;
}

const CalendrierScolaireContext = createContext<
  CalendrierScolaireContextType | undefined
>(undefined);

export const CalendrierScolaireProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [horaires, setHoraires] = useState<Horaire[]>([]);
  const [creneauxHoraires, setCreneauxHoraires] = useState<CreneauHoraire[]>(
    []
  );
  const [joursFeries, setJoursFeries] = useState<JourFerie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAnneeScolaire();

  // Fonctions de conversion DB vers modèle
  const toEvenement = (r: EvenementDB): Evenement => ({
    id: r.id,
    titre: r.titre,
    description: r.description,
    date_debut: r.date_debut,
    date_fin: r.date_fin,
    heure_debut: r.heure_debut,
    heure_fin: r.heure_fin,
    type: r.type as Evenement["type"],
    matiere: r.matiere,
    classe: r.classe,
    salle: r.salle,
    organisateur: r.organisateur,
    participants: r.participants ? JSON.parse(r.participants) : [],
    couleur: r.couleur,
    rappel: r.rappel,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  const toHoraire = (r: HoraireDB): Horaire => ({
    id: r.id,
    nom: r.nom,
    classe: r.classe,
    salle: r.salle,
    date_debut: r.date_debut,
    date_fin: r.date_fin,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  const toCreneauHoraire = (r: CreneauHoraireDB): CreneauHoraire => ({
    id: r.id,
    horaire_id: r.horaire_id,
    jour_semaine: r.jour_semaine,
    date_specifique: r.date_specifique,
    heure_debut: r.heure_debut,
    heure_fin: r.heure_fin,
    matieres: Array.isArray(r.matieres)
      ? r.matieres
      : r.matieres
      ? JSON.parse(r.matieres)
      : [],
    professeur: r.professeur,
    salle_specifique: r.salle_specifique,
    notes: r.notes,
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
        setEvenements([]);
        setHoraires([]);
        setCreneauxHoraires([]);
        return;
      }

      const [evenementsData, horairesData, creneauxData] = await Promise.all([
        SelectData("evenements"),
        SelectData("horaires"),
        SelectData("creneaux_horaires"),
      ]);

      // Filtrer par année scolaire et par deleted
      const evenementsFiltered = (evenementsData || []).filter(
        (r: EvenementDB) => !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      const horairesFiltered = (horairesData || []).filter(
        (r: HoraireDB) => !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      const creneauxFiltered = (creneauxData || []).filter(
        (r: CreneauHoraireDB) =>
          !r.deleted && r.annee_scolaire_id === currentYear.id
      );

      setEvenements(evenementsFiltered.map(toEvenement));
      setHoraires(horairesFiltered.map(toHoraire));
      setCreneauxHoraires(creneauxFiltered.map(toCreneauHoraire));

      // Charger les jours fériés pour l'année courante
      await chargerJoursFeries(new Date().getFullYear());
    } catch (e) {
      setError("Erreur lors du chargement des données du calendrier");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES ÉVÉNEMENTS =====
  const ajouterEvenement = async (data: EvenementFormData) => {
    try {
      setIsLoading(true);

      // Validations
      if (!data.titre?.trim())
        throw new Error("Le titre de l'événement est requis");
      if (!data.date_debut) throw new Error("La date de début est requise");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");

      // Validation des dates
      if (data.date_fin && data.date_fin < data.date_debut) {
        throw new Error(
          "La date de fin ne peut pas être antérieure à la date de début"
        );
      }

      // Validation des heures
      if (
        data.heure_debut &&
        data.heure_fin &&
        data.heure_debut >= data.heure_fin
      ) {
        throw new Error(
          "L'heure de fin doit être postérieure à l'heure de début"
        );
      }

      const payload: Omit<EvenementDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        titre: data.titre.trim(),
        participants: data.participants
          ? JSON.stringify(data.participants)
          : undefined,
        deleted: false,
      };

      // Nettoyer les champs optionnels vides
      if (!payload.description?.trim()) delete (payload as any).description;
      if (!payload.matiere?.trim()) delete (payload as any).matiere;
      if (!payload.classe?.trim()) delete (payload as any).classe;
      if (!payload.salle?.trim()) delete (payload as any).salle;
      if (!payload.organisateur?.trim()) delete (payload as any).organisateur;

      const res = await InsertDataReturn("evenements", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout de l'événement"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout de l'événement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierEvenement = async (
    id: string,
    data: Partial<EvenementFormData>
  ) => {
    try {
      setIsLoading(true);

      if (data.titre?.trim()) {
        data.titre = data.titre.trim();
      }

      // Validation des dates si modifiées
      if (data.date_fin && data.date_debut && data.date_fin < data.date_debut) {
        throw new Error(
          "La date de fin ne peut pas être antérieure à la date de début"
        );
      }

      if (
        data.heure_debut &&
        data.heure_fin &&
        data.heure_debut >= data.heure_fin
      ) {
        throw new Error(
          "L'heure de fin doit être postérieure à l'heure de début"
        );
      }

      const updateData = { ...data };
      if (updateData.participants) {
        (updateData as any).participants = JSON.stringify(
          updateData.participants
        );
      }

      const ok = await UpdateData("evenements", id, updateData);
      if (!ok) throw new Error("Erreur lors de la modification de l'événement");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification de l'événement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEvenement = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("evenements", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression de l'événement");

      setEvenements((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de l'événement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerEvenementDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("evenements", id);
      if (!ok)
        throw new Error(
          "Erreur lors de la suppression définitive de l'événement"
        );

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive de l'événement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerEvenement = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("evenements", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration de l'événement");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration de l'événement"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES HORAIRES =====
  const ajouterHoraire = async (data: HoraireFormData) => {
    try {
      setIsLoading(true);

      if (!data.nom?.trim()) throw new Error("Le nom de l'horaire est requis");
      if (!data.classe?.trim()) throw new Error("La classe est requise");
      if (!data.salle?.trim()) throw new Error("La salle est requise");
      if (!data.date_debut) throw new Error("La date de début est requise");
      if (!data.date_fin) throw new Error("La date de fin est requise");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");

      if (data.date_fin < data.date_debut) {
        throw new Error(
          "La date de fin ne peut pas être antérieure à la date de début"
        );
      }

      // Vérifier l'unicité nom/classe/période
      const existe = await DataObjectExiste("horaires", {
        nom: data.nom.trim(),
        classe: data.classe.trim(),
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });

      if (existe) {
        throw new Error("Un horaire avec ce nom existe déjà pour cette classe");
      }

      const payload: Omit<HoraireDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        nom: data.nom.trim(),
        classe: data.classe.trim(),
        salle: data.salle.trim(),
        deleted: false,
      };

      const res = await InsertDataReturn("horaires", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout de l'horaire"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout de l'horaire"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Variante: crée un horaire et retourne l'objet créé (avec id)
  const ajouterHoraireReturn = async (data: HoraireFormData): Promise<Horaire> => {
    try {
      setIsLoading(true);

      if (!data.nom?.trim()) throw new Error("Le nom de l'horaire est requis");
      if (!data.classe?.trim()) throw new Error("La classe est requise");
      if (!data.salle?.trim()) throw new Error("La salle est requise");
      if (!data.date_debut) throw new Error("La date de début est requise");
      if (!data.date_fin) throw new Error("La date de fin est requise");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");

      if (data.date_fin < data.date_debut) {
        throw new Error(
          "La date de fin ne peut pas être antérieure à la date de début"
        );
      }

      const existe = await DataObjectExiste("horaires", {
        nom: data.nom.trim(),
        classe: data.classe.trim(),
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });
      if (existe) {
        throw new Error("Un horaire avec ce nom existe déjà pour cette classe");
      }

      const payload: Omit<HoraireDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        nom: data.nom.trim(),
        classe: data.classe.trim(),
        salle: data.salle.trim(),
        deleted: false,
      };

      const res = await InsertDataReturn("horaires", payload);
      if (!res.success || !res.rows || res.rows.length === 0) {
        throw new Error(res.error?.message || "Erreur lors de l'ajout de l'horaire");
      }

      const created = toHoraire(res.rows[0] as HoraireDB);
      // rafraîchir les listes pour cohérence de l'état global
      await rechargerDonnees();
      return created;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierHoraire = async (
    id: string,
    data: Partial<HoraireFormData>
  ) => {
    try {
      setIsLoading(true);

      if (data.nom?.trim()) data.nom = data.nom.trim();
      if (data.classe?.trim()) data.classe = data.classe.trim();
      if (data.salle?.trim()) data.salle = data.salle.trim();

      if (data.date_fin && data.date_debut && data.date_fin < data.date_debut) {
        throw new Error(
          "La date de fin ne peut pas être antérieure à la date de début"
        );
      }

      const ok = await UpdateData("horaires", id, data);
      if (!ok) throw new Error("Erreur lors de la modification de l'horaire");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification de l'horaire"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerHoraire = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("horaires", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression de l'horaire");

      setHoraires((prev) => prev.filter((h) => h.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de l'horaire"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerHoraireDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("horaires", id);
      if (!ok)
        throw new Error(
          "Erreur lors de la suppression définitive de l'horaire"
        );

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive de l'horaire"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerHoraire = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("horaires", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration de l'horaire");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration de l'horaire"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES CRÉNEAUX HORAIRES =====
  const ajouterCreneauHoraire = async (data: CreneauHoraireFormData) => {
    try {
      setIsLoading(true);

      if (!data.horaire_id) throw new Error("L'horaire parent est requis");
      if (!data.heure_debut) throw new Error("L'heure de début est requise");
      if (!data.heure_fin) throw new Error("L'heure de fin est requise");
      if (!data.matieres || data.matieres.length === 0)
        throw new Error("Au moins une matière est requise");
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");

      if (data.heure_debut >= data.heure_fin) {
        throw new Error(
          "L'heure de fin doit être postérieure à l'heure de début"
        );
      }

      if (data.jour_semaine === undefined && !data.date_specifique) {
        throw new Error(
          "Le jour de la semaine ou une date spécifique est requis"
        );
      }

      // Vérifier les conflits d'horaire
      const horaire = horaires.find((h) => h.id === data.horaire_id);
      if (horaire) {
        const conflits = verifierConflitHoraire(
          horaire.classe,
          data.salle_specifique || horaire.salle,
          data.date_specifique || horaire.date_debut,
          data.date_specifique || horaire.date_fin,
          data.heure_debut,
          data.heure_fin
        );

        if (conflits.length > 0) {
          throw new Error(`Conflit détecté: ${conflits[0].message}`);
        }
      }

      const payload: Omit<CreneauHoraireDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        matieres: data.matieres, // JSONB en base; envoyer un tableau natif
        deleted: false,
      };

      if (!payload.professeur?.trim()) delete (payload as any).professeur;
      if (!payload.salle_specifique?.trim())
        delete (payload as any).salle_specifique;
      if (!payload.notes?.trim()) delete (payload as any).notes;

      const res = await InsertDataReturn("creneaux_horaires", payload);
      if (!res.success) {
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout du créneau"
        );
      }

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout du créneau"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierCreneauHoraire = async (
    id: string,
    data: Partial<CreneauHoraireFormData>
  ) => {
    try {
      setIsLoading(true);

      if (
        data.heure_debut &&
        data.heure_fin &&
        data.heure_debut >= data.heure_fin
      ) {
        throw new Error(
          "L'heure de fin doit être postérieure à l'heure de début"
        );
      }

      const updateData = { ...data };
      // Pour JSONB, conserver le tableau tel quel

      const ok = await UpdateData("creneaux_horaires", id, updateData);
      if (!ok) throw new Error("Erreur lors de la modification du créneau");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification du créneau"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerCreneauHoraire = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("creneaux_horaires", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression du créneau");

      setCreneauxHoraires((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression du créneau"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerCreneauHoraireDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("creneaux_horaires", id);
      if (!ok)
        throw new Error("Erreur lors de la suppression définitive du créneau");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive du créneau"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerCreneauHoraire = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("creneaux_horaires", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration du créneau");

      await rechargerDonnees();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration du créneau"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GESTION DES JOURS FÉRIÉS =====
  const chargerJoursFeries = async (annee: number) => {
    try {
      const response = await fetch(
        `https://date.nager.at/api/v3/publicholidays/${annee}/HT`
      );
      if (response.ok) {
        const data = await response.json();
        const formattedHolidays: JourFerie[] = data.map((holiday: any) => ({
          date: holiday.date,
          nom: holiday.name,
          nom_local: holiday.localName || holiday.name,
          type: "holiday" as const,
          annee: annee,
        }));
        setJoursFeries(formattedHolidays);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des jours fériés:", error);
      // Fallback avec quelques jours fériés essentiels
      setJoursFeries([
        {
          date: `${annee}-01-01`,
          nom: "Jour de l'Indépendance",
          nom_local: "Jour de l'Indépendance",
          type: "holiday",
          annee,
        },
        {
          date: `${annee}-01-02`,
          nom: "Jour des Aïeux",
          nom_local: "Jour des Aïeux",
          type: "holiday",
          annee,
        },
        {
          date: `${annee}-05-01`,
          nom: "Fête du Travail",
          nom_local: "Fête du Travail",
          type: "holiday",
          annee,
        },
        {
          date: `${annee}-12-25`,
          nom: "Noël",
          nom_local: "Noël",
          type: "holiday",
          annee,
        },
      ]);
    }
  };

  // ===== FONCTIONS UTILITAIRES =====
  const getEvenementsByDate = (date: string): Evenement[] => {
    return evenements.filter((e) => {
      if (e.date_fin) {
        return date >= e.date_debut && date <= e.date_fin;
      }
      return e.date_debut === date;
    });
  };

  const getEvenementsByClasse = (classe: string): Evenement[] => {
    return evenements.filter((e) => e.classe === classe);
  };

  const getEvenementsByMois = (annee: number, mois: number): Evenement[] => {
    const debutMois = `${annee}-${mois.toString().padStart(2, "0")}-01`;
    const finMois = `${annee}-${mois.toString().padStart(2, "0")}-31`;

    return evenements.filter((e) => {
      return (
        (e.date_debut >= debutMois && e.date_debut <= finMois) ||
        (e.date_fin && e.date_fin >= debutMois && e.date_fin <= finMois) ||
        (e.date_debut <= debutMois && e.date_fin && e.date_fin >= finMois)
      );
    });
  };

  const getHorairesByClasse = (classe: string): Horaire[] => {
    return horaires.filter((h) => h.classe === classe);
  };

  const getCreneauxByHoraire = (horaireId: string): CreneauHoraire[] => {
    return creneauxHoraires.filter((c) => c.horaire_id === horaireId);
  };

  const getCreneauxByDate = (date: string): CreneauHoraire[] => {
    const dateObj = new Date(date);
    const jourSemaine = dateObj.getDay();

    return creneauxHoraires.filter(
      (c) => c.date_specifique === date || c.jour_semaine === jourSemaine
    );
  };

  const getHorairesWithCreneaux = (): HoraireWithCreneaux[] => {
    return horaires.map((horaire) => {
      const creneaux = getCreneauxByHoraire(horaire.id);
      const heuresTotal = creneaux.reduce((total, creneau) => {
        const debut = new Date(`2000-01-01T${creneau.heure_debut}`);
        const fin = new Date(`2000-01-01T${creneau.heure_fin}`);
        return total + (fin.getTime() - debut.getTime()) / (1000 * 60 * 60); // heures
      }, 0);

      return {
        ...horaire,
        creneaux,
        nombre_creneaux: creneaux.length,
        heures_total: heuresTotal,
      };
    });
  };

  const verifierConflitHoraire = (
    classe: string,
    salle: string,
    dateDebut: string,
    dateFin: string,
    heureDebut: string,
    heureFin: string,
    excludeId?: string
  ): ConflitHoraire[] => {
    const conflits: ConflitHoraire[] = [];

    // Vérifier conflits avec autres événements
    const evenementsConflits = evenements.filter((e) => {
      if (excludeId && e.id === excludeId) return false;

      const memeClasse = e.classe === classe;
      const memeSalle = e.salle === salle;

      if (!memeClasse && !memeSalle) return false;

      // Vérifier chevauchement de dates
      const eventDateFin = e.date_fin || e.date_debut;
      const datesChevauchent = !(
        dateFin < e.date_debut || dateDebut > eventDateFin
      );

      if (!datesChevauchent) return false;

      // Vérifier chevauchement d'heures si heures définies
      if (e.heure_debut && e.heure_fin) {
        const heuresChevauchent = !(
          heureFin <= e.heure_debut || heureDebut >= e.heure_fin
        );
        return heuresChevauchent;
      }

      return true;
    });

    evenementsConflits.forEach((e) => {
      conflits.push({
        type: e.classe === classe ? "classe" : "salle",
        message: `${e.classe === classe ? "Classe" : "Salle"} ${
          e.classe === classe ? classe : salle
        } occupée par "${e.titre}" le ${e.date_debut}`,
        evenement_conflit: e,
      });
    });

    return conflits;
  };

  const getEvenementsWithDetails = (): EvenementWithDetails[] => {
    return evenements.map((evenement) => {
      const conflits =
        evenement.classe && evenement.salle
          ? verifierConflitHoraire(
              evenement.classe,
              evenement.salle,
              evenement.date_debut,
              evenement.date_fin || evenement.date_debut,
              evenement.heure_debut || "00:00",
              evenement.heure_fin || "23:59",
              evenement.id
            )
          : [];

      return {
        ...evenement,
        conflits,
        participants_details: [], // À implémenter si nécessaire
      };
    });
  };

  const getStatistiquesCalendrier = () => {
    const evenementsParType = evenements.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maintenant = new Date();
    const prochainEvenement = evenements
      .filter((e) => new Date(e.date_debut) > maintenant)
      .sort(
        (a, b) =>
          new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
      )[0];

    return {
      totalEvenements: evenements.length,
      totalHoraires: horaires.length,
      totalCreneaux: creneauxHoraires.length,
      evenementsParType,
      prochainEvenement,
    };
  };

  // Charger les données au montage et quand l'année change
  useEffect(() => {
    rechargerDonnees();
  }, [currentYear]);

  return (
    <CalendrierScolaireContext.Provider
      value={{
        // États
        evenements,
        horaires,
        creneauxHoraires,
        joursFeries,
        isLoading,
        error,

        // Gestion des événements
        ajouterEvenement,
        modifierEvenement,
        supprimerEvenement,
        supprimerEvenementDefinitif,
        restaurerEvenement,

        // Gestion des horaires
        ajouterHoraire,
        ajouterHoraireReturn,
        modifierHoraire,
        supprimerHoraire,
        supprimerHoraireDefinitif,
        restaurerHoraire,

        // Gestion des créneaux horaires
        ajouterCreneauHoraire,
        modifierCreneauHoraire,
        supprimerCreneauHoraire,
        supprimerCreneauHoraireDefinitif,
        restaurerCreneauHoraire,

        // Gestion des jours fériés
        chargerJoursFeries,

        // Fonctions utilitaires
        getEvenementsByDate,
        getEvenementsByClasse,
        getEvenementsByMois,
        getHorairesByClasse,
        getCreneauxByHoraire,
        getCreneauxByDate,
        getHorairesWithCreneaux,
        verifierConflitHoraire,
        getEvenementsWithDetails,
        getStatistiquesCalendrier,
        rechargerDonnees,
      }}
    >
      {children}
    </CalendrierScolaireContext.Provider>
  );
};

export const useCalendrierScolaire = () => {
  const ctx = useContext(CalendrierScolaireContext);
  if (!ctx) {
    throw new Error(
      "useCalendrierScolaire must be used within a CalendrierScolaireProvider"
    );
  }
  return ctx;
};
