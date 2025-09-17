"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCalendrierScolaire } from "@/Context/CalendrierScolaire";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { useNotes } from "@/Context/ContextNotes";
import {
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Moon,
  Sun,
  Printer,
  Edit3,
  Trash2,
  Save,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";
import { EntetIMFP } from "../AnneeAcademique/module";

// Informations de l'établissement
const ETABLISSEMENT_INFO = {
  nom: "Institution Mixte Faustin Premiere (IMFP)",
  adresse: "Gonaives, Haiti",
  telephone: "+509 3745-8901",
  email: "contact@imfp.edu.ht",
};

interface Event {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  subject?: string;
  type: "exam" | "vacation" | "holiday" | "school-start" | "activity";
}

interface Schedule {
  id: string;
  name: string;
  className: string;
  room: string;
  startDate: string;
  endDate: string;
  details: {
    date: Date;
    schedule: {
      startTime: string;
      endTime: string;
      subjects: string[]; // Changé pour permettre plusieurs matières
    }[];
  }[];
}

interface HolidayEvent {
  date: string;
  name: string;
  localName: string;
  type: "holiday";
}

interface Props {
  darkMode: boolean;
}

const CalendrierScolaire = ({ darkMode }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const {
    evenements,
    horaires,
    creneauxHoraires,
    joursFeries,
    isLoading,
    ajouterEvenement,
    modifierEvenement,
    supprimerEvenement,
    ajouterHoraire,
    ajouterHoraireReturn,
    supprimerHoraire,
    ajouterCreneauHoraire,
    chargerJoursFeries,
    verifierConflitHoraire,
    rechargerDonnees,
  } = useCalendrierScolaire();
  const { currentYear } = useAnneeScolaire();
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<
    "month" | "week" | "agenda" | "schedules"
  >("month");
  const [currentScheduleStep, setCurrentScheduleStep] = useState(0);
  const [scheduleDetails, setScheduleDetails] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [conflictWarning, setConflictWarning] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    endDate: "",
    time: "",
    subject: "",
    type: "exam" as Event["type"],
  });

  const [newSchedule, setNewSchedule] = useState({
    name: "",
    className: "",
    room: "",
    startDate: "",
    endDate: "",
  });

  // Charger les jours fériés via le contexte
  useEffect(() => {
    const annee = new Date().getFullYear();
    chargerJoursFeries(annee);
  }, [chargerJoursFeries]);

  // Vérifier les conflits via le contexte
  const checkScheduleConflict = (
    className: string,
    room: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ) => {
    const d = date.toISOString().split("T")[0];
    const conflits = verifierConflitHoraire(
      className,
      room,
      d,
      d,
      startTime,
      endTime,
      excludeScheduleId
    );
    if (conflits.length > 0) return conflits[0].message;
    return null;
  };

  // Générer les heures de 6h à 17h
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 17; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      times.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Données dynamiques depuis le contexte Année/Notes
  const { getMatieresBySalle } = useNotes();
  const [selectedClasseId, setSelectedClasseId] = useState<string>("");
  const [selectedSalleId, setSelectedSalleId] = useState<string>("");

  // Classes organisées depuis le contexte
  const classesOptions = useMemo(
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

  // Matières filtrées par salle sélectionnée
  const subjects = useMemo(() => {
    if (!selectedSalleId || !currentYear) return [] as string[];
    const mats = getMatieresBySalle(selectedSalleId);
    return mats.map((m) => m.name);
  }, [selectedSalleId, currentYear, getMatieresBySalle]);

  // Libellés lisibles pour la classe et la salle sélectionnées
  const selectedClasseLabel = useMemo(() => {
    const id = selectedClasseId || newSchedule.className;
    const found = classesOptions.find((c) => c.value === id);
    return found ? found.label : id;
  }, [classesOptions, selectedClasseId, newSchedule.className]);

  const selectedSalleLabel = useMemo(() => {
    const classeId = selectedClasseId || newSchedule.className;
    const salleId = selectedSalleId || newSchedule.room;
    const list = (classeId && sallesByClass[classeId]) || [];
    const found = list.find((s) => s.value === salleId);
    return found ? found.label : salleId;
  }, [
    sallesByClass,
    selectedClasseId,
    selectedSalleId,
    newSchedule.className,
    newSchedule.room,
  ]);

  // Données gérées côté serveur via le contexte. Pas de localStorage ici.

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    // Next month days to fill grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Adapter les données du contexte pour l'UI existante
  const eventsUI = useMemo(() => {
    return evenements.map(
      (e) =>
        ({
          id: e.id,
          title: e.titre,
          date: e.date_debut,
          endDate: e.date_fin,
          time:
            e.heure_debut && e.heure_fin
              ? `${e.heure_debut}-${e.heure_fin}`
              : undefined,
          subject: e.matiere,
          type: e.type,
        } as Event)
    );
  }, [evenements]);

  const holidaysUI = useMemo(() => {
    return joursFeries.map(
      (h) =>
        ({
          date: h.date,
          name: h.nom_local,
          localName: h.nom_local,
          type: "holiday" as const,
        } as HolidayEvent)
    );
  }, [joursFeries]);

  const schedulesUI = useMemo(() => {
    return horaires.map((h) => {
      const creneaux = creneauxHoraires.filter((c) => c.horaire_id === h.id);
      const start = new Date(h.date_debut);
      const end = new Date(h.date_fin);
      const days: {
        date: Date;
        schedule: { startTime: string; endTime: string; subjects: string[] }[];
      }[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dow = d.getDay();
        const slots = creneaux
          .filter(
            (c) => c.date_specifique === dateStr || c.jour_semaine === dow
          )
          .map((c) => ({
            startTime: c.heure_debut,
            endTime: c.heure_fin,
            subjects: c.matieres || [],
          }));
        days.push({ date: new Date(d), schedule: slots });
      }
      return {
        id: h.id,
        name: h.nom,
        className: h.classe,
        room: h.salle,
        startDate: h.date_debut,
        endDate: h.date_fin,
        details: days,
      } as Schedule;
    });
  }, [horaires, creneauxHoraires]);

  const getEventsForDate = (date: Date) => {
    const dateString = formatDate(date);
    const userEvents = eventsUI.filter((event: Event) => {
      if (event.endDate) {
        return dateString >= event.date && dateString <= event.endDate;
      }
      return event.date === dateString;
    });

    const holidayEvents = holidaysUI.filter(
      (holiday) => holiday.date === dateString
    );

    return [...userEvents, ...holidayEvents];
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date || !currentYear?.id) return;
    const [start, end] = newEvent.time?.split("-") || [];
    if (editingEvent) {
      await modifierEvenement(editingEvent.id, {
        titre: newEvent.title,
        date_debut: newEvent.date,
        date_fin: newEvent.endDate || undefined,
        heure_debut: start || undefined,
        heure_fin: end || undefined,
        matiere: newEvent.subject || undefined,
        type: newEvent.type,
      });
      setEditingEvent(null);
    } else {
      await ajouterEvenement({
        titre: newEvent.title,
        date_debut: newEvent.date,
        date_fin: newEvent.endDate || undefined,
        heure_debut: start || undefined,
        heure_fin: end || undefined,
        matiere: newEvent.subject || undefined,
        type: newEvent.type,
        annee_scolaire_id: currentYear.id,
      });
    }
    await rechargerDonnees();
    resetEventForm();
  };

  const startScheduleCreation = () => {
    setNewSchedule({
      name: "",
      className: "",
      room: "",
      startDate: "",
      endDate: "",
    });
    setCurrentScheduleStep(0);
    setScheduleDetails([]);
    setConflictWarning("");
    setShowScheduleModal(true);
  };

  const proceedToScheduleDetails = () => {
    if (
      newSchedule.startDate &&
      newSchedule.endDate &&
      newSchedule.className &&
      newSchedule.room &&
      newSchedule.name
    ) {
      const start = new Date(newSchedule.startDate);
      const end = new Date(newSchedule.endDate);
      const days = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
          date: new Date(d),
          schedule: [],
        });
      }

      setScheduleDetails(days);
      setCurrentScheduleStep(1);
    }
  };

  const addTimeSlot = (dayIndex: number) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule.push({
        startTime: "08:00",
        endTime: "10:00",
        subjects: [], // Maintenant un tableau
      });
      return updated;
    });
  };

  const updateScheduleSlot = (
    dayIndex: number,
    slotIndex: number,
    field: string,
    value: string | string[]
  ) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule[slotIndex] = {
        ...updated[dayIndex].schedule[slotIndex],
        [field]: value,
      };

      // Vérifier les conflits si on modifie les heures
      if (field === "startTime" || field === "endTime") {
        const slot = updated[dayIndex].schedule[slotIndex];
        const conflict = checkScheduleConflict(
          newSchedule.className,
          newSchedule.room,
          updated[dayIndex].date,
          slot.startTime,
          slot.endTime,
          editingSchedule?.id
        );
        setConflictWarning(conflict || "");
      }

      return updated;
    });
  };

  const addSubjectToSlot = (
    dayIndex: number,
    slotIndex: number,
    subject: string
  ) => {
    if (!subject) return;

    setScheduleDetails((prev) => {
      const updated = [...prev];
      const currentSubjects = updated[dayIndex].schedule[slotIndex].subjects;
      if (!currentSubjects.includes(subject)) {
        updated[dayIndex].schedule[slotIndex].subjects = [
          ...currentSubjects,
          subject,
        ];
      }
      return updated;
    });
  };

  const removeSubjectFromSlot = (
    dayIndex: number,
    slotIndex: number,
    subjectIndex: number
  ) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule[slotIndex].subjects.splice(subjectIndex, 1);
      return updated;
    });
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule.splice(slotIndex, 1);
      return updated;
    });
    setConflictWarning("");
  };

  const saveSchedule = async () => {
    if (conflictWarning) {
      alert("Impossible de sauvegarder: " + conflictWarning);
      return;
    }
    if (!currentYear?.id) return;

    // Créer l'horaire et récupérer son id immédiatement
    const created = await ajouterHoraireReturn({
      nom: newSchedule.name,
      classe: newSchedule.className,
      salle: newSchedule.room,
      date_debut: newSchedule.startDate,
      date_fin: newSchedule.endDate,
      annee_scolaire_id: currentYear.id,
    });

    for (const day of scheduleDetails) {
      const dateStr = day.date.toISOString().split("T")[0];
      for (const slot of day.schedule) {
        if (slot.startTime && slot.endTime && (slot.subjects || []).length) {
          await ajouterCreneauHoraire({
            horaire_id: created.id,
            date_specifique: dateStr,
            heure_debut: slot.startTime,
            heure_fin: slot.endTime,
            matieres: slot.subjects,
            annee_scolaire_id: currentYear.id,
          });
        }
      }
    }

    await rechargerDonnees();
    resetScheduleForm();
  };

  const editEvent = (event: Event) => {
    setNewEvent({
      title: event.title,
      date: event.date,
      endDate: event.endDate || "",
      time: event.time || "",
      subject: event.subject || "",
      type: event.type,
    });
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const deleteEvent = async (id: string) => {
    await supprimerEvenement(id);
    await rechargerDonnees();
  };

  const deleteSchedule = async (id: string) => {
    await supprimerHoraire(id);
    await rechargerDonnees();
  };

  const resetEventForm = () => {
    setNewEvent({
      title: "",
      date: "",
      endDate: "",
      time: "",
      subject: "",
      type: "exam",
    });
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const resetScheduleForm = () => {
    setNewSchedule({
      name: "",
      className: "",
      room: "",
      startDate: "",
      endDate: "",
    });
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setCurrentScheduleStep(0);
    setScheduleDetails([]);
    setConflictWarning("");
  };

  const printCalendar = () => {
    window.print();
  };

  const printAgenda = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const allEvents: (
        | Event
        | (HolidayEvent & { id: string; title: string })
      )[] = [
        ...eventsUI,
        ...holidaysUI.map((h) => ({
          ...h,
          id: h.date,
          title: h.localName,
        })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const eventsByMonth = new Map<
        string,
        (Event | (HolidayEvent & { id: string; title: string }))[]
      >();
      allEvents.forEach(
        (event: Event | (HolidayEvent & { id: string; title: string })) => {
          const date = new Date(event.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!eventsByMonth.has(monthKey)) {
            eventsByMonth.set(monthKey, []);
          }
          eventsByMonth.get(monthKey)!.push(event);
        }
      );

      const monthSections = Array.from(eventsByMonth.entries())
        .map(([monthKey, events]) => {
          const [year, month] = monthKey.split("-").map(Number);
          const monthName = new Date(year, month).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          });

          return `
          <div class="month-section">
            <div class="month-header">${monthName.toUpperCase()}</div>
            ${events
              .map(
                (
                  event: Event | (HolidayEvent & { id: string; title: string })
                ) => {
                  const isHoliday = "localName" in event;
                  const eventType = isHoliday
                    ? "holiday"
                    : (event as Event).type;
                  const eventDate = new Date(event.date);

                  return `
                <div class="event-item ${eventType}">
                  <div class="event-date">
                    ${eventDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div class="event-content">
                    <div class="event-title">${
                      "localName" in event ? event.localName : event.title
                    }</div>
                    <div class="event-details">
                      <span class="event-badge ${eventType}">
                        ${
                          eventType === "exam"
                            ? "Examen"
                            : eventType === "vacation"
                            ? "Vacances"
                            : eventType === "holiday"
                            ? "Jour Férié"
                            : eventType === "school-start"
                            ? "Rentrée"
                            : "Activité"
                        }
                      </span>
                      ${
                        !isHoliday && (event as Event).time
                          ? ` • ${(event as Event).time}`
                          : ""
                      }
                      ${
                        !isHoliday && (event as Event).subject
                          ? ` • ${(event as Event).subject}`
                          : ""
                      }
                      ${
                        !isHoliday && (event as Event).endDate
                          ? ` • Jusqu'au ${new Date(
                              (event as Event).endDate as string
                            ).toLocaleDateString("fr-FR")}`
                          : ""
                      }
                    </div>
                  </div>
                </div>
              `;
                }
              )
              .join("")}
          </div>
        `;
        })
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Planning des Événements - ${ETABLISSEMENT_INFO.nom}</title>
            <style>
              @page {
                size: A4;
                margin: 0.75in;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Times New Roman', serif;
                font-size: 11pt;
                line-height: 1.4;
                color: #000;
                background: #fff;
              }
              
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding: 15px;
                border-bottom: 2px solid #000;
              }
              
              .institution-name {
                font-size: 18pt;
                font-weight: bold;
                margin-bottom: 5px;
              }
              
              .institution-details {
                font-size: 9pt;
                margin-bottom: 10px;
              }
              
              .document-title {
                font-size: 14pt;
                font-weight: bold;
                margin-bottom: 5px;
              }
              
              .print-date {
                font-size: 8pt;
                font-style: italic;
              }
              
              .events-container {
                margin: 10px 0;
              }
              
              .month-section {
                margin-bottom: 20px;
                break-inside: avoid;
              }
              
              .month-header {
                background: #f0f0f0;
                padding: 8px 12px;
                font-size: 12pt;
                font-weight: bold;
                border: 1px solid #000;
                margin-bottom: 8px;
              }
              
              .event-item {
                display: flex;
                padding: 6px 10px;
                margin-bottom: 4px;
                border-left: 3px solid #666;
                border: 1px solid #ccc;
                break-inside: avoid;
              }
              
              .event-item.holiday { border-left-color: #dc3545; }
              .event-item.exam { border-left-color: #ffc107; }
              .event-item.vacation { border-left-color: #28a745; }
              
              .event-date {
                font-weight: bold;
                min-width: 100px;
                font-size: 9pt;
              }
              
              .event-content {
                flex-grow: 1;
                margin-left: 10px;
              }
              
              .event-title {
                font-weight: bold;
                font-size: 10pt;
                margin-bottom: 2px;
              }
              
              .event-details {
                font-size: 8pt;
                color: #666;
              }
              
              .event-badge {
                background: #666;
                color: white;
                padding: 1px 4px;
                border-radius: 3px;
                font-size: 7pt;
                font-weight: bold;
                text-transform: uppercase;
              }
              
              .footer {
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 8pt;
              }
            </style>
          </head>
          <body>
           

            ${EntetIMFP(`PLANNING DES ÉVÉNEMENTS`)}
            
            <div class="events-container">
              ${monthSections}
            </div>
            
            <div class="footer">
              <strong>${
                ETABLISSEMENT_INFO.nom
              }</strong> - Document généré automatiquement
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printSchedule = (schedule: Schedule) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Horaire - ${schedule.name}</title>
            <style>
              @page {
                size: A4;
                margin: 0.5in;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Times New Roman', serif;
                font-size: 10pt;
                line-height: 1.3;
                color: #000;
                background: #fff;
              }
              
              .header {
                text-align: center;
                margin-bottom: 15px;
                padding: 10px;
                border-bottom: 2px solid #000;
              }
              
              .institution-name {
                font-size: 16pt;
                font-weight: bold;
                margin-bottom: 3px;
              }
              
              .institution-details {
                font-size: 8pt;
                margin-bottom: 8px;
              }
              
              .document-title {
                font-size: 12pt;
                font-weight: bold;
                margin-bottom: 3px;
              }
              
              .schedule-info {
                background: #f8f9fa;
                padding: 8px;
                border: 1px solid #000;
                margin-bottom: 15px;
                text-align: center;
              }
              
              .schedule-info h3 {
                font-size: 11pt;
                margin-bottom: 5px;
              }
              
              .schedule-meta {
                font-size: 9pt;
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
              }
              
              .day-block {
                margin-bottom: 12px;
                break-inside: avoid;
                border: 1px solid #000;
              }
              
              .day-header {
                background: #e9ecef;
                padding: 6px 10px;
                font-weight: bold;
                font-size: 9pt;
                border-bottom: 1px solid #000;
              }
              
              .schedule-table {
                width: 100%;
                border-collapse: collapse;
              }
              
              .schedule-row {
                border-bottom: 1px solid #ccc;
              }
              
              .time-cell {
                padding: 4px 8px;
                font-weight: bold;
                background: #f8f9fa;
                border-right: 1px solid #000;
                width: 80px;
                text-align: center;
                font-size: 8pt;
              }
              
              .subject-cell {
                padding: 4px 8px;
                font-size: 8pt;
              }
              
              .subject-list {
                display: flex;
                flex-wrap: wrap;
                gap: 3px;
              }
              
              .subject-tag {
                background: #007bff;
                color: white;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 7pt;
                font-weight: bold;
              }
              
              .empty-day {
                padding: 8px;
                text-align: center;
                font-style: italic;
                font-size: 8pt;
              }
              
              .footer {
                margin-top: 15px;
                padding-top: 8px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 7pt;
              }
            </style>
          </head>
          <body>
            
            ${EntetIMFP(`HORAIRE DE CLASSE`)}
            
            <div class="schedule-info">
              <h3>${schedule.name}</h3>
              <div class="schedule-meta">
                <span><strong>Classe:</strong> ${schedule.className}</span>
                <span><strong>Salle:</strong> ${schedule.room}</span>
                <span><strong>Du:</strong> ${new Date(
                  schedule.startDate
                ).toLocaleDateString("fr-FR")}</span>
                <span><strong>Au:</strong> ${new Date(
                  schedule.endDate
                ).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            
            <div class="schedule-content">
              ${schedule.details
                .filter((day) => day.schedule.length > 0)
                .map(
                  (day) => `
                  <div class="day-block">
                    <div class="day-header">
                      ${day.date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                    ${
                      day.schedule.length > 0
                        ? `
                      <table class="schedule-table">
                        ${day.schedule
                          .map(
                            (slot) => `
                            <tr class="schedule-row">
                              <td class="time-cell">
                                ${slot.startTime}<br>-<br>${slot.endTime}
                              </td>
                              <td class="subject-cell">
                                <div class="subject-list">
                                  ${slot.subjects
                                    .map(
                                      (subject) =>
                                        `<span class="subject-tag">${subject}</span>`
                                    )
                                    .join("")}
                                </div>
                              </td>
                            </tr>
                          `
                          )
                          .join("")}
                      </table>
                    `
                        : `
                      <div class="empty-day">
                        Aucun cours programmé
                      </div>
                    `
                    }
                  </div>
                `
                )
                .join("")}
            </div>
            
            <div class="footer">
              <strong>${
                ETABLISSEMENT_INFO.nom
              }</strong> - Horaire généré le ${new Date().toLocaleDateString(
        "fr-FR"
      )}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const filteredSchedules = schedulesUI.filter((schedule) => {
    const classMatch = !filterClass || schedule.className === filterClass;
    const roomMatch = !filterRoom || schedule.room === filterRoom;
    return classMatch && roomMatch;
  });

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exam: "Examen",
      vacation: "Vacances",
      holiday: "Jour Férié",
      "school-start": "Rentrée",
      activity: "Activité",
    };
    return labels[type] || type;
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`p-6 border-b transition-colors no-print ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Calendrier Scolaire</h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {ETABLISSEMENT_INFO.nom} - Année Académique 2025
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                setViewMode(
                  viewMode === "month"
                    ? "agenda"
                    : viewMode === "agenda"
                    ? "schedules"
                    : "month"
                )
              }
              className={`px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {viewMode === "month"
                ? "Vue Agenda"
                : viewMode === "agenda"
                ? "Horaires"
                : "Calendrier"}
            </button>

            <button
              onClick={() => {
                if (viewMode === "schedules") {
                  startScheduleCreation();
                } else {
                  setNewEvent({
                    ...newEvent,
                    date: selectedDate ? formatDate(selectedDate) : "",
                  });
                  setShowEventModal(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>
                {viewMode === "schedules"
                  ? "Nouvel Horaire"
                  : "Ajouter Événement"}
              </span>
            </button>

            <button
              onClick={viewMode === "agenda" ? printAgenda : printCalendar}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              title="Imprimer"
            >
              <Printer className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 print-calendar">
        {isLoading && (
          <div className="text-center py-4 no-print">
            <div className="text-blue-600">Chargement...</div>
          </div>
        )}

        {conflictWarning && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 no-print">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{conflictWarning}</span>
            </div>
          </div>
        )}

        {viewMode === "month" ? (
          <>
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6 no-print">
              <button
                onClick={() => navigateMonth(-1)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white hover:bg-gray-50 border"
                }`}
              >
                ← Précédent
              </button>

              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={() => navigateMonth(1)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white hover:bg-gray-50 border"
                }`}
              >
                Suivant →
              </button>
            </div>

            {/* Calendar Grid */}
            <div
              className={`rounded-lg shadow-sm border transition-colors ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className={`p-3 text-center text-sm font-medium ${
                      darkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDate(day.date);
                  const isToday =
                    formatDate(day.date) === formatDate(new Date());

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day.date)}
                      className={`min-h-[120px] p-2 cursor-pointer transition-colors relative ${
                        day.isCurrentMonth
                          ? darkMode
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-white hover:bg-gray-50"
                          : darkMode
                          ? "bg-gray-900 text-gray-600"
                          : "bg-gray-100 text-gray-400"
                      } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-sm font-medium ${
                            isToday ? "text-blue-600" : ""
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {dayEvents
                          .slice(0, 4)
                          .map(
                            (
                              event: Event | HolidayEvent,
                              eventIndex: number
                            ) => (
                              <div
                                key={eventIndex}
                                className={`text-xs p-1 rounded border ${
                                  darkMode
                                    ? "border-gray-600 bg-gray-700"
                                    : "border-gray-300 bg-gray-100"
                                }`}
                                title={
                                  "localName" in event
                                    ? event.localName
                                    : event.title
                                }
                              >
                                <div className="font-medium">
                                  {"localName" in event
                                    ? event.localName
                                    : event.title}
                                </div>
                                {"localName" in event ? null : (
                                  <div className="text-xs opacity-75">
                                    {getEventTypeLabel((event as Event).type)}
                                    {(event as Event).time &&
                                      ` - ${(event as Event).time}`}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        {dayEvents.length > 4 && (
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            +{dayEvents.length - 4} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : viewMode === "agenda" ? (
          // Agenda View
          <div
            className={`rounded-lg shadow-sm border transition-colors ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Planning des Événements
                </h3>
                <button
                  onClick={printAgenda}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors no-print"
                >
                  <Download className="h-4 w-4" />
                  <span>Imprimer Planning</span>
                </button>
              </div>

              <div className="space-y-4">
                {[
                  ...eventsUI,
                  ...holidaysUI.map((h) => ({
                    ...h,
                    id: h.date,
                    title: h.localName,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map(
                    (
                      event:
                        | Event
                        | (HolidayEvent & { id: string; title: string })
                    ) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          darkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {"localName" in event
                                ? event.localName
                                : event.title}
                            </h4>
                            <div
                              className={`text-sm mt-1 ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              <span>
                                {new Date(event.date).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                              {!("localName" in event) &&
                                (event as Event).endDate && (
                                  <span>
                                    {" "}
                                    -{" "}
                                    {new Date(
                                      (event as Event).endDate as string
                                    ).toLocaleDateString("fr-FR")}
                                  </span>
                                )}
                              {!("localName" in event) &&
                                (event as Event).time && (
                                  <span> {(event as Event).time}</span>
                                )}
                              {!("localName" in event) &&
                                (event as Event).subject && (
                                  <span> {(event as Event).subject}</span>
                                )}
                              {!("localName" in event) &&
                                (event as Event).type !== "holiday" && (
                                  <span>
                                    {" "}
                                    {getEventTypeLabel((event as Event).type)}
                                  </span>
                                )}
                            </div>
                          </div>

                          {!("localName" in event) && (
                            <div className="flex space-x-2 no-print">
                              <button
                                onClick={() => editEvent(event as Event)}
                                className={`p-1 rounded transition-colors ${
                                  darkMode
                                    ? "hover:bg-gray-600"
                                    : "hover:bg-gray-200"
                                }`}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteEvent(event.id as string)}
                                className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>
          </div>
        ) : (
          // Schedules View
          <div>
            <div className="flex justify-between items-center mb-6 no-print">
              <h2 className="text-xl font-semibold">Gestion des Horaires</h2>

              {/* Filtres */}
              <div className="flex space-x-4">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className={`p-2 border rounded ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">Toutes les classes</option>
                  {classesOptions.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className={`p-2 border rounded ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">Toutes les salles</option>
                  {(filterClass && sallesByClass[filterClass]
                    ? sallesByClass[filterClass]
                    : Object.values(sallesByClass).flat()
                  ).map((room) => (
                    <option key={room.value} value={room.value}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`border rounded-lg p-4 ${
                    darkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{schedule.name}</h3>
                      <p
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      >
                        {schedule.className} - Salle: {schedule.room}
                      </p>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Du{" "}
                        {new Date(schedule.startDate).toLocaleDateString(
                          "fr-FR"
                        )}
                        au{" "}
                        {new Date(schedule.endDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div className="flex space-x-2 no-print">
                      <button
                        onClick={() => printSchedule(schedule)}
                        className={`p-2 rounded transition-colors ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                        title="Imprimer l'horaire"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {schedule.details
                      .filter((day) => day.schedule.length > 0)
                      .map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`border rounded-lg overflow-hidden ${
                            darkMode ? "border-gray-600" : "border-gray-300"
                          }`}
                        >
                          <div
                            className={`px-4 py-3 font-medium ${
                              darkMode
                                ? "bg-gray-700 text-gray-200"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatDisplayDate(day.date)}
                          </div>
                          <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {day.schedule.map((slot, slotIndex) => (
                              <div
                                key={slotIndex}
                                className={`px-4 py-2 flex justify-between items-center ${
                                  darkMode ? "bg-gray-800" : "bg-white"
                                }`}
                              >
                                <span className="font-medium text-sm">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {slot.subjects.map(
                                    (subject, subjectIndex) => (
                                      <span
                                        key={subjectIndex}
                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                                      >
                                        {subject}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-lg p-6 transition-colors ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEvent ? "Modifier l'Événement" : "Nouvel Événement"}
              </h3>
              <button
                onClick={resetEventForm}
                className={`p-1 rounded transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Titre *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Nom de l'événement"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Type d'événement
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      type: e.target.value as Event["type"],
                    })
                  }
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="exam">Examen</option>
                  <option value="vacation">Vacances</option>
                  <option value="school-start">Rentrée scolaire</option>
                  <option value="activity">Activité</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date début *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className={`w-full p-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date fin (optionnel)
                  </label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endDate: e.target.value })
                    }
                    className={`w-full p-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
              </div>

              {newEvent.type === "exam" && (
                <>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Horaire
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newEvent.time?.split("-")[0] || ""}
                        onChange={(e) => {
                          const endTime =
                            newEvent.time?.split("-")[1] || "10:00";
                          setNewEvent({
                            ...newEvent,
                            time: `${e.target.value}-${endTime}`,
                          });
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="">Heure début</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newEvent.time?.split("-")[1] || ""}
                        onChange={(e) => {
                          const startTime =
                            newEvent.time?.split("-")[0] || "08:00";
                          setNewEvent({
                            ...newEvent,
                            time: `${startTime}-${e.target.value}`,
                          });
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="">Heure fin</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Matière
                    </label>
                    <select
                      value={newEvent.subject}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, subject: e.target.value })
                      }
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="">Sélectionner une matière</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={addEvent}
                  disabled={!newEvent.title || !newEvent.date}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingEvent ? "Modifier" : "Ajouter"}</span>
                </button>

                <button
                  onClick={resetEventForm}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg p-6 transition-colors ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {currentScheduleStep === 0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Créer un Nouvel Horaire
                  </h3>
                  <button
                    onClick={resetScheduleForm}
                    className={`p-1 rounded transition-colors ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Nom de l'horaire *
                    </label>
                    <input
                      type="text"
                      value={newSchedule.name}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, name: e.target.value })
                      }
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder="Ex: Examens de fin d'année"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Classe *
                    </label>
                    <select
                      value={newSchedule.className}
                      onChange={(e) => {
                        setSelectedClasseId(e.target.value);
                        setSelectedSalleId("");
                        setNewSchedule({
                          ...newSchedule,
                          className: e.target.value,
                          room: "",
                        });
                      }}
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="">Choisir une classe</option>
                      {classesOptions.map((cls) => (
                        <option key={cls.value} value={cls.value}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Salle *
                    </label>
                    <select
                      value={newSchedule.room}
                      onChange={(e) => {
                        setSelectedSalleId(e.target.value);
                        setNewSchedule({
                          ...newSchedule,
                          room: e.target.value,
                        });
                      }}
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      disabled={!newSchedule.className}
                    >
                      <option value="">Choisir une salle</option>
                      {(selectedClasseId && sallesByClass[selectedClasseId]
                        ? sallesByClass[selectedClasseId]
                        : []
                      ).map((room) => (
                        <option key={room.value} value={room.value}>
                          {room.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={newSchedule.startDate}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          startDate: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      value={newSchedule.endDate}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          endDate: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={resetScheduleForm}
                    className={`px-4 py-2 rounded transition-colors ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={proceedToScheduleDetails}
                    disabled={
                      !newSchedule.name ||
                      !newSchedule.className ||
                      !newSchedule.room ||
                      !newSchedule.startDate ||
                      !newSchedule.endDate
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </>
            )}

            {currentScheduleStep === 1 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Définir les Horaires - {selectedClasseLabel} (
                    {selectedSalleLabel})
                  </h3>
                  <button
                    onClick={resetScheduleForm}
                    className={`p-1 rounded transition-colors ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scheduleDetails.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`border rounded p-4 ${
                        darkMode ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">
                          {formatDisplayDate(day.date)}
                        </h4>
                        <button
                          onClick={() => addTimeSlot(dayIndex)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Ajouter créneau</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {day.schedule.map((slot: any, slotIndex: number) => (
                          <div
                            key={slotIndex}
                            className={`border rounded p-3 ${
                              darkMode ? "border-gray-500" : "border-gray-300"
                            }`}
                          >
                            <div className="grid grid-cols-12 gap-2 items-center mb-2">
                              <div className="col-span-3">
                                <select
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateScheduleSlot(
                                      dayIndex,
                                      slotIndex,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full p-2 rounded border text-sm transition-colors ${
                                    darkMode
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300"
                                  }`}
                                >
                                  {timeOptions.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-3">
                                <select
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    updateScheduleSlot(
                                      dayIndex,
                                      slotIndex,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full p-2 rounded border text-sm transition-colors ${
                                    darkMode
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300"
                                  }`}
                                >
                                  {timeOptions.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-5">
                                <select
                                  onChange={(e) => {
                                    addSubjectToSlot(
                                      dayIndex,
                                      slotIndex,
                                      e.target.value
                                    );
                                    e.target.value = "";
                                  }}
                                  className={`w-full p-2 rounded border text-sm transition-colors ${
                                    darkMode
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300"
                                  }`}
                                >
                                  <option value="">Ajouter une matière</option>
                                  {subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                      {subject}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-1">
                                <button
                                  onClick={() =>
                                    removeTimeSlot(dayIndex, slotIndex)
                                  }
                                  className="p-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Affichage des matières sélectionnées */}
                            <div className="flex flex-wrap gap-2">
                              {slot.subjects.map(
                                (subject: string, subjectIndex: number) => (
                                  <span
                                    key={subjectIndex}
                                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-sm"
                                  >
                                    {subject}
                                    <button
                                      onClick={() =>
                                        removeSubjectFromSlot(
                                          dayIndex,
                                          slotIndex,
                                          subjectIndex
                                        )
                                      }
                                      className="hover:bg-blue-700 rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setCurrentScheduleStep(0)}
                    className={`px-4 py-2 rounded transition-colors ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Retour
                  </button>
                  <button
                    onClick={saveSchedule}
                    disabled={!!conflictWarning}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition-colors"
                  >
                    Enregistrer l'Horaire
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          * {
            visibility: hidden;
          }
          .print-calendar,
          .print-calendar * {
            visibility: visible;
          }
          .print-calendar {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          header {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .print-calendar {
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .print-calendar * {
            background: white !important;
            color: black !important;
            border-color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendrierScolaire;
