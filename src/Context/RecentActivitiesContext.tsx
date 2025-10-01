"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import {
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
} from "@/Config/SupabaseData";

// Types
export type ActivityAction =
  | "ajout"
  | "modification"
  | "suppression"
  | "reinscription"
  | "connexion"
  | "deconnexion"
  | "consultation"
  | "export"
  | "import";

export type ActivityModule =
  | "Gestion Élèves"
  | "Notes"
  | "Paiements"
  | "Professeurs"
  | "Employés"
  | "Paramètres"
  | "Authentification"
  | "Rapports"
  | "Calendrier"
  | "Système";

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  module: ActivityModule;
  title: string;
  details?: string;
  source_table?: string;
  entity_id?: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  user_role?: string;
  annee_scolaire_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface ActivitySettings {
  id: string;
  auto_delete_enabled: boolean;
  auto_delete_days: number;
  max_activities: number;
  last_cleanup_at?: string;
  updated_at?: string;
  updated_by?: string;
}

interface RecentActivitiesContextType {
  // Activités
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;

  // Paramètres
  settings: ActivitySettings | null;
  settingsLoading: boolean;

  // Actions
  addActivity: (
    activity: Omit<ActivityItem, "id" | "created_at" | "user_id" | "user_email">
  ) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  deleteActivities: (ids: string[]) => Promise<boolean>;
  deleteAllActivities: () => Promise<boolean>;

  // Paramètres
  updateSettings: (settings: Partial<ActivitySettings>) => Promise<boolean>;
  triggerCleanup: () => Promise<number>;

  // Refresh
  refresh: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const RecentActivitiesContext = createContext<
  RecentActivitiesContextType | undefined
>(undefined);

// Days options pour la suppression automatique
export const AUTO_DELETE_DAYS_OPTIONS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  100,
];

export const RecentActivitiesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { currentYear } = useAnneeScolaire();
  const { currentSession } = useContextUtilisateur();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<ActivitySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ========================================
  // Charger les activités
  // ========================================
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SelectData("system_activities");

      if (data) {
        let filtered = (data as ActivityItem[]).filter((a) => !a.deleted);

        // Filtrer par année scolaire si définie
        if (currentYear?.id) {
          filtered = filtered.filter(
            (a) =>
              !a.annee_scolaire_id || a.annee_scolaire_id === currentYear.id
          );
        }

        // Trier par date décroissante
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivities(filtered);
      } else {
        setActivities([]);
      }
    } catch (e: any) {
      console.error("Erreur chargement activités:", e);
      setError("Impossible de charger les activités");
    } finally {
      setLoading(false);
    }
  }, [currentYear?.id]);

  // ========================================
  // Charger les paramètres
  // ========================================
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const data = await SelectData("activity_settings");

      if (data && data.length > 0) {
        setSettings(data[0] as ActivitySettings);
      } else {
        // Créer paramètres par défaut si inexistants
        const defaultSettings = {
          auto_delete_enabled: false,
          auto_delete_days: 30,
          max_activities: 1000,
        };

        const result = await InsertDataReturn(
          "activity_settings",
          defaultSettings
        );
        if (result?.success && result.rows) {
          setSettings(result.rows[0] as ActivitySettings);
        }
      }
    } catch (e: any) {
      console.error("Erreur chargement paramètres:", e);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ========================================
  // Ajouter une activité
  // ========================================
  const addActivity = useCallback(
    async (
      activity: Omit<
        ActivityItem,
        "id" | "created_at" | "user_id" | "user_email"
      >
    ): Promise<boolean> => {
      try {
        if (!currentSession.user) {
          console.error("Utilisateur non connecté");
          return false;
        }

        const activityData: any = {
          action: activity.action,
          module: activity.module,
          title: activity.title,
          details: activity.details,
          source_table: activity.source_table,
          entity_id: activity.entity_id,
          user_id: currentSession.user.id,
          user_email: currentSession.user.email,
          user_name: currentSession.employer
            ? `${currentSession.employer.prenom} ${currentSession.employer.nom}`
            : undefined,
          user_role: currentSession.role,
          annee_scolaire_id: activity.annee_scolaire_id || currentYear?.id,
          ip_address: activity.ip_address,
          user_agent:
            activity.user_agent ||
            (typeof window !== "undefined" ? navigator.userAgent : undefined),
          metadata: activity.metadata || {},
          created_at: new Date().toISOString(),
          deleted: false,
        };

        const result = await InsertDataReturn(
          "system_activities",
          activityData
        );

        if (result?.success) {
          await fetchActivities(); // Rafraîchir la liste
          return true;
        }

        return false;
      } catch (e: any) {
        console.error("Erreur ajout activité:", e);
        return false;
      }
    },
    [
      currentSession.employer,
      currentSession.role,
      currentSession.user,
      currentYear?.id,
      fetchActivities,
    ]
  );

  // ========================================
  // Supprimer une activité (soft delete)
  // ========================================
  const deleteActivity = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const success = await UpdateData("system_activities", id, {
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentSession?.user?.id,
        });

        if (success) {
          await fetchActivities();
          return true;
        }
        return false;
      } catch (e: any) {
        console.error("Erreur suppression activité:", e);
        return false;
      }
    },
    [currentSession?.user?.id, fetchActivities]
  );

  // ========================================
  // Supprimer plusieurs activités
  // ========================================
  const deleteActivities = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const promises = ids.map((id) =>
          UpdateData("system_activities", id, {
            deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: currentSession?.user?.id,
          })
        );

        const results = await Promise.all(promises);
        const allSuccess = results.every((r) => r === true);

        if (allSuccess) {
          await fetchActivities();
          return true;
        }
        return false;
      } catch (e: any) {
        console.error("Erreur suppression multiple:", e);
        return false;
      }
    },
    [currentSession?.user?.id, fetchActivities]
  );

  // ========================================
  // Supprimer toutes les activités
  // ========================================
  const deleteAllActivities = useCallback(async (): Promise<boolean> => {
    try {
      const allIds = activities.map((a) => a.id);
      return await deleteActivities(allIds);
    } catch (e: any) {
      console.error("Erreur suppression totale:", e);
      return false;
    }
  }, [activities, deleteActivities]);

  // ========================================
  // Mettre à jour les paramètres
  // ========================================
  const updateSettings = useCallback(
    async (newSettings: Partial<ActivitySettings>): Promise<boolean> => {
      try {
        if (!settings?.id) return false;

        const updateData = {
          ...newSettings,
          updated_at: new Date().toISOString(),
          updated_by: currentSession?.user?.id,
        };

        const success = await UpdateData(
          "activity_settings",
          settings.id,
          updateData
        );

        if (success) {
          await fetchSettings();
          return true;
        }
        return false;
      } catch (e: any) {
        console.error("Erreur mise à jour paramètres:", e);
        return false;
      }
    },
    [currentSession?.user?.id, fetchSettings, settings?.id]
  );

  // ========================================
  // Déclencher le nettoyage manuel
  // ========================================
  const triggerCleanup = useCallback(async (): Promise<number> => {
    try {
      if (!settings?.auto_delete_enabled) {
        console.warn("Suppression automatique désactivée");
        return 0;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.auto_delete_days);

      const oldActivities = activities.filter(
        (a) => new Date(a.created_at) < cutoffDate
      );

      if (oldActivities.length > 0) {
        const ids = oldActivities.map((a) => a.id);
        await deleteActivities(ids);

        // Mettre à jour last_cleanup_at
        await UpdateData("activity_settings", settings.id, {
          last_cleanup_at: new Date().toISOString(),
        });

        return oldActivities.length;
      }

      return 0;
    } catch (e: any) {
      console.error("Erreur nettoyage:", e);
      return 0;
    }
  }, [
    activities,
    deleteActivities,
    settings?.auto_delete_days,
    settings?.auto_delete_enabled,
    settings?.id,
  ]);

  // ========================================
  // Effects
  // ========================================
  useEffect(() => {
    fetchActivities();
    fetchSettings();
  }, [fetchActivities, fetchSettings]);

  // Nettoyage automatique périodique (toutes les heures)
  useEffect(() => {
    if (!settings?.auto_delete_enabled) return;

    const interval = setInterval(() => {
      triggerCleanup();
    }, 3600000); // 1 heure

    return () => clearInterval(interval);
  }, [settings?.auto_delete_enabled, triggerCleanup]);

  // ========================================
  // Context Value
  // ========================================
  const value = useMemo(
    () => ({
      activities,
      loading,
      error,
      settings,
      settingsLoading,
      addActivity,
      deleteActivity,
      deleteActivities,
      deleteAllActivities,
      updateSettings,
      triggerCleanup,
      refresh: fetchActivities,
      refreshSettings: fetchSettings,
    }),
    [
      activities,
      addActivity,
      deleteActivities,
      deleteActivity,
      deleteAllActivities,
      error,
      fetchActivities,
      fetchSettings,
      loading,
      settings,
      settingsLoading,
      triggerCleanup,
      updateSettings,
    ]
  );

  return (
    <RecentActivitiesContext.Provider value={value}>
      {children}
    </RecentActivitiesContext.Provider>
  );
};

// ========================================
// Hook personnalisé
// ========================================
export const useRecentActivities = () => {
  const ctx = useContext(RecentActivitiesContext);
  if (!ctx) {
    throw new Error(
      "useRecentActivities doit être utilisé dans RecentActivitiesProvider"
    );
  }
  return ctx;
};

// ========================================
// Helper: Enregistrer automatiquement une activité
// ========================================
export const logActivity = async (
  action: ActivityAction,
  module: ActivityModule,
  title: string,
  details?: string,
  sourceTable?: string,
  entityId?: string,
  metadata?: Record<string, any>,
  currentSession?: any,
  currentYear?: any
) => {
  try {
    if (!currentSession?.user) return false;

    const activityData = {
      action,
      module,
      title,
      details,
      source_table: sourceTable,
      entity_id: entityId,
      user_id: currentSession.user.id,
      user_email: currentSession.user.email,
      user_name: currentSession.employer
        ? `${currentSession.employer.prenom} ${currentSession.employer.nom}`
        : undefined,
      user_role: currentSession.role,
      annee_scolaire_id: currentYear?.id,
      user_agent:
        typeof window !== "undefined" ? navigator.userAgent : undefined,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      deleted: false,
    };

    const result = await InsertDataReturn("system_activities", activityData);
    return result?.success || false;
  } catch (e) {
    console.error("Erreur log activité:", e);
    return false;
  }
};
