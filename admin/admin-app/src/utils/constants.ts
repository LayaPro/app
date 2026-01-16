export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fej22pbnws.ap-south-1.awsapprunner.com';

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
  ACCESS_MANAGEMENT: '/access-management',
  USERS: '/access/users',
  ROLES: '/access/roles',
  TENANTS: '/access/tenants',
  
  // Team Management
  TEAM_MEMBERS: '/team/members',
  DESIGNATIONS: '/team/designations',
  EQUIPMENTS: '/team/equipments',
  
  // Workflow Setup
  EVENTS_SETUP: '/workflow/events-setup',
  GALLERY_SETUP: '/workflow/gallery-setup',
  PROJECTS_SETUP: '/workflow/projects-setup',
  
  // Organization
  ORGANIZATION: '/organization',
  
  SETTINGS: '/settings',
} as const;

export const ROLES = {
  ADMIN: 'Admin',
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
