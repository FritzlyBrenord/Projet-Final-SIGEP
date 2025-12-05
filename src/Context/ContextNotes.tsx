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
import { Note, NoteFormData, NoteWithDetails } from "../types/NoteType";
import { Subject } from "./ContextAnneeScolaire";
import {
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
  DataObjectExiste,
} from "@/Config/SupabaseData";

interface NoteDB {
  id: string;
  eleve_id: string;
  matiere_id: string;
  trimestre: 1 | 2 | 3;
  note: number;
  observation?: string;
  decision_de_fin_annee?: string;
  date_ajout: string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  // Gestion des notes
  ajouterNote: (data: NoteFormData) => Promise<void>;
  modifierNote: (id: string, data: Partial<NoteFormData>) => Promise<void>;
  supprimerNote: (id: string) => Promise<void>; // logique
  supprimerNoteDefinitif: (id: string) => Promise<void>; // hard
  restaurerNote: (id: string) => Promise<void>;

  // Fonctions utilitaires
  getNotesByEleve: (eleveId: string) => Note[];
  getNotesByMatiere: (matiereId: string) => Note[];
  getNotesByTrimestre: (trimestre: 1 | 2 | 3) => Note[];
  getNotesByEleveAndMatiere: (eleveId: string, matiereId: string) => Note[];
  getNotesByEleveMatiereTrimestre: (
    eleveId: string,
    matiereId: string,
    trimestre: 1 | 2 | 3
  ) => Note | null;
  getMatieresBySalle: (salleId: string) => Subject[];
  getNotesWithDetails: () => NoteWithDetails[];
  calculateMoyenneGeneraleTrimestre: (
    eleveId: string,
    trimestre: 1 | 2 | 3
  ) => number;
  calculateMoyenneGeneraleAnnuelle: (eleveId: string) => number;
  rechargerNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAnneeScolaire();

  const toNote = (r: NoteDB): Note => ({
    id: r.id,
    eleve_id: r.eleve_id,
    matiere_id: r.matiere_id,
    trimestre: r.trimestre,
    note: r.note,
    observation: r.observation,
    date_ajout: r.date_ajout,
    decision_de_fin_annee: r.decision_de_fin_annee,
    annee_scolaire_id: r.annee_scolaire_id,
    deleted: r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  const rechargerNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await SelectData("notes");
      const list = (data || []).filter(
        (r: NoteDB) =>
          !r.deleted && (!currentYear || r.annee_scolaire_id === currentYear.id)
      );
      setNotes(list.map(toNote));
    } catch (e) {
      setError("Erreur lors du chargement des notes");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  // Gestion des notes
  const ajouterNote = async (data: NoteFormData) => {
    try {
      setIsLoading(true);

      // Valider contraintes NOT NULL / FK
      if (!data.annee_scolaire_id) throw new Error("Année scolaire requise");
      if (!data.eleve_id) throw new Error("Élève requis");
      if (!data.matiere_id) throw new Error("Matière requise");

      // Vérifier si une note existe déjà pour cet élève, matière et trimestre
      const existingNote = await DataObjectExiste("notes", {
        eleve_id: data.eleve_id,
        matiere_id: data.matiere_id,
        trimestre: data.trimestre,
        annee_scolaire_id: data.annee_scolaire_id,
        deleted: false,
      });

      if (existingNote) {
        throw new Error(
          "Une note existe déjà pour cet élève, cette matière et ce trimestre"
        );
      }

      const payload: Omit<NoteDB, "id" | "created_at" | "updated_at"> = {
        ...data,
        date_ajout: new Date().toISOString().split("T")[0],
        deleted: false,
      } as NoteDB;

      if (!payload.observation) delete (payload as any).observation;

      const res = await InsertDataReturn("notes", payload);
      if (!res.success)
        throw new Error(
          res.error?.message || "Erreur lors de l'ajout de la note"
        );
      await rechargerNotes();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'ajout de la note"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const modifierNote = async (id: string, data: Partial<NoteFormData>) => {
    try {
      setIsLoading(true);

      if (data.note !== undefined && data.note < 0) {
        throw new Error("La note doit être entre 0 et 100");
      }

      const ok = await UpdateData("notes", id, data);
      if (!ok) throw new Error("Erreur lors de la modification de la note");
      await rechargerNotes();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la modification de la note"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerNote = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("notes", id, { deleted: true });
      if (!ok) throw new Error("Erreur lors de la suppression de la note");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de la note"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerNoteDefinitif = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await DeleteData("notes", id);
      if (!ok)
        throw new Error("Erreur lors de la suppression définitive de la note");
      await rechargerNotes();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression définitive de la note"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const restaurerNote = async (id: string) => {
    try {
      setIsLoading(true);
      const ok = await UpdateData("notes", id, { deleted: false });
      if (!ok) throw new Error("Erreur lors de la restauration de la note");
      await rechargerNotes();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la restauration de la note"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions utilitaires
  const getNotesByEleve = (eleveId: string): Note[] => {
    return notes.filter((n) => n.eleve_id === eleveId);
  };

  const getNotesByMatiere = (matiereId: string): Note[] => {
    return notes.filter((n) => n.matiere_id === matiereId);
  };

  const getNotesByTrimestre = (trimestre: 1 | 2 | 3): Note[] => {
    return notes.filter((n) => n.trimestre === trimestre);
  };

  const getNotesByEleveAndMatiere = (
    eleveId: string,
    matiereId: string
  ): Note[] => {
    return notes.filter(
      (n) => n.eleve_id === eleveId && n.matiere_id === matiereId
    );
  };

  const getNotesByEleveMatiereTrimestre = (
    eleveId: string,
    matiereId: string,
    trimestre: 1 | 2 | 3
  ): Note | null => {
    return (
      notes.find(
        (n) =>
          n.eleve_id === eleveId &&
          n.matiere_id === matiereId &&
          n.trimestre === trimestre
      ) || null
    );
  };

  const getMatieresBySalle = (salleId: string): Subject[] => {
    if (!currentYear) return [];

    // Trouver la salle dans l'année courante
    for (const classe of currentYear.classes) {
      const salle = classe.salles.find((s) => s.id === salleId);
      if (salle) {
        return salle.subjects;
      }
    }
    return [];
  };

  const getNotesWithDetails = (): NoteWithDetails[] => {
    if (!currentYear) return [];

    return notes.map((note) => {
      // Trouver la matière dans l'année courante
      let matiere_nom = "";
      let classe_nom = "";
      let salle_nom = "";

      for (const classe of currentYear.classes) {
        for (const salle of classe.salles) {
          const matiere = salle.subjects.find((s) => s.id === note.matiere_id);
          if (matiere) {
            matiere_nom = matiere.name;
            classe_nom = classe.name;
            salle_nom = salle.name;
            break;
          }
        }
        if (matiere_nom) break;
      }

      return {
        ...note,
        eleve_nom: "", // À remplir avec les données des élèves depuis le contexte des élèves
        eleve_prenom: "",
        eleve_code: "",
        matiere_nom,
        classe_nom,
        salle_nom,
      };
    });
  };

  const calculateMoyenneGeneraleTrimestre = (
    eleveId: string,
    trimestre: 1 | 2 | 3
  ): number => {
    if (!currentYear) return 0;

    let totalPoints = 0;
    let totalCoefficient = 0;

    // Parcourir toutes les classes pour trouver les matières
    for (const classe of currentYear.classes) {
      for (const salle of classe.salles) {
        for (const matiere of salle.subjects) {
          const note = getNotesByEleveMatiereTrimestre(
            eleveId,
            matiere.id,
            trimestre
          );
          if (note) {
            totalPoints += note.note;
            totalCoefficient += matiere.coefficient;
          }
        }
      }
    }

    if (totalCoefficient === 0) return 0;

    // Formule: Total des points / Total des coefficients * 0.1 (pour avoir une note sur 10)
    const moyenne = (totalPoints / totalCoefficient) * 10;

    // Retourner la moyenne avec 2 décimales exactes
    return parseFloat(moyenne.toFixed(2));
  };

  // Calcul de la moyenne générale annuelle (moyenne des moyennes des trimestres)
  const calculateMoyenneGeneraleAnnuelle = (eleveId: string): number => {
    const moyennesTrimestres = [1, 2, 3]
      .map((trimestre) =>
        calculateMoyenneGeneraleTrimestre(eleveId, trimestre as 1 | 2 | 3)
      )
      .filter((moyenne) => moyenne > 0);

    if (moyennesTrimestres.length === 0) return 0;

    const moyenneAnnuelle =
      moyennesTrimestres.reduce((sum, moyenne) => sum + moyenne, 0) /
      moyennesTrimestres.length;

    // Retourner avec 2 décimales exactes
    return parseFloat(moyenneAnnuelle.toFixed(2));
  };

  useEffect(() => {
    rechargerNotes();
  }, [currentYear, rechargerNotes]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        isLoading,
        error,
        ajouterNote,
        modifierNote,
        supprimerNote,
        supprimerNoteDefinitif,
        restaurerNote,
        getNotesByEleve,
        getNotesByMatiere,
        getNotesByTrimestre,
        getNotesByEleveAndMatiere,
        getNotesByEleveMatiereTrimestre,
        getMatieresBySalle,
        getNotesWithDetails,
        calculateMoyenneGeneraleTrimestre,
        calculateMoyenneGeneraleAnnuelle,
        rechargerNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within a NotesProvider");
  return ctx;
};
