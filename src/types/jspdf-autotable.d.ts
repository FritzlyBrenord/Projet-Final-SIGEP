declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap';
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineColor?: number | number[];
    tableLineWidth?: number;
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      font?: string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    headStyles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      font?: string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    bodyStyles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      font?: string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    footStyles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      font?: string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    alternateRowStyles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      font?: string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number | number[];
      textColor?: number | number[];
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    columnStyles?: { [key: string]: any };
    didDrawPage?: (data: any) => void;
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
  }

  interface jsPDFWithPlugin extends jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }

  const autoTable: (doc: jsPDF, options: UserOptions) => jsPDF;
  export = autoTable;
}