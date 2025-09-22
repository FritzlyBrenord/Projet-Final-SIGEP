"use client";
import React from "react";
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
    <AnneeScolaireProvider>
      <ElevesProvider>
        <CalendrierScolaireProvider>
          <NotesProvider>
            <DecisionFinAnneeProvider>
              <FraisScolariteProvider>
                <EmployerProvider>
                  <ProfesseurProvider>
                    <RecentActivitiesProvider>
                      {children}
                    </RecentActivitiesProvider>
                  </ProfesseurProvider>
                </EmployerProvider>
              </FraisScolariteProvider>
            </DecisionFinAnneeProvider>
          </NotesProvider>
        </CalendrierScolaireProvider>
      </ElevesProvider>
    </AnneeScolaireProvider>
  );
}
