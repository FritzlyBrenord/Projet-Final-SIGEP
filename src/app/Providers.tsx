"use client";

import React, { useEffect, useRef, useState } from "react";

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
import Spinner from "@/utils/Spinner/Spinner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { uuid } = Uuid();
  const hasCheckedInitialURL = useRef(false);

  const [isURLChecking, setIsURLChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkURL = async () => {
      if (!uuid) {
        console.log("En attente du chargement du uuid...");
        return;
      }

      const expectedURL = `/SIGEP-Tableau-De-Bord/${uuid}`;

      if (pathname !== expectedURL) {
        console.warn(
          `URL incorrecte: ${pathname}. Redirection vers: ${expectedURL}`
        );
        await router.replace(expectedURL);
      } else if (isMounted) {
        setIsURLChecking(false);
      }
    };

    // Timeout de sécurité pour éviter le spinner infini
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("Timeout - Désactivation forcée du spinner");
        setIsURLChecking(false);
      }
    }, 5000); // 5 secondes max

    checkURL();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pathname, router, uuid]);

  // Afficher le spinner pendant les chargements
  if (isURLChecking) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${"bg-gray-900"}`}
      >
        <Spinner />
      </div>
    );
  }
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
