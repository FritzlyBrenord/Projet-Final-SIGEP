"use client";
import React, { useMemo, useState } from "react";
import { useAnneeScolaire } from "@/Context/ContextAnneeScolaire";
import { Printer, Search } from "lucide-react";
import { generateSchedulePrintContent } from "@/module/AnneeAcademique/module/PrintUtils";

const EmploiDuTempsPage: React.FC = () => {
  const { currentYear } = useAnneeScolaire();
  const [classeFilter, setClasseFilter] = useState("");
  const [salleFilter, setSalleFilter] = useState("");

  const classes = currentYear?.classes || [];
  const classeNames = useMemo(
    () => Array.from(new Set(classes.map((c) => c.name))),
    [classes]
  );
  const salleNames = useMemo(
    () =>
      Array.from(
        new Set(
          classes.flatMap((c) =>
            c.salles.map((s) => `${c.name}::${s.name}`)
          )
        )
      ),
    [classes]
  );

  const filtered = useMemo(() => {
    return classes
      .filter((c) => (classeFilter ? c.name === classeFilter : true))
      .map((c) => ({
        ...c,
        salles: c.salles.filter((s) =>
          salleFilter ? `${c.name}::${s.name}` === salleFilter : true
        ),
      }));
  }, [classes, classeFilter, salleFilter]);

  const printAll = () => {
    const levels = filtered.map((classe) => ({
      id: classe.id,
      name: classe.name,
      classes: classe.salles.map((salle) => ({
        id: salle.id,
        name: salle.name,
        maxStudents: salle.maxStudents,
        subjects: salle.subjects.map((s) => ({ id: s.id, name: s.name, coefficient: s.coefficient })),
        schedule: salle.schedule,
      })),
    }));
    const w = window.open("", "_blank");
    if (w) {
      const html = generateSchedulePrintContent(levels as any);
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Emploi du temps</h1>
        <button
          onClick={printAll}
          className="px-4 py-2 rounded-lg border flex items-center gap-2 hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Imprimer
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Classe</label>
          <select
            className="w-full p-2 border rounded"
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            {classeNames.map((cn) => (
              <option key={cn} value={cn}>{cn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salle</label>
          <select
            className="w-full p-2 border rounded"
            value={salleFilter}
            onChange={(e) => setSalleFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            {salleNames.map((sn) => {
              const [classeName, salleName] = sn.split("::");
              return (
                <option key={sn} value={sn}>{classeName} - {salleName}</option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((classe) => (
          <div key={classe.id} className="border rounded p-4">
            <h3 className="font-semibold mb-3">{classe.name}</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {classe.salles.map((salle) => (
                <div key={salle.id} className="border rounded p-3">
                  <div className="font-medium mb-2">{salle.name}</div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {["Lundi","Mardi","Mercredi","Jeudi","Vendredi"].map((day) => (
                      <div key={day}>
                        <div className="font-semibold text-gray-700">{day}</div>
                        {salle.schedule.filter((i) => i.day === day).map((i) => (
                          <div key={i.id} className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                            {i.startTime}-{i.endTime} • {i.subject} {i.teacherName ? `(${i.teacherName})` : ""}
                          </div>
                        ))}
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
  );
};

export default EmploiDuTempsPage;


