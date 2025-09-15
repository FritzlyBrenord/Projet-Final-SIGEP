import React, { useEffect, useMemo, useState } from "react";
import { useEleves } from "@/Context/ContextEleves";
import { useProfesseur } from "@/Context/ContextProfesseur";
import { useFraisScolarite } from "@/Context/ContextPaiement";
import { useNotes } from "@/Context/ContextNotes";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { SelectData } from "@/Config/SupabaseData";

interface Props {
  isDarkMode: boolean;
}

type TrashItem = {
  id: string;
  type: "Élève" | "Professeur" | "Paiement" | "Note" | string;
  title: string;
  subtitle?: string;
  date?: string;
  restore: () => Promise<void> | void;
  hardDelete: () => Promise<void> | void;
};

const PAGE_SIZE = 10;

const Corbeille = ({ isDarkMode }: Props) => {
  const { eleves, restaurerEleve, supprimerEleveDefinitif, rechargerEleves } =
    useEleves();
  const {
    professeurs,
    restaurerProfesseur,
    supprimerProfesseurDefinitif,
    rechargerProfesseurs,
  } = useProfesseur();
  const {
    paiements,
    restaurerPaiement,
    supprimerPaiementDefinitif,
    rechargerDonnees,
  } = useFraisScolarite();
  const { notes, restaurerNote, supprimerNoteDefinitif, rechargerNotes } =
    useNotes();
  const { currentYear } = useAnneeScolaire();

  const [page, setPage] = useState(1);
  const [deletedItems, setDeletedItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
  };

  // Charger les éléments supprimés directement depuis la base
  useEffect(() => {
    const loadDeleted = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [elevesDB, profsDB, paiementsDB, notesDB] = await Promise.all([
          SelectData("eleves"),
          SelectData("professeurs"),
          SelectData("paiements"),
          SelectData("notes"),
        ]);

        const anneeId = currentYear?.id;

        const elevesDeleted: TrashItem[] = (elevesDB || [])
          .filter((e: any) => e.deleted === true && (!anneeId || e.annee_scolaire_id === anneeId))
          .map((e: any) => ({
            id: e.id,
            type: "Élève" as const,
            title: `${e.prenom} ${e.nom}`,
            subtitle: `Code: ${e.code}`,
            restore: async () => {
              await restaurerEleve(e.id);
              await rechargerEleves();
              await refreshDeleted();
            },
            hardDelete: async () => {
              await supprimerEleveDefinitif(e.id);
              await rechargerEleves();
              await refreshDeleted();
            },
          }));

        const profsDeleted: TrashItem[] = (profsDB || [])
          .filter((p: any) => p.deleted === true && (!anneeId || p.annee_scolaire_id === anneeId))
          .map((p: any) => ({
            id: p.id,
            type: "Professeur" as const,
            title: `${p.prenom} ${p.nom}`,
            subtitle: p.email,
            restore: async () => {
              await restaurerProfesseur(p.id);
              await rechargerProfesseurs();
              await refreshDeleted();
            },
            hardDelete: async () => {
              await supprimerProfesseurDefinitif(p.id);
              await rechargerProfesseurs();
              await refreshDeleted();
            },
          }));

        const paiementsDeleted: TrashItem[] = (paiementsDB || [])
          .filter((pa: any) => pa.deleted === true && (!anneeId || pa.annee_scolaire_id === anneeId))
          .map((pa: any) => ({
            id: pa.id,
            type: "Paiement" as const,
            title: `Reçu ${pa.numero_recu}`,
            subtitle: `Montant: ${pa.montant_paye}`,
            restore: async () => {
              await restaurerPaiement(pa.id);
              await rechargerDonnees();
              await refreshDeleted();
            },
            hardDelete: async () => {
              await supprimerPaiementDefinitif(pa.id);
              await rechargerDonnees();
              await refreshDeleted();
            },
          }));

        const notesDeleted: TrashItem[] = (notesDB || [])
          .filter((n: any) => n.deleted === true && (!anneeId || n.annee_scolaire_id === anneeId))
          .map((n: any) => ({
            id: n.id,
            type: "Note" as const,
            title: `Note: ${n.note}`,
            subtitle: `Trimestre ${n.trimestre}`,
            restore: async () => {
              await restaurerNote(n.id);
              await rechargerNotes();
              await refreshDeleted();
            },
            hardDelete: async () => {
              await supprimerNoteDefinitif(n.id);
              await rechargerNotes();
              await refreshDeleted();
            },
          }));

        setDeletedItems([
          ...elevesDeleted,
          ...profsDeleted,
          ...paiementsDeleted,
          ...notesDeleted,
        ]);
        setPage(1);
      } catch (e) {
        setError("Erreur lors du chargement de la corbeille");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const refreshDeleted = async () => {
      await loadDeleted();
    };

    // expose refreshDeleted in closure for restore/hardDelete callbacks
    // initial load and when l'année change
    loadDeleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear]);

  const items: TrashItem[] = useMemo(() => {
    // On ne se base plus sur les tableaux des contexts (qui excluent les deleted)
    return deletedItems;
  }, [deletedItems]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRestore = async (item: TrashItem) => {
    await item.restore();
  };
  const handleHardDelete = async (item: TrashItem) => {
    if (confirm("Supprimer définitivement cet élément ?")) {
      await item.hardDelete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Corbeille</h2>
      </div>

      {isLoading && (
        <div className={`text-sm ${themeClasses.textSecondary}`}>Chargement...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        {!isLoading && items.length === 0 && (
          <div className={`${themeClasses.cardBg} border ${themeClasses.border} p-6 rounded-xl text-center`}>
            <div className={`text-lg font-medium ${themeClasses.text}`}>Corbeille vide</div>
            <div className={`text-sm ${themeClasses.textSecondary}`}>Aucun élément trouvé</div>
          </div>
        )}

        {pageItems.map((item) => (
          <div
            key={item.id}
            className={`${themeClasses.cardBg} border ${themeClasses.border} p-6 rounded-xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {item.type}
                  </span>
                  <span className={`font-semibold ${themeClasses.text}`}>
                    {item.title}
                  </span>
                </div>
                {item.subtitle && (
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    {item.subtitle}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRestore(item)}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200"
                >
                  Restaurer
                </button>
                <button
                  onClick={() => handleHardDelete(item)}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className={themeClasses.textSecondary}>
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-2 rounded ${
              page <= 1
                ? "bg-gray-300 text-gray-500"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Précédent
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-2 rounded ${
              page >= totalPages
                ? "bg-gray-300 text-gray-500"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default Corbeille;
