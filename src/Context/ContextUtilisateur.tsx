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
import React, { createContext, useContext, useEffect, useState } from "react";

// Interface pour l'utilisateur
interface UserProfile {
  id?: string;
  email_connexion: string;
  password_connexion: string;
  role: "Super Administrateur" | "Administrateur" | "Utilisateur";
  employer_id: string;
  isbloquer?: boolean;
  derniere_connexion?: string;
  created_at?: string;
  updated_at?: string;
  autorisations?: string[];
  // Données de l'employé associé
  employer?: Employer;
}

// Interface pour la session
interface SessionData {
  user: any | null;
  role: "Super Administrateur" | "Administrateur" | "Utilisateur";
  employer: Employer | null;
  isAuthenticated: boolean;
  canAccess: boolean;
}
import {
  isUserAlreadyConnected,
  getUserSession,
  createSession,
  forceNewSession,
  getDeviceInfo,
  deleteCurrentSession,
} from "@/components/SessionManager";

interface ListeContextUtilisateurType {
  // Gestion des utilisateurs
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

  // Gestion des autorisations
  GetUtilisateurAutorisations: (id: string) => Promise<string[] | null>;
  UpdateUtilisateurAutorisations: (
    id: string,
    autorisations: string[]
  ) => Promise<boolean>;

  //profil
  SaveProfilPhoto: (userId: string, photoBase64: string) => void;
  GetProfilPhoto: (userId: string) => string | null;
  RemoveProfilPhoto: (userId: string) => void;

  // Authentification
  Login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  Logout: () => Promise<boolean>;

  // Session
  currentSession: SessionData;
  GetUserByEmail: (email: string) => Promise<UserProfile | null>;

  // États
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
    role: "Utilisateur",
    isAuthenticated: false,
    canAccess: false,
  });

  // Fonction utilitaire pour vérifier la validité de l'utilisateur authentifié
  const isValidAuthUser = (authUser: any): boolean => {
    return authUser && authUser.user && typeof authUser.user.email === "string";
  };

  // Fonction pour récupérer les utilisateurs avec leurs données d'employés
  const fetchUtilisateurs = async () => {
    setLoading(true);
    setError(null);

    try {
      const utilisateurs = await SelectData("Utilisateur");
      const employers = await SelectData("employes");

      if (utilisateurs && employers) {
        // Associer les données d'employés aux utilisateurs
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

  // Fonction pour ajouter un utilisateur
  const AddUtilisateur = async (
    nouvelUtilisateur: Omit<UserProfile, "id">
  ): Promise<boolean> => {
    let authUserId: string | null = null;

    try {
      setLoading(true);
      setError(null);

      console.log("1️⃣ Données reçues:", nouvelUtilisateur);

      // ===== ÉTAPE 1: Vérifier si l'email existe déjà =====
      const emailExists = await DataExsite(
        "Utilisateur",
        "email_connexion",
        nouvelUtilisateur.email_connexion
      );

      console.log("2️⃣ Email existe dans table Utilisateur?", emailExists);

      if (emailExists === true) {
        setError("Un utilisateur avec cet email existe déjà");
        return false;
      }

      // ===== ÉTAPE 2: Créer l'utilisateur dans l'authentification =====
      console.log("3️⃣ Création auth...");
      authUserId = await CreerUtilisateur(
        nouvelUtilisateur.email_connexion,
        nouvelUtilisateur.password_connexion
      );

      console.log("4️⃣ Auth User ID reçu:", authUserId);

      if (!authUserId) {
        setError("Erreur lors de la création de l'authentification");
        return false;
      }

      // ===== ÉTAPE 3: VÉRIFIER que l'utilisateur auth existe vraiment =====
      console.log("5️⃣ Vérification de l'utilisateur auth...");
      const authUserVerified = await VerifierUtilisateurAuth(authUserId);

      if (!authUserVerified) {
        console.error("❌ L'utilisateur auth n'a pas été créé correctement");
        setError("Échec de la vérification de l'utilisateur dans auth.users");
        return false;
      }

      console.log("✅ Utilisateur auth vérifié:", authUserVerified);

      // ===== ÉTAPE 4: Insérer dans la table Utilisateur =====
      const dataToInsert: any = {
        id: authUserId, // 👈 Utiliser l'UUID de auth.users
        email_connexion: nouvelUtilisateur.email_connexion,
        role: nouvelUtilisateur.role,
        employer_id: nouvelUtilisateur.employer_id,
        isbloquer: false,
        created_at: new Date().toISOString(),
      };

      console.log("6️⃣ Données à insérer dans table:", dataToInsert);

      const result = await InsertDataReturn("Utilisateur", dataToInsert);

      console.log("7️⃣ Résultat insertion:", result);

      if (result?.success === true && result.rows) {
        console.log("✅ Utilisateur créé avec succès dans les deux tables!");
        await fetchUtilisateurs();
        return true;
      } else {
        console.error("❌ Échec insertion dans table Utilisateur:", result);
        setError(
          `Erreur d'insertion: ${JSON.stringify(result?.error || "Inconnu")}`
        );

        // ===== ROLLBACK: Supprimer l'utilisateur auth =====
        console.log("🔄 Rollback: suppression de l'utilisateur auth...");
        await DeleteUserAdmin(authUserId);
        console.log("🔄 Utilisateur auth supprimé");

        return false;
      }
    } catch (error: any) {
      console.error("❌ Exception:", error);
      setError(error.message || "Erreur lors de l'ajout de l'utilisateur");

      // ===== ROLLBACK en cas d'exception =====
      if (authUserId) {
        console.log(
          "🔄 Rollback: suppression de l'utilisateur auth suite à exception..."
        );
        try {
          await DeleteUserAdmin(authUserId);
          console.log("🔄 Utilisateur auth supprimé");
        } catch (rollbackError) {
          console.error("❌ Erreur lors du rollback:", rollbackError);
        }
      }

      return false;
    } finally {
      setLoading(false);
    }
  };
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

      // Modifier l'email dans auth
      if (
        updatedUtilisateur.email_connexion &&
        updatedUtilisateur.email_connexion !== currentUser.email_connexion
      ) {
        const emailUpdateResult = await UpdateEmailAdmin(
          updatedUtilisateur.email_connexion,
          id
        );
        if (!emailUpdateResult?.succes) {
          setError("Erreur lors de la modification de l'email");
          return false;
        }
      }

      // Modifier le password dans auth UNIQUEMENT
      if (updatedUtilisateur.password_connexion) {
        const passwordUpdateResult = await UpdatePasswordAdmin(
          updatedUtilisateur.password_connexion,
          id
        );
        if (!passwordUpdateResult?.succes) {
          setError(
            passwordUpdateResult?.error ||
              "Erreur lors de la modification du mot de passe"
          );
          return false;
        }
      }

      // Préparer les données pour la table (SANS le password)
      const dataToUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (updatedUtilisateur.email_connexion !== undefined) {
        dataToUpdate.email_connexion = updatedUtilisateur.email_connexion;
      }

      // ❌ NE PAS stocker password_connexion en clair !
      // Le password est géré par Supabase Auth uniquement

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
      if (updatedUtilisateur.autorisations !== undefined) {
        dataToUpdate.autorisation = updatedUtilisateur.autorisations;
      }

      const success = await UpdateData("Utilisateur", id, dataToUpdate);

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      } else {
        setError("Erreur lors de la mise à jour");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Erreur lors de la mise à jour");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les autorisations d'un utilisateur
  const GetUtilisateurAutorisations = async (
    id: string
  ): Promise<string[] | null> => {
    try {
      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find((u: any) => u.id === id);

      if (user) {
        return user.autorisation || [];
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération des autorisations:", error);
      return null;
    }
  };

  // Fonction pour mettre à jour les autorisations d'un utilisateur
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
        setError("Erreur lors de la mise à jour des autorisations");
        return false;
      }
    } catch (error: any) {
      setError(
        error.message || "Erreur lors de la mise à jour des autorisations"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const BloquerUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Bannir dans l'authentification
      const authBanResult = await BanUserAdmin(id);
      if (!authBanResult?.succes) {
        setError("Erreur lors du blocage dans l'authentification");
        return false;
      }

      // Mettre à jour dans la table
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
      setError(error.message || "Erreur lors du blocage");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const DebloquerUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Débannir dans l'authentification
      const authUnbanResult = await UnbanUserAdmin(id);
      if (!authUnbanResult?.succes) {
        setError("Erreur lors du déblocage dans l'authentification");
        return false;
      }

      // Mettre à jour dans la table
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
      setError(error.message || "Erreur lors du déblocage");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Bloquer un utilisateur par email
  const BloquerUtilisateurParEmail = async (
    email: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔒 Tentative de blocage pour email:", email);

      // 1. Trouver l'utilisateur par email
      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find(
        (u: any) => u.email_connexion?.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        console.error("❌ Utilisateur introuvable:", email);
        setError("Utilisateur introuvable avec cet email");
        return false;
      }

      console.log("✅ Utilisateur trouvé:", user.id);

      // 2. Bannir dans l'authentification
      const authBanResult = await BanUserAdmin(user.id);
      if (!authBanResult?.succes) {
        console.error("❌ Erreur lors du blocage auth");
        setError("Erreur lors du blocage dans l'authentification");
        return false;
      }

      console.log("✅ Utilisateur banni dans auth");

      // 3. Mettre à jour dans la table
      const success = await UpdateData("Utilisateur", user.id, {
        isbloquer: true,
        updated_at: new Date().toISOString(),
      });

      if (success === true) {
        console.log("✅ Utilisateur bloqué dans la table");
        await fetchUtilisateurs();
        return true;
      }

      console.error("❌ Échec mise à jour table");
      return false;
    } catch (error: any) {
      console.error("❌ Erreur lors du blocage par email:", error);
      setError(error.message || "Erreur lors du blocage");
      return false;
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour supprimer un utilisateur
  const DeleteUtilisateur = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // 1. Supprimer de l'authentification Supabase
      const authDeleteResult = await DeleteUserAdmin(id);
      if (!authDeleteResult?.succes) {
        setError("Erreur lors de la suppression de l'authentification");
        return false;
      }

      // 2. Supprimer de la table Utilisateur
      const success = await DeleteData("Utilisateur", id);

      if (success === true) {
        await fetchUtilisateurs();
        return true;
      } else {
        setError("Erreur lors de la suppression de l'utilisateur");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Erreur lors de la suppression");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer un utilisateur par email
  const GetUserByEmail = async (email: any): Promise<UserProfile | null> => {
    try {
      const utilisateurs = await SelectData("Utilisateur");
      const user = utilisateurs?.find((u: any) => u.email_connexion === email);

      if (user) {
        // Récupérer les données de l'employé
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
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
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

      // ===== ÉTAPE 1: Vérifier si l'utilisateur est déjà connecté =====
      const alreadyConnected = await isUserAlreadyConnected(email);

      if (alreadyConnected) {
        const existingSession = await getUserSession(email);

        // Afficher une confirmation
        const forceLogin = window.confirm(
          `⚠️ Attention !\n\n` +
            `Ce compte est déjà connecté depuis :\n` +
            `- Appareil : ${existingSession?.device_info || "Inconnu"}\n` +
            `- Depuis : ${
              existingSession?.login_time
                ? new Date(existingSession.login_time).toLocaleString()
                : "Inconnu"
            }\n\n` +
            `Voulez-vous forcer la déconnexion de l'autre session et vous connecter ici ?`
        );

        if (!forceLogin) {
          return {
            success: false,
            message: "Connexion annulée. Une session est déjà active.",
          };
        }

        // L'utilisateur veut forcer la connexion
        console.log("🔄 Forçage de la nouvelle session...");
      }

      // ===== ÉTAPE 2: Tentative de connexion Supabase Auth =====
      const loginResult = await SignIn(email, password);

      if (!loginResult.success) {
        const error = loginResult.error;

        // Gérer les erreurs (votre code existant)
        if (error?.message?.includes("Email not confirmed")) {
          return {
            success: false,
            message: "Veuillez confirmer votre email avant de vous connecter",
          };
        }

        if (
          error?.message?.includes("user is banned") ||
          error?.message?.toLowerCase().includes("banned")
        ) {
          return {
            success: false,
            message: "Votre compte est bloqué. Contactez l'administrateur.",
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
          message: error?.message || "Erreur lors de la connexion",
        };
      }

      // ===== ÉTAPE 3: Récupérer les données utilisateur =====
      const user = await GetUserByEmail(email);
      if (!user) {
        await SignOut();
        return {
          success: false,
          message: "Utilisateur non trouvé dans le système",
        };
      }

      if (user.isbloquer) {
        await SignOut();
        return {
          success: false,
          message: "Votre compte est bloqué. Contactez l'administrateur.",
        };
      }

      if (!user.employer) {
        await SignOut();
        return {
          success: false,
          message: "Employé associé non trouvé ou supprimé",
        };
      }

      // ===== ÉTAPE 4: Créer/Forcer la session =====
      let sessionToken: string | null;

      if (alreadyConnected) {
        // Forcer une nouvelle session (supprimer l'ancienne)
        sessionToken = await forceNewSession(email);
      } else {
        // Créer une nouvelle session
        sessionToken = await createSession(email);
      }

      if (!sessionToken) {
        await SignOut();
        return {
          success: false,
          message: "Erreur lors de la création de la session",
        };
      }

      console.log("✅ Session créée avec token:", sessionToken);

      // ===== ÉTAPE 5: Mettre à jour la dernière connexion =====
      await UpdateData("Utilisateur", user.id!, {
        derniere_connexion: new Date().toISOString(),
      });

      // ===== ÉTAPE 6: Mettre à jour la session du context =====
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
          message: "Erreur lors de la récupération des données utilisateur",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Erreur lors de la connexion",
      };
    } finally {
      setLoading(false);
    }
  };

  const Logout = async (): Promise<boolean> => {
    try {
      // Supprimer la session de la table
      await deleteCurrentSession();

      // Déconnexion Supabase
      const success = await SignOut();

      if (success === true) {
        setCurrentSession({
          user: null,
          employer: null,
          role: "Utilisateur",
          isAuthenticated: false,
          canAccess: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return false;
    }
  };
  // Fonction pour rafraîchir la liste
  const RefreshUtilisateurs = async () => {
    await fetchUtilisateurs();
  };

  // Vérifier la session au chargement
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
        console.error("Erreur lors de la vérification de session:", error);
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
