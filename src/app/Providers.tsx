"use client";

import React, { useEffect, useRef } from "react";

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
import { redirect, usePathname, useRouter } from "next/navigation";
import Uuid from "@/utils/UUid/Uuid";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { uuid } = Uuid();
  const hasCheckedInitialURL = useRef(false);

  useEffect(() => {
    if (uuid || uuid !== null || uuid !== "") {
      if (!pathname?.startsWith("/SIGEP-Tableau-De-Bord/")) {
        return;
      }

      const expectedURL = `/SIGEP-Tableau-De-Bord/${uuid}`;
      if (pathname !== expectedURL) {
        console.warn("URL incorrecte au chargement. Correction...");
        router.replace(expectedURL);
      }
    }
  }, [pathname, router, uuid]);
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
