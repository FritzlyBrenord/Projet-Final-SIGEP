import { NextRequest, NextResponse } from "next/server";
import { SelectData } from "@/Config/SupabaseData";

type AnyRow = Record<string, any>;

interface ActivityItem {
  id: string;
  source: string;
  entityId: string;
  action: "ajout" | "modification" | "suppression";
  date: string; // ISO
  title: string;
  details?: string;
  module: string;
}

const toIso = (value: any): string | null => {
  if (!value) return null;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
};

const inferAction = (row: AnyRow): "ajout" | "modification" | "suppression" => {
  if (row.deleted === true) return "suppression";
  const created = toIso(row.created_at);
  const updated = toIso(row.updated_at);
  if (updated && created && updated !== created) return "modification";
  return "ajout";
};

const inYear = (row: AnyRow, yearId?: string | null): boolean => {
  if (!yearId) return true;
  if (row.annee_scolaire_id && String(row.annee_scolaire_id) === String(yearId)) return true;
  // Some tables might not be year-scoped
  if (!("annee_scolaire_id" in row)) return true;
  return false;
};

const newerThan = (row: AnyRow, sinceIso?: string | null): boolean => {
  if (!sinceIso) return true;
  const updated = toIso(row.updated_at);
  const created = toIso(row.created_at);
  const candidate = updated || created;
  if (!candidate) return false;
  return candidate > sinceIso;
};

const mapActivities = (rows: AnyRow[], source: string): ActivityItem[] => {
  return rows.map((r) => {
    const dateIso = toIso(r.updated_at) || toIso(r.created_at) || new Date().toISOString();
    const action = inferAction(r);
    let title = "";
    let details = "";
    let module = "Système";

    switch (source) {
      case "eleves":
        module = "Gestion Élèves";
        title = action === "ajout" ? "Nouvelle inscription" : action === "modification" ? "Fiche élève modifiée" : "Élève supprimé";
        details = `${r.prenom ?? ""} ${r.nom ?? ""}`.trim();
        break;
      case "paiements":
        module = "Paiements";
        title = action === "ajout" ? "Nouveau paiement" : action === "modification" ? "Paiement modifié" : "Paiement supprimé";
        if (typeof r.montant_paye === "number") details = `${r.montant_paye} HTG`;
        break;
      case "types_frais":
        module = "Paramètres";
        title = action === "ajout" ? "Type de frais ajouté" : action === "modification" ? "Type de frais modifié" : "Type de frais supprimé";
        details = r.nom ?? "";
        break;
      case "frais_par_classe":
        module = "Paramètres";
        title = action === "ajout" ? "Frais par classe ajouté" : action === "modification" ? "Frais par classe modifié" : "Frais par classe supprimé";
        details = `${r.classe ?? ""}`.trim();
        break;
      case "notes":
        module = "Notes";
        title = action === "ajout" ? "Notes ajoutées" : action === "modification" ? "Notes modifiées" : "Notes supprimées";
        details = `${r.eleve_id ?? ""}`;
        break;
      default:
        module = "Système";
        title = action;
    }

    return {
      id: `${source}:${r.id}:${dateIso}`,
      source,
      entityId: String(r.id ?? ""),
      action,
      date: dateIso,
      title,
      details,
      module,
    } as ActivityItem;
  });
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const yearId = searchParams.get("yearId");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(200, Math.max(10, Number(limitParam || 100)));

    // Fetch all needed tables in parallel once
    const [elevesRows, paiementsRows, typesFraisRows, fraisParClasseRows, notesRows] = await Promise.all([
      SelectData("eleves"),
      SelectData("paiements"),
      SelectData("types_frais"),
      SelectData("frais_par_classe"),
      SelectData("notes"),
    ]);

    const filterRows = (rows: AnyRow[] | null | undefined) =>
      (rows || [])
        .filter((r) => inYear(r, yearId))
        .filter((r) => newerThan(r, since));

    const elevesFiltered = filterRows(elevesRows as AnyRow[]);

    // Build a map for names to use in other sources (e.g., notes -> student name)
    const eleveNameById = new Map<string, string>();
    for (const e of elevesFiltered) {
      const nom = `${e.prenom ?? ""} ${e.nom ?? ""}`.trim();
      if (e.id) eleveNameById.set(String(e.id), nom);
    }

    // Map activities per source
    const elevesActs = mapActivities(elevesFiltered, "eleves");
    const paiementsActs = mapActivities(filterRows(paiementsRows as AnyRow[]), "paiements");
    const typesFraisActs = mapActivities(filterRows(typesFraisRows as AnyRow[]), "types_frais");
    const fraisParClasseActs = mapActivities(filterRows(fraisParClasseRows as AnyRow[]), "frais_par_classe");

    // Notes with student name in details
    const notesFiltered = filterRows(notesRows as AnyRow[]);
    const notesActs = notesFiltered.map((r) => {
      const dateIso = toIso(r.updated_at) || toIso(r.created_at) || new Date().toISOString();
      const action = inferAction(r);
      const studentName = eleveNameById.get(String(r.eleve_id || "")) || String(r.eleve_id || "");
      const item: ActivityItem = {
        id: `notes:${r.id}:${dateIso}`,
        source: "notes",
        entityId: String(r.id ?? ""),
        action,
        date: dateIso,
        title: action === "ajout" ? "Notes ajoutées" : action === "modification" ? "Notes modifiées" : "Notes supprimées",
        details: studentName,
        module: "Notes",
      };
      return item;
    });

    const all = [...elevesActs, ...paiementsActs, ...typesFraisActs, ...fraisParClasseActs, ...notesActs];
    all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const sliced = all.slice(0, limit);

    return NextResponse.json({ activities: sliced }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Erreur lors de l'agrégation des activités" },
      { status: 500 }
    );
  }
}

