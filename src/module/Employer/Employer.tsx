import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Printer,
  X,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Check,
  Loader2,
  Filter,
} from "lucide-react";
import {
  Employer,
  EmployerFormData,
  FONCTIONS,
  DEPARTEMENTS,
} from "../../types/EmployerType";
import { useEmployer } from "../../Context/ContextEmployer";
import { useAnneeScolaire } from "../../Context/ContextAnneeScolaire";
import { EntetIMFP } from "../AnneeAcademique/module";

interface Props {
  isDarkMode?: boolean;
}

const SelectWithSearch = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  multiple = false,
  isDarkMode = false,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  multiple?: boolean;
  isDarkMode?: boolean;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900";
  const dropdownClasses = isDarkMode
    ? "bg-gray-700 border-gray-600"
    : "bg-white border-gray-300";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  const handleOptionClick = (value: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange([value]);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const displayText =
    selectedLabels.length > 0
      ? multiple
        ? selectedLabels.join(", ")
        : selectedLabels[0]
      : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${inputClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "focus:ring-2 focus:ring-blue-500"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedLabels.length > 0 ? "" : "text-gray-400"}>
          {displayText}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg ${dropdownClasses}`}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Rechercher..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer hover:${
                    isDarkMode ? "bg-gray-600" : "bg-gray-100"
                  } flex items-center justify-between`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <span>{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {multiple && selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedLabels.map((label, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                isDarkMode
                  ? "bg-blue-900 text-blue-200"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const optionValue = options.find(
                    (opt) => opt.label === label
                  )?.value;
                  if (optionValue) {
                    const newValues = selectedValues.filter(
                      (v) => v !== optionValue
                    );
                    onChange(newValues);
                  }
                }}
                className="ml-2 hover:bg-blue-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const validateNifCin = (value: string): boolean => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue.length === 10;
};

const formatNifCin = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length === 10 && cleanValue.startsWith("0")) {
    return `${cleanValue.slice(0, 3)}-${cleanValue.slice(
      3,
      6
    )}-${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
  }
  return cleanValue;
};

const GestionEmployes = ({ isDarkMode = false }: Props) => {
  const {
    employes,
    ajouterEmployer,
    modifierEmployer,
    supprimerEmployer,
    rechercherEmployes,
    genererNouveauCode,
  } = useEmployer();
  const { currentYear } = useAnneeScolaire();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | "delete"
  >("add");
  const [selectedEmp, setSelectedEmp] = useState<Employer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFonction, setFilterFonction] = useState<string>("");
  const [filterDepartement, setFilterDepartement] = useState<string>("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [printHeader, setPrintHeader] = useState({
    companyName: "",
    address: "",
    phone: "",
  });
  const [printColumns, setPrintColumns] = useState({
    code: true,
    nom: true,
    prenom: true,
    email: false,
    telephone: true,
    nifcin: false,
    fonction: true,
    departement: true,
  });

  const [formData, setFormData] = useState<EmployerFormData>({
    code: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    date_embauche: "",
    nif_cin: "",
    diplomes: "",
    responsabilites: "",
    fonction: "",
    departement: "",
    statut: "actif",
    annee_scolaire_id: "",
  });

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
  const buttonSecondaryClasses = isDarkMode
    ? "bg-gray-600 hover:bg-gray-500 text-white"
    : "bg-gray-300 hover:bg-gray-400 text-gray-700";
  const buttonDangerClasses = isDarkMode
    ? "bg-red-700 hover:bg-red-600 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";
  const tableHeaderClasses = isDarkMode
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-50 text-gray-500";
  const tableRowClasses = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const tableBorderClasses = isDarkMode ? "divide-gray-700" : "divide-gray-200";

  // Règles d'auto-département selon la fonction
  useEffect(() => {
    if (!formData.fonction) return;
    const f = formData.fonction.toLowerCase();
    let suggested = "";
    if (["censeur", "surveillant"].includes(f)) suggested = "Censora";
    else if (
      ["directeur", "directeur pédagogique", "directeur pedagogique"].includes(
        f
      )
    )
      suggested = "Direction";
    else if (["économe", "econome"].includes(f)) suggested = "Economat";
    if (suggested && !formData.departement)
      setFormData((p) => ({ ...p, departement: suggested }));
  }, [formData.departement, formData.fonction]);

  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      date_embauche: "",
      nif_cin: "",
      diplomes: "",
      responsabilites: "",
      fonction: "",
      departement: "",
      statut: "actif",
      annee_scolaire_id: "",
    });
  };

  const openModal = async (
    type: "add" | "edit" | "view" | "delete",
    emp: Employer | null = null
  ) => {
    setModalType(type);
    setSelectedEmp(emp);

    if (type === "add") {
      resetForm();
      try {
        const newCode = await genererNouveauCode();
        setFormData((prev) => ({ ...prev, code: newCode }));
      } catch {
        const lastNum = employes.reduce((m, e) => {
          const n = parseInt((e.code || "").replace("EMP", ""));
          return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        setFormData((prev) => ({
          ...prev,
          code: `EMP${String(lastNum + 1).padStart(3, "0")}`,
        }));
      }
    } else if (type === "edit" && emp) {
      setFormData({
        code: emp.code,
        nom: emp.nom,
        prenom: emp.prenom,
        email: emp.email,
        telephone: emp.telephone,
        adresse: emp.adresse,
        date_embauche: emp.date_embauche,
        nif_cin: emp.nif_cin,
        diplomes: emp.diplomes || "",
        responsabilites: emp.responsabilites || "",
        fonction: emp.fonction || "",
        departement: emp.departement || "",
        statut: emp.statut,
        annee_scolaire_id: emp.annee_scolaire_id,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmp(null);
    resetForm();
  };

  const handleInputChange = (field: keyof EmployerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert("Veuillez remplir nom, prénom et email");
      return;
    }
    if (formData.nif_cin && !validateNifCin(formData.nif_cin)) {
      alert("Le NIF/CIN doit contenir exactement 10 chiffres");
      return;
    }
    if (!currentYear) {
      alert("Veuillez d'abord sélectionner une année scolaire.");
      return;
    }

    try {
      setIsSubmitting(true);
      const employerData = {
        ...formData,
        annee_scolaire_id: currentYear.id,
      } as EmployerFormData;
      if (modalType === "add") {
        await ajouterEmployer(employerData);
        alert("Employé ajouté avec succès!");
      } else if (modalType === "edit" && selectedEmp) {
        await modifierEmployer(selectedEmp.id, employerData);
        alert("Employé modifié avec succès!");
      }
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmp) return;
    try {
      setIsDeleting(true);
      await supprimerEmployer(selectedEmp.id);
      setTimeout(() => {
        alert("Employé supprimé avec succès!");
        closeModal();
      }, 100);
    } catch (e) {
      alert("Erreur lors de la suppression de l'employé");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployes = (
    searchTerm ? rechercherEmployes(searchTerm) : employes
  ).filter((emp) => {
    const okF = filterFonction ? (emp.fonction || "") === filterFonction : true;
    const okD = filterDepartement
      ? (emp.departement || "") === filterDepartement
      : true;
    const okS = filterStatut ? (emp.statut || "") === filterStatut : true;
    return okF && okD && okS;
  });

  const handlePrint = () => {
    const list = filteredEmployes;
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; }
        .header { text-align: center; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; margin-top: 4px; }
        .meta { font-size: 12px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #444; padding: 6px 8px; font-size: 12px; }
        th { background: #f0f0f0; text-align: left; }
        @media print { .page-break { page-break-after: always; } }
      </style>
    `;
    const columns: { key: string; label: string }[] = [];
    if (printColumns.code) columns.push({ key: "code", label: "Code" });
    if (printColumns.nom) columns.push({ key: "nom", label: "Nom" });
    if (printColumns.prenom) columns.push({ key: "prenom", label: "Prénom" });
    if (printColumns.email) columns.push({ key: "email", label: "Email" });
    if (printColumns.telephone)
      columns.push({ key: "telephone", label: "Téléphone" });
    if (printColumns.nifcin) columns.push({ key: "nif_cin", label: "NIF/CIN" });
    if (printColumns.fonction)
      columns.push({ key: "fonction", label: "Fonction" });
    if (printColumns.departement)
      columns.push({ key: "departement", label: "Département" });

    const rows = list.map(
      (p) =>
        ({
          code: p.code,
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          telephone: p.telephone,
          nif_cin: p.nif_cin || "",
          fonction: p.fonction || "",
          departement: p.departement || "",
        } as Record<string, string>)
    );

    const thead = `<tr>${columns
      .map((c) => `<th>${c.label}</th>`)
      .join("")}</tr>`;
    const tbody = rows
      .map(
        (r) =>
          `<tr>${columns
            .map((c) => `<td>${(r as any)[c.key] || ""}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html>
        <head><meta charset="utf-8" />${style}</head>
        <body>
         ${EntetIMFP(`Lise des Employés`)}
          <table>
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const fonctionOptions = FONCTIONS.map((f) => ({ value: f, label: f }));
  const departementOptions = DEPARTEMENTS.map((d) => ({ value: d, label: d }));

  return (
    <div className={`${baseClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Employés</h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion du personnel de l'établissement - SIGEP
          </p>
          {currentYear && (
            <p
              className={`text-sm mt-2 ${
                isDarkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              Année scolaire courante : <strong>{currentYear.year}</strong>
            </p>
          )}
          {!currentYear && (
            <p
              className={`text-sm mt-2 ${
                isDarkMode ? "text-yellow-300" : "text-yellow-600"
              }`}
            >
              ⚠️ Aucune année scolaire sélectionnée. Veuillez d'abord
              sélectionner une année scolaire.
            </p>
          )}
        </div>

        <div className={`${cardClasses} rounded-lg shadow-sm border p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${buttonSecondaryClasses}`}
              aria-label="Afficher/masquer les filtres"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>

            <button
              onClick={() => openModal("add")}
              disabled={!currentYear}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                !currentYear
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : buttonPrimaryClasses
              }`}
            >
              <Plus className="h-4 w-4" />
              Ajouter un Employé
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${buttonSecondaryClasses}`}
            >
              <Printer className="h-4 w-4" />
              Imprimer la liste
            </button>
          </div>
        </div>

        {!showFilters && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <SelectWithSearch
                options={[
                  { value: "", label: "Toutes les fonctions" },
                  ...fonctionOptions,
                ]}
                selectedValues={filterFonction ? [filterFonction] : [""]}
                onChange={(values) => setFilterFonction(values[0] || "")}
                placeholder="Filtrer par fonction"
                multiple={false}
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <SelectWithSearch
                options={[
                  { value: "", label: "Tous les départements" },
                  ...departementOptions,
                ]}
                selectedValues={filterDepartement ? [filterDepartement] : [""]}
                onChange={(values) => setFilterDepartement(values[0] || "")}
                placeholder="Filtrer par département"
                multiple={false}
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <SelectWithSearch
                options={[
                  { value: "", label: "Tous les statuts" },
                  { value: "actif", label: "Actif" },
                  { value: "inactif", label: "Inactif" },
                ]}
                selectedValues={filterStatut ? [filterStatut] : [""]}
                onChange={(values) => setFilterStatut(values[0] || "")}
                placeholder="Filtrer par statut"
                multiple={false}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-blue-900" : "bg-blue-100"
                }`}
              >
                <Users
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Total Employés
                </p>
                <p className="text-2xl font-bold">{employes.length}</p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-green-900" : "bg-green-100"
                }`}
              >
                <CheckCircle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Actifs
                </p>
                <p className="text-2xl font-bold">
                  {employes.filter((p) => p.statut === "actif").length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-red-900" : "bg-red-100"
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Inactifs
                </p>
                <p className="text-2xl font-bold">
                  {employes.filter((p) => p.statut === "inactif").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${cardClasses} rounded-lg shadow-sm border`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Liste des Employés ({filteredEmployes.length})
            </h2>

            {filteredEmployes.length === 0 ? (
              <div className="text-center py-12">
                <User
                  className={`h-16 w-16 mx-auto mb-4 ${
                    isDarkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Aucun employé trouvé
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeaderClasses}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Fonction / Département
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${tableBorderClasses}`}>
                    {filteredEmployes.map((emp) => (
                      <tr key={emp.id} className={tableRowClasses}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                                }`}
                              >
                                <User
                                  className={`h-5 w-5 ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {emp.prenom} {emp.nom}
                              </div>
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {emp.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{emp.email}</div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {emp.telephone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isDarkMode
                                  ? "bg-blue-900 text-blue-200"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {emp.fonction || "-"}
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                isDarkMode
                                  ? "bg-purple-900 text-purple-200"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {emp.departement || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              emp.statut === "actif"
                                ? isDarkMode
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : isDarkMode
                                ? "bg-red-900 text-red-300"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {emp.statut === "actif" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal("view", emp)}
                              className={`${
                                isDarkMode
                                  ? "text-gray-400 hover:text-gray-200"
                                  : "text-gray-600 hover:text-gray-900"
                              } p-1`}
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("edit", emp)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("delete", emp)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    {modalType === "add" && "Ajouter un Employé"}
                    {modalType === "edit" && "Modifier l'Employé"}
                    {modalType === "view" && "Détails de l'Employé"}
                    {modalType === "delete" && "Confirmer la Suppression"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {modalType === "delete" ? (
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      } mb-6`}
                    >
                      Êtes-vous sûr de vouloir supprimer l'employé{" "}
                      <strong>
                        {selectedEmp?.prenom} {selectedEmp?.nom}
                      </strong>{" "}
                      ?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          isDeleting
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : buttonDangerClasses
                        }`}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isDeleting ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                ) : modalType === "view" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">
                          Informations personnelles
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <strong>Code:</strong> {selectedEmp?.code}
                          </div>
                          <div>
                            <strong>Nom:</strong> {selectedEmp?.nom}
                          </div>
                          <div>
                            <strong>Prénom:</strong> {selectedEmp?.prenom}
                          </div>
                          <div>
                            <strong>Email:</strong> {selectedEmp?.email}
                          </div>
                          <div>
                            <strong>Téléphone:</strong> {selectedEmp?.telephone}
                          </div>
                          <div>
                            <strong>Adresse:</strong> {selectedEmp?.adresse}
                          </div>
                          <div>
                            <strong>NIF/CIN:</strong>{" "}
                            {selectedEmp?.nif_cin || "Non renseigné"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-4">
                          Informations professionnelles
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <strong>Date d'embauche:</strong>{" "}
                            {selectedEmp?.date_embauche
                              ? new Date(
                                  selectedEmp.date_embauche
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div>
                            <strong>Statut:</strong>{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                selectedEmp?.statut === "actif"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {selectedEmp?.statut}
                            </span>
                          </div>
                          <div>
                            <strong>Fonction:</strong> {selectedEmp?.fonction}
                          </div>
                          <div>
                            <strong>Département:</strong>{" "}
                            {selectedEmp?.departement}
                          </div>
                          <div>
                            <strong>Responsabilités:</strong>{" "}
                            {selectedEmp?.responsabilites}
                          </div>
                          <div>
                            <strong>Diplômes:</strong> {selectedEmp?.diplomes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Code Employé *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.code}
                          onChange={(e) =>
                            handleInputChange("code", e.target.value)
                          }
                          disabled={modalType === "edit"}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Statut *
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.statut}
                          onChange={(e) =>
                            handleInputChange(
                              "statut",
                              e.target.value as "actif" | "inactif"
                            )
                          }
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Nom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.nom}
                          onChange={(e) =>
                            handleInputChange("nom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Prénom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.prenom}
                          onChange={(e) =>
                            handleInputChange("prenom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.telephone}
                          onChange={(e) =>
                            handleInputChange("telephone", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Adresse
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.adresse}
                          onChange={(e) =>
                            handleInputChange("adresse", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Date d'embauche
                        </label>
                        <input
                          type="date"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.date_embauche}
                          onChange={(e) =>
                            handleInputChange("date_embauche", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          NIF/CIN
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 0024358933 ou 5784673767"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.nif_cin}
                          onChange={(e) =>
                            handleInputChange(
                              "nif_cin",
                              formatNifCin(e.target.value)
                            )
                          }
                          maxLength={13}
                        />
                        <p
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        ></p>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Fonction
                        </label>
                        <SelectWithSearch
                          options={fonctionOptions}
                          selectedValues={
                            formData.fonction ? [formData.fonction] : []
                          }
                          onChange={(values) =>
                            handleInputChange("fonction", values[0] || "")
                          }
                          placeholder="Sélectionner une fonction..."
                          multiple={false}
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Département
                        </label>
                        <SelectWithSearch
                          options={departementOptions}
                          selectedValues={
                            formData.departement ? [formData.departement] : []
                          }
                          onChange={(values) =>
                            handleInputChange("departement", values[0] || "")
                          }
                          placeholder="Sélectionner un département..."
                          multiple={false}
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Diplômes et qualifications
                        </label>
                        <textarea
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.diplomes}
                          onChange={(e) =>
                            handleInputChange("diplomes", e.target.value)
                          }
                          placeholder="Ex: Licence, Master, ..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Responsabilités
                        </label>
                        <textarea
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.responsabilites}
                          onChange={(e) =>
                            handleInputChange("responsabilites", e.target.value)
                          }
                          placeholder="Décrivez les responsabilités..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : buttonPrimaryClasses
                        }`}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSubmitting
                          ? "Sauvegarde..."
                          : modalType === "add"
                          ? "Ajouter"
                          : "Modifier"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className={`${cardClasses} rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    Préparer l'impression
                  </h3>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1  gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Colonnes à imprimer</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { key: "code", label: "Code" },
                        { key: "nom", label: "Nom" },
                        { key: "prenom", label: "Prénom" },
                        { key: "email", label: "Email" },
                        { key: "telephone", label: "Téléphone" },
                        { key: "nifcin", label: "NIF/CIN" },
                        { key: "fonction", label: "Fonction" },
                        { key: "departement", label: "Département" },
                      ].map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(printColumns as any)[col.key]}
                            onChange={(e) =>
                              setPrintColumns({
                                ...printColumns,
                                [col.key]: e.target.checked,
                              })
                            }
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handlePrint()}
                    className={`px-4 py-2 rounded-lg ${buttonPrimaryClasses}`}
                  >
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionEmployes;
