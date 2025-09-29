"use client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const Uuid = () => {
  const [uuid, setUuid] = useState<string>("");

  // Initialize UUID on client-side only
  useEffect(() => {
    const storedUuid = localStorage.getItem("uuid");
    if (storedUuid) {
      setUuid(storedUuid);
    } else {
      const newUuid = uuidv4();
      setUuid(newUuid);
      localStorage.setItem("uuid", newUuid);
    }
  }, []);

  // Update localStorage whenever uuid changes
  useEffect(() => {
    if (uuid) {
      localStorage.setItem("uuid", uuid);
    }
  }, [uuid]);

  const rafrechieUUID = () => {
    setUuid(uuidv4());
  };

  return { uuid, rafrechieUUID };
};

export default Uuid;
