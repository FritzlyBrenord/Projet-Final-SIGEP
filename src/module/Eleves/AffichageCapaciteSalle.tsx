"use client";

import { useState, useEffect } from "react";
import { Users, AlertCircle, CheckCircle } from "lucide-react";
import { SelectData } from "@/Config/SupabaseData";

interface CapaciteInfo {
  isValid: boolean;
  message: string;
  currentCount: number;
  maxCapacity: number;
}

interface AffichageCapaciteSalleProps {
  salleId: string;
  anneeScolaireId: string;
}

const verifierCapaciteSalle = async (
  salleId: string,
  anneeScolaireId: string
): Promise<{
  isValid: boolean;
  message: string;
  currentCount: number;
  maxCapacity: number;
}> => {
  try {
    // 1. Récupérer les informations de la salle
    const salles = await SelectData("salles");
    const salle = salles?.find((s: any) => s.id === salleId);

    if (!salle) {
      return {
        isValid: false,
        message: "Salle introuvable",
        currentCount: 0,
        maxCapacity: 0,
      };
    }

    const capaciteMax = salle.capacite;

    // 2. Compter le nombre d'élèves actuellement inscrits dans cette salle pour l'année courante
    const inscriptions = await SelectData("eleves_inscriptions");
    const inscriptionsActives =
      inscriptions?.filter(
        (i: any) =>
          i.salle_id === salleId &&
          i.annee_scolaire_id === anneeScolaireId &&
          !i.deleted
      ) || [];

    const nombreElevesActuels = inscriptionsActives.length;

    // 3. Vérifier si la capacité est dépassée
    if (nombreElevesActuels >= capaciteMax) {
      return {
        isValid: false,
        message: `La salle est pleine (${nombreElevesActuels}/${capaciteMax} élèves). Veuillez choisir une autre salle.`,
        currentCount: nombreElevesActuels,
        maxCapacity: capaciteMax,
      };
    }

    return {
      isValid: true,
      message: `Capacité disponible : ${nombreElevesActuels}/${capaciteMax} élèves`,
      currentCount: nombreElevesActuels,
      maxCapacity: capaciteMax,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de capacité:", error);
    return {
      isValid: false,
      message: "Erreur lors de la vérification de la capacité",
      currentCount: 0,
      maxCapacity: 0,
    };
  }
};

const AffichageCapaciteSalle = ({
  salleId,
  anneeScolaireId,
}: AffichageCapaciteSalleProps) => {
  const [capaciteInfo, setCapaciteInfo] = useState<CapaciteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerCapacite = async () => {
      if (salleId && anneeScolaireId) {
        setLoading(true);
        const result = await verifierCapaciteSalle(salleId, anneeScolaireId);
        setCapaciteInfo(result);
        setLoading(false);
      }
    };

    chargerCapacite();
  }, [salleId, anneeScolaireId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (!capaciteInfo) {
    return <div className="text-sm text-red-500">Erreur de chargement</div>;
  }

  const pourcentage = Math.round(
    (capaciteInfo.currentCount / capaciteInfo.maxCapacity) * 100
  );

  return (
    <div className="w-full">
      {/* Compteur */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">Élèves inscrits</span>
        <span className="text-sm font-semibold">
          {capaciteInfo.currentCount}/{capaciteInfo.maxCapacity}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            capaciteInfo.isValid ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>

      {/* Message */}
      <p className="text-xs text-gray-500 mt-1">{capaciteInfo.message}</p>
    </div>
  );
};

export default AffichageCapaciteSalle;
