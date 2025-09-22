"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";

interface ActivityItem {
  id: string;
  source: string;
  entityId: string;
  action: "ajout" | "modification" | "suppression";
  date: string;
  title: string;
  details?: string;
  module: string;
}

interface RecentActivitiesContextType {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  refresh: () => Promise<void>;
}

const RecentActivitiesContext = createContext<RecentActivitiesContextType | undefined>(undefined);

export const RecentActivitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentYear } = useAnneeScolaire();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (lastSyncAt) params.set("since", lastSyncAt);
      if (currentYear?.id) params.set("yearId", currentYear.id);
      params.set("limit", "100");

      const res = await fetch(`/api/recent-activities?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur réseau");
      const json = await res.json();
      const list = (json.activities || []) as ActivityItem[];

      if (list.length > 0) {
        // fusionner par id, garder plus récent
        setActivities((prev) => {
          const map = new Map<string, ActivityItem>();
          [...list, ...prev].forEach((a) => {
            const existing = map.get(a.id);
            if (!existing || existing.date < a.date) map.set(a.id, a);
          });
          return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
        });
        const maxDate = list.reduce((max, a) => (a.date > max ? a.date : max), lastSyncAt || "");
        setLastSyncAt(maxDate || new Date().toISOString());
      } else if (!lastSyncAt) {
        setLastSyncAt(new Date().toISOString());
      }
    } catch (e) {
      setError("Impossible de charger les activités");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset when year changes
    setActivities([]);
    setLastSyncAt(null);
  }, [currentYear?.id]);

  useEffect(() => {
    fetchActivities();
    if (timerRef.current) clearInterval(timerRef.current as any);
    timerRef.current = setInterval(fetchActivities, 60000); // 60s
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, [currentYear?.id, lastSyncAt]);

  const value = useMemo(
    () => ({ activities, loading, error, lastSyncAt, refresh: fetchActivities }),
    [activities, loading, error, lastSyncAt]
  );

  return (
    <RecentActivitiesContext.Provider value={value}>{children}</RecentActivitiesContext.Provider>
  );
};

export const useRecentActivities = () => {
  const ctx = useContext(RecentActivitiesContext);
  if (!ctx) throw new Error("useRecentActivities must be used within RecentActivitiesProvider");
  return ctx;
};

