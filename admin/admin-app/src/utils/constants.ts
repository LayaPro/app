export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  ALBUMS: '/albums',
  CALENDAR: '/calendar',
  FINANCES: '/finances',
  STATISTICS: '/statistics',
  
  // Access Management
  USERS: '/access/users',
  ROLES: '/access/roles',
  TENANTS: '/access/tenants',
  
  // Team Management
  TEAM_MEMBERS: '/team/members',
  DESIGNATIONS: '/team/designations',
  EQUIPMENTS: '/team/equipments',
  
  // Workflow Setup
  PROJECT_TYPES: '/workflow/project-types',
  PROJECT_STATUS: '/workflow/project-status',
  EVENT_TYPES: '/workflow/event-types',
  DELIVERY_STATUS: '/workflow/delivery-status',
  
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
