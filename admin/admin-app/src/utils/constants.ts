export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  ALBUMS: '/albums',
  CALENDAR: '/calendar',
  TEAM: '/team',
  EQUIPMENTS: '/equipments',
  FINANCES: '/finances',
  STATISTICS: '/statistics',
  SETTINGS: '/settings',
} as const;

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const SIDEBAR_WIDTH = {
  EXPANDED: '256px',
  COLLAPSED: '80px',
} as const;
