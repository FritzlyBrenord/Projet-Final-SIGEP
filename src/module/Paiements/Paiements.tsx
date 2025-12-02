import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  FileText,
  DollarSign,
  Users,
  ChevronDown,
  Settings,
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Printer,
  BarChart3,
  Loader,
  X, // NOUVEAU: Icône pour fermer les modals
} from "lucide-react";
import { useFraisScolarite } from "@/Context/ContextPaiement";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useEleves } from "@/Context/ContextEleves";
import { EntetIMFP } from "../AnneeAcademique/module";

interface Props {
  isDarkMode?: boolean;
}

const FraisScolaritePage = ({ isDarkMode = false }: Props) => {
  // Contextes (INCHANGÉS)
  const {
    typesFrais,
    fraisParClasse,
    paiements,
    isLoading: isLoadingFrais,
    error: errorFrais,
    ajouterPaiement,
    ajouterTypeFrais,
    ajouterFraisParClasse,
    modifierFraisParClasse,
    supprimerPaiement,
    getFraisForClasse,
    getStudentBalance,
    generateReceiptNumber,
    supprimerTypeFraisDefinitif,
    modifierPaiement, // NOUVEAU: Fonction pour modifier un paiement
  } = useFraisScolarite();

  const { currentYear } = useAnneeScolaire();
  const { eleves, isLoading: isLoadingEleves } = useEleves();

  // Classes et salles (INCHANGÉS)
  const classes = useMemo(
    () =>
      currentYear?.classes.map((classe) => ({
        value: classe.id,
        label: classe.name,
      })) || [],
    [currentYear?.classes]
  ) as { value: string; label: string }[];

  const sallesByClass: Record<string, { value: string; label: string }[]> =
    useMemo(() => {
      const result: Record<string, { value: string; label: string }[]> = {};
      currentYear?.classes.forEach((classe) => {
        result[classe.id] = classe.salles.map((salle) => ({
          value: salle.id,
          label: `${salle.name}`,
        }));
      });
      return result;
    }, [currentYear?.classes]);

  // États existants (INCHANGÉS)
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "paiements" | "consultation" | "configuration"
  >("paiements");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTypeFrais, setFilterTypeFrais] = useState("");
  const [filterStatutPaiement, setFilterStatutPaiement] = useState("");
  const [paiementForm, setPaiementForm] = useState({
    type_frais_id: "",
    montant_du: "",
    montant_paye: "",
    remarques: "",
  });
  const [newTypeFrais, setNewTypeFrais] = useState({
    nom: "",
    montant_defaut: "",
    description: "",
    obligatoire: false,
  });
  const [selectedClasseForConfig, setSelectedClasseForConfig] = useState("");

  // NOUVEAUX ÉTATS pour les fonctionnalités demandées
  const [editingPaiement, setEditingPaiement] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcessModal, setShowExcessModal] = useState(false);
  const [excessData, setExcessData] = useState<any>(null);
  // Brouillon des montants par type (configuration par classe)
  const [classeFraisDrafts, setClasseFraisDrafts] = useState<
    Record<string, string>
  >({});

  const isLoading = isLoadingFrais || isLoadingEleves;

  const activeStudents = eleves.filter(
    (s) =>
      s.statut === "actif" &&
      (!selectedClasseId || s.classe_id === selectedClasseId) &&
      (!selectedSalleId || s.salle_id === selectedSalleId)
  );

  // Fonctions utilitaires existantes (INCHANGÉES)
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " HTG";
  };

  const getPaymentStatusColor = (montantDu: number, montantPaye: number) => {
    if (montantPaye >= montantDu) return "text-green-600";
    if (montantPaye > 0) return "text-yellow-600";
    return "text-red-600";
  };

  const getPaymentStatusIcon = (montantDu: number, montantPaye: number) => {
    if (montantPaye >= montantDu) return <CheckCircle className="h-4 w-4" />;
    if (montantPaye > 0) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getClasseIdById = useCallback(
    (classeId: string) => {
      const classe = classes.find((c) => c.value === classeId);
      return classe ? classe.value : "";
    },
    [classes]
  );
  const getClasseNameById = useCallback(
    (classeId: string) => {
      const classe = classes.find((c) => c.value === classeId);
      return classe ? classe.label : "";
    },
    [classes]
  );
  const getSalleNameById = (classeId: string, salleId: string) => {
    const salles = sallesByClass[classeId] || [];
    const salle = salles.find((s) => s.value === salleId);
    return salle ? salle.label : "";
  };

  // Initialiser/mettre à jour les brouillons lorsqu'on change de classe ou de données
  useEffect(() => {
    if (!selectedClasseForConfig) {
      setClasseFraisDrafts({});
      return;
    }
    const drafts: Record<string, string> = {};
    typesFrais.forEach((type) => {
      const montant = getFraisForClasse(selectedClasseForConfig, type.id);
      drafts[type.id] = Number.isFinite(montant) ? String(montant) : "";
    });
    setClasseFraisDrafts(drafts);
  }, [selectedClasseForConfig, typesFrais, fraisParClasse, getFraisForClasse]);

  // NOUVELLES FONCTIONS pour les fonctionnalités demandées

  // Vérifier si un type de frais est déjà soldé pour un élève
  const isTypeFraisSolde = (eleveId: string, typeFraisId: string) => {
    const student = eleves.find((e) => e.id === eleveId);
    if (!student) return false;

    const classeId = getClasseIdById(student.classe_id);
    const montantDu = getFraisForClasse(classeId, typeFraisId);

    const paiementsExistants = paiements.filter(
      (p) => p.eleve_id === eleveId && p.type_frais_id === typeFraisId
    );
    const totalPaye = paiementsExistants.reduce(
      (sum, p) => sum + p.montant_paye,
      0
    );

    return totalPaye >= montantDu;
  };

  // Obtenir le solde par type de frais pour un élève
  const getStudentBalanceByType = (eleveId: string) => {
    const student = eleves.find((e) => e.id === eleveId);
    if (!student) return {};

    const classeId = getClasseIdById(student.classe_id);
    const balances: {
      [key: string]: {
        due: number;
        paid: number;
        balance: number;
        typeName: string;
      };
    } = {};

    typesFrais.forEach((type) => {
      const montantDu = getFraisForClasse(classeId, type.id);
      const paiementsExistants = paiements.filter(
        (p) => p.eleve_id === eleveId && p.type_frais_id === type.id
      );
      const totalPaye = paiementsExistants.reduce(
        (sum, p) => sum + p.montant_paye,
        0
      );

      balances[type.id] = {
        due: montantDu,
        paid: totalPaye,
        balance: montantDu - totalPaye,
        typeName: type.nom,
      };
    });

    return balances;
  };

  // Obtenir les types disponibles pour l'excédent
  const getAvailableTypesForExcess = (
    eleveId: string,
    currentTypeId: string
  ) => {
    const student = eleves.find((e) => e.id === eleveId);
    if (!student) return [];

    const classeId = getClasseIdById(student.classe_id);

    return typesFrais.filter((type) => {
      if (type.id === currentTypeId) return false;

      const montantDu = getFraisForClasse(classeId, type.id);
      const paiementsExistants = paiements.filter(
        (p) => p.eleve_id === eleveId && p.type_frais_id === type.id
      );
      const totalPaye = paiementsExistants.reduce(
        (sum, p) => sum + p.montant_paye,
        0
      );

      return totalPaye < montantDu;
    });
  };

  // Gestion du formulaire (MODIFIÉE pour les nouvelles contraintes)
  const handlePaiementChange = (field: string, value: string) => {
    setPaiementForm((prev) => ({ ...prev, [field]: value }));
  };

  // FONCTION MODIFIÉE pour gérer les nouvelles contraintes
  const handleAddPaiement = async () => {
    try {
      if (
        !selectedStudent ||
        !paiementForm.type_frais_id ||
        !paiementForm.montant_du ||
        !paiementForm.montant_paye ||
        !currentYear
      ) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const montantPaye = parseFloat(paiementForm.montant_paye);
      const montantDu = parseFloat(paiementForm.montant_du);

      // NOUVELLE CONTRAINTE: Vérifier si le type est déjà soldé
      if (isTypeFraisSolde(selectedStudent.id, paiementForm.type_frais_id)) {
        alert(
          "Ce type de frais est déjà entièrement payé pour cet élève. Vous ne pouvez pas ajouter un nouveau paiement pour ce type."
        );
        return;
      }

      // NOUVELLE CONTRAINTE: Gérer la détection d'un type de frais déjà payé partiellement
      const paiementsExistants = paiements.filter(
        (p) =>
          p.eleve_id === selectedStudent.id &&
          p.type_frais_id === paiementForm.type_frais_id
      );
      const totalDejaPaye = paiementsExistants.reduce(
        (sum, p) => sum + p.montant_paye,
        0
      );
      const restantAPayer = montantDu - totalDejaPaye;

      // S'il existe déjà un paiement pour ce type et que le nouveau montant n'excède pas le restant,
      // proposer d'augmenter le paiement existant au lieu de créer un doublon
      if (paiementsExistants.length > 0 && montantPaye <= restantAPayer) {
        // Choisir le paiement le plus récent si possible
        const paiementExistant: any = [...paiementsExistants].sort((a, b) => {
          const da = a.date_paiement ? new Date(a.date_paiement).getTime() : 0;
          const db = b.date_paiement ? new Date(b.date_paiement).getTime() : 0;
          return db - da;
        })[0];

        const confirmer = window.confirm(
          `Ce type de frais existe déjà pour cet élève (déjà payé: ${formatCurrency(
            totalDejaPaye
          )} / dû: ${formatCurrency(
            montantDu
          )}).\n\nVoulez-vous augmenter le paiement existant de ${formatCurrency(
            montantPaye
          )} ?`
        );

        if (confirmer) {
          await modifierPaiement(paiementExistant.id, {
            montant_paye:
              parseFloat(paiementExistant.montant_paye) + montantPaye,
            remarques: paiementForm.remarques || undefined,
          });

          setPaiementForm({
            type_frais_id: "",
            montant_du: "",
            montant_paye: "",
            remarques: "",
          });

          alert("Paiement existant augmenté avec succès !");
          return;
        }
        // Si l'utilisateur refuse, on continue le flux normal (y compris gestion d'excédent)
      }

      if (montantPaye > restantAPayer) {
        // Gérer l'excédent
        const excess = montantPaye - restantAPayer;
        const availableTypes = getAvailableTypesForExcess(
          selectedStudent.id,
          paiementForm.type_frais_id
        );

        if (availableTypes.length > 0) {
          // Inclure des informations sur un paiement existant (si présent) pour l'augmenter automatiquement
          const paiementExistant = paiementsExistants.length
            ? [...paiementsExistants].sort((a, b) => {
                const da = a.date_paiement
                  ? new Date(a.date_paiement).getTime()
                  : 0;
                const db = b.date_paiement
                  ? new Date(b.date_paiement).getTime()
                  : 0;
                return db - da;
              })[0]
            : null;

          setExcessData({
            eleveId: selectedStudent.id,
            currentTypeId: paiementForm.type_frais_id,
            amountForCurrent: restantAPayer,
            excessAmount: excess,
            availableTypes: availableTypes,
            remarques: paiementForm.remarques,
            existingPaiementId: paiementExistant?.id,
            existingPaiementPaid: paiementExistant?.montant_paye ?? 0,
          });
          setShowExcessModal(true);
          return;
        } else {
          alert(
            `Le montant saisi (${formatCurrency(
              montantPaye
            )}) dépasse le montant restant à payer (${formatCurrency(
              restantAPayer
            )}). Aucun autre type de frais disponible pour l'excédent.`
          );
          return;
        }
      }

      // Ajouter le paiement normal
      await ajouterPaiement({
        eleve_id: selectedStudent.id,
        type_frais_id: paiementForm.type_frais_id,
        montant_du: parseFloat(paiementForm.montant_du),
        montant_paye: montantPaye,
        remarques: paiementForm.remarques || undefined,
        annee_scolaire_id: currentYear.id,
      });

      setPaiementForm({
        type_frais_id: "",
        montant_du: "",
        montant_paye: "",
        remarques: "",
      });

      alert("Paiement ajouté avec succès!");
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  // NOUVELLES FONCTIONS pour gérer l'excédent
  const handleExcessPayment = async (selectedTypeId: string) => {
    if (!excessData) return;

    try {
      const student = eleves.find((e) => e.id === excessData.eleveId);
      if (!student) return;

      const classeId = getClasseIdById(student.classe_id);
      const montantDuSelectedType = getFraisForClasse(classeId, selectedTypeId);

      const paiementsExistants = paiements.filter(
        (p) =>
          p.eleve_id === excessData.eleveId &&
          p.type_frais_id === selectedTypeId
      );
      const totalDejaPayé = paiementsExistants.reduce(
        (sum, p) => sum + p.montant_paye,
        0
      );
      const restantAPayer = montantDuSelectedType - totalDejaPayé;

      const montantPourSelectedType = Math.min(
        excessData.excessAmount,
        restantAPayer
      );

      if (currentYear) {
        // 1) Pour le type original: augmenter le paiement existant s'il existe, sinon créer
        if (excessData.existingPaiementId) {
          await modifierPaiement(excessData.existingPaiementId, {
            montant_paye:
              parseFloat(excessData.existingPaiementPaid) +
              parseFloat(excessData.amountForCurrent),
            remarques: excessData.remarques || undefined,
          });
        } else {
          await ajouterPaiement({
            eleve_id: excessData.eleveId,
            type_frais_id: excessData.currentTypeId,
            montant_du: excessData.amountForCurrent,
            montant_paye: excessData.amountForCurrent,
            remarques: excessData.remarques || undefined,
            annee_scolaire_id: currentYear?.id,
          });
        }

        // 2) Pour le type sélectionné: ajouter le paiement avec l'excédent
        await ajouterPaiement({
          eleve_id: excessData.eleveId,
          type_frais_id: selectedTypeId,
          montant_du: montantDuSelectedType,
          montant_paye: montantPourSelectedType,
          remarques: `Excédent de paiement`,
          annee_scolaire_id: currentYear?.id,
        });
      }

      setShowExcessModal(false);
      setExcessData(null);
      setPaiementForm({
        type_frais_id: "",
        montant_du: "",
        montant_paye: "",
        remarques: "",
      });

      alert("Paiements ajoutés avec succès avec gestion de l'excédent!");
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  // NOUVELLES FONCTIONS pour modification des paiements
  const handleEditPaiement = (paiement: any) => {
    setEditingPaiement({ ...paiement });
    setShowEditModal(true);
  };

  const handleUpdatePaiement = async () => {
    if (!editingPaiement) return;

    try {
      await modifierPaiement(editingPaiement.id, {
        montant_paye: parseFloat(editingPaiement.montant_paye),
        remarques: editingPaiement.remarques,
      });

      setShowEditModal(false);
      setEditingPaiement(null);
      alert("Paiement modifié avec succès!");
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  // Autres fonctions existantes (INCHANGÉES)...
  const handleAddTypeFrais = async () => {
    try {
      if (!newTypeFrais.nom || !newTypeFrais.montant_defaut || !currentYear) {
        alert("Veuillez remplir les champs obligatoires");
        return;
      }

      await ajouterTypeFrais({
        nom: newTypeFrais.nom,
        montant_defaut: parseFloat(newTypeFrais.montant_defaut),
        description: newTypeFrais.description || undefined,
        obligatoire: newTypeFrais.obligatoire,
        annee_scolaire_id: currentYear.id,
      });

      setNewTypeFrais({
        nom: "",
        montant_defaut: "",
        description: "",
        obligatoire: false,
      });

      alert("Type de frais ajouté avec succès!");
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  const handleUpdateFraisClasse = async (
    typeFraisId: string,
    montant: number
  ) => {
    try {
      if (!selectedClasseForConfig || !currentYear) return;

      const existingFrais = fraisParClasse.find(
        (f) =>
          f.classe_id === selectedClasseForConfig &&
          f.type_frais_id === typeFraisId
      );

      if (existingFrais) {
        // Modifier le frais existant
        await modifierFraisParClasse(existingFrais.id, { montant });
        alert("Frais modifié avec succès!");
      } else {
        // Ajouter un nouveau frais
        await ajouterFraisParClasse({
          classe: selectedClasseForConfig,
          type_frais_id: typeFraisId,
          montant,
          annee_scolaire_id: currentYear.id,
        });
        alert("Frais ajouté avec succès!");
      }
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  // Auto-remplissage du montant (INCHANGÉ)
  useEffect(() => {
    if (paiementForm.type_frais_id && selectedStudent) {
      const classeId = getClasseIdById(selectedStudent.classe_id);
      const montant = getFraisForClasse(classeId, paiementForm.type_frais_id);
      setPaiementForm((prev) => ({
        ...prev,
        montant_du: montant.toString(),
      }));
    }
  }, [
    paiementForm.type_frais_id,
    selectedStudent,
    getFraisForClasse,
    getClasseIdById,
  ]);

  // FONCTION AMÉLIORÉE pour la génération de reçu
  const generateReceipt = (paiement: any) => {
    const student = eleves.find((s) => s.id === paiement.eleve_id);
    const typeFrais = typesFrais.find((t) => t.id === paiement.type_frais_id);
    if (!student || !typeFrais) return;

    const receiptWindow = window.open("", "_blank", "width=800,height=600");
    if (!receiptWindow) return;

    const classeNom = getClasseNameById(student.classe_id);
    const salleNom = getSalleNameById(student.classe_id, student.salle_id);
    const balances = getStudentBalanceByType(student.id);
    const currentBalance = balances[typeFrais.id];

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu ${paiement.numero_recu}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .school-info {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: bold;
            background: #2563eb;
            color: white;
            padding: 10px;
            margin-top: 15px;
            border-radius: 5px;
          }
          .student-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .payment-table th,
          .payment-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          .payment-table th {
            background: #2563eb;
            color: white;
            font-weight: bold;
          }
          .payment-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
            text-align: center;
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .balance-info {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .signature-area {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 20px;
          }
          .signature-box {
            width: 200px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 30px;
            padding-top: 5px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        
         ${EntetIMFP(`FICHE DE PAIEMENT`)}
        
        <div class="student-info">
          <div class="info-row">
            <span class="info-label">Nom et Prénom:</span>
            <span>${student.prenom} ${student.nom}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Code Élève:</span>
            <span>${student.code}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Classe:</span>
            <span>${classeNom} - ${salleNom}</span>
          </div>
          <div class="info-row">
            <span class="info-label">N° Fiche:</span>
            <span>${paiement.numero_recu}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span>${new Date(paiement.date_paiement).toLocaleDateString(
              "fr-FR"
            )}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Heure:</span>
            <span>${paiement.heure_paiement}</span>
          </div>
        </div>

        <table class="payment-table">
          <thead>
            <tr>
              <th>Type de Frais</th>
              <th>Montant Dû</th>
              <th>Montant Versé</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${typeFrais.nom}</td>
              <td>${formatCurrency(paiement.montant_du)}</td>
              <td>${formatCurrency(paiement.montant_paye)}</td>
              <td>${formatCurrency(
                Math.max(0, currentBalance?.balance || 0)
              )}</td>
            </tr>
          </tbody>
        </table>

        
        ${
          (currentBalance?.balance || 0) > 0
            ? `
          <div class="balance-info">
            <strong>⚠️ Solde Restant:</strong> ${formatCurrency(
              currentBalance.balance
            )}<br>
            <small>Veuillez effectuer le paiement du solde restant avant la prochaine échéance.</small>
          </div>
        `
            : `
          <div class="balance-info" style="background: #dcfce7; border-color: #16a34a;">
            <strong>✅ Paiement Complet</strong><br>
            <small>Ce type de frais est entièrement soldé.</small>
          </div>
        `
        }

        ${
          paiement.remarques
            ? `
          <div class="info-row">
            <span class="info-label">Remarques:</span>
            <span>${paiement.remarques}</span>
          </div>
        `
            : ""
        }

        <div class="signature-area">
        
          <div class="signature-box">
            <div class="signature-line">Signature du Responsable de l'économat</div>
          </div>
        </div>

        
      </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  // Styles conditionnels (INCHANGÉS)
  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900";
  const buttonClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";
  const tabActiveClasses = isDarkMode
    ? "bg-blue-700 text-white"
    : "bg-blue-600 text-white";
  const tabInactiveClasses = isDarkMode
    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
    : "bg-gray-200 text-gray-700 hover:bg-gray-300";

  // Gestion des erreurs et chargement (INCHANGÉES)
  if (errorFrais) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600">{errorFrais}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-16 w-16 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* En-tête (INCHANGÉ) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Gestion des Frais de Scolarité
          </h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion des paiements et frais scolaires - SIGEP
          </p>
        </div>

        {/* NOUVEAUX MODALS */}

        {/* Modal pour modification de paiement */}
        {showEditModal && editingPaiement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${cardClasses} p-6 rounded-lg max-w-md w-full mx-4`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Modifier le Paiement</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Montant Payé
                  </label>
                  <input
                    type="number"
                    value={editingPaiement.montant_paye}
                    onChange={(e) =>
                      setEditingPaiement((prev: any) => ({
                        ...prev,
                        montant_paye: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${inputClasses}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Remarques
                  </label>
                  <textarea
                    value={editingPaiement.remarques || ""}
                    onChange={(e) =>
                      setEditingPaiement((prev: any) => ({
                        ...prev,
                        remarques: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${inputClasses}`}
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdatePaiement}
                  className={`flex-1 px-4 py-2 rounded-lg ${buttonClasses}`}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour l'excédent de paiement */}
        {showExcessModal && excessData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${cardClasses} p-6 rounded-lg max-w-md w-full mx-4`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Excédent de Paiement</h3>
                <button
                  onClick={() => setShowExcessModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm mb-2">
                  Le montant payé dépasse le montant dû.
                </p>
                <p className="text-sm mb-4 font-medium text-blue-600">
                  Excédent: {formatCurrency(excessData.excessAmount)}
                </p>
                <p className="text-sm mb-4">
                  Voulez-vous appliquer l'excédent à un autre type de frais?
                </p>
              </div>

              <div className="space-y-3 max-h-40 overflow-y-auto">
                {excessData.availableTypes.map((type: any) => {
                  const student = eleves.find(
                    (e) => e.id === excessData.eleveId
                  );
                  const classeId = getClasseIdById(student?.classe_id || "");
                  const montantDu = getFraisForClasse(classeId, type.id);
                  const paiementsExistants = paiements.filter(
                    (p) =>
                      p.eleve_id === excessData.eleveId &&
                      p.type_frais_id === type.id
                  );
                  const totalDejaPayé = paiementsExistants.reduce(
                    (sum, p) => sum + p.montant_paye,
                    0
                  );
                  const restant = montantDu - totalDejaPayé;

                  return (
                    <button
                      key={type.id}
                      onClick={() => handleExcessPayment(type.id)}
                      className={`w-full p-3 border rounded-lg text-left hover:bg-blue-50 ${
                        isDarkMode
                          ? "border-gray-600 hover:bg-blue-900"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="font-medium">{type.nom}</div>
                      <div className="text-sm text-gray-500">
                        Restant à payer: {formatCurrency(restant)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowExcessModal(false);
                    setExcessData(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler - Ne pas utiliser l'excédent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Le reste du code UI reste IDENTIQUE, avec juste quelques modifications dans la section paiements */}

        {/* Onglets (INCHANGÉ) */}
        <div
          className={`flex flex-col sm:flex-row mb-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {[
            { id: "paiements", icon: DollarSign, label: "Paiements" },
            { id: "consultation", icon: Eye, label: "Consultation" },
            { id: "configuration", icon: Settings, label: "Configuration" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id ? tabActiveClasses : tabInactiveClasses
              }`}
            >
              <tab.icon className="h-4 w-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sélecteurs principaux MODIFIÉS pour afficher les balances par type */}
        <div className={`${cardClasses} p-6 rounded-lg shadow-sm border mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Classe
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                value={selectedClasseId}
                onChange={(e) => {
                  setSelectedClasseId(e.target.value);
                  setSelectedSalleId("");
                  setSelectedStudent(null);
                }}
              >
                <option value="">Toutes les classes</option>
                {classes.map((classe) => (
                  <option key={classe.value} value={classe.value}>
                    {classe.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Salle
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                value={selectedSalleId}
                onChange={(e) => {
                  setSelectedSalleId(e.target.value);
                  setSelectedStudent(null);
                }}
                disabled={!selectedClasseId}
              >
                <option value="">Toutes les salles</option>
                {selectedClasseId &&
                  sallesByClass[selectedClasseId]?.map((salle) => (
                    <option key={salle.value} value={salle.value}>
                      {salle.label}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Rechercher un élève
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nom, prénom ou code..."
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Liste des élèves MODIFIÉE avec balances par type */}
          {(selectedClasseId || selectedSalleId || searchTerm) && (
            <div className="mt-4">
              <h3 className="font-medium mb-3">
                Élèves ({activeStudents.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {activeStudents
                  .filter((student) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      student.nom.toLowerCase().includes(search) ||
                      student.prenom.toLowerCase().includes(search) ||
                      student.code.toLowerCase().includes(search)
                    );
                  })
                  .map((student) => {
                    const balancesByType = getStudentBalanceByType(student.id);
                    const classeId = getClasseIdById(student.classe_id);
                    const classeNom = getClasseNameById(student.classe_id);
                    const salleNom = getSalleNameById(
                      student.classe_id,
                      student.salle_id
                    );

                    return (
                      <div
                        key={student.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedStudent?.id === student.id
                            ? isDarkMode
                              ? "bg-blue-800 border-blue-600"
                              : "bg-blue-100 border-blue-500"
                            : isDarkMode
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="font-medium">
                          {student.prenom} {student.nom}
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {student.code} • {classeNom} - {salleNom}
                        </div>
                        {/* NOUVEAU: Balances individuelles par type */}
                        <div className="mt-2 space-y-1">
                          {Object.values(balancesByType).map(
                            (balance: any, index) => (
                              <div
                                key={index}
                                className={`text-xs flex justify-between ${
                                  balance.balance > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                <span>{balance.typeName}:</span>
                                <span>{formatCurrency(balance.balance)}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Contenu selon l'onglet actif - Seule la section paiements est modifiée */}
        {activeTab === "paiements" && (
          <div className={`${cardClasses} rounded-lg shadow-sm border`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Saisie des Paiements</h2>
                {selectedStudent && (
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode ? "bg-gray-700" : "bg-blue-50"
                    }`}
                  >
                    <div className="font-medium">
                      {selectedStudent.prenom} {selectedStudent.nom}
                    </div>
                    <div className="text-sm">
                      {/* NOUVEAU: Affichage des balances individuelles */}
                      {Object.values(
                        getStudentBalanceByType(selectedStudent.id)
                      ).map((balance: any, index) => (
                        <div
                          key={index}
                          className={`${
                            balance.balance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {balance.typeName}: {formatCurrency(balance.balance)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!selectedStudent ? (
                <div className="text-center py-12">
                  <Users
                    className={`h-16 w-16 mx-auto mb-4 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    Veuillez sélectionner un élève pour ajouter un paiement
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Formulaire MODIFIÉ */}
                  <div className="space-y-4">
                    <h3 className="font-bold mb-4">Nouveau Paiement</h3>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Type de Frais *
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                        value={paiementForm.type_frais_id}
                        onChange={(e) =>
                          handlePaiementChange("type_frais_id", e.target.value)
                        }
                      >
                        <option value="">Sélectionner un type de frais</option>
                        {typesFrais.map((type) => {
                          const classeId = getClasseIdById(
                            selectedStudent.classe_id
                          );
                          const montant = getFraisForClasse(classeId, type.id);
                          const isSolde = isTypeFraisSolde(
                            selectedStudent.id,
                            type.id
                          );

                          return (
                            <option
                              key={type.id}
                              value={type.id}
                              disabled={isSolde}
                            >
                              {type.nom} - {formatCurrency(montant)}{" "}
                              {isSolde ? "(SOLDÉ)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Montant Dû *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={paiementForm.montant_du}
                          onChange={(e) =>
                            handlePaiementChange("montant_du", e.target.value)
                          }
                          readOnly
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Montant Payé *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={paiementForm.montant_paye}
                          onChange={(e) =>
                            handlePaiementChange("montant_paye", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Remarques
                      </label>
                      <textarea
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                        value={paiementForm.remarques}
                        onChange={(e) =>
                          handlePaiementChange("remarques", e.target.value)
                        }
                      />
                    </div>

                    <button
                      onClick={handleAddPaiement}
                      disabled={isLoading}
                      className={`w-full ${buttonClasses} px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50`}
                    >
                      <Save className="h-4 w-4 inline mr-2" />
                      Enregistrer le Paiement
                    </button>
                  </div>

                  {/* Historique MODIFIÉ avec bouton Edit */}
                  <div>
                    <h3 className="font-bold mb-4">Historique des Paiements</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {paiements
                        .filter((p) => p.eleve_id === selectedStudent.id)
                        .sort(
                          (a, b) =>
                            new Date(b.date_paiement).getTime() -
                            new Date(a.date_paiement).getTime()
                        )
                        .map((paiement) => {
                          const typeFrais = typesFrais.find(
                            (t) => t.id === paiement.type_frais_id
                          );
                          return (
                            <div
                              key={paiement.id}
                              className={`p-4 border rounded-lg ${
                                isDarkMode
                                  ? "border-gray-600"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between mb-2">
                                <div className="font-medium">
                                  {typeFrais?.nom || "Type inconnu"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Reçu: {paiement.numero_recu}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                <div>
                                  Dû: {formatCurrency(paiement.montant_du)}
                                </div>
                                <div>
                                  Payé: {formatCurrency(paiement.montant_paye)}
                                </div>
                                <div>
                                  {new Date(
                                    paiement.date_paiement
                                  ).toLocaleDateString()}
                                </div>
                                <div>{paiement.heure_paiement}</div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div
                                  className={`flex items-center gap-1 text-sm ${getPaymentStatusColor(
                                    paiement.montant_du,
                                    paiement.montant_paye
                                  )}`}
                                >
                                  {getPaymentStatusIcon(
                                    paiement.montant_du,
                                    paiement.montant_paye
                                  )}
                                  {paiement.montant_paye >= paiement.montant_du
                                    ? "Soldé"
                                    : paiement.montant_paye > 0
                                    ? "Partiel"
                                    : "Non payé"}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => generateReceipt(paiement)}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    Reçu
                                  </button>
                                  {/* NOUVEAU: Bouton pour modifier */}
                                  <button
                                    onClick={() => handleEditPaiement(paiement)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm("Supprimer ce paiement?")) {
                                        try {
                                          await supprimerPaiement(paiement.id);
                                        } catch (error) {
                                          alert(
                                            `Erreur: ${
                                              error instanceof Error
                                                ? error.message
                                                : "Erreur inconnue"
                                            }`
                                          );
                                        }
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {paiements.filter(
                        (p) => p.eleve_id === selectedStudent.id
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          Aucun paiement enregistré
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Les autres onglets restent IDENTIQUES à votre code original */}
        {activeTab === "consultation" && (
          <div className={`${cardClasses} rounded-lg shadow-sm border`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  Consultation des Paiements
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${inputClasses}`}
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showFilters && (
                <div
                  className={`mb-6 p-4 border rounded-lg ${
                    isDarkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      className={`px-3 py-2 border rounded-lg ${inputClasses}`}
                      value={filterTypeFrais}
                      onChange={(e) => setFilterTypeFrais(e.target.value)}
                    >
                      <option value="">Tous les types</option>
                      {typesFrais.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.nom}
                        </option>
                      ))}
                    </select>

                    <select
                      className={`px-3 py-2 border rounded-lg ${inputClasses}`}
                      value={filterStatutPaiement}
                      onChange={(e) => setFilterStatutPaiement(e.target.value)}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="solde">Soldé</option>
                      <option value="partiel">Partiel</option>
                      <option value="impaye">Non payé</option>
                    </select>

                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Recherche..."
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg ${inputClasses}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tableau des paiements */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Élève
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? "divide-gray-700" : "divide-gray-200"
                    }`}
                  >
                    {paiements
                      .filter((paiement) => {
                        const student = eleves.find(
                          (s) => s.id === paiement.eleve_id
                        );
                        const typeFrais = typesFrais.find(
                          (t) => t.id === paiement.type_frais_id
                        );

                        // Filtre par type de frais
                        if (
                          filterTypeFrais &&
                          paiement.type_frais_id !== filterTypeFrais
                        ) {
                          return false;
                        }

                        // Filtre par statut
                        if (filterStatutPaiement) {
                          const isComplete =
                            paiement.montant_paye >= paiement.montant_du;
                          const isPartial =
                            paiement.montant_paye > 0 && !isComplete;
                          const isUnpaid = paiement.montant_paye === 0;

                          if (filterStatutPaiement === "solde" && !isComplete)
                            return false;
                          if (filterStatutPaiement === "partiel" && !isPartial)
                            return false;
                          if (filterStatutPaiement === "impaye" && !isUnpaid)
                            return false;
                        }

                        // Filtre par recherche
                        if (searchTerm && student) {
                          const search = searchTerm.toLowerCase();
                          return (
                            student.nom.toLowerCase().includes(search) ||
                            student.prenom.toLowerCase().includes(search) ||
                            student.code.toLowerCase().includes(search) ||
                            typeFrais?.nom.toLowerCase().includes(search)
                          );
                        }

                        return true;
                      })
                      .map((paiement) => {
                        const student = eleves.find(
                          (s) => s.id === paiement.eleve_id
                        );
                        const typeFrais = typesFrais.find(
                          (t) => t.id === paiement.type_frais_id
                        );
                        if (!student) return null;

                        return (
                          <tr
                            key={paiement.id}
                            className={
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {student.prenom} {student.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {typeFrais?.nom || "Type inconnu"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                Payé: {formatCurrency(paiement.montant_paye)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Dû: {formatCurrency(paiement.montant_du)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`flex items-center gap-1 ${getPaymentStatusColor(
                                  paiement.montant_du,
                                  paiement.montant_paye
                                )}`}
                              >
                                {getPaymentStatusIcon(
                                  paiement.montant_du,
                                  paiement.montant_paye
                                )}
                                {paiement.montant_paye >= paiement.montant_du
                                  ? "Soldé"
                                  : paiement.montant_paye > 0
                                  ? "Partiel"
                                  : "Non payé"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(
                                paiement.date_paiement
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateReceipt(paiement)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Supprimer ce paiement?")) {
                                      try {
                                        await supprimerPaiement(paiement.id);
                                      } catch (error) {
                                        alert(
                                          `Erreur: ${
                                            error instanceof Error
                                              ? error.message
                                              : "Erreur inconnue"
                                          }`
                                        );
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "configuration" && (
          <div className={`${cardClasses} rounded-lg shadow-sm border`}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">
                Configuration des Types de Frais
              </h2>

              {/* Configuration des frais par classe */}
              <div
                className={`mb-8 p-6 border rounded-lg ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className="font-bold mb-4">
                  Configuration des Frais par Classe
                </h3>

                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sélectionner une classe
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={selectedClasseForConfig}
                    onChange={(e) => setSelectedClasseForConfig(e.target.value)}
                  >
                    <option value="">Choisir une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.value} value={classe.value}>
                        {classe.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClasseForConfig && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">
                      Frais pour la classe :
                      {
                        classes.find((c) => c.value === selectedClasseForConfig)
                          ?.label
                      }
                    </h4>

                    {typesFrais.map((typeFrais) => (
                      <div
                        key={typeFrais.id}
                        className={`p-4 border rounded-lg ${
                          isDarkMode ? "border-gray-600" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{typeFrais.nom}</div>
                            <div className="text-sm text-gray-500">
                              {typeFrais.description}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              placeholder="Montant"
                              className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                              value={classeFraisDrafts[typeFrais.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClasseFraisDrafts((prev) => ({
                                  ...prev,
                                  [typeFrais.id]: val,
                                }));
                              }}
                            />
                            <button
                              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white ${
                                isDarkMode
                                  ? "bg-blue-600 hover:bg-blue-500"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                              onClick={() => {
                                const parsed = parseFloat(
                                  classeFraisDrafts[typeFrais.id] || "0"
                                );
                                const montant = Number.isFinite(parsed)
                                  ? parsed
                                  : 0;
                                handleUpdateFraisClasse(typeFrais.id, montant);
                              }}
                              title="Valider"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Valider
                            </button>
                            <span className="text-sm text-gray-500">HTG</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ajout de nouveaux types de frais */}
              <div
                className={`mb-6 p-4 border rounded-lg ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className="font-bold mb-4">Ajouter un Type de Frais</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    className={`px-3 py-2 border rounded-lg ${inputClasses}`}
                    value={newTypeFrais.nom}
                    onChange={(e) =>
                      setNewTypeFrais((prev) => ({
                        ...prev,
                        nom: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Montant"
                    className={`px-3 py-2 border rounded-lg ${inputClasses}`}
                    value={newTypeFrais.montant_defaut}
                    onChange={(e) =>
                      setNewTypeFrais((prev) => ({
                        ...prev,
                        montant_defaut: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    className={`px-3 py-2 border rounded-lg ${inputClasses}`}
                    value={newTypeFrais.description}
                    onChange={(e) =>
                      setNewTypeFrais((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newTypeFrais.obligatoire}
                      onChange={(e) =>
                        setNewTypeFrais((prev) => ({
                          ...prev,
                          obligatoire: e.target.checked,
                        }))
                      }
                    />
                    Obligatoire
                  </label>
                </div>
                <button
                  onClick={handleAddTypeFrais}
                  disabled={isLoading}
                  className={`${buttonClasses} px-4 py-2 rounded-lg disabled:opacity-50`}
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {typesFrais.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg ${
                      isDarkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {type.nom}
                          {type.obligatoire && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(type.montant_defaut)}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Supprimer ce type de frais?")) {
                            try {
                              await supprimerTypeFraisDefinitif(type.id);
                            } catch (error) {
                              alert(
                                `Erreur: ${
                                  error instanceof Error
                                    ? error.message
                                    : "Erreur inconnue"
                                }`
                              );
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraisScolaritePage;
