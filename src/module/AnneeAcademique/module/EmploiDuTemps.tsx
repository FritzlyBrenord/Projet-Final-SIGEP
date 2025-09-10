import React, { useState } from "react";
import {
  Clock,
  Printer,
  Plus,
  X,
  Search,
} from "lucide-react";
import {
  Teacher,
  Subject,
  ScheduleItem,
  Class,
  Level,
  ScheduleConfigModalProps,
} from "../../../types/AnneeScolaireType";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { generateSchedulePrintContent, generateClassSchedulePrintContent } from "./PrintUtils";

interface EmploiDuTempsProps {
  isDarkMode: boolean;
  onShowScheduleConfig: (classId: string) => void;
}

const EmploiDuTemps: React.FC<EmploiDuTempsProps> = ({
  isDarkMode,
  onShowScheduleConfig,
}) => {
  const { anneeActuelle, obtenirConstantes } = useAnneeScolaire();

  const constants = obtenirConstantes();
  const { days } = constants;
  const levels = anneeActuelle?.levels || [];

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateSchedulePrintContent(levels);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrintClass = (cls: Class, levelName: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = generateClassSchedulePrintContent(cls, levelName);
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
          Emplois du Temps
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handlePrintAll}
            className={`px-4 py-2 rounded-lg border flex items-center space-x-2 transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer tout</span>
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
          <h4
            className={`font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {level.name}
          </h4>

          {level.classes.map((cls) => (
            <div
              key={cls.id}
              className={`border rounded-lg p-4 mb-4 ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700/30"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5
                  className={`font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {cls.name}
                </h5>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onShowScheduleConfig(cls.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Configurer
                  </button>
                  <button
                    onClick={() => handlePrintClass(cls, level.name)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Printer className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {cls.schedule.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {days.map((day) => (
                    <div
                      key={day}
                      className={`p-2 rounded border ${
                        isDarkMode
                          ? "border-gray-600"
                          : "border-gray-300"
                      }`}
                    >
                      <h6
                        className={`text-xs font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {day}
                      </h6>
                      {cls.schedule
                        .filter((item) => item.day === day)
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-1 rounded text-xs mb-1 ${
                              isDarkMode
                                ? "bg-blue-900/30 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            <div>
                              {item.startTime}-{item.endTime}
                            </div>
                            <div className="font-medium">
                              {item.subject}
                              {item.teacherName
                                ? ` • ${item.teacherName}`
                                : ""}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Aucun emploi du temps configuré
                </p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Modal de configuration d'emploi du temps
export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  classId,
  className,
  subjects,
  teachers,
  onClose,
  onAddSchedule,
  isDarkMode,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>("Lundi");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Fonction pour vérifier les conflits d'horaires
  const checkForConflicts = () => {
    if (!startTime || !endTime || !selectedDay) {
      setHasConflict(false);
      setConflictMessage("");
      return;
    }

    // Convertir les heures en minutes pour la comparaison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    // Vérifier si l'heure de fin est après l'heure de début
    if (newEnd <= newStart) {
      setHasConflict(true);
      setConflictMessage("L'heure de fin doit être après l'heure de début");
      return;
    }

    // Ici, nous devrions vérifier contre les cours existants
    // Pour l'instant, on va juste vérifier la logique de base
    setHasConflict(false);
    setConflictMessage("");
  };

  // Vérifier les conflits quand les horaires changent
  React.useEffect(() => {
    checkForConflicts();
  }, [startTime, endTime, selectedDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubject && startTime && endTime) {
      const scheduleItem: ScheduleItem = {
        id: Date.now().toString(),
        day: selectedDay as any,
        startTime,
        endTime,
        subject: selectedSubject,
        teacherName: selectedTeacherName || undefined,
      };
      onAddSchedule(classId, scheduleItem);
      setStartTime("08:00");
      setEndTime("09:00");
      setSelectedSubject("");
      setSelectedTeacherName("");
      setTeacherSearch("");
    }
  };

  const selectTeacher = (teacher: Teacher) => {
    setSelectedTeacherName(teacher.name);
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 bg-opacity-50">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Emploi du temps - {className}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Jour
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Matière
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSubject(value);
                    const subj = subjects.find((s) => s.name === value);
                    if (subj?.teacher?.name) {
                      setSelectedTeacherName(subj.teacher.name);
                      setTeacherSearch(subj.teacher.name);
                    } else {
                      setSelectedTeacherName("");
                      setTeacherSearch("");
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  required
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                      {subject.teacher ? ` • ${subject.teacher.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Heure de début
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Professeur
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => {
                    setTeacherSearch(e.target.value);
                    setShowTeacherDropdown(true);
                  }}
                  onFocus={() => setShowTeacherDropdown(true)}
                  placeholder="Rechercher un professeur..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />

                {showTeacherDropdown && teacherSearch && (
                  <div
                    className={`absolute z-10 mt-1 w-full max-h-36 overflow-y-auto rounded border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {filteredTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        onClick={() => selectTeacher(teacher)}
                      >
                        {teacher.name}
                      </button>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <div
                        className={`px-3 py-2 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Aucun professeur trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Avertissement de conflit */}
            {hasConflict && (
              <div
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-red-900/20 border-red-800 text-red-300"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span className="text-sm font-medium">{conflictMessage}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={hasConflict || !selectedSubject}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  hasConflict || !selectedSubject
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter au planning</span>
              </button>
            </div>
          </form>

          {subjects.length === 0 && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode
                  ? "bg-yellow-900/20 border border-yellow-800"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <p
                className={`text-sm ${
                  isDarkMode ? "text-yellow-300" : "text-yellow-700"
                }`}
              >
                Aucune matière n'est configurée pour cette classe. Veuillez
                d'abord ajouter des matières à l'étape précédente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmploiDuTemps;