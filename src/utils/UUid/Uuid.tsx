"use client";
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const Uuid = () => {
  const [uuid, setUuid] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction pour créer/supprimer le cookie UUID
  const setUuidCookie = (uuidValue: string, isSession: boolean = false) => {
    if (typeof window === "undefined") return;

    if (uuidValue) {
      if (isSession) {
        document.cookie = `client_uuid=${uuidValue}; path=/; SameSite=Strict; Secure`;
      } else {
        document.cookie = `client_uuid=${uuidValue}; path=/; max-age=${
          24 * 60 * 60
        }; SameSite=Strict; Secure`;
      }
    } else {
      document.cookie =
        "client_uuid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  // Récupérer l'UUID depuis le cookie
  const getUuidFromCookie = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "client_uuid") {
        return value;
      }
    }
    return null;
  }, []);

  // Obtenir l'UUID actuel (synchrone)
  const getCurrentUuid = useCallback((): string => {
    return uuid || localStorage.getItem("uuid") || "";
  }, [uuid]);

  // Vérifier si l'UUID est valide (synchrone)
  const isUuidValid = useCallback((): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const storedUuid = localStorage.getItem("uuid");
      const cookieUuid = getUuidFromCookie();

      // Vérifier que les deux existent et correspondent
      const isValid = !!(storedUuid && cookieUuid && storedUuid === cookieUuid);

      if (!isValid) {
        console.warn("⚠️ UUID invalide - incohérence détectée");
      }

      return isValid;
    } catch (error) {
      console.error("❌ Erreur validation UUID:", error);
      return false;
    }
  }, [getUuidFromCookie]);

  // Vérifier si l'UUID est valide
  const validateUuid = useCallback(async (): Promise<boolean> => {
    return isUuidValid();
  }, [isUuidValid]);

  // Initialize UUID
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeUuid = () => {
      try {
        const storedUuid = localStorage.getItem("uuid");
        const cookieUuid = getUuidFromCookie();

        // Scénario 1: Les deux existent et correspondent
        if (storedUuid && cookieUuid && storedUuid === cookieUuid) {
          setUuid(storedUuid);
          setIsInitialized(true);
          return;
        }

        // Scénario 2: Cookie existe mais pas localStorage
        if (cookieUuid && !storedUuid) {
          setUuid(cookieUuid);
          localStorage.setItem("uuid", cookieUuid);
          setIsInitialized(true);
          return;
        }

        // Scénario 3: localStorage existe mais pas cookie
        if (storedUuid && !cookieUuid) {
          setUuid(storedUuid);
          setUuidCookie(storedUuid, true);
          setIsInitialized(true);
          return;
        }

        // Scénario 4: Aucun des deux - générer nouveau
        const newUuid = uuidv4();
        setUuid(newUuid);
        localStorage.setItem("uuid", newUuid);
        setUuidCookie(newUuid, true);
        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Erreur initialisation UUID:", error);
        const fallbackUuid = uuidv4();
        setUuid(fallbackUuid);
        localStorage.setItem("uuid", fallbackUuid);
        setUuidCookie(fallbackUuid, true);
        setIsInitialized(true);
      }
    };

    initializeUuid();
  }, [getUuidFromCookie]);

  const rafrachieUUID = () => {
    const newUuid = uuidv4();
    setUuid(newUuid);
    localStorage.setItem("uuid", newUuid);
    setUuidCookie(newUuid, true);
  };

  return {
    uuid,
    rafrachieUUID,
    isUuidValid,
    validateUuid,
    isInitialized,
    getCurrentUuid,
  };
};

export default Uuid;
