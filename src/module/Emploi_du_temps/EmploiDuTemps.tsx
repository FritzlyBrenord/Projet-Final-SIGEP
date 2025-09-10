import { Salle } from "@/Context/ContextAnneeScolaire";
import {
  generateClassesPrintContent,
  generateClassSchedulePrintContent,
} from "../AnneeAcademique/module";

export const handlePrintSalleSchedule = (salle: Salle, classeName: string) => {
  const clsForPrint = {
    id: salle.id,
    name: `${classeName} - ${salle.name}`,
    maxStudents: salle.maxStudents,
    subjects: salle.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      coefficient: s.coefficient,
    })),
    schedule: salle.schedule.map((i) => ({
      id: i.id,
      day: i.day,
      startTime: i.startTime,
      endTime: i.endTime,
      subject: i.subject,
      teacherName: i.teacherName,
    })),
  } as any;
  const w = window.open("", "_blank");
  if (w) {
    const html = generateClassSchedulePrintContent(clsForPrint, classeName);
    w.document.write(html);
    w.document.close();
    w.print();
  }
};

export const handlePrintSubjectsList = (salle: Salle) => {
  // Construit une structure Level -> Class pour generateClassesPrintContent
  const levelLike = [
    {
      id: salle.id,
      name: salle.name,
      classes: [
        {
          id: salle.id,
          name: salle.name,
          maxStudents: salle.maxStudents,
          subjects: salle.subjects.map((s) => ({
            id: s.id,
            name: s.name,
            coefficient: s.coefficient,
          })),
        },
      ],
    },
  ] as any;
  const w = window.open("", "_blank");
  if (w) {
    const html = generateClassesPrintContent(levelLike);
    w.document.write(html);
    w.document.close();
    w.print();
  }
};
