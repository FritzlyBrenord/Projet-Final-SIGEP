"use client";
import React from "react";
import { ProfesseurProvider } from "@/Context/ContextProfesseur";
import { AnneeScolaireProvider } from "@/Context/ContextAnneeScolaire";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnneeScolaireProvider>
      <ProfesseurProvider>{children}</ProfesseurProvider>
    </AnneeScolaireProvider>
  );
}


