import { supabase } from "@/Config/supabase";
import { NextResponse } from "next/server";

export const DataExsite = async (table: string, column: string, value: any) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(column, value)
      .single();
    if (error && error.code === "PGRST116") {
      console.log("nexiste pas");
      return false;
    } else {
      console.log("existe");
      return true;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};

export const DataObjectExiste = async (
  table: string,
  conditions: Record<string, any>
) => {
  try {
    // Construire la requête de base
    let query = supabase.from(table).select("*");

    // Ajouter chaque condition à la requête
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error && error.code === "PGRST116") {
      console.log("n'existe pas");
      return false;
    } else {
      console.log("existe");
      return true;
    }
  } catch (err) {
    console.error("Erreur lors de la vérification: ", err);
    return false;
  }
};

export const DataExsiteUneSeuleLigne = async (
  table: string,
  column: string,
  value: string,
  idValue: string,
  idcolone: string
) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(idcolone, idValue)
      .eq(column, value)
      .single();
    if (error && error.code === "PGRST116") {
      console.log("nexiste pas");
      return false;
    } else {
      console.log("existe");
      return true;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};
export const DataExisteObjet = async (
  table: string,
  column: string,
  value: any
) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .contains(column, value) // Vérifie si l'objet existe dans la colonne JSONB
      .maybeSingle(); // Peut retourner null au lieu d'une erreur

    if (error) {
      console.error("Erreur lors de la vérification :", error);
      return false; // En cas d'erreur, on suppose que la donnée n'existe pas
    }

    return data ? false : true; // false si l'objet existe, true sinon
  } catch (err) {
    console.error("Erreur lors de la requête :", err);
    return false; // Retourne false en cas d'erreur
  }
};

export const InsertData = async (table: string, data: object) => {
  try {
    const { error } = await supabase.from(table).insert(data);

    if (!error) {
      console.log("insertion réussie");
      return true;
    } else {
      return error;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};

// Insert and return inserted row(s) to immediately get generated IDs
export const InsertDataReturn = async (
  table: string,
  data: object
): Promise<{ success: boolean; rows?: any[]; error?: any }> => {
  try {
    const { data: rows, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (!error) {
      return { success: true, rows };
    }
    return { success: false, error };
  } catch (err) {
    console.error("Erreur lors de l'insertion avec retour: ", err);
    return { success: false, error: err };
  }
};

export const SelectData = async (table: string) => {
  try {
    const { error, data } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      console.log("Données récupérées");
      return data;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};

export const DeleteData = async (table: string, id: string | number) => {
  try {
    const { data, error } = await supabase.from(table).delete().eq("id", id);

    if (!error) {
      console.log("Element suprimer");
      return true;
    } else {
      console.log("Erreur lors de la supression");
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};
export const DeleteDataMultiple = async (table: string, ids: any[]) => {
  try {
    const { data, error } = await supabase.from(table).delete().in("id", ids);

    if (!error) {
      console.log("Element suprimer");
      return true;
    } else {
      console.log("Erreur lors de la supression");
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};
export const UploadImagePublic = async (
  fileNames: any,
  files: any,
  bucket: string
) => {
  let uploadsPromises: any;
  function isAnyArray(value: any): value is any[] {
    return Array.isArray(value);
  }
  if (isAnyArray(files) && isAnyArray(fileNames)) {
    uploadsPromises = await files.map(async (file: any, index: any) => {
      await supabase.storage.from(bucket).upload(fileNames[index], file);
      return uploadsPromises;
    });
  } else {
    uploadsPromises = await supabase.storage
      .from(bucket)
      .upload(fileNames, files);
    return uploadsPromises;
  }

  if (uploadsPromises) {
    return true;
  } else {
    return false;
  }
};

export const getPublicImageUrl = async (imageName: string, bucket: string) => {
  const { data } = await supabase.storage.from(bucket).getPublicUrl(imageName);

  return data.publicUrl;
};

export const UpdateUneSeuleElement = async (
  table: string,
  id: string,
  collone: any,
  newValeur: any
) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .update({ [collone]: newValeur })
      .eq("id", id);

    if (!error) {
      console.log("modifier");
      return true;
    } else {
      console.log("Erreur lors de la supression");
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de l'insertion: ");
  }
};

export const UpdateData = async (table: string, id: any, newValeur: object) => {
  const { data: currentRow, error: fetchError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  try {
    const { data, error } = await supabase
      .from(table)
      .update(newValeur)
      .eq("id", id);
    if (!error) {
      console.log("modifier");
      return true;
    } else {
      console.log("Erreur lors de la modiffication", error);
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de modification ", err);
  }
};

export const SignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  try {
    if (!error) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de modification ", err);
  }
};

export const SignIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  try {
    if (!error) {
      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/`;
      }
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de modification ", err);
  }
};

export const SignOut = async () => {
  const { error } = await supabase.auth.signOut();
  try {
    if (!error) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de modification ", err);
  }
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "Erreur lors de la recuperation de l'utilisateur:",
      error.message
    );
  }

  console.log("Utilisateur connecte", data);
  return data;
};

export const UtilisateurConnecter = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session) {
    NextResponse.redirect("/Compte");
  }
  return NextResponse.next();
};

export const UpdateEmail = async (newValeur: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newValeur,
    });
    if (error) {
      throw error;
    }
    return { succes: true };
  } catch (error) {}
};
export const UpdateEmailAdmin = async (newValeur: string, userId: string) => {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email: newValeur,
    });
    if (error) {
      throw error;
    }
    return { succes: true };
  } catch (error) {}
};
export const UpdatePasswordAdmin = async (
  newValeur: string,
  userId: string
) => {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newValeur,
    });
    if (error) {
      throw error;
    }
    return { succes: true };
  } catch (error) {}
};
export const DeleteUserAdmin = async (userId: string) => {
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw error;
    }
    return { succes: true };
  } catch (error) {}
};
export const CreerUtilisateur = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  try {
    if (!error) {
      return data.user.id;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Erreur lors de modification ", err);
  }
};

export const VerifierPassword = async (
  email: string,
  actuelMotDePasse: string
) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: actuelMotDePasse,
    });
    if (error) {
      return true;
    } else {
      return false;
    }
  } catch (error) {}
};
export const UpdatePassword = async (newValeur: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newValeur });
    if (error) {
      return true;
    } else {
      return false;
    }
  } catch (error) {}
};
