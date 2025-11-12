"use client";

import {
  SelectData,
  InsertDataReturn,
  UpdateData,
  DeleteData,
  DataExsite,
  CreerUtilisateur,
  SignIn,
  SignOut,
  getUser,
  UnbanUserAdmin,
  BanUserAdmin,
  DeleteUserAdmin,
  UpdatePasswordAdmin,
  UpdateEmailAdmin,
  VerifierUtilisateurAuth,
} from "@/Config/SupabaseData";
import { Employer } from "@/types/EmployerType";
import Uuid from "@/utils/UUid/Uuid";
import React, { createContext, useContext, useEffect, useState } from "react";

// Interface pour l'utilisateur
interface UserProfile {
  id?: string;
  email_connexion: string;
  password_connexion: string;
  role: "Administrateur" | "Registraire" | "Pedagogie" | "Econome" | "RRH";
  employer_id: string;
  isbloquer?: boolean;
  derniere_connexion?: string;
  created_at?: string;
  updated_at?: string;
  autorisations?: string[];
  employer?: Employer;
}

// Interface pour la session
interface SessionData {
  user: any | null;
  role: "Administrateur" | "Registraire" | "Pedagogie" | "Econome" | "RRH";
  employer: Employer | null;
  isAuthenticated: boolean;
  canAccess: boolean;
}

interface ListeContextUtilisateurType {
  listeUtilisateurs: UserProfile[];
  AddUtilisateur: (utilisateur: Omit<UserProfile, "id">) => Promise<boolean>;
  UpdateUtilisateur: (
    id: string,
    updatedUtilisateur: Partial<UserProfile>
  ) => Promise<boolean>;
  BloquerUtilisateur: (id: string) => Promise<boolean>;
  BloquerUtilisateurParEmail: (email: string) => Promise<boolean>;
  DebloquerUtilisateur: (id: string) => Promise<boolean>;
  DeleteUtilisateur: (id: string) => Promise<boolean>;
  RefreshUtilisateurs: () => Promise<void>;
  GetUtilisateurAutorisations: (id: string) => Promise<string[] | null>;
  UpdateUtilisateurAutorisations: (
    id: string,
    autorisations: string[]
  ) => Promise<boolean>;
  SaveProfilPhoto: (userId: string, photoBase64: string) => void;
  GetProfilPhoto: (userId: string) => string | null;
  RemoveProfilPhoto: (userId: string) => void;
  Login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  Logout: () => Promise<boolean>;
  currentSession: SessionData;
  GetUserByEmail: (email: string) => Promise<UserProfile | null>;
  loading: boolean;
  error: string | null;
}

const ListeContextUtilisateur = createContext<
  ListeContextUtilisateurType | undefined
>(undefined);

export const ContextUtilisateur: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [listeUtilisateurs, setListeUtilisateurs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionData>({
    user: null,
    employer: null,
    role: "Registraire",
    isAuthenticated: false,
    canAccess: false,
  });
  const { rafrachieUUID } = Uuid();

  const isValidAuthUser = (authUser: any): boolean => {
    return authUser && authUser.user && typeof authUser.user.email === "string";
  };

  const fetchUtilisateurs = async () => {
    setLoading(true);
    setError(null);

    try {
      const utilisateurs = await SelectData("Utilisateur");
      const employers = await SelectData("employes");

      if (utilisateurs && employers) {
        const utilisateursAvecEmployers = utilisateurs.map((user: any) => ({
          ...user,
          autorisations: user.autorisation || [],
          employer: employers.find(
            (emp: Employer) => emp.id === user.employer_id && !emp.deleted
          ),
        }));

        setListeUtilisateurs(utilisateursAvecEmployers);
      }
    } catch (error: any) {
      setError(
        error.message || "Erreur lors de la récupération des utilisateurs"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Ajouter un utilisateur avec autorisations automatiques
  const AddUtilisateur = async (
    nouvelUtilisateur: Omit<UserProfile, "id">
  ): Promise<boolean> => {
    let authUserId: string | null = null;

    try {
      setLoading(true);
      setError(null);

      console.log("1️⃣ Données reçues:", nouvelUtilisateur);

      const emailExists = await DataExsite(
        "Utilisateur",
        "email_connexion",
        nouvelUtilisateur.email_connexion
      );

      console.log("2️⃣ Email existe?", emailExists);

      if (emailExists === true) {
        setError("Un utilisateur avec cet email existe déjà");
        return false;
      }

      console.log("3️⃣ Création auth...");
      authUserId = await CreerUtilisateur(
        nouvelUtilisateur.email_connexion,
        nouvelUtilisateur.password_connexion
      );

      console.log("4️⃣ Auth User ID:", authUserId);

      if (!authUserId) {
        setError("Erreur lors de la création de l'authentification");
        return false;
      }

      console.log("5️⃣ Vérification auth...");
      const authUserVerified = await VerifierUtilisateurAuth(authUserId);

      if (!authUserVerified) {
        console.error("❌ Auth non vérifiée");
        setError("Échec de la vérification de l'utilisateur");
        return false;
      }

      console.log("✅ Utilisateur auth vérifié");

      // 🎯 Insérer avec autorisations automatiques
      const dataToInsert: any = {
        id: authUserId,
        email_connexion: nouvelUtilisateur.email_connexion,
        role: nouvelUtilisateur.role,
        employer_id: nouvelUtilisateur.employer_id,
        isbloquer: false,
        autorisation: nouvelUtilisateur.autorisations || [], // 🎯 Autorisations
        created_at: new Date().toISOString(),
      };

      console.log("6️⃣ Insertion:", dataToInsert);

      const result = await InsertDataReturn("Utilisateur", dataToInsert);

      console.log("7️⃣ Résultat:", result);

      if (result?.success === true && result.rows) {
        console.log("✅ Utilisateur créé avec autorisations!");
        await fetchUtilisateurs();
        return true;
      } else {
        console.error("❌ Échec insertion:", result);
        setError(`Erreur d'insertion: ${JSON.stringify(result?.error)}`);

        console.log("🔄 Rollback auth...");
        await DeleteUserAdmin(authUserId);
        return false;
      }
    } catch (error: any) {
      console.error("❌ Exception:", error);
      setError(error.message || "Erreur lors de l'ajout");

      if (authUserId) {
        try {
          await DeleteUserAdmin(authUserId);
          console.log("🔄 Rollback effectué");
        } catch (rollbackError) {
          console.error("❌ Erreur rollback:", rollbackError);
        }
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Mettre à jour avec autorisations automatiques
  const UpdateUtilisateur = async (
    id: string,
    updatedUtilisateur: Partial<UserProfile>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const utilisateurs = await SelectData("Utilisateur");
      const currentUser = utilisateurs?.find((u: any) => u.id === id);

      if (!currentUser) {
        setError("Utilisateur non trouvé");
        return false;
      }

      if (
        updatedUtilisateur.email_connexion &&
        updatedUtilisateur.email_connexion !== currentUser.email_connexion
      ) {
        const emailUpdateResult = await UpdateEmailAdmin(
          updatedUtilisateur.email_connexion,
          id
        );
        if (!emailUpdateResult?.succes) {
          setError("Erreur modification email");
          return false;
        }
      }

      if (updatedUtilisateur.password_connexion) {
        const passwordUpdateResult = await UpdatePasswordAdmin(
          updatedUtilisateur.password_connexion,
          id
        );
        if (!passwordUpdateResult?.succes) {
          setError(
            passwordUpdateResult?.error || "Erreur modification mot de passe"
          );
          return false;
        }
      }

      const dataToUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (updatedUtilisateur.email_connexion !== undefined) {
        dataToUpdate.email_connexion = updatedUtilisateur.email_connexion;
      }

      if (updatedUtilisateur.role !== undefined) {
        dataToUpdate.role = updatedUtilisateur.role;
      }

      if (updatedUtilisateur.employer_id !== undefined) {
        dataToUpdate.employer_id = updatedUtilisateur.employer_id;
      }

      if (updatedUtilisateur.isbloquer !== undefined) {
        dataToUpdate.isbloquer = updatedUtilisateur.isbloquer;
      }

      if (updatedUtilisateur.derniere_connexion !== undefined) {
        dataToUpdate.derniere_connexion = updatedUtilisateur.derniere_connexion;
      }

      // 🎯 Autorisations automatiques
      if (updatedUtilisateur.autorisations !== undefined) {
        dataToUpdate.autorisation = updatedUtilisateur.autorisations;
      }

      const success = await UpdateData("Utilisateur", id, dataToUpdate);

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      } else {
        setError("Erreur mise à jour");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Erreur mise à jour");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const GetUtilisateurAutorisations = async (
    id: string
  ): Promise<string[] | null> => {
    try {
      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find((u: any) => u.id === id);
      return user ? user.autorisation || [] : null;
    } catch (error) {
      console.error("Erreur autorisations:", error);
      return null;
    }
  };

  const UpdateUtilisateurAutorisations = async (
    id: string,
    autorisations: string[]
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const success = await UpdateData("Utilisateur", id, {
        autorisation: autorisations,
        updated_at: new Date().toISOString(),
      });

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      } else {
        setError("Erreur mise à jour autorisations");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Erreur autorisations");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const BloquerUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const authBanResult = await BanUserAdmin(id);
      if (!authBanResult?.succes) {
        setError("Erreur blocage auth");
        return false;
      }

      const success = await UpdateData("Utilisateur", id, {
        isbloquer: true,
        updated_at: new Date().toISOString(),
      });

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message || "Erreur blocage");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const DebloquerUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const authUnbanResult = await UnbanUserAdmin(id);
      if (!authUnbanResult?.succes) {
        setError("Erreur déblocage auth");
        return false;
      }

      const success = await UpdateData("Utilisateur", id, {
        isbloquer: false,
        updated_at: new Date().toISOString(),
      });

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message || "Erreur déblocage");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const BloquerUtilisateurParEmail = async (
    email: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔒 Blocage pour email:", email);

      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find(
        (u: any) => u.email_connexion?.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        console.error("❌ Utilisateur introuvable:", email);
        setError("Utilisateur introuvable");
        return false;
      }

      console.log("✅ Utilisateur trouvé:", user.id);

      const authBanResult = await BanUserAdmin(user.id);
      if (!authBanResult?.succes) {
        console.error("❌ Erreur blocage auth");
        setError("Erreur blocage auth");
        return false;
      }

      console.log("✅ Banni dans auth");

      const success = await UpdateData("Utilisateur", user.id, {
        isbloquer: true,
        updated_at: new Date().toISOString(),
      });

      if (success === true) {
        console.log("✅ Bloqué dans table");
        await fetchUtilisateurs();
        return true;
      }

      console.error("❌ Échec table");
      return false;
    } catch (error: any) {
      console.error("❌ Erreur blocage email:", error);
      setError(error.message || "Erreur blocage");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const DeleteUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const authDeleteResult = await DeleteUserAdmin(id);
      if (!authDeleteResult?.succes) {
        setError("Erreur suppression auth");
        return false;
      }

      const success = await DeleteData("Utilisateur", id);

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      } else {
        setError("Erreur suppression");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Erreur suppression");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const GetUserByEmail = async (email: any): Promise<UserProfile | null> => {
    try {
      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find((u: any) => u.email_connexion === email);

      if (user) {
        const employers = await SelectData("employes");
        const employer = employers?.find(
          (e: Employer) => e.id === user.employer_id && !e.deleted
        );

        return {
          ...user,
          autorisations: user.autorisation || [],
          employer,
        };
      }

      return null;
    } catch (error) {
      console.error("Erreur GetUserByEmail:", error);
      return null;
    }
  };

  const SaveProfilPhoto = (userId: string, photoBase64: string): void => {
    localStorage.setItem(`profil_photo_${userId}`, photoBase64);
  };

  const GetProfilPhoto = (userId: string): string | null => {
    return localStorage.getItem(`profil_photo_${userId}`);
  };

  const RemoveProfilPhoto = (userId: string): void => {
    localStorage.removeItem(`profil_photo_${userId}`);
  };

  const Login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    try {
      setLoading(true);

      const loginResult = await SignIn(email, password);

      if (!loginResult.success) {
        const error = loginResult.error;

        if (error?.message?.includes("Email not confirmed")) {
          return {
            success: false,
            message: "Veuillez confirmer votre email",
          };
        }

        if (
          error?.message?.includes("user is banned") ||
          error?.message?.toLowerCase().includes("banned")
        ) {
          return {
            success: false,
            message: "Compte bloqué. Contactez l'administrateur.",
          };
        }

        if (error?.message?.includes("Invalid login credentials")) {
          return {
            success: false,
            message: "Email ou mot de passe incorrect",
          };
        }

        return {
          success: false,
          message: error?.message || "Erreur connexion",
        };
      }

      const user = await GetUserByEmail(email);
      if (!user) {
        await SignOut();
        return {
          success: false,
          message: "Utilisateur non trouvé",
        };
      }

      if (user.isbloquer) {
        await SignOut();
        return {
          success: false,
          message: "Compte bloqué. Contactez l'administrateur.",
        };
      }

      if (!user.employer) {
        await SignOut();
        return {
          success: false,
          message: "Employé associé non trouvé",
        };
      }

      await UpdateData("Utilisateur", user.id!, {
        derniere_connexion: new Date().toISOString(),
      });

      const authUser = await getUser();
      if (isValidAuthUser(authUser)) {
        setCurrentSession({
          user: authUser.user,
          employer: user.employer,
          role: user.role,
          isAuthenticated: true,
          canAccess: true,
        });

        return { success: true, message: "Connexion réussie", user };
      } else {
        return {
          success: false,
          message: "Erreur récupération données",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Erreur connexion",
      };
    } finally {
      setLoading(false);
    }
  };

  const Logout = async (): Promise<boolean> => {
    try {
      let sessionEmail = null;
      let sessionUserId = null;

      const cookies = document.cookie.split(";");

      const superAdminCookie = cookies.find((c) =>
        c.trim().startsWith("superadmin_session=")
      );
      const userCookie = cookies.find((c) =>
        c.trim().startsWith("user_session=")
      );

      if (superAdminCookie) {
        try {
          const value = superAdminCookie.split("=")[1];
          const data = JSON.parse(decodeURIComponent(value));
          sessionEmail = data.email;
          sessionUserId = data.id;
        } catch (e) {
          console.error("Erreur parsing superadmin cookie:", e);
        }
      } else if (userCookie) {
        try {
          const value = userCookie.split("=")[1];
          const data = JSON.parse(decodeURIComponent(value));
          sessionEmail = data.email;
          sessionUserId = data.id;
        } catch (e) {
          console.error("Erreur parsing user cookie:", e);
        }
      }

      if (sessionEmail) {
        try {
          const response = await fetch("/api/presence/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: sessionEmail,
              user_id: sessionUserId,
            }),
          });

          if (response.ok) {
            console.log("⚫ Marqué OFFLINE");
          }
        } catch (presenceError) {
          console.error("⚠️ Erreur presence:", presenceError);
        }
      }

      // ✅ SUPPRIMER COMPLÈTEMENT L'UUID
      localStorage.removeItem("uuid");
      document.cookie =
        "client_uuid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";

      // Supprimer les autres sessions
      document.cookie =
        "superadmin_session=; path=/; max-age=0; secure; samesite=strict";
      document.cookie =
        "user_session=; path=/; max-age=0; secure; samesite=strict";
      localStorage.removeItem("superadmin_session");

      const success = await SignOut();

      if (success === true) {
        setCurrentSession({
          user: null,
          employer: null,
          role: "Registraire",
          isAuthenticated: false,
          canAccess: false,
        });

        console.log("✅ Déconnexion complète - UUID supprimé");
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Erreur déconnexion:", error);

      // ✅ FORCER LA SUPPRESSION DE L'UUID MÊME EN CAS D'ERREUR
      localStorage.removeItem("uuid");
      document.cookie =
        "client_uuid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";

      document.cookie =
        "superadmin_session=; path=/; max-age=0; secure; samesite=strict";
      document.cookie =
        "user_session=; path=/; max-age=0; secure; samesite=strict";
      localStorage.removeItem("superadmin_session");

      return false;
    }
  };

  const RefreshUtilisateurs = async () => {
    await fetchUtilisateurs();
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const authUser = await getUser();
        if (isValidAuthUser(authUser)) {
          const user = await GetUserByEmail(authUser.user?.email);
          if (user && !user.isbloquer && user.employer) {
            setCurrentSession({
              user: authUser.user,
              employer: user.employer,
              role: user.role,
              isAuthenticated: true,
              canAccess: true,
            });
          }
        }
      } catch (error) {
        console.error("Erreur vérification session:", error);
      }
    };

    checkSession();
    fetchUtilisateurs();
  }, []);

  return (
    <ListeContextUtilisateur.Provider
      value={{
        listeUtilisateurs,
        AddUtilisateur,
        UpdateUtilisateur,
        BloquerUtilisateur,
        BloquerUtilisateurParEmail,
        DebloquerUtilisateur,
        DeleteUtilisateur,
        RefreshUtilisateurs,
        GetUtilisateurAutorisations,
        UpdateUtilisateurAutorisations,
        SaveProfilPhoto,
        GetProfilPhoto,
        RemoveProfilPhoto,
        Login,
        Logout,
        currentSession,
        GetUserByEmail,
        loading,
        error,
      }}
    >
      {children}
    </ListeContextUtilisateur.Provider>
  );
};

export const useContextUtilisateur = (): ListeContextUtilisateurType => {
  const context = useContext(ListeContextUtilisateur);
  if (!context) {
    throw new Error(
      "useContextUtilisateur doit être utilisé dans un ContextUtilisateur"
    );
  }
  return context;
};
