"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseLogin } from "@/Config/SupabaseClient";
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
import { deleteExpiredSessions } from "@/components/deleteExpiredSessions";

export default function Providers({ children }: { children: React.ReactNode }) {
  // const router = useRouter();

  // // Déconnexion automatique à la fermeture du navigateur
  // useEffect(() => {
  //   const handleUnload = async () => {
  //     try {
  //       const sessionToken = localStorage.getItem("session_token");
  //       if (sessionToken) {
  //         // Appeler l’API pour supprimer la session côté serveur
  //         await fetch("/api/sessions/deleteSession", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ session_token: sessionToken }),
  //         });
  //         localStorage.removeItem("session_token");
  //         await supabaseLogin.auth.signOut();
  //       }
  //     } catch (err) {
  //       console.error("Erreur lors de la suppression session au unload:", err);
  //     }
  //   };

  //   window.addEventListener("beforeunload", handleUnload);
  //   return () => window.removeEventListener("beforeunload", handleUnload);
  // }, []);

  // // Vérification de la session à chaque chargement ou changement de route
  // useEffect(() => {
  //   const checkSession = async () => {
  //     try {
  //       const {
  //         data: { user },
  //       } = await supabaseLogin.auth.getUser();

  //       const sessionToken = localStorage.getItem("session_token");

  //       // Pas de session → redirection vers login
  //       if (!user || !sessionToken) {
  //         await supabaseLogin.auth.signOut();
  //         localStorage.removeItem("session_token");
  //         router.replace("/");
  //         return;
  //       }

  //       // Supprimer les sessions expirées via API
  //       await deleteExpiredSessions(user.email ?? "");

  //       // Vérifier si la session en localStorage existe encore dans la DB
  //       const res = await fetch("/api/sessions/getSession", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ session_token: sessionToken }),
  //       });
  //       const data = await res.json();

  //       if (!data.exists) {
  //         // Session non valide → logout
  //         localStorage.removeItem("session_token");
  //         await supabaseLogin.auth.signOut();
  //         router.replace("/");
  //         return;
  //       }

  //       // Mettre à jour last_activity via API
  //       await fetch("/api/sessions/updateActivity", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ session_token: sessionToken }),
  //       });
  //     } catch (err) {
  //       console.error("Erreur vérification session:", err);
  //       localStorage.removeItem("session_token");
  //       await supabaseLogin.auth.signOut();
  //       router.replace("/");
  //     }
  //   };

  //   checkSession();
  // }, [router]);
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
