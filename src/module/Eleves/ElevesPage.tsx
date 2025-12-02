import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserX,
  UserCheck,
  Download,
  Users,
  Calendar,
  ChevronDown,
  MapPin,
  Building,
  GraduationCap,
  SearchIcon,
  ArrowLeft,
  X,
} from "lucide-react";
import ReenrollmentModal from "./Reinscription/Reinscription";
import ExportModal from "./ExportModal";
import CitySelect from "../../components/CitySelect";

import DoublonConfirmationModal from "../../components/DoublonConfirmationModal";
import { useEleves } from "../../Context/ContextEleves";
import { useAnneeScolaire } from "../../Context/ContextAnneeScolaire";

import {
  EleveAffiche,
  DoublonEleve,
  EleveFormData,
} from "../../types/EleveTypeV2";
import Spinner from "@/utils/Spinner/Spinner";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import LocationSelect from "./LocationSelectionner";
import ParcoursAcademiqueModal from "./ParcoursAcademiqueModal";
import StudentSearchModal from "./modalRecherche";
import { SelectData } from "@/Config/SupabaseData";
import AffichageCapaciteSalle from "./AffichageCapaciteSalle";
import { notify } from "@/components/Notification";

interface Props {
  isDarkMode: boolean;
  isSuperAdmin: boolean;
}

type ViewType = "list" | "form" | "reinscription";

const ElevesPage = ({ isSuperAdmin, isDarkMode }: Props) => {
  const {
    eleves,
    ajouterEleve,
    modifierEleve,
    verifierDoublons,
    getParcoursAcademique,
    supprimerEleve,
    rechercherEleves,
    genererNouveauCode,
    rechargerEleves,
  } = useEleves();
  const { addActivity } = useRecentActivities();
  const { currentYear } = useAnneeScolaire();
  const { currentSession } = useContextUtilisateur();

  // ✅ NOUVEAU : État pour gérer la vue actuelle
  const [currentView, setCurrentView] = useState<ViewType>("list");

  const [filteredStudents, setFilteredStudents] = useState<EleveAffiche[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSalle, setFilterSalle] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterBirthPlace, setFilterBirthPlace] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterPreviousSchool, setFilterPreviousSchool] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EleveAffiche | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<EleveAffiche | null>(
    null
  );
  const [showExportModal, setShowExportModal] = useState(false);

  // États de chargement
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // États pour la gestion des doublons
  const [showDoublonModal, setShowDoublonModal] = useState(false);
  const [pendingEleveData, setPendingEleveData] =
    useState<EleveFormData | null>(null);
  const [doublonsDetectes, setDoublonsDetectes] = useState<DoublonEleve[]>([]);

  //parcours
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [parcoursEleve, setParcoursEleve] = useState("");
  const [idEleve, setIdEleve] = useState<any>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const onClose = () => {
    setIsOpen(!isOpen);
  };

  // Formulaire
  const [formData, setFormData] = useState<EleveFormData>({
    nom: "",
    prenom: "",
    date_naissance: "",
    pays_naissance: "",
    region_naissance: "",
    ville_naissance: "",
    section_naissance: "",
    sexe: "M",
    adresse_actuelle: "",
    telephone_parents: "",
    adresse_parents: "",
    nif_parents: "",
    moyenne_generale: 0,
    etablissement_precedent: "",
    photo_url: "",
    annee_scolaire_id: "",
    classe_id: "",
    salle_id: "",
    statut: "inactif",
    observations: "",
  });

  const getEleveNomPrenom = (
    eleveId: string
  ): { nom: string; prenom: string } | undefined => {
    const eleve = eleves.find((e) => e.id === eleveId);
    if (!eleve) return undefined;

    return {
      nom: eleve.nom,
      prenom: eleve.prenom,
    };
  };

  // Classes et salles depuis l'année scolaire courante
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

  const getClasseName = (classeId?: string) =>
    classes.find((c) => c.value === classeId)?.label || classeId || "";
  const getSalleName = (classeId?: string, salleId?: string) => {
    if (!classeId || !salleId) return salleId || "";
    return (
      sallesByClass[classeId]?.find((s) => s.value === salleId)?.label ||
      salleId
    );
  };

  // Fonction pour calculer l'âge
  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Effet pour filtrer les étudiants
  useEffect(() => {
    let filtered = searchTerm ? rechercherEleves(searchTerm) : eleves;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass) {
      filtered = filtered.filter(
        (student) => student.classe_id === filterClass
      );
    }

    if (filterSalle) {
      filtered = filtered.filter((student) => student.salle_id === filterSalle);
    }

    if (filterGender) {
      filtered = filtered.filter((student) => student.sexe === filterGender);
    }

    if (filterStatus) {
      filtered = filtered.filter(
        (student) =>
          student.statut === (filterStatus as "actif" | "inactif" | "suspendu")
      );
    }

    if (filterAge) {
      filtered = filtered.filter((student: EleveAffiche) => {
        const age = calculateAge(student.date_naissance);
        const ageRange = filterAge.split("-");
        if (ageRange.length === 2) {
          return age >= parseInt(ageRange[0]) && age <= parseInt(ageRange[1]);
        }
        return age.toString() === filterAge;
      });
    }

    if (filterBirthPlace) {
      filtered = filtered.filter((student: EleveAffiche) => {
        const fullLocation =
          `${student.pays_naissance} ${student.region_naissance} ${student.ville_naissance}`.toLowerCase();
        return fullLocation.includes(filterBirthPlace.toLowerCase());
      });
    }
    if (filterAddress) {
      filtered = filtered.filter((student: EleveAffiche) =>
        student.adresse_actuelle
          .toLowerCase()
          .includes(filterAddress.toLowerCase())
      );
    }

    if (filterPreviousSchool) {
      filtered = filtered.filter((student: EleveAffiche) =>
        student.etablissement_precedent
          .toLowerCase()
          .includes(filterPreviousSchool.toLowerCase())
      );
    }

    // Appliquer le tri - UTILISEZ LA MÊME MÉTHODE QUE LES FILTRES
    if (sortBy) {
      // Au lieu de modifier le tableau existant, créez un nouveau tableau trié
      filtered = [...filtered].sort((a: EleveAffiche, b: EleveAffiche) => {
        // Pour le nom, prénom et code
        if (sortBy === "nom" || sortBy === "prenom" || sortBy === "code") {
          const aValue = a[sortBy].toLowerCase();
          const bValue = b[sortBy].toLowerCase();

          if (sortOrder === "asc") {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }

        // Pour la date de naissance (traitement spécial)
        if (sortBy === "date_naissance") {
          const aValue = new Date(a.date_naissance).getTime();
          const bValue = new Date(b.date_naissance).getTime();

          if (sortOrder === "asc") {
            return aValue - bValue; // Plus ancien → plus récent
          } else {
            return bValue - aValue; // Plus récent → plus ancien
          }
        }

        return 0;
      });
    }
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [
    eleves,
    searchTerm,
    filterClass,
    filterSalle,
    filterGender,
    filterStatus,
    filterAge,
    filterBirthPlace,
    filterAddress,
    filterPreviousSchool,
    sortBy,
    sortOrder,
    rechercherEleves,
  ]);

  // ✅ NOUVEAU : Calcul de la pagination
  const totalItems = filteredStudents.length;
  const totalPages =
    itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);

  // S'assurer que la page actuelle est valide
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Obtenir les éléments de la page actuelle
  const paginatedStudents = useMemo(() => {
    if (itemsPerPage === -1) {
      return filteredStudents;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Fonctions de navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fonction de validation pour nom et prénom
  const validateName = (value: string) => {
    // Si la valeur est vide, on retourne true (la validation required s'occupe du reste)
    if (!value || value.trim() === "") return true;

    // Vérifier la longueur (max 70 caractères)
    if (value.length > 70) {
      return false;
    }

    // Vérifier si c'est uniquement des chiffres
    if (/^\d+$/.test(value)) {
      return false; // Uniquement des chiffres → erreur
    }

    // Compter le nombre de chiffres
    const digitCount = (value.match(/\d/g) || []).length;

    // Si il y a des chiffres, doit avoir exactement 2 chiffres
    if (digitCount > 0 && digitCount !== 2) {
      return false; // Plus ou moins de 2 chiffres → erreur
    }

    return true; // Valide
  };

  // Fonction pour formater l'erreur
  const getNameErrorMessage = (value: string) => {
    if (!value || value.trim() === "") return "";

    if (value.length > 70) {
      return "Ne peut pas dépasser 70 caractères";
    }

    if (/^\d+$/.test(value)) {
      return "Ne peut pas contenir uniquement des chiffres";
    }

    const digitCount = (value.match(/\d/g) || []).length;
    if (digitCount > 0 && digitCount !== 2) {
      return "Doit contenir exactement 2 chiffres si des chiffres sont présents";
    }

    return "";
  };

  // Fonction pour formater et valider le téléphone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Si c'est Haïti
    if (formData.pays_naissance === "Haïti") {
      // Supprimer tout sauf les chiffres
      let digits = value.replace(/\D/g, "");

      // Si le numéro commence par 509, on le garde, sinon on ajoute 509
      if (digits.startsWith("509")) {
        digits = digits.substring(3); // Enlever le 509 existant
      }

      // Limiter à 8 chiffres maximum (sans l'indicatif)
      digits = digits.substring(0, 8);

      // Formater comme (509) XX-XX-XXXX
      let formattedValue = "(509) ";
      if (digits.length > 0) {
        formattedValue += digits.substring(0, 2);
        if (digits.length > 2) {
          formattedValue += "-" + digits.substring(2, 4);
          if (digits.length > 4) {
            formattedValue += "-" + digits.substring(4, 8);
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        telephone_parents: formattedValue,
      }));
    } else {
      // Pour les autres pays, accepter maximum 13 chiffres
      let digits = value.replace(/\D/g, "");
      digits = digits.substring(0, 13);

      setFormData((prev) => ({
        ...prev,
        telephone_parents: digits,
      }));
    }
  };

  // Fonction de validation du téléphone
  const validatePhone = (value: string, pays: string) => {
    if (!value || value.trim() === "") return false;

    if (pays === "Haiti") {
      // Pour Haïti: format (509) XX-XX-XXXX avec exactement 8 chiffres
      const digits = value.replace(/\D/g, "");
      return (
        digits.length === 11 &&
        digits.startsWith("509") &&
        digits.substring(3).length === 8
      );
    } else {
      // Pour autres pays: maximum 13 chiffres
      const digits = value.replace(/\D/g, "");
      return digits.length > 0 && digits.length <= 13;
    }
  };

  // Fonction pour obtenir le message d'erreur du téléphone
  const getPhoneErrorMessage = (value: string, pays: string) => {
    if (!value || value.trim() === "") return "Ce champ est requis";

    if (pays === "Haïti") {
      const digits = value.replace(/\D/g, "");
      if (!digits.startsWith("509")) {
        return "Le numéro doit commencer par l'indicatif 509";
      }
      if (digits.substring(3).length !== 8) {
        return "Le numéro doit contenir 8 chiffres après l'indicatif";
      }
    } else {
      const digits = value.replace(/\D/g, "");
      if (digits.length === 0) {
        return "Veuillez entrer un numéro de téléphone valide";
      }
      if (digits.length > 13) {
        return "Le numéro ne peut pas dépasser 13 chiffres";
      }
    }

    return "";
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Gestion du formulaire
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target as {
      name: keyof EleveFormData;
      value: string;
    };
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === "moyenne_generale" ? parseFloat(value) || 0 : value,
      } as EleveFormData;
      if (name === "classe_id") {
        next.salle_id = "";
      }
      return next;
    });
  };

  // Validation de la date de naissance (minimum 5 ans)
  const validateBirthDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;
    return actualAge >= 5 && birthDate <= today;
  };

  // Formatage du NIF
  const formatNIF = (nif: string): string => {
    const cleanNIF = nif.replace(/\D/g, "");
    if (cleanNIF.length !== 10) return nif;

    if (cleanNIF.startsWith("0")) {
      return `${cleanNIF.slice(0, 3)}-${cleanNIF.slice(3, 6)}-${cleanNIF.slice(
        6,
        9
      )}-${cleanNIF.slice(9)}`;
    } else {
      return cleanNIF;
    }
  };

  // Validation du NIF
  const validateNIF = (nif: string): boolean => {
    if (!nif) return true;
    const cleanNIF = nif.replace(/\D/g, "");
    return cleanNIF.length === 10 && /^\d{10}$/.test(cleanNIF);
  };

  const handleSubmit = async () => {
    if (!currentYear) {
      alert("Veuillez d'abord sélectionner une année scolaire");
      return;
    }

    // Validations obligatoires
    if (!formData.nom.trim()) {
      alert("Le nom est obligatoire");
      return;
    }
    if (!formData.prenom.trim()) {
      alert("Le prénom est obligatoire");
      return;
    }
    if (!validateName(formData.nom) || !validateName(formData.prenom)) {
      alert("Veuillez corriger les erreurs dans les champs nom et prénom");
      return;
    }
    if (!validatePhone(formData.telephone_parents, formData.pays_naissance)) {
      alert("Veuillez corriger le numéro de téléphone");
      return;
    }

    if (!formData.date_naissance) {
      alert("La date de naissance est obligatoire");
      return;
    }
    if (!formData.pays_naissance.trim()) {
      alert("Le pays de naissance est obligatoire");
      return;
    }
    if (!formData.region_naissance.trim()) {
      alert("La région de naissance est obligatoire");
      return;
    }
    if (!formData.ville_naissance.trim()) {
      alert("La ville de naissance est obligatoire");
      return;
    }
    if (!formData.adresse_actuelle.trim()) {
      alert("L'adresse actuelle est obligatoire");
      return;
    }
    if (!formData.telephone_parents.trim()) {
      alert("Le téléphone des parents est obligatoire");
      return;
    }
    if (!formData.adresse_parents.trim()) {
      alert("L'adresse des parents est obligatoire");
      return;
    }
    if (!formData.classe_id) {
      alert("La classe est obligatoire");
      return;
    }
    if (!formData.salle_id) {
      alert("La salle est obligatoire");
      return;
    }

    if (!validateBirthDate(formData.date_naissance)) {
      alert(
        "L'élève doit avoir au moins 5 ans et la date de naissance ne peut pas être dans le futur"
      );
      return;
    }

    if (formData.nif_parents && !validateNIF(formData.nif_parents)) {
      alert("Le NIF doit contenir exactement 10 chiffres");
      return;
    }

    const payload: EleveFormData = {
      ...formData,
      annee_scolaire_id: currentYear.id,
      nif_parents: formData.nif_parents ? formatNIF(formData.nif_parents) : "",
      statut: formData.statut,
    };

    try {
      setIsSubmitting(true);

      if (editingStudent) {
        await modifierEleve(editingStudent.id, payload);
        await addActivity({
          action: "modification",
          module: "Gestion Élèves",
          title: "Modification élève",
          details: `L'élève ${payload.nom} ${payload.prenom} a été modifié.`,
        });
        notify(
          "success",
          `L'élève ${payload.nom} ${payload.prenom} a été modifié.`
        );
        resetForm();
      } else {
        const doublons = await verifierDoublons(payload);

        if (doublons.length > 0) {
          setDoublonsDetectes(doublons);
          setPendingEleveData(payload);
          setShowDoublonModal(true);
        } else {
          await ajouterEleve(payload);

          await addActivity({
            action: "ajout",
            module: "Gestion Élèves",
            title: "Inscription élève",
            details: `L'élève ${payload.nom} ${payload.prenom} a été inscrit.`,
          });
          notify(
            "success",
            `L'élève ${payload.nom} ${payload.prenom} a été inscrit.`
          );

          resetForm();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de l'élève");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      date_naissance: "",
      pays_naissance: "",
      region_naissance: "",
      ville_naissance: "",
      section_naissance: "",
      sexe: "M",
      adresse_actuelle: "",
      telephone_parents: "",
      adresse_parents: "",
      nif_parents: "",
      moyenne_generale: 0,
      etablissement_precedent: "",
      photo_url: "",
      annee_scolaire_id: "",
      classe_id: "",
      salle_id: "",
      statut: "inactif",
      observations: "",
    });
    setEditingStudent(null);
    setCurrentView("list"); // ✅ Retour à la liste
  };

  // Gestion des doublons
  const handleDoublonConfirm = async () => {
    if (!pendingEleveData) return;

    try {
      setIsSubmitting(true);
      await ajouterEleve(pendingEleveData as any);
      setShowDoublonModal(false);
      setDoublonsDetectes([]);
      setPendingEleveData(null);
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      alert("Erreur lors de la confirmation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoublonCancel = () => {
    setShowDoublonModal(false);
    setDoublonsDetectes([]);
    setPendingEleveData(null);
  };

  // Actions sur les étudiants
  const changeStudentStatus = async (
    student: EleveAffiche,
    newStatus: "actif" | "inactif" | "suspendu"
  ) => {
    const statusLabels = {
      actif: "actif",
      inactif: "inactif",
      suspendu: "suspendu",
    };

    const confirmed = window.confirm(
      `Voulez-vous vraiment changer le statut de ${student.prenom} ${
        student.nom
      } de "${statusLabels[student.statut]}" à "${statusLabels[newStatus]}" ?`
    );

    if (!confirmed) return;

    try {
      setIsChangingStatus(true);
      setLoadingStudentId(student.id);

      console.log("🔄 Changement de statut:", {
        eleveId: student.id,
        inscriptionId: student.inscription_id,
        ancienStatut: student.statut,
        nouveauStatut: newStatus,
      });

      await modifierEleve(
        student.id,
        { statut: newStatus },
        student.inscription_id
      );

      await rechargerEleves();

      await addActivity({
        action: "modification",
        module: "Gestion Élèves",
        title: "Changement de statut",
        details: `Le statut de ${student.prenom} ${student.nom} a été changé de "${student.statut}" à "${newStatus}".`,
      });

      notify(
        "success",
        `Statut changé avec succès : ${student.prenom} ${student.nom} est maintenant "${statusLabels[newStatus]}"`
      );

      console.log("✅ Statut changé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors du changement de statut:", error);
      alert(
        `Erreur lors du changement de statut: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsChangingStatus(false);
      setLoadingStudentId(null);
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) {
      try {
        setIsDeleting(true);
        setLoadingStudentId(studentId);
        await supprimerEleve(studentId);
        await addActivity({
          action: "suppression",
          module: "Gestion Élèves",
          title: "Suppression élève",
          details: `L'élève ${getEleveNomPrenom(studentId)?.nom} ${
            getEleveNomPrenom(studentId)?.prenom
          } a été supprimé.`,
        });
        notify(
          "success",
          `L'élève ${getEleveNomPrenom(studentId)?.nom} ${
            getEleveNomPrenom(studentId)?.prenom
          } a été supprimé.`
        );
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'élève");
      } finally {
        setIsDeleting(false);
        setLoadingStudentId(null);
      }
    }
  };

  const editStudent = (student: EleveAffiche) => {
    setEditingStudent(student);
    setFormData({
      nom: student.nom,
      prenom: student.prenom,
      date_naissance: student.date_naissance,
      pays_naissance: student.pays_naissance,
      region_naissance: student.region_naissance,
      ville_naissance: student.ville_naissance,
      section_naissance: student.section_naissance || "",
      sexe: student.sexe,
      adresse_actuelle: student.adresse_actuelle,
      telephone_parents: student.telephone_parents,
      adresse_parents: student.adresse_parents,
      nif_parents: student.nif_parents,
      moyenne_generale: student.moyenne_generale,
      etablissement_precedent: student.etablissement_precedent,
      photo_url: student.photo_url || "",
      annee_scolaire_id: student.annee_scolaire_id,
      classe_id: student.classe_id,
      salle_id: student.salle_id,
      statut: student.statut,
      observations: student.observations_inscription || "",
    });
    setCurrentView("form"); // ✅ Afficher le formulaire
  };

  const getELeveParcours = () => {
    setIsOpen2(true);
  };

  const handleParcoursEleve = (studentCode: string) => {
    const eleveTrouve = eleves.filter((el) => el.code === studentCode);

    if (eleveTrouve.length > 0) {
      notify("success", "Élève trouvé !");
      const idEleve = eleveTrouve[0].id;
      setIdEleve(idEleve);
      setIsOpen(true);
    } else {
      alert("Aucun élève avec ce code");
    }
  };

  // Statistiques
  const stats = {
    total: eleves.length,
    actifs: eleves.filter((s: EleveAffiche) => s.statut === "actif").length,
    inactifs: eleves.filter((s: EleveAffiche) => s.statut === "inactif").length,
    suspendus: eleves.filter((s: EleveAffiche) => s.statut === "suspendu")
      .length,
    moyenneGenerale:
      eleves.reduce(
        (acc: number, s: EleveAffiche) => acc + (s.moyenne_generale || 0),
        0
      ) / (eleves.length || 1),
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case "actif":
          return "bg-green-900 text-green-200";
        case "inactif":
          return "bg-gray-700 text-gray-300";
        case "suspendu":
          return "bg-red-900 text-red-200";
        default:
          return "bg-gray-700 text-gray-300";
      }
    } else {
      switch (status) {
        case "actif":
          return "bg-green-100 text-green-800";
        case "inactif":
          return "bg-gray-100 text-gray-800";
        case "suspendu":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
  };

  const baseClasses = isDarkMode
    ? "min-h-screen bg-gray-900 text-white"
    : "min-h-screen bg-gray-50 text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const buttonPrimaryClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  // ✅ RENDU CONDITIONNEL SELON LA VUE
  if (currentView === "form") {
    return (
      <div className={`${baseClasses} p-6`}>
        <div className="max-w-5xl mx-auto">
          {/* ✅ En-tête avec bouton retour */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={resetForm}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              Retour à la liste
            </button>

            <h1 className="text-3xl font-bold">
              {editingStudent ? "Modifier l'élève" : "Inscrire un nouvel élève"}
            </h1>
          </div>
          <AffichageCapaciteSalle
            salleId={formData.salle_id}
            anneeScolaireId={currentYear ? currentYear.id : ""}
          />

          <br />
          {/* ✅ Formulaire */}
          <div className={`${cardClasses} rounded-lg shadow-sm border p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  maxLength={70}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    !validateName(formData.nom) ? "border-red-500" : ""
                  } ${inputClasses}`}
                  value={formData.nom}
                  onChange={handleInputChange}
                />
                {!validateName(formData.nom) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getNameErrorMessage(formData.nom)}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  required
                  maxLength={70}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    !validateName(formData.prenom) ? "border-red-500" : ""
                  } ${inputClasses}`}
                  value={formData.prenom}
                  onChange={handleInputChange}
                />
                {!validateName(formData.prenom) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getNameErrorMessage(formData.prenom)}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Sexe *
                </label>
                <select
                  name="sexe"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.sexe}
                  onChange={handleInputChange}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  required
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 5)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.date_naissance}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate) {
                      const age = calculateAge(selectedDate);
                      if (age < 5) {
                        alert("L'élève doit avoir au moins 5 ans");
                        return;
                      }
                    }
                    handleInputChange(e);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'élève doit avoir au moins 5 ans
                </p>
              </div>
              <div className="md:col-span-2">
                <LocationSelect
                  value={{
                    pays: formData.pays_naissance,
                    region: formData.region_naissance,
                    ville: formData.ville_naissance,
                    section: formData.section_naissance,
                  }}
                  onChange={(location) => {
                    setFormData((prev) => ({
                      ...prev,
                      pays_naissance: location.pays,
                      region_naissance: location.region,
                      ville_naissance: location.ville,
                      section_naissance: location.section,
                    }));
                  }}
                  isDarkMode={isDarkMode}
                  required={true}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Adresse actuelle *
                </label>
                <input
                  type="text"
                  name="adresse_actuelle"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.adresse_actuelle}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Téléphone parents/tuteurs *
                </label>
                <input
                  type="tel"
                  name="telephone_parents"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    !validatePhone(
                      formData.telephone_parents,
                      formData.pays_naissance
                    )
                      ? "border-red-500"
                      : ""
                  } ${inputClasses}`}
                  value={formData.telephone_parents}
                  onChange={handlePhoneChange}
                  placeholder={
                    formData.pays_naissance === "Haiti"
                      ? "(509) XX-XX-XXXX"
                      : "Numéro de téléphone"
                  }
                />
                {!validatePhone(
                  formData.telephone_parents,
                  formData.pays_naissance
                ) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getPhoneErrorMessage(
                      formData.telephone_parents,
                      formData.pays_naissance
                    )}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  NIF/CIN parent/tuteur
                </label>
                <input
                  type="text"
                  name="nif_parents"
                  placeholder="Ex: 002-434-827-9 ou 3723277377"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.nif_parents}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      if (value.length >= 3 && value.startsWith("0")) {
                        if (value.length >= 6) {
                          if (value.length >= 9) {
                            value = `${value.slice(0, 3)}-${value.slice(
                              3,
                              6
                            )}-${value.slice(6, 9)}-${value.slice(9)}`;
                          } else {
                            value = `${value.slice(0, 3)}-${value.slice(
                              3,
                              6
                            )}-${value.slice(6)}`;
                          }
                        } else {
                          value = `${value.slice(0, 3)}-${value.slice(3)}`;
                        }
                      }
                      setFormData((prev) => ({
                        ...prev,
                        nif_parents: value,
                      }));
                    }
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Adresse parent/tuteur *
                </label>
                <input
                  type="text"
                  name="adresse_parents"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.adresse_parents}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Classe *
                </label>
                <select
                  name="classe_id"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.classe_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner une classe</option>
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
                  Salle *
                </label>
                <select
                  name="salle_id"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.salle_id}
                  onChange={handleInputChange}
                  disabled={!formData.classe_id}
                >
                  <option value="">Sélectionner une salle</option>
                  {formData.classe_id && sallesByClass[formData.classe_id]
                    ? sallesByClass[formData.classe_id].map((salle) => (
                        <option key={salle.value} value={salle.value}>
                          {salle.label}
                        </option>
                      ))
                    : Object.values(sallesByClass)
                        .flat()
                        .map((salle) => (
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
                  Moyenne générale (
                  <i className="text-[10px] text-red-500">
                    Établissement précédent
                  </i>
                  ) *
                </label>
                <input
                  type="number"
                  name="moyenne_generale"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.moyenne_generale}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Établissement précédent *
                </label>
                <input
                  type="text"
                  name="etablissement_precedent"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.etablissement_precedent}
                  onChange={handleInputChange}
                />
              </div>
              {editingStudent && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Statut *
                  </label>
                  <select
                    name="statut"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.statut}
                    onChange={handleInputChange}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Observations
                </label>
                <textarea
                  name="observations"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={formData.observations}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isDarkMode
                    ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                    : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg transition-colors ${buttonPrimaryClasses} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" color="white" />
                    {editingStudent ? "Modification..." : "Ajout..."}
                  </>
                ) : editingStudent ? (
                  "Modifier"
                ) : (
                  "Ajouter"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "reinscription") {
    return (
      <div className={`${baseClasses} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* ✅ En-tête avec bouton retour */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setCurrentView("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              Retour à la liste
            </button>
            <h1 className="text-3xl font-bold">Réinscription des Élèves</h1>
          </div>

          {/* ✅ Composant de réinscription */}
          <ReenrollmentModal
            isOpen={true}
            onClose={() => setCurrentView("list")}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    );
  }

  // ✅ VUE LISTE (par défaut)
  return (
    <div className={`${baseClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Élèves</h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion complète des élèves de l'établissement
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Total Élèves
                </p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Actifs
                </p>
                <p className="text-2xl font-semibold">{stats.actifs}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Suspendus
                </p>
                <p className="text-2xl font-semibold">{stats.suspendus}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Inactifs
                </p>
                <p className="text-2xl font-semibold">{stats.inactifs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions et filtres */}
        <div className={`${cardClasses} p-6 rounded-lg shadow-sm border mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCurrentView("form")} // ✅ Changer la vue
                className={`${buttonPrimaryClasses} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
              >
                <Plus className="h-4 w-4" />
                Inscription
              </button>
              <button
                onClick={() => setCurrentView("reinscription")} // ✅ Changer la vue
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <GraduationCap className="h-4 w-4" />
                Réinscription
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className={`w-full pl-10 pr-3 mb-5 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtres de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.value} value={classe.value}>
                  {classe.label}
                </option>
              ))}
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterSalle}
              onChange={(e) => setFilterSalle(e.target.value)}
            >
              <option value="">Toutes les salles</option>
              {filterClass && sallesByClass[filterClass]
                ? sallesByClass[filterClass].map((salle) => (
                    <option key={salle.value} value={salle.value}>
                      {salle.label}
                    </option>
                  ))
                : Object.values(sallesByClass)
                    .flat()
                    .map((salle) => (
                      <option key={salle.value} value={salle.value}>
                        {salle.label}
                      </option>
                    ))}
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="">Tous les sexes</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 flex items-center gap-2 ${inputClasses} hover:bg-opacity-80`}
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvancedFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filtres avancés */}
          {showAdvancedFilters && (
            <>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Tranche d'âge
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterAge}
                    onChange={(e) => setFilterAge(e.target.value)}
                  >
                    <option value="">Tous les âges</option>
                    <option value="5-10">5-10 ans</option>
                    <option value="10-15">10-15 ans</option>
                    <option value="15-20">15-20 ans</option>
                    <option value="20-25">20-25 ans</option>
                    <option value="25-30">25-30 ans</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    placeholder="Port-au-Prince, Cap-Haïtien..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterBirthPlace}
                    onChange={(e) => setFilterBirthPlace(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse actuelle
                  </label>
                  <input
                    type="text"
                    placeholder="Delmas, Pétion-Ville..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterAddress}
                    onChange={(e) => setFilterAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    École précédente
                  </label>
                  <input
                    type="text"
                    placeholder="École Saint-Joseph..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={filterPreviousSchool}
                    onChange={(e) => setFilterPreviousSchool(e.target.value)}
                  />
                </div>
              </div>

              {/* Section de tri */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Trier par
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Aucun tri</option>
                    <option value="nom">Nom (A-Z)</option>
                    <option value="prenom">Prénom (A-Z)</option>
                    <option value="code">Code (A-Z)</option>
                    <option value="date_naissance">Date de naissance</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Ordre
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                    disabled={!sortBy}
                  >
                    <option value="asc">Croissant (A-Z)</option>
                    <option value="desc">Décroissant (Z-A)</option>
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <button
                    onClick={() => {
                      setSortBy("");
                      setSortOrder("asc");
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses} hover:bg-opacity-80`}
                    disabled={!sortBy}
                  >
                    Réinitialiser le tri
                  </button>
                  {currentSession.role === "Administrateur" || isSuperAdmin ? (
                    <button
                      onClick={getELeveParcours}
                      className={`w-full flex justify-center gap-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses} hover:bg-opacity-80`}
                    >
                      <span>Parcours Scolaire</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        alert(
                          "Vous ne disposez pas des droits nécessaires pour accéder à cette fonctionnalité avancée."
                        )
                      }
                      className={`w-full flex justify-center gap-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses} hover:bg-opacity-80`}
                    >
                      <span>Parcours Scolaire</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Liste des élèves */}
        <div
          className={`${cardClasses} rounded-lg shadow-sm border overflow-hidden`}
        >
          {/* Contrôles de pagination - AU-DESSUS DU TABLEAU */}
          <div
            className={`${cardClasses} p-4 rounded-lg shadow-sm border mb-4`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Affichage de{" "}
                  <span className="font-semibold">
                    {itemsPerPage === -1
                      ? totalItems
                      : Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          totalItems
                        )}
                  </span>{" "}
                  à{" "}
                  <span className="font-semibold">
                    {itemsPerPage === -1
                      ? totalItems
                      : Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  sur <span className="font-semibold">{totalItems}</span> élèves
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Par page:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={25}>25</option>
                    <option value={30}>30</option>
                    <option value={-1}>Tous</option>
                  </select>
                </div>
              </div>

              {/* Boutons de navigation */}
              {itemsPerPage !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    title="Première page"
                  >
                    ««
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    title="Page précédente"
                  >
                    «
                  </button>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            currentPage === pageNumber
                              ? buttonPrimaryClasses
                              : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    title="Page suivante"
                  >
                    »
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    title="Dernière page"
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Code
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Élève
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Classe/Salle
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Lieu
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Statut
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode
                    ? "bg-gray-800 divide-gray-700"
                    : "bg-white divide-gray-200"
                }`}
              >
                {paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">
                          {student.prenom} {student.nom}
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {student.sexe === "M" ? "Masculin" : "Féminin"} • Âge:{" "}
                          {calculateAge(student.date_naissance)} ans
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {getClasseName(student.classe_id)}
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Salle:{" "}
                          {getSalleName(student.classe_id, student.salle_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {student.ville_naissance},{student.region_naissance}
                            /{student.section_naissance}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {student.adresse_actuelle.length > 20
                              ? student.adresse_actuelle.substring(0, 20) +
                                "..."
                              : student.adresse_actuelle}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          student.statut || "inactif"
                        )}`}
                      >
                        {student.statut
                          ? student.statut.charAt(0).toUpperCase() +
                            student.statut.slice(1)
                          : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-400 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editStudent(student)}
                          className={`transition-colors ${
                            isDarkMode
                              ? "text-gray-400 hover:text-gray-200"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {student.statut === "actif" ? (
                          <button
                            onClick={() =>
                              changeStudentStatus(student, "suspendu")
                            }
                            disabled={
                              isChangingStatus &&
                              loadingStudentId === student.id
                            }
                            className="text-orange-600 hover:text-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Suspendre"
                          >
                            {isChangingStatus &&
                            loadingStudentId === student.id ? (
                              <Spinner size="sm" color="orange" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              changeStudentStatus(student, "actif")
                            }
                            disabled={
                              isChangingStatus &&
                              loadingStudentId === student.id
                            }
                            className="text-green-600 hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Activer"
                          >
                            {isChangingStatus &&
                            loadingStudentId === student.id ? (
                              <Spinner size="sm" color="green" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteStudent(student.id)}
                          disabled={
                            isDeleting && loadingStudentId === student.id
                          }
                          className="text-red-600 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer"
                        >
                          {isDeleting && loadingStudentId === student.id ? (
                            <Spinner size="sm" color="red" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Contrôles de pagination - EN BAS DU TABLEAU */}
            {itemsPerPage !== -1 && totalPages > 1 && (
              <div
                className={`${cardClasses} p-4 rounded-lg shadow-sm border mt-4`}
              >
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    ««
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    « Précédent
                  </button>

                  <span
                    className={`px-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Page {currentPage} sur {totalPages}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Suivant »
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {paginatedStudents.length === 0 && (
          <div className="text-center py-12">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {filteredStudents.length === 0
                ? "Aucun élève trouvé selon vos critères de recherche."
                : "Aucun élève sur cette page."}
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails - GARDE LE MODAL */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${cardClasses} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Détails de l'élève</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`hover:text-red-500 transition-colors ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Code
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.code}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nom complet
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.prenom} {selectedStudent.nom}
                  </p>
                </div>
                <div>
                  <label>Date de naissance</label>
                  <p>
                    {selectedStudent.date_naissance} (
                    {calculateAge(selectedStudent.date_naissance)} ans)
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Lieu de naissance
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.ville_naissance},{" "}
                    {selectedStudent.region_naissance},{" "}
                    {selectedStudent.pays_naissance}
                    {selectedStudent.section_naissance &&
                      ` (${selectedStudent.section_naissance})`}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sexe
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.sexe === "M" ? "Masculin" : "Féminin"}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Classe / Salle
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {getClasseName(selectedStudent.classe_id)} -{" "}
                    {getSalleName(
                      selectedStudent.classe_id,
                      selectedStudent.salle_id
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse actuelle
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.adresse_actuelle}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Téléphone parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.telephone_parents}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    NIF parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.nif_parents}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.adresse_parents}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Moyenne générale
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.moyenne_generale}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Établissement précédent
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.etablissement_precedent}
                  </p>
                </div>
                {selectedStudent.observations_inscription && (
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Observations
                    </label>
                    <p
                      className={`text-sm p-2 rounded ${
                        isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-50 text-gray-900"
                      }`}
                    >
                      {selectedStudent.observations_inscription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals existants - GARDER */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        students={eleves.map((e) => ({
          id: e.id,
          code: e.code,
          nom: e.nom,
          prenom: e.prenom,
          dateNaissance: e.date_naissance,
          pays_naissance: e.pays_naissance,
          region_naissance: e.region_naissance,
          ville_naissance: e.ville_naissance,
          section_naissance: e.section_naissance,
          sexe: e.sexe,
          adresseActuelle: e.adresse_actuelle,
          telephoneParents: e.telephone_parents,
          adresseParents: e.adresse_parents,
          nifParents: e.nif_parents,
          classesDemandee: e.classe_id,
          salle: e.salle_id,
          moyenneGenerale: e.moyenne_generale,
          etablissementPrecedent: e.etablissement_precedent,
          status: e.statut,
          dateInscription: e.date_inscription,
          observations: e.observations_inscription,
          photoUrl: e.photo_url,
        }))}
        isDarkMode={isDarkMode}
      />

      <DoublonConfirmationModal
        isOpen={showDoublonModal}
        onClose={() => setShowDoublonModal(false)}
        onConfirm={handleDoublonConfirm}
        onCancel={handleDoublonCancel}
        doublons={doublonsDetectes}
        isDarkMode={isDarkMode}
      />

      <ParcoursAcademiqueModal
        getParcoursAcademique={getParcoursAcademique}
        isOpen={isOpen}
        onClose={onClose}
        isDarkMode={isDarkMode}
        eleveId={idEleve}
      />

      <StudentSearchModal
        isOpen={isOpen2}
        onClose={() => setIsOpen2(false)}
        isDarkMode={isDarkMode}
        onSearchComplete={handleParcoursEleve}
      />
    </div>
  );
};

export default ElevesPage;
