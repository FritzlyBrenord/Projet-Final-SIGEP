// Types pour la gestion des années scolaires

export interface Teacher {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  teacher?: Teacher;
}

export interface ScheduleItem {
  id: string;
  day: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";
  startTime: string;
  endTime: string;
  subject: string;
  teacherName?: string;
}
export interface Level {
  id: string;
  name: string;
  classes: Class[];
}

export interface Salle {
  id: string;
  name: string;
  maxStudents: number;
  matieres: Subject[];
  emploiTemps: ScheduleItem[];
}

export interface Class {
  id: string;
  name: string;
  salles: Salle[];
  maxStudents?: number;
  subjects?: Subject[];
  schedule?: ScheduleItem[];
}

export interface AnneeScolaireConfig {
  id?: string;
  year: string;
  description?: string;
  classes: Class[];
}

export interface NewYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingYears: string[];
  isDarkMode: boolean;
  mode?: "create" | "edit";
  initialConfig?: AnneeScolaireConfig;
  onSave?: (config: AnneeScolaireConfig) => void;
  onDelete?: (year: string) => void;
}

export interface AddClassFormProps {
  onAddClass: (className: string) => void;
  isDarkMode: boolean;
}

export interface AddSubjectFormProps {
  classeId: string;
  salleId: string;
  availableSubjects: string[];
  onAddSubject: (
    classeId: string,
    salleId: string,
    subjectName: string,
    coefficient: number
  ) => void;
  isDarkMode: boolean;
}

export interface ScheduleConfigModalProps {
  classId: string;
  className: string;
  subjects: Subject[];
  teachers: Teacher[];
  isOpen: boolean;
  onClose: () => void;
  onAddSchedule: (classId: string, scheduleItem: ScheduleItem) => void;
  isDarkMode: boolean;
}

export interface EditCoefficientModalProps {
  subjectName: string;
  currentCoefficient: number;
  onClose: () => void;
  onSave: (newCoefficient: number) => void;
  isDarkMode: boolean;
}

export interface SubjectForEdit {
  classeId: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  currentCoefficient: number;
}

export interface AnneeScolaireConstants {
  availableLevels: string[];
  availableSubjects: string[];
  availableTeachers: Teacher[];
  days: string[];
}
