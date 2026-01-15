// Types pour le système de badges

export type BadgeOrientation = 'portrait' | 'paysage';

export interface StudentData {
  schoolName: string;
  schoolLogo?: string;
  name: string;
  className: string;
  id: string;
  dob: string;
  year: string;
  photo: string;
  bloodGroup?: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
}

export interface BadgeColors {
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bodyText: string;
  footerBg: string;
  footerText: string;
  accentColor: string;
  secondaryColor?: string;
}

export interface BadgeConfig {
  orientation: BadgeOrientation;
  showQR: boolean;
  colors: BadgeColors;
  templateId: string;
  backgroundImage?: string;
  backgroundPattern?: 'dots' | 'lines' | 'grid' | 'waves' | 'none';
}

export const defaultColors: BadgeColors = {
  headerBg: '#0d9488',
  headerText: '#ffffff',
  bodyBg: '#ffffff',
  bodyText: '#1f2937',
  footerBg: '#0d9488',
  footerText: '#ffffff',
  accentColor: '#14b8a6',
};

export const presetColors: Record<string, BadgeColors> = {
  orange: {
    headerBg: '#ea580c',
    headerText: '#ffffff',
    bodyBg: '#fff7ed',
    bodyText: '#1f2937',
    footerBg: '#ea580c',
    footerText: '#ffffff',
    accentColor: '#fb923c',
    secondaryColor: '#fed7aa',
  },
  blue: {
    headerBg: '#1e40af',
    headerText: '#ffffff',
    bodyBg: '#eff6ff',
    bodyText: '#1f2937',
    footerBg: '#1e40af',
    footerText: '#ffffff',
    accentColor: '#3b82f6',
    secondaryColor: '#bfdbfe',
  },
  purple: {
    headerBg: '#7c3aed',
    headerText: '#ffffff',
    bodyBg: '#f5f3ff',
    bodyText: '#1f2937',
    footerBg: '#7c3aed',
    footerText: '#ffffff',
    accentColor: '#a78bfa',
    secondaryColor: '#ddd6fe',
  },
  red: {
    headerBg: '#dc2626',
    headerText: '#ffffff',
    bodyBg: '#fef2f2',
    bodyText: '#1f2937',
    footerBg: '#dc2626',
    footerText: '#ffffff',
    accentColor: '#ef4444',
    secondaryColor: '#fecaca',
  },
  green: {
    headerBg: '#059669',
    headerText: '#ffffff',
    bodyBg: '#f0fdf4',
    bodyText: '#1f2937',
    footerBg: '#059669',
    footerText: '#ffffff',
    accentColor: '#10b981',
    secondaryColor: '#bbf7d0',
  },
  gold: {
    headerBg: '#b45309',
    headerText: '#ffffff',
    bodyBg: '#fffbeb',
    bodyText: '#1f2937',
    footerBg: '#b45309',
    footerText: '#ffffff',
    accentColor: '#f59e0b',
    secondaryColor: '#fde68a',
  },
};
