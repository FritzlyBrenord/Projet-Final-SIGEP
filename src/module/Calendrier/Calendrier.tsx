"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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
      subject: string;
    }[];
  }[];
}

interface HolidayEvent {
  date: string;
  name: string;
  type: "holiday";
}

interface Props {
  darkMode: boolean;
}
const CalendrierScolaire = ({ darkMode }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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

  // Jours fériés officiels d'Haïti 2025
  const holidays: HolidayEvent[] = [
    { date: "2025-01-01", name: "Indépendance", type: "holiday" },
    { date: "2025-01-02", name: "Jour des Aïeux", type: "holiday" },
    { date: "2025-03-02", name: "Carnaval (Dimanche)", type: "holiday" },
    { date: "2025-03-03", name: "Carnaval (Lundi)", type: "holiday" },
    { date: "2025-03-04", name: "Carnaval (Mardi)", type: "holiday" },
    { date: "2025-04-18", name: "Vendredi Saint", type: "holiday" },
    { date: "2025-04-20", name: "Pâques", type: "holiday" },
    { date: "2025-05-01", name: "Fête du Travail", type: "holiday" },
    { date: "2025-05-18", name: "Jour du Drapeau", type: "holiday" },
    { date: "2025-05-29", name: "Ascension", type: "holiday" },
    { date: "2025-06-19", name: "Fête Dieu", type: "holiday" },
    { date: "2025-08-15", name: "Assomption", type: "holiday" },
    { date: "2025-10-17", name: "Mort de Dessalines", type: "holiday" },
    { date: "2025-11-01", name: "Toussaint", type: "holiday" },
    { date: "2025-11-02", name: "Jour des Morts", type: "holiday" },
    { date: "2025-11-18", name: "Bataille de Vertières", type: "holiday" },
    { date: "2025-12-25", name: "Noël", type: "holiday" },
  ];

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

  const classes = [
    "9ème A",
    "9ème B",
    "9ème C",
    "8ème A",
    "8ème B",
    "7ème A",
    "7ème B",
    "6ème A",
    "6ème B",
    "5ème A",
    "5ème B",
    "4ème A",
    "4ème B",
    "3ème A",
    "3ème B",
  ];

  const subjects = [
    "Mathématiques",
    "Français",
    "Sciences",
    "Histoire",
    "Géographie",
    "Anglais",
    "Physique",
    "Chimie",
    "Biologie",
    "Informatique",
    "Arts",
    "Sport",
  ];

  // Fonction pour obtenir les salles selon la classe sélectionnée
  const getAvailableRooms = (selectedClass: string) => {
    if (!selectedClass) return classes;

    const level = selectedClass.split("ème")[0] + "ème";
    return classes.filter((room) => room.startsWith(level));
  };

  useEffect(() => {
    try {
      const savedEvents = JSON.parse(
        localStorage.getItem("calendar-events") || "[]"
      );
      const savedSchedules = JSON.parse(
        localStorage.getItem("calendar-schedules") || "[]"
      );
      const savedTheme = JSON.parse(
        localStorage.getItem("dark-mode") || "false"
      );

      setEvents(savedEvents);
      setSchedules(savedSchedules);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("calendar-events", JSON.stringify(events));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des événements:", error);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem("calendar-schedules", JSON.stringify(schedules));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des horaires:", error);
    }
  }, [schedules]);

  useEffect(() => {
    try {
      localStorage.setItem("dark-mode", JSON.stringify(darkMode));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du thème:", error);
    }
  }, [darkMode]);

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

  const getEventsForDate = (date: Date) => {
    const dateString = formatDate(date);
    const userEvents = events.filter((event) => {
      if (event.endDate) {
        return dateString >= event.date && dateString <= event.endDate;
      }
      return event.date === dateString;
    });

    const holidayEvents = holidays.filter(
      (holiday) => holiday.date === dateString
    );

    return [...userEvents, ...holidayEvents];
  };

  const addEvent = () => {
    if (newEvent.title && newEvent.date) {
      const event: Event = {
        id: Date.now().toString(),
        ...newEvent,
      };

      if (editingEvent) {
        setEvents(events.map((e) => (e.id === editingEvent.id ? event : e)));
        setEditingEvent(null);
      } else {
        setEvents([...events, event]);
      }

      resetEventForm();
    }
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
        subject: "",
      });
      return updated;
    });
  };

  const updateScheduleSlot = (
    dayIndex: number,
    slotIndex: number,
    field: string,
    value: string
  ) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule[slotIndex] = {
        ...updated[dayIndex].schedule[slotIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setScheduleDetails((prev) => {
      const updated = [...prev];
      updated[dayIndex].schedule.splice(slotIndex, 1);
      return updated;
    });
  };

  const saveSchedule = () => {
    const schedule: Schedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      className: newSchedule.className,
      room: newSchedule.room,
      startDate: newSchedule.startDate,
      endDate: newSchedule.endDate,
      details: scheduleDetails,
    };

    if (editingSchedule) {
      setSchedules(
        schedules.map((s) => (s.id === editingSchedule.id ? schedule : s))
      );
      setEditingSchedule(null);
    } else {
      setSchedules([...schedules, schedule]);
    }

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

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
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
  };

  const printCalendar = () => {
    window.print();
  };

  const printSchedule = (schedule: Schedule) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Horaire - ${schedule.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #000;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
              }
              .schedule-info { 
                margin-bottom: 30px; 
                padding: 15px;
                border: 1px solid #ccc;
              }
              .day-block {
                margin-bottom: 25px;
                page-break-inside: avoid;
              }
              .day-header {
                background-color: #f0f0f0;
                padding: 10px;
                border: 2px solid #000;
                font-weight: bold;
                font-size: 16px;
              }
              .schedule-item {
                padding: 8px 15px;
                border: 1px solid #ccc;
                border-top: none;
                display: flex;
                justify-content: space-between;
              }
              .time-slot {
                font-weight: bold;
                min-width: 120px;
              }
              .subject {
                flex-grow: 1;
                margin-left: 20px;
              }
              @media print { 
                body { margin: 0; }
                .day-block { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Calendrier Scolaire Haïtien</h1>
              <h2>${schedule.name}</h2>
            </div>
            <div class="schedule-info">
              <p><strong>Classe:</strong> ${schedule.className}</p>
              <p><strong>Salle:</strong> ${schedule.room}</p>
              <p><strong>Période:</strong> ${new Date(
                schedule.startDate
              ).toLocaleDateString("fr-FR")} - ${new Date(
        schedule.endDate
      ).toLocaleDateString("fr-FR")}</p>
            </div>
            
            ${schedule.details
              .filter((day) => day.schedule.length > 0)
              .map(
                (day) => `
                <div class="day-block">
                  <div class="day-header">
                    ${day.date.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  ${day.schedule
                    .map(
                      (slot) => `
                    <div class="schedule-item">
                      <span class="time-slot">${slot.startTime} - ${slot.endTime}</span>
                      <span class="subject">${slot.subject}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
              )
              .join("")}
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

  const filteredSchedules = schedules.filter((schedule) => {
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
      holiday: "Férié",
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
                Haïti - Année Académique 2025
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
              onClick={printCalendar}
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
                        {dayEvents.slice(0, 4).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`text-xs p-1 rounded border ${
                              darkMode
                                ? "border-gray-600 bg-gray-700"
                                : "border-gray-300 bg-gray-100"
                            }`}
                            title={"type" in event ? event.name : event.title}
                          >
                            <div className="font-medium">
                              {"type" in event ? event.name : event.title}
                            </div>
                            {"type" in event ? null : (
                              <div className="text-xs opacity-75">
                                {getEventTypeLabel(event.type)}
                                {event.time && ` - ${event.time}`}
                              </div>
                            )}
                          </div>
                        ))}
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
              <h3 className="text-lg font-semibold mb-4">
                Planning des Événements
              </h3>

              <div className="space-y-4">
                {[
                  ...events,
                  ...holidays.map((h) => ({
                    ...h,
                    id: h.date,
                    title: h.name,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((event) => (
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
                            {"name" in event ? event.name : event.title}
                          </h4>
                          <div
                            className={`text-sm mt-1 ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <span>
                              {new Date(event.date).toLocaleDateString("fr-FR")}
                            </span>
                            {event.endDate && (
                              <span>
                                {" "}
                                -{" "}
                                {new Date(event.endDate).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            )}
                            {event.time && <span> ⏰ {event.time}</span>}
                            {event.subject && <span> 📚 {event.subject}</span>}
                            {"type" in event && event.type !== "holiday" && (
                              <span> 📋 {getEventTypeLabel(event.type)}</span>
                            )}
                          </div>
                        </div>

                        {!("type" in event && event.type === "holiday") && (
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
                              onClick={() => deleteEvent(event.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
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
                  {getAvailableRooms(filterClass).map((room) => (
                    <option key={room} value={room}>
                      {room}
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
                                <span className="text-sm">{slot.subject}</span>
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
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-6 transition-colors ${
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
                        setNewSchedule({
                          ...newSchedule,
                          className: e.target.value,
                          room: "", // Reset room when class changes
                        });
                      }}
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="">Choisir une classe</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
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
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, room: e.target.value })
                      }
                      className={`w-full p-3 border rounded transition-colors ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      disabled={!newSchedule.className}
                    >
                      <option value="">Choisir une salle</option>
                      {getAvailableRooms(newSchedule.className).map((room) => (
                        <option key={room} value={room}>
                          {room}
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
                    Définir les Horaires - {newSchedule.className} (
                    {newSchedule.room})
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

                      <div className="space-y-2">
                        {day.schedule.map((slot: any, slotIndex: number) => (
                          <div
                            key={slotIndex}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
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
                                value={slot.subject}
                                onChange={(e) =>
                                  updateScheduleSlot(
                                    dayIndex,
                                    slotIndex,
                                    "subject",
                                    e.target.value
                                  )
                                }
                                className={`w-full p-2 rounded border text-sm transition-colors ${
                                  darkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                              >
                                <option value="">Choisir une matière</option>
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
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
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
