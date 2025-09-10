import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  X,
} from "lucide-react";
import {
  Teacher,
  Subject,
  Class,
  Level,
  AnneeScolaireConstants,
  AddClassFormProps,
  AddSubjectFormProps,
  EditCoefficientModalProps,
  SubjectForEdit,
} from "../../../types/AnneeScolaireType";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { generateClassesPrintContent } from "./PrintUtils";

interface ClassesMatieresProps {
  isDarkMode: boolean;
  onShowEditCoefficientModal: (subject: SubjectForEdit) => void;
}

const ClassesMatieres: React.FC<ClassesMatieresProps> = ({
  isDarkMode,
  onShowEditCoefficientModal,
}) => {
  const {
    anneeActuelle,
    ajouterNiveau,
    ajouterClasse,
    ajouterMatiere,
    supprimerNiveau,
    supprimerClasse,
    supprimerMatiere,
    modifierCoefficientMatiere,
    obtenirConstantes,
  } = useAnneeScolaire();

  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const constants = obtenirConstantes();
  const { availableLevels, availableSubjects } = constants;
  const levels = anneeActuelle?.levels || [];

  const handleAddLevel = (levelName: string) => {
    ajouterNiveau(levelName);
  };

  const handleAddClass = (
    levelId: string,
    className: string,
    maxStudents: number
  ) => {
    ajouterClasse(levelId, className, maxStudents);
  };

  const handleAddSubject = (
    levelId: string,
    classId: string,
    subjectName: string,
    coefficient: number = 100
  ) => {
    ajouterMatiere(levelId, classId, subjectName, coefficient);
  };

  const handleRemoveLevel = (levelId: string) => {
    supprimerNiveau(levelId);
  };

  const handleRemoveClass = (levelId: string, classId: string) => {
    supprimerClasse(levelId, classId);
  };

  const handleRemoveSubject = (
    levelId: string,
    classId: string,
    subjectId: string
  ) => {
    supprimerMatiere(levelId, classId, subjectId);
  };

  const handleUpdateCoefficient = (
    levelId: string,
    classId: string,
    subjectId: string,
    newCoefficient: number
  ) => {
    modifierCoefficientMatiere(levelId, classId, subjectId, newCoefficient);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateClassesPrintContent(levels);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3
          className={`text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Organisation des Classes et Matières
        </h3>
        <div className="flex space-x-2">
          <select
            onChange={(e) => e.target.value && handleAddLevel(e.target.value)}
            value=""
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="">Ajouter une classe</option>
            {availableLevels
              .filter((level) => !levels.some((l) => l.name === level))
              .map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
          </select>
          <button
            onClick={handlePrint}
            className={`px-4 py-2 rounded-lg border flex items-center space-x-2 transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {levels.map((level) => (
        <div
          key={level.id}
          className={`border rounded-lg p-4 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setExpandedLevel(expandedLevel === level.id ? null : level.id)
              }
              className="flex items-center space-x-2"
            >
              {expandedLevel === level.id ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <GraduationCap className="w-5 h-5 text-blue-500" />
              <h4
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {level.name}
              </h4>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {level.classes.length} salle
                {level.classes.length !== 1 ? "s" : ""}
              </span>
            </button>
            <button
              onClick={() => handleRemoveLevel(level.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expandedLevel === level.id && (
            <div className="space-y-4">
              <AddClassForm
                levelId={level.id}
                onAddClass={handleAddClass}
                isDarkMode={isDarkMode}
              />

              {level.classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`border rounded-lg p-4 ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700/50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() =>
                        setExpandedClass(
                          expandedClass === cls.id ? null : cls.id
                        )
                      }
                      className="flex items-center space-x-2"
                    >
                      {expandedClass === cls.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Users className="w-4 h-4 text-green-500" />
                      <span
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {cls.name}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          isDarkMode
                            ? "bg-gray-600 text-gray-300"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        Max: {cls.maxStudents} élèves
                      </span>
                    </button>
                    <button
                      onClick={() => handleRemoveClass(level.id, cls.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedClass === cls.id && (
                    <div className="space-y-3">
                      <div>
                        <h5
                          className={`text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Matières ({cls.subjects.length})
                        </h5>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {cls.subjects.map((subject) => (
                            <span
                              key={subject.id}
                              className={`px-3 py-1 rounded-full text-sm flex items-center space-x-2 ${
                                isDarkMode
                                  ? "bg-blue-900/30 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{subject.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-blue-800/50 text-blue-200"
                                    : "bg-blue-200 text-blue-800"
                                }`}
                              >
                                Coef: {subject.coefficient}
                              </span>
                              <button
                                onClick={() => {
                                  onShowEditCoefficientModal({
                                    levelId: level.id,
                                    classId: cls.id,
                                    subjectId: subject.id,
                                    subjectName: subject.name,
                                    currentCoefficient: subject.coefficient,
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Modifier le coefficient"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveSubject(
                                    level.id,
                                    cls.id,
                                    subject.id
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                                title="Supprimer la matière"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <AddSubjectForm
                          levelId={level.id}
                          classId={cls.id}
                          availableSubjects={constants.availableSubjects}
                          onAddSubject={handleAddSubject}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Composant AddClassForm
const AddClassForm: React.FC<AddClassFormProps> = ({
  levelId,
  onAddClass,
  isDarkMode,
}) => {
  const [className, setClassName] = useState("");
  const [maxStudents, setMaxStudents] = useState(30);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim()) {
      onAddClass(levelId, className.trim(), maxStudents);
      setClassName("");
      setMaxStudents(30);
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
          isDarkMode
            ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
        }`}
      >
        <Plus className="w-4 h-4" />
        <span>Ajouter une salle</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="Nom de la salle"
          className={`px-3 py-2 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
          autoFocus
        />
        <input
          type="number"
          value={maxStudents}
          onChange={(e) => setMaxStudents(parseInt(e.target.value) || 30)}
          placeholder="Max élèves"
          min="1"
          max="100"
          className={`px-3 py-2 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            isDarkMode
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

// Composant AddSubjectForm
const AddSubjectForm: React.FC<AddSubjectFormProps> = ({
  levelId,
  classId,
  availableSubjects,
  onAddSubject,
  isDarkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [coefficient, setCoefficient] = useState(100);

  const filteredSubjects = availableSubjects.filter((subject) =>
    subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubject = (subjectName: string) => {
    onAddSubject(levelId, classId, subjectName, coefficient);
    setSearchTerm("");
    setCustomSubject("");
    setCoefficient(100);
    setShowForm(false);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSubject.trim()) {
      handleAddSubject(customSubject.trim());
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={`px-3 py-2 border border-dashed rounded-lg transition-colors flex items-center space-x-2 text-sm ${
          isDarkMode
            ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
        }`}
      >
        <Plus className="w-3 h-3" />
        <span>Ajouter matière</span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une matière..."
          className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
        />
      </div>

      {searchTerm && (
        <div
          className={`max-h-32 overflow-y-auto border rounded-lg ${
            isDarkMode ? "border-gray-600" : "border-gray-300"
          }`}
        >
          {filteredSubjects.map((subject) => (
            <button
              key={subject}
              onClick={() => handleAddSubject(subject)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {subject}
            </button>
          ))}
          {filteredSubjects.length === 0 && (
            <div
              className={`px-3 py-2 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Aucune matière trouvée
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAddCustom} className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Nouvelle matière..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          <input
            type="number"
            value={coefficient}
            onChange={(e) => setCoefficient(parseInt(e.target.value) || 100)}
            placeholder="Coefficient"
            min="1"
            max="1000"
            className={`w-24 px-3 py-2 rounded-lg border text-sm ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Ajouter
          </button>
        </div>
      </form>

      <button
        onClick={() => setShowForm(false)}
        className={`text-sm transition-colors ${
          isDarkMode
            ? "text-gray-400 hover:text-gray-300"
            : "text-gray-500 hover:text-gray-600"
        }`}
      >
        Annuler
      </button>
    </div>
  );
};

export default ClassesMatieres;
