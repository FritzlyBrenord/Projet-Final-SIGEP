import { Level, Class, Subject, ScheduleItem } from "../../../types/AnneeScolaireType";

// Si Level n'est pas exporté, assurez-vous que AnneeScolaireType.ts contient : export type Level = ...

export const EntetIMFP = (titre: string): string => {
  return `
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 20px;
        background: #fff;
        color: #333;
        line-height: 1.6;
      }
      
      .header-container {
        border-bottom: 3px solid #2563eb;
        padding: 15px 20px;
        margin-bottom: 25px;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        position: relative;
      }
      
      .school-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #1e40af;
        text-align: center;
        letter-spacing: 0.5px;
      }
      
      .separator {
        width: 50px;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, #059669);
        margin: 8px auto;
        border-radius: 2px;
      }
      
      .info-section {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 10px;
        gap: 20px;
      }
      
      .address-contact {
        text-align: center;
      }
      
      .school-info {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 3px;
        font-weight: 500;
      }
      
      .contact-info {
        font-size: 12px;
        color: #475569;
        margin-top: 5px;
        font-style: italic;
      }
      
      .logo-container {
        flex-shrink: 0;
      }
      
      .logo {
        width: 90px;
        height: 90px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .document-title {
        font-size: 14px;
        font-weight: bold;
        color: #059669;
        margin-top: 15px;
        padding: 8px 16px;
        background: rgba(5, 150, 105, 0.1);
        border-radius: 6px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border: 1px solid rgba(5, 150, 105, 0.2);
      }
      
      @media print {
        body {
          padding: 10px;
        }
        .header-container {
          box-shadow: none;
          padding: 10px 15px;
        }
        .logo {
          width: 70px;
          height: 70px;
        }
      }
      
      @media (max-width: 600px) {
        .info-section {
          flex-direction: column;
          gap: 15px;
        }
        .logo {
          width: 80px;
          height: 80px;
        }
      }
    </style>
    
    <div class="header-container">
      <div class="school-name">INSTITUTION MIXTE FAUSTIN PREMIERE (IMFP)</div>
      <div class="separator"></div>
      
      <div class="info-section">
        <div class="address-contact">
          <div class="school-info">156, avenue des Dattes, Gonaïves (Haïti) HT-4410</div>
          <div class="school-info">Route Nationale #1</div>
          <div class="contact-info">
            Téléphone: +509 3373 4336 / 3764 4223<br>
            Email: collegefaustin1er888@gmail.com
          </div>
        </div>
        
        <div class="logo-container">
          <div class="logo">
            <img src="/logo.png" alt="Logo IMFP" />
          </div>
        </div>
      </div>
      
      <div class="document-title">${titre}</div>
    </div>
  `;
};

export const EntetIMFPSimple = (titre: string): string => {
  return `
    <div style="
      border-bottom: 2px solid #2563eb; 
      padding: 12px 15px; 
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
      gap: 25px;
    ">
      <div style="text-align: center;">
        <h1 style="color: #1e40af; margin: 0 0 8px 0; font-size: 20px;">
          INSTITUTION MIXTE FAUSTIN PREMIERE (IMFP)
        </h1>
        <p style="color: #64748b; margin: 2px 0; font-size: 12px;">
          156, avenue des Dattes, Gonaïves (Haïti) HT-4410
        </p>
        <p style="color: #64748b; margin: 2px 0; font-size: 11px;">
          Tél: +509 3373 4336 / 3764 4223 | collegefaustin1er888@gmail.com
        </p>
        <h2 style="color: #059669; margin-top: 10px; font-size: 16px;">
          ${titre}
        </h2>
      </div>
      
      <div>
        <img src="/logo.png" alt="Logo IMFP" style="
          width: 120px; 
          height: 120px; 
          object-fit: contain;
          border-radius: 6px;
          padding: 4px;
         
        " />
      </div>
    </div>
  `;
};

export const generateClassesPrintContent = (levels: Level[]) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Configuration Classes et Matières - IMFP</title>
      <style>
      body { 
        font-family: 'Arial', sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: #fff;
        color: #333;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #2563eb; 
        padding-bottom: 20px; 
        margin-bottom: 30px; 
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 20px;
        border-radius: 8px;
      }
      .school-name { 
        font-size: 28px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #1e40af;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      .school-info { 
        font-size: 14px; 
        color: #64748b; 
        margin-bottom: 5px;
      }
      .document-title {
        font-size: 18px;
        font-weight: bold;
        color: #059669;
        margin-top: 15px;
      }
      
      .level-section {
        margin-bottom: 40px;
        break-inside: avoid;
      }
      
      .level-header {
        background: #2563eb;
        color: white;
        padding: 12px 20px;
        font-size: 20px;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }
      
      .classes-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 0 0 8px 8px;
        overflow: hidden;
      }
      
      .classes-table th {
        background: #f1f5f9;
        color: #334155;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .classes-table td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
      }
      
      .classes-table tr:nth-child(even) {
        background: #f8fafc;
      }
      
      .classes-table tr:hover {
        background: #e0f2fe;
      }
      
      .class-name {
        font-weight: bold;
        color: #059669;
        font-size: 16px;
      }
      
      .max-students {
        color: #7c3aed;
        font-weight: 500;
      }
      
      .subjects-container {
        max-width: 300px;
      }
      
      .subject-tag {
        display: inline-block;
        background: #dbeafe;
        color: #1e40af;
        padding: 4px 8px;
        margin: 2px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        border: 1px solid #bfdbfe;
      }
      
      .subjects-count {
        color: #64748b;
        font-style: italic;
        margin-bottom: 8px;
      }
      
      .summary-section {
        margin-top: 40px;
        background: #f0f9ff;
        border: 2px solid #0ea5e9;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .summary-header {
        background: #0ea5e9;
        color: white;
        padding: 15px 20px;
        font-size: 18px;
        font-weight: bold;
      }
      
      .summary-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .summary-table td {
        padding: 12px 20px;
        border-bottom: 1px solid #bae6fd;
      }
      
      .summary-table td:first-child {
        font-weight: bold;
        color: #0c4a6e;
        width: 60%;
      }
      
      .summary-table td:last-child {
        font-weight: bold;
        color: #dc2626;
        text-align: right;
      }
      
      @media print { 
        body { margin: 0; padding: 15px; } 
        .no-print { display: none; }
        .level-section { page-break-inside: avoid; }
        .classes-table tr { page-break-inside: avoid; }
      }
      </style>
    </head>
    <body>
   
       ${EntetIMFP("Classes et Matières")}
      <div class="content">
        ${levels
          .map(
            (level: Level) => `
        <div class="level-section">
          <div class="level-header">${level.name}</div>
          <table class="classes-table">
            <thead>
              <tr>
                <th style="width: 25%;">Classe</th>
                <th style="width: 15%;">Nombre Max</th>
                <th style="width: 60%;">Matières</th>
              </tr>
            </thead>
            <tbody>
            ${level.classes
              .map(
                (cls: Class) => `
                <tr>
                  <td>
                    <div class="class-name">${cls.name}</div>
                  </td>
                  <td>
                    <span class="max-students">${cls.maxStudents ?? 0} élèves</span>
                  </td>
                  <td>
                    <div class="subjects-container">
                      <div class="subjects-count">${cls.subjects?.length ?? 0} matière(s)</div>
                  ${(cls.subjects ?? [])
                    .map(
                      (subject: Subject) =>
                        `<span class="subject-tag">${subject.name} (Coef: ${subject.coefficient})</span>`
                    )
                    .join("")}
                </div>
                  </td>
                </tr>
            `
              )
              .join("")}
            </tbody>
          </table>
          </div>
        `
          )
          .join("")}
      </div>
      
    <div class="summary-section">
      <div class="summary-header">Récapitulatif Général</div>
      <table class="summary-table">
        <tr>
          <td>Total des Classex scolaires</td>
          <td>${levels.length}</td>
        </tr>
        <tr>
          <td>Total des classes</td>
          <td>${levels.reduce(
            (acc: number, level: Level) => acc + level.classes.length,
            0
          )}</td>
        </tr>
        <tr>
          <td>Total des matières enseignées</td>
          <td>${levels.reduce(
            (acc: number, level: Level) =>
              acc +
              level.classes.reduce(
                (acc2: number, cls: Class) => acc2 + (cls.subjects?.length ?? 0),
                0
              ),
            0
          )}</td>
        </tr>
        <tr>
          <td>Capacité totale d'accueil</td>
          <td>${levels.reduce(
            (acc: number, level: Level) =>
              acc +
              level.classes.reduce(
                (acc2: number, cls: Class) => acc2 + (cls.maxStudents ?? 0),
                0
              ),
            0
          )} élèves</td>
        </tr>
      </table>
      </div>
    </body>
    </html>
  `;
};

export const generateSchedulePrintContent = (levels: Level[]) => {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Emplois du Temps Complets - IMFP</title>
      <style>
      body { 
        font-family: 'Arial', sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: #fff;
        color: #333;
        font-size: 12px;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #059669; 
        padding-bottom: 20px; 
        margin-bottom: 30px; 
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        padding: 20px;
        border-radius: 8px;
      }
      .school-name { 
        font-size: 28px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #065f46;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      .school-info { 
        font-size: 14px; 
        color: #64748b; 
        margin-bottom: 5px;
      }
      .document-title {
        font-size: 18px;
        font-weight: bold;
        color: #dc2626;
        margin-top: 15px;
      }
      
      .level-section {
        margin-bottom: 40px;
        break-inside: avoid;
      }
      
      .level-header {
        background: #059669;
        color: white;
        padding: 12px 20px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }
      
      .class-schedule {
        margin-bottom: 30px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .class-header {
        background: #f3f4f6;
        padding: 10px 15px;
        border-bottom: 2px solid #d1d5db;
      }
      
      .class-title {
        font-size: 16px;
        font-weight: bold;
        color: #7c3aed;
        margin-bottom: 5px;
      }
      
      .class-info {
        font-size: 12px;
        color: #6b7280;
      }
      
      .schedule-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .schedule-table th {
        background: #1f2937;
        color: white;
        padding: 12px 8px;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        border: 1px solid #374151;
      }
      
      .day-header {
        background: #374151 !important;
        color: white;
        padding: 8px 10px;
        font-weight: bold;
        font-size: 12px;
      }
      
      .schedule-table td {
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
        vertical-align: top;
        font-size: 11px;
      }
      
      .time-slot {
        background: #f9fafb;
        font-weight: bold;
        color: #374151;
        text-align: center;
        width: 100px;
      }
      
      .subject-cell {
        background: #ecfdf5;
        color: #065f46;
        font-weight: 500;
      }
      
      .teacher-cell {
        background: #fef3c7;
        color: #92400e;
        font-style: italic;
      }
      
      .empty-cell {
        background: #f3f4f6;
        color: #9ca3af;
        text-align: center;
        font-style: italic;
      }
      
      @media print { 
        body { margin: 0; padding: 10px; font-size: 10px; } 
        .level-section { page-break-inside: avoid; }
        .class-schedule { page-break-inside: avoid; margin-bottom: 20px; }
      }
      </style>
    </head>
    <body>
     
      ${EntetIMFP("Emplois du Temps")}
      
      <div class="content">
        ${levels
          .map(
            (level: Level) => `
        <div class="level-section">
          <div class="level-header">${level.name}</div>
            ${level.classes
              .map(
                (cls: Class) => `
            <div class="class-schedule">
              <div class="class-header">
                <div class="class-title">${cls.name}</div>
                <div class="class-info">
                  Capacité: ${cls.maxStudents ?? 0} élèves | 
                  Matières: ${cls.subjects?.length ?? 0} | 
                  Créneaux: ${cls.schedule?.length ?? 0}
                </div>
              </div>
              
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th>LUNDI</th>
                    <th>MARDI</th>
                    <th>MERCREDI</th>
                    <th>JEUDI</th>
                    <th>VENDREDI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                ${days
                  .map((day: string) => {
                    const daySchedule = (cls.schedule ?? []).filter(
                      (item: ScheduleItem) => item.day === day
                    );
                    if (daySchedule.length === 0) {
                      return `
                            <td class="empty-cell">
                              <div style="text-align: center; padding: 20px; color: #9ca3af; font-style: italic;">
                                
                              </div>
                            </td>
                          `;
                    }
                    return `
                          <td class="subject-cell">
                            ${daySchedule
                              .map(
                                (item: ScheduleItem) => `
                                  <div style="margin-bottom: 15px; padding: 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #0ea5e9;">
                                    <div style="font-weight: bold; color: #0c4a6e; margin-bottom: 4px;">
                                      ${item.startTime} - ${item.endTime}
                                    </div>
                                    <div style="font-weight: 600; color: #1e40af; margin-bottom: 2px;">
                                      ${item.subject}
                                    </div>
                                    <div style="font-size: 10px; color: #64748b; font-style: italic;">
                                      ${item.teacherName || ""}
                                    </div>
                      </div>
                    `
                              )
                              .join("")}
                          </td>
                        `;
                  })
                  .join("")}
                  </tr>
                </tbody>
              </table>
              </div>
            `
              )
              .join("")}
          </div>
        `
          )
          .join("")}
      </div>
    </body>
    </html>
  `;
};

export const generateClassSchedulePrintContent = (cls: Class, levelName: string) => {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Emploi du temps - ${cls.name} - IMFP</title>
      <style>
      body { 
        font-family: 'Arial', sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: #fff;
        color: #333;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #7c3aed; 
        padding-bottom: 20px; 
        margin-bottom: 30px; 
        background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
        padding: 20px;
        border-radius: 8px;
      }
      .school-name { 
        font-size: 28px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #581c87;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      .school-info { 
        font-size: 14px; 
        color: #64748b; 
        margin-bottom: 5px;
      }
      .document-title {
        font-size: 20px;
        font-weight: bold;
        color: #dc2626;
        margin-top: 15px;
      }
      
      .class-info-section {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }
      
      .class-info-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .class-info-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .class-info-table td:first-child {
        font-weight: bold;
        color: #374151;
        width: 30%;
      }
      
      .schedule-section {
        margin-top: 30px;
      }
      
      .schedule-title {
        background: #7c3aed;
        color: white;
        padding: 15px 20px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }
      
      .weekly-schedule {
        border: 2px solid #7c3aed;
        border-top: none;
        border-radius: 0 0 8px 8px;
        overflow: hidden;
      }
      
      .schedule-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .schedule-table th {
        background: #1e293b;
        color: white;
        padding: 12px;
        text-align: center;
        font-weight: bold;
      }
      
      .day-row {
        background: #f1f5f9;
      }
      
      .day-cell {
        background: #334155;
        color: white;
        font-weight: bold;
        padding: 10px;
        text-align: center;
        width: 120px;
      }
      
      .schedule-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        vertical-align: top;
      }
      
      .time-cell {
        background: #fef3c7;
        font-weight: bold;
        color: #92400e;
        text-align: center;
        width: 120px;
      }
      
      .subject-cell {
        background: #ecfdf5;
        color: #065f46;
        font-weight: 500;
        font-size: 14px;
      }
      
      .teacher-cell {
        background: #fef2f2;
        color: #991b1b;
        font-style: italic;
      }
      
      .day-schedule-cell {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        padding: 15px;
        vertical-align: top;
      }
      
      .empty-day-message {
        text-align: center;
        padding: 50px 10px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .course-block {
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }
      
      .course-block:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      
      .course-block:last-child {
        margin-bottom: 0;
      }
      
      .course-time {
        background: #1f2937;
        color: white;
        font-weight: bold;
        font-size: 12px;
        padding: 5px 8px;
        border-radius: 4px;
        text-align: center;
        margin-bottom: 8px;
      }
      
      .course-subject {
        background: #ecfdf5;
        color: #065f46;
        font-weight: bold;
        font-size: 14px;
        padding: 6px 8px;
        border-radius: 4px;
        text-align: center;
        margin-bottom: 6px;
        border: 1px solid #bbf7d0;
      }
      
      .course-teacher {
        background: #fef3c7;
        color: #92400e;
        font-style: italic;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        text-align: center;
        border: 1px solid #fde68a;
      }
      
      @media print { 
        body { margin: 0; padding: 15px; } 
        .schedule-section { page-break-inside: avoid; }
        .course-block:hover { transform: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      }
      </style>
    </head>
    <body>
     
      ${EntetIMFP(`Emploi du Temps - ${cls.name}`)}
      
    <div class="class-info-section">
      
            </div>
    
    <div class="schedule-section">
      <div class="schedule-title">Planning Hebdomadaire</div>
      <div class="weekly-schedule">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>LUNDI</th>
              <th>MARDI</th>
              <th>MERCREDI</th>
              <th>JEUDI</th>
              <th>VENDREDI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
            ${days
              .map((day: string) => {
                const daySchedule = (cls.schedule ?? []).filter(
                  (item: ScheduleItem) => item.day === day
                );
                if (daySchedule.length === 0) {
                  return `
                      <td class="day-schedule-cell">
                        <div class="empty-day-message" style="color: #9ca3af; font-style: italic;">
                          
                        </div>
                      </td>
                    `;
                }
                return `
                    <td class="day-schedule-cell">
                      ${daySchedule
                        .map(
                          (item: ScheduleItem) => `
                          <div class="course-block">
                            <div class="course-time">${item.startTime} - ${
                            item.endTime
                          }</div>
                            <div class="course-subject">${item.subject}</div>
                            <div class="course-teacher">${
                              item.teacherName || ""
                            }</div>
                  </div>
                `
                        )
                        .join("")}
                    </td>
                  `;
              })
              .join("")}
            </tr>
          </tbody>
        </table>
          </div>
      </div>
    </body>
    </html>
  `;
};

export const generateCompleteConfigPrintContent = (
  yearInput: string,
  description: string,
  levels: Level[]
) => {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Configuration Complète - ${yearInput} - IMFP</title>
      <style>
      body { 
        font-family: 'Arial', sans-serif; 
        margin: 0; 
        padding: 15px; 
        background: #fff;
        color: #333;
        font-size: 11px;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #dc2626; 
        padding-bottom: 20px; 
        margin-bottom: 25px; 
        background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
        padding: 20px;
        border-radius: 8px;
      }
      .school-name { 
        font-size: 26px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #991b1b;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      .school-info { 
        font-size: 13px; 
        color: #64748b; 
        margin-bottom: 5px;
      }
      .document-title {
        font-size: 18px;
        font-weight: bold;
        color: #059669;
        margin-top: 15px;
      }
      
      .section {
        margin-bottom: 30px;
        break-inside: avoid;
      }
      
      .section-header {
        background: #dc2626;
        color: white;
        padding: 12px 20px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }
      
      .overview-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .overview-table th {
        background: #f1f5f9;
        color: #334155;
        padding: 10px;
        text-align: left;
        font-weight: bold;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .overview-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
      }
      
      .overview-table tr:nth-child(even) {
        background: #f8fafc;
      }
      
      .compact-schedule {
        font-size: 10px;
      }
      
      .compact-schedule .time {
        font-weight: bold;
        color: #374151;
      }
      
      .compact-schedule .subject {
        color: #059669;
        font-weight: 500;
      }
      
      .compact-schedule .teacher {
        color: #7c3aed;
        font-style: italic;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
      }
      
      .summary-card {
        background: #f0f9ff;
        border: 2px solid #0ea5e9;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }
      
      .summary-number {
        font-size: 24px;
        font-weight: bold;
        color: #0c4a6e;
        margin-bottom: 5px;
      }
      
      .summary-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      
      @media print { 
        body { margin: 0; padding: 10px; font-size: 10px; } 
        .section { page-break-inside: avoid; margin-bottom: 20px; }
        .overview-table { font-size: 9px; }
        .summary-grid { display: block; }
        .summary-card { display: inline-block; width: 23%; margin: 1%; }
      }
      </style>
    </head>
    <body>
      
      ${EntetIMFP(`Année Scolaire ${yearInput}`)}
      ${
        description
          ? `<div class="school-info" style="margin-top: 10px; font-style: italic;">${description}</div>`
          : ""
      }
      </div>
      
    <!-- Section Classes et Matières -->
        <div class="section">
      <div class="section-header">📚 Classes et Matières par Classe</div>
      <table class="overview-table">
        <thead>
          <tr>
            <th style="width: 15%;">Classe</th>
            <th style="width: 20%;">Classe</th>
            <th style="width: 10%;">Capacité</th>
            <th style="width: 55%;">Matières (Coefficient)</th>
          </tr>
        </thead>
        <tbody>
          ${levels
            .map((level: Level) =>
              level.classes
                .map(
                  (cls: Class, classIndex: number) => `
                  <tr>
                    ${
                      classIndex === 0
                        ? `<td rowspan="${level.classes.length}" style="background: #dbeafe; color: #1e40af; font-weight: bold; vertical-align: middle; text-align: center;">${level.name}</td>`
                        : ""
                    }
                    <td style="font-weight: bold; color: #7c3aed;">${
                      cls.name
                    }</td>
                    <td style="text-align: center; color: #dc2626; font-weight: bold;">${
                      cls.maxStudents ?? 0
                    }</td>
                    <td>
                    ${(cls.subjects ?? [])
                      .map(
                        (subject: Subject) =>
                          `<span style="display: inline-block; background: #ecfdf5; color: #065f46; padding: 2px 6px; margin: 1px; border-radius: 8px; font-size: 10px; border: 1px solid #bbf7d0;">${subject.name} (${subject.coefficient})</span>`
                      )
                      .join("")}
                    </td>
                  </tr>
          `
                )
                .join("")
            )
            .join("")}
        </tbody>
      </table>
        </div>
        
    <!-- Section Emplois du Temps -->
        <div class="section">
      <div class="section-header">🕐 Emplois du Temps Détaillés</div>
      <table class="overview-table">
        <thead>
          <tr>
            <th style="width: 15%;">Classe</th>
            <th style="width: 20%;">Classe</th>
            <th style="width: 65%;">Planning Hebdomadaire</th>
          </tr>
        </thead>
        <tbody>
          ${levels
            .map((level: Level) =>
              level.classes
                .map(
                  (cls: Class, classIndex: number) => `
                  <tr>
                    ${
                      classIndex === 0
                        ? `<td rowspan="${level.classes.length}" style="background: #fef3c7; color: #92400e; font-weight: bold; vertical-align: middle; text-align: center;">${level.name}</td>`
                        : ""
                    }
                    <td style="font-weight: bold; color: #7c3aed;">${
                      cls.name
                    }</td>
                    <td>
                      <div class="compact-schedule">
                  ${
                    (cls.schedule?.length ?? 0) > 0
                      ? days
                          .map((day: string) => {
                            const daySchedule = (cls.schedule ?? []).filter(
                              (item: ScheduleItem) => item.day === day
                            );
                            if (daySchedule.length === 0)
                              return `<strong>${day}:</strong> <em style="color: #9ca3af;">Libre</em><br>`;
                            return `<strong>${day}:</strong> ${daySchedule
                              .map(
                                (item: ScheduleItem) =>
                                  `<span class="time">${item.startTime}-${
                                    item.endTime
                                  }</span> <span class="subject">${
                                    item.subject
                                  }</span> <span class="teacher">(${
                                    item.teacherName || "N/A"
                                  })</span>`
                              )
                              .join(", ")}<br>`;
                          })
                          .join("")
                      : '<em style="color: #9ca3af;">Aucun emploi du temps configuré</em>'
                  }
                </div>
                    </td>
                  </tr>
              `
                )
                .join("")
            )
            .join("")}
        </tbody>
      </table>
      </div>
      
    <!-- Section Récapitulatif -->
    <div class="section">
      <div class="section-header">📊 Statistiques Générales</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number">${levels.length}</div>
          <div class="summary-label">Classex Scolaires</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${levels.reduce(
            (acc: number, level: Level) => acc + level.classes.length,
            0
          )}</div>
          <div class="summary-label">Classes Total</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${levels.reduce(
            (acc: number, level: Level) =>
              acc +
              level.classes.reduce(
                (acc2: number, cls: Class) => acc2 + (cls.subjects?.length ?? 0),
                0
              ),
            0
          )}</div>
          <div class="summary-label">Matières Enseignées</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${levels.reduce(
            (acc: number, level: Level) =>
              acc +
              level.classes.reduce(
                (acc2: number, cls: Class) => acc2 + (cls.maxStudents ?? 0),
                0
              ),
            0
          )}</div>
          <div class="summary-label">Capacité Totale</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${levels.reduce(
            (acc: number, level: Level) =>
              acc +
              level.classes.reduce(
                (acc2: number, cls: Class) => acc2 + (cls.schedule?.length ?? 0),
                0
              ),
            0
          )}</div>
          <div class="summary-label">Créneaux Horaires</div>
        </div>
      </div>
      </div>
    </body>
    </html>
  `;
};