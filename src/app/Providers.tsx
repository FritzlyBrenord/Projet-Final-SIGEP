"use client";

import React, { useEffect } from "react";

import { ContextUtilisateur } from "@/Context/ContextUtilisateur";
import { ProfesseurProvider } from "@/Context/ContextProfesseur";
import { AnneeScolaireProvider } from "@/Context/ContextAnneeScolaire";
import { EmployerProvider } from "@/Context/ContextEmployer";
import { ElevesProvider } from "@/Context/ContextEleves";
import { NotesProvider } from "@/Context/ContextNotes";
import { FraisScolariteProvider } from "@/Context/ContextPaiement";
import { DecisionFinAnneeProvider } from "@/Context/ContextDecisionFinAnnee";
import { CalendrierScolaireProvider } from "@/Context/CalendrierScolaire";
import { RecentActivitiesProvider } from "@/Context/RecentActivitiesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ContextUtilisateur>
      <AnneeScolaireProvider>
        <ElevesProvider>
          <FraisScolariteProvider>
            <NotesProvider>
              <DecisionFinAnneeProvider>
                <EmployerProvider>
                  <ProfesseurProvider>
                    <CalendrierScolaireProvider>
                      <RecentActivitiesProvider>
                        {children}
                      </RecentActivitiesProvider>
                    </CalendrierScolaireProvider>
                  </ProfesseurProvider>
                </EmployerProvider>
              </DecisionFinAnneeProvider>
            </NotesProvider>
          </FraisScolariteProvider>
        </ElevesProvider>
      </AnneeScolaireProvider>
    </ContextUtilisateur>
  );
}
