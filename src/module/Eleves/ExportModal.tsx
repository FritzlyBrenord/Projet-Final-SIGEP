import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Download,
  Building,
  MapPin,
  Phone,
  FileText,
  Table,
  Printer,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { EntetIMFP } from "../AnneeAcademique/module";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";
// Assurez-vous que ces imports sont présents

import html2canvas from "html2canvas"; // À installer si pas déjà fait

interface Student {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  pays_naissance: string;
  region_naissance: string;
  ville_naissance: string;
  section_naissance?: string;
  sexe: "M" | "F";
  adresseActuelle: string;
  telephoneParents: string;
  adresseParents: string;
  nifParents: string;
  classesDemandee: string;
  salle: string;
  moyenneGenerale: number;
  etablissementPrecedent: string;
  status: "actif" | "inactif" | "suspendu";
  dateInscription: string;
  observations?: string;
}

interface ExportColumn {
  id: string;
  label: string;
  key: string;
  isSelected: boolean;
  isCustom: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  isDarkMode: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  students,
  isDarkMode,
}) => {
  const { currentYear } = useAnneeScolaire();
  const { addActivity } = useRecentActivities();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSalle, setSelectedSalle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [etablissementInfo, setEtablissementInfo] = useState({
    nom: "École Secondaire SIGEP",
    adresse: "123 Avenue Jean-Jacques Dessalines, Port-au-Prince, Haïti",
    telephone: "+509 1234-5678",
  });

  // Colonnes disponibles pour l'export
  const [availableColumns, setAvailableColumns] = useState<ExportColumn[]>([
    {
      id: "code",
      label: "Code",
      key: "code",
      isSelected: true,
      isCustom: false,
    },
    { id: "nom", label: "Nom", key: "nom", isSelected: true, isCustom: false },
    {
      id: "prenom",
      label: "Prénom",
      key: "prenom",
      isSelected: true,
      isCustom: false,
    },
    {
      id: "sexe",
      label: "Sexe",
      key: "sexe",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "dateNaissance",
      label: "Date de naissance",
      key: "dateNaissance",
      isSelected: false,
      isCustom: false,
    },

    {
      id: "paysNaissance",
      label: "Pays de naissance",
      key: "paysNaissance",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "regionNaissance",
      label: "Region de naissance",
      key: "regionNaissance",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "villeNaissance",
      label: "Ville de naissance",
      key: "villeNaissance",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "sectionNaissance",
      label: "Section de naissance",
      key: "sectionNaissance",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "adresseActuelle",
      label: "Adresse actuelle",
      key: "adresseActuelle",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "telephoneParents",
      label: "Téléphone parents",
      key: "telephoneParents",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "nifParents",
      label: "NIF parents",
      key: "nifParents",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "adresseParents",
      label: "Adresse parents",
      key: "adresseParents",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "classesDemandee",
      label: "Classe",
      key: "classesDemandee",
      isSelected: true,
      isCustom: false,
    },
    {
      id: "salle",
      label: "Salle",
      key: "salle",
      isSelected: true,
      isCustom: false,
    },
    {
      id: "moyenneGenerale",
      label: "Moyenne générale",
      key: "moyenneGenerale",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "etablissementPrecedent",
      label: "Établissement précédent",
      key: "etablissementPrecedent",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "status",
      label: "Statut",
      key: "status",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "dateInscription",
      label: "Date d'inscription",
      key: "dateInscription",
      isSelected: false,
      isCustom: false,
    },
    {
      id: "observations",
      label: "Observations",
      key: "observations",
      isSelected: false,
      isCustom: false,
    },
  ]);

  const [customColumns, setCustomColumns] = useState<ExportColumn[]>([]);

  const classes = useMemo(
    () =>
      currentYear?.classes.map((classe) => ({
        value: classe.id,
        label: classe.name,
      })) || [],
    [currentYear?.classes]
  ) as { value: string; label: string }[];

  // Salles organisées par classe depuis le contexte
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

  const classSelector = (idClass: any) => {
    return classes.find((item) => item.value === idClass)?.label;
  };
  const salleSelector = (idSalle: any, idClass?: any) => {
    const classId = idClass || selectedClass;
    return sallesByClass[classId]?.find((item) => item.value === idSalle)
      ?.label;
  };

  // Filtrer et trier les étudiants selon les critères sélectionnés
  const getFilteredStudents = () => {
    let filtered = students;

    if (selectedClass) {
      filtered = filtered.filter(
        (student) => student.classesDemandee === selectedClass
      );
    }

    if (selectedSalle) {
      filtered = filtered.filter((student) => student.salle === selectedSalle);
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (student) => student.status === selectedStatus
      );
    }

    // Appliquer le tri
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        switch (sortBy) {
          case "nom":
            aValue = a.nom.toLowerCase();
            bValue = b.nom.toLowerCase();
            break;
          case "prenom":
            aValue = a.prenom.toLowerCase();
            bValue = b.prenom.toLowerCase();
            break;
          case "code":
            aValue = a.code.toLowerCase();
            bValue = b.code.toLowerCase();
            break;
          case "dateNaissance":
            aValue = a.dateNaissance;
            bValue = b.dateNaissance;
            break;
          default:
            return 0;
        }

        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  };

  // Toggle sélection d'une colonne
  const toggleColumn = (columnId: string) => {
    setAvailableColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, isSelected: !col.isSelected } : col
      )
    );
  };

  // Ajouter une colonne vide
  const addEmptyColumn = () => {
    const newColumn: ExportColumn = {
      id: `empty_${Date.now()}`,
      label: "Colonne vide",
      key: "",
      isSelected: true,
      isCustom: true,
    };
    setCustomColumns((prev) => [...prev, newColumn]);
  };

  // Supprimer une colonne personnalisée
  const removeCustomColumn = (columnId: string) => {
    setCustomColumns((prev) => prev.filter((col) => col.id !== columnId));
  };

  // Modifier le label d'une colonne personnalisée
  const updateCustomColumnLabel = (columnId: string, newLabel: string) => {
    setCustomColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, label: newLabel } : col
      )
    );
  };

  // Générer le HTML du tableau
  const generateHTMLTable = () => {
    const filteredStudents = getFilteredStudents();
    const selectedColumns = [
      ...availableColumns.filter((col) => col.isSelected),
      ...customColumns.filter((col) => col.isSelected),
    ];

    const currentDate = new Date().toLocaleDateString("fr-FR");

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liste des Élèves - ${etablissementInfo.nom}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            font-size: 14px;
        }
        .info {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .info p {
            margin: 5px 0;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th {
            background-color: #34495e;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
            font-size: 12px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e3f2fd;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .status-actif { color: #27ae60; font-weight: bold; }
        .status-inactif { color: #95a5a6; font-weight: bold; }
        .status-suspendu { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
   ${EntetIMFP("Listes des Élèves")}
   
    <div class="info">
      
        <p><strong>Nombre d'élèves:</strong> ${filteredStudents.length}</p>
        ${
          selectedClass
            ? `<p><strong>Classe:</strong> ${classSelector(selectedClass)}</p>`
            : ""
        }
        ${
          selectedSalle
            ? `<p><strong>Salle:</strong> ${salleSelector(selectedSalle)}</p>`
            : ""
        }
        ${
          selectedStatus
            ? `<p><strong>Statut:</strong> ${selectedStatus}</p>`
            : ""
        }
    </div>

    <table>
        <thead>
            <tr>
                ${selectedColumns
                  .map((col) => `<th>${col.label}</th>`)
                  .join("")}
            </tr>
        </thead>
        <tbody>
            ${filteredStudents
              .map(
                (student) => `
                <tr>
                    ${selectedColumns
                      .map((col) => {
                        if (col.isCustom) {
                          return `<td></td>`;
                        }

                        let value = student[col.key as keyof Student];

                        // Formatage spécial pour certains champs
                        if (col.key === "sexe") {
                          value = value === "M" ? "Masculin" : "Féminin";
                        } else if (col.key === "status") {
                          const statusClass = `status-${value}`;
                          value = `<span class="${statusClass}">${
                            String(value).charAt(0).toUpperCase() +
                            String(value).slice(1)
                          }</span>`;
                        } else if (col.key === "dateNaissance") {
                          value = new Date(String(value)).toLocaleDateString(
                            "fr-FR"
                          );
                        } else if (col.key === "dateInscription") {
                          value = new Date(String(value)).toLocaleDateString(
                            "fr-FR"
                          );
                        } else if (col.key === "moyenneGenerale") {
                          value = String(value);
                        } else if (col.key === "salle") {
                          value = `${salleSelector(
                            value,
                            student.classesDemandee
                          )}`;
                        } else if (col.key === "classesDemandee") {
                          value = `${classSelector(value)}`;
                        }

                        return `<td>${value || ""}</td>`;
                      })
                      .join("")}
                </tr>
            `
              )
              .join("")}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Document généré le ${new Date().toLocaleDateString(
          "fr-FR"
        )} par le système SIGEP</p>
    </div>
</body>
</html>`;

    return html;
  };

  // Générer et télécharger PDF
  const downloadPDF = async () => {
    try {
      console.log("🚀 Début de la génération du PDF...");

      // Étape 1: Vérifier les données
      const filteredStudents = getFilteredStudents();
      if (filteredStudents.length === 0) {
        alert("Aucun élève à exporter");
        return;
      }
      console.log(`📊 ${filteredStudents.length} élèves à exporter`);

      // Étape 2: Générer le HTML
      console.log("📝 Génération du HTML...");
      const htmlContent = generateHTMLTable();
      console.log("HTML généré avec succès, longueur:", htmlContent.length);

      // Étape 3: Créer un conteneur mieux configuré
      const printContainer = document.createElement("div");
      printContainer.id = "pdf-export-container";
      printContainer.style.position = "fixed";
      printContainer.style.left = "0";
      printContainer.style.top = "0";
      printContainer.style.width = "210mm";
      printContainer.style.minHeight = "297mm";
      printContainer.style.padding = "20px";
      printContainer.style.backgroundColor = "white";
      printContainer.style.zIndex = "9999";
      printContainer.style.boxSizing = "border-box";
      printContainer.innerHTML = htmlContent;

      document.body.appendChild(printContainer);
      console.log("📦 Conteneur HTML ajouté au DOM");

      // Étape 4: Attendre le rendu
      await new Promise((resolve) => {
        printContainer.onload = resolve;
        setTimeout(resolve, 2000); // Augmenter le temps d'attente
      });

      // Étape 5: Vérifier que le contenu est bien rendu
      console.log("👀 Vérification du rendu...");
      const hasContent = printContainer.innerHTML.length > 0;
      console.log("Contenu présent:", hasContent);
      console.log("Hauteur du conteneur:", printContainer.scrollHeight);

      if (!hasContent) {
        throw new Error("Le conteneur HTML est vide");
      }

      // Étape 6: Configuration html2canvas
      console.log("📸 Début de la conversion html2canvas...");
      const canvas = await html2canvas(printContainer, {
        scale: 1, // Commencer avec scale 1 pour debug
        useCORS: true,
        logging: true, // Activer les logs pour debug
        backgroundColor: "#ffffff",
        width: printContainer.scrollWidth,
        height: printContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: printContainer.scrollWidth,
        windowHeight: printContainer.scrollHeight,
      });
      console.log("✅ html2canvas réussi");

      // Étape 7: Nettoyage
      document.body.removeChild(printContainer);
      console.log("🧹 Conteneur nettoyé");

      // Étape 8: Création du PDF
      console.log("📄 Création du PDF...");
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Étape 9: Sauvegarde
      const fileName = `liste_eleves_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
      console.log("💾 PDF sauvegardé:", fileName);

      // Étape 10: Historique
      addActivity({
        action: "export",
        module: "Gestion Élèves",
        title: "PDF généré",
        details: `Un PDF de la liste des élèves a été généré avec ${filteredStudents.length} élève(s).`,
      });
    } catch (error) {
      console.error("❌ ERREUR DÉTAILLÉE:", error);
      console.error(
        "Type d erreur:",
        error instanceof Error ? error.constructor.name : "Unknown"
      );
      console.error("Message:", error instanceof Error ? error.message : error);
      console.error(
        "Stack:",
        error instanceof Error ? error.stack : "No stack"
      );

      // Nettoyage en cas d'erreur
      const container = document.getElementById("pdf-export-container");
      if (container) {
        document.body.removeChild(container);
      }

      alert(
        `Erreur détaillée: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }. Utilisation de la méthode alternative...`
      );
      downloadPDFFallback();
    }
  };
  const downloadPDFFallback = () => {
    console.log("🔄 Utilisation de la méthode de secours...");

    const filteredStudents = getFilteredStudents();
    const selectedColumns = [
      ...availableColumns.filter((col) => col.isSelected),
      ...customColumns.filter((col) => col.isSelected),
    ];

    const doc = new jsPDF("p", "mm", "a4");

    // En-tête simplifié
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LISTE DES ÉLÈVES", 105, 20, { align: "center" });

    // Informations de base
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPosition = 35;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, yPosition);
    doc.text(`Nombre d'élèves: ${filteredStudents.length}`, 14, yPosition + 5);

    if (selectedClass) {
      doc.text(`Classe: ${classSelector(selectedClass)}`, 14, yPosition + 10);
      yPosition += 5;
    }
    if (selectedSalle) {
      doc.text(
        `Salle: ${salleSelector(selectedSalle, selectedClass)}`,
        14,
        yPosition + 10
      );
      yPosition += 5;
    }

    // Préparer les données pour le tableau
    const headers = selectedColumns.map((col) => col.label);
    const data = filteredStudents.map((student) =>
      selectedColumns.map((col) => {
        if (col.isCustom) return "";

        let value = student[col.key as keyof Student];

        // Utiliser le même formatage que le HTML
        if (col.key === "sexe") {
          value = value === "M" ? "Masculin" : "Féminin";
        } else if (col.key === "status") {
          value =
            String(value).charAt(0).toUpperCase() + String(value).slice(1);
        } else if (
          col.key === "dateNaissance" ||
          col.key === "dateInscription"
        ) {
          value = new Date(String(value)).toLocaleDateString("fr-FR");
        } else if (col.key === "salle") {
          value = `${salleSelector(value, student.classesDemandee)}`;
        } else if (col.key === "classesDemandee") {
          value = `${classSelector(value)}`;
        }

        return String(value || "");
      })
    );

    // Générer le tableau
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: yPosition + 15,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    doc.save(
      `liste_eleves_${new Date().toISOString().split("T")[0]}_fallback.pdf`
    );

    addActivity({
      action: "export",
      module: "Gestion Élèves",
      title: "PDF généré (méthode secours)",
      details: `PDF généré avec méthode alternative - ${filteredStudents.length} élève(s).`,
    });
  };

  // Générer et télécharger Excel
  const downloadExcel = () => {
    const filteredStudents = getFilteredStudents();
    const selectedColumns = [
      ...availableColumns.filter((col) => col.isSelected),
      ...customColumns.filter((col) => col.isSelected),
    ];

    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();

    // Préparer les données
    const headers = selectedColumns.map((col) => col.label);
    const data = filteredStudents.map((student) =>
      selectedColumns.map((col) => {
        if (col.isCustom) {
          return "";
        }

        let value = student[col.key as keyof Student];

        // Formatage spécial pour certains champs
        if (col.key === "sexe") {
          value = value === "M" ? "Masculin" : "Féminin";
        } else if (col.key === "status") {
          value =
            String(value).charAt(0).toUpperCase() + String(value).slice(1);
        } else if (col.key === "dateNaissance") {
          value = new Date(String(value)).toLocaleDateString("fr-FR");
        } else if (col.key === "dateInscription") {
          value = new Date(String(value)).toLocaleDateString("fr-FR");
        }
        addActivity({
          action: "export",
          module: "Gestion Élèves",
          title: "Pdf généré",
          details: `Un pdf de la liste des élèves a été généré.`,
        });

        return value || "";
      })
    );

    // Créer la feuille de calcul
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Définir la largeur des colonnes
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, "Liste des Élèves");

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `liste_eleves_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Imprimer directement
  const printDocument = async () => {
    await addActivity({
      action: "export",
      module: "Gestion Élèves",
      title: "Document imprimé",
      details: `Document de la liste des élèves imprimé.`,
    });
    const html = generateHTMLTable();
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const baseClasses = isDarkMode
    ? "bg-gray-800 border-gray-700 text-white"
    : "bg-white border-gray-200 text-gray-900";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const buttonPrimaryClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${baseClasses} rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Exporter la liste des élèves salle
            </h2>
            <button
              onClick={onClose}
              className={`hover:text-red-500 transition-colors ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Filtres */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Filtres d'export</h3>

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
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
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
                  value={selectedSalle}
                  onChange={(e) => setSelectedSalle(e.target.value)}
                >
                  <option value="">Toutes les salles</option>
                  {selectedClass && sallesByClass[selectedClass]
                    ? sallesByClass[selectedClass].map((salle) => (
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
                  Statut
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="suspendu">Suspendu</option>
                </select>
              </div>

              {/* Section de tri */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-3">Options de tri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="dateNaissance">Date de naissance</option>
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
                </div>

                {sortBy && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSortBy("");
                        setSortOrder("asc");
                      }}
                      className={`px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 ${inputClasses} hover:bg-opacity-80`}
                    >
                      Réinitialiser le tri
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className="text-sm">
                  <strong>Résultat:</strong> {getFilteredStudents().length}{" "}
                  élève(s) trouvé(s)
                </p>
              </div>
            </div>
          </div>

          {/* Sélection des colonnes */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Colonnes à inclure</h3>
              <button
                onClick={addEmptyColumn}
                className={`${buttonPrimaryClasses} px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors`}
              >
                <Plus className="h-4 w-4" />
                Ajouter colonne vide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableColumns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={column.isSelected}
                    onChange={() => toggleColumn(column.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {column.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Colonnes personnalisées */}
            {customColumns.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">
                  Colonnes personnalisées
                </h4>
                <div className="space-y-2">
                  {customColumns.map((column) => (
                    <div key={column.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={column.isSelected}
                        onChange={() => {
                          setCustomColumns((prev) =>
                            prev.map((col) =>
                              col.id === column.id
                                ? { ...col, isSelected: !col.isSelected }
                                : col
                            )
                          );
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={column.label}
                        onChange={(e) =>
                          updateCustomColumnLabel(column.id, e.target.value)
                        }
                        className={`flex-1 px-2 py-1 border rounded text-sm ${inputClasses}`}
                        placeholder="Nom de la colonne"
                      />
                      <button
                        onClick={() => removeCustomColumn(column.id)}
                        className="text-red-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={downloadPDF}
                disabled={getFilteredStudents().length === 0}
                className={`${buttonPrimaryClasses} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Télécharger en PDF"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>

              <button
                onClick={downloadExcel}
                disabled={getFilteredStudents().length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Télécharger en Excel"
              >
                <Table className="h-4 w-4" />
                Excel
              </button>

              <button
                onClick={printDocument}
                disabled={getFilteredStudents().length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Imprimer directement"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                    : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
