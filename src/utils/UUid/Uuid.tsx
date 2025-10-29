"use client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const Uuid = () => {
  const [uuid, setUuid] = useState<string>("");

  // Fonction pour créer/supprimer le cookie UUID
  const setUuidCookie = (uuidValue: string) => {
    if (uuidValue) {
      // Créer le cookie avec une expiration de 24h
      document.cookie = `client_uuid=${uuidValue}; path=/; max-age=${
        24 * 60 * 60
      }; SameSite=Strict`;
    } else {
      // Supprimer le cookie
      document.cookie =
        "client_uuid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  // Initialize UUID on client-side only
  useEffect(() => {
    const storedUuid = localStorage.getItem("uuid");
    if (storedUuid) {
      setUuid(storedUuid);
      setUuidCookie(storedUuid); // Mettre à jour le cookie
    } else {
      const newUuid = uuidv4();
      setUuid(newUuid);
      localStorage.setItem("uuid", newUuid);
      setUuidCookie(newUuid); // Créer le cookie
    }
  }, []);

  // Update localStorage and cookie whenever uuid changes
  useEffect(() => {
    if (uuid) {
      localStorage.setItem("uuid", uuid);
      setUuidCookie(uuid); // Mettre à jour le cookie
    }
  }, [uuid]);

  const rafrechieUUID = () => {
    const newUuid = uuidv4();
    setUuid(newUuid);
    // Le cookie sera mis à jour via le useEffect
  };

  return { uuid, rafrechieUUID };
};

export default Uuid;
