import { supabase } from "@/Config/supabase";
import { BadgeConfig } from "@/module/BadgeCadre/BadgeClassicCustomizable";

export interface BadgeModel {
  id: string;
  name: string;
  description?: string;
  config: BadgeConfig;
  template_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBadgeModelInput {
  name: string;
  description?: string;
  config: BadgeConfig;
  template_id: string;
}

export interface UpdateBadgeModelInput {
  name?: string;
  description?: string;
  config?: BadgeConfig;
}

class BadgeModelService {
  /**
   * Récupérer tous les modèles de l'utilisateur connecté
   */
  async getMyModels(userId?: string): Promise<BadgeModel[]> {
    try {
      // Si un userId est fourni, filtrer par created_by
      let query = supabase
        .from("badge_models")
        .select("*");

      if (userId) {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [getMyModels] Erreur Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.error("Erreur fatale lors de la récupération des modèles:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Récupérer un modèle par son ID
   */
  async getModelById(id: string): Promise<BadgeModel | null> {
    try {
      const { data, error } = await supabase
        .from("badge_models")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [getModelById] Erreur Supabase:", error);
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error("Erreur fatale lors de la récupération du modèle:", error?.message || error);
      throw error;
    }
  }

  /**
   * Créer un nouveau modèle
   * @param input - Les données du modèle à créer
   * @param userId - L'ID de l'utilisateur (requis)
   */
  async createModel(input: CreateBadgeModelInput, userId: string): Promise<BadgeModel> {
    try {
      console.log("🔍 [createModel] Début de la création du modèle");
      console.log("🔍 [createModel] userId:", userId);
      console.log("🔍 [createModel] input:", {
        name: input.name,
        description: input.description,
        template_id: input.template_id,
        configKeys: Object.keys(input.config),
      });

      if (!userId) {
        console.error("❌ [createModel] userId est manquant");
        throw new Error("L'ID utilisateur est requis pour créer un modèle");
      }

      const dataToInsert = {
        name: input.name,
        description: input.description,
        config: input.config,
        template_id: input.template_id,
        created_by: userId,
      };

      console.log("🔍 [createModel] Données à insérer:", {
        ...dataToInsert,
        config: "...", // Ne pas logger la config complète
      });

      const { data, error } = await supabase
        .from("badge_models")
        .insert([dataToInsert])
        .select()
        .single();

      console.log("🔍 [createModel] Réponse Supabase:");
      console.log("  - error:", error);
      console.log("  - data:", data ? "✅ Données reçues" : "❌ Pas de données");

      if (error) {
        console.error("❌ [createModel] Erreur Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      if (!data) {
        console.error("❌ [createModel] Pas de données retournées");
        throw new Error("Aucune donnée retournée après l'insertion");
      }

      console.log("✅ [createModel] Modèle créé avec succès:", data.id);
      return data;
    } catch (error: any) {
      console.error("❌ [createModel] Exception capturée:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });
      throw error;
    }
  }

  /**
   * Mettre à jour un modèle existant
   */
  async updateModel(
    id: string,
    input: UpdateBadgeModelInput
  ): Promise<BadgeModel> {
    try {
      const { data, error } = await supabase
        .from("badge_models")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du modèle:", error);
      throw error;
    }
  }

  /**
   * Supprimer un modèle
   */
  async deleteModel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("badge_models")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression du modèle:", error);
      throw error;
    }
  }
}

export const badgeModelService = new BadgeModelService();
