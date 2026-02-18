export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROPOSALS: '/proposals',
  ALBUMS: '/albums',
  CALENDAR: '/calendar',
  CALENDAR_EVENTS_LIST: '/calendar/events-list',
  CALENDAR_EVENTS_CALENDAR: '/calendar/events-calendar',
  FINANCES: '/finances',
  FINANCES_OVERVIEW: '/finances/overview',
  FINANCES_CUSTOMERS: '/finances/customers',
  FINANCES_TEAM_MEMBERS: '/finances/team-members',
  FINANCES_EXPENSES: '/finances/expenses',
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
  ORGANIZATION_BASIC_DETAILS: '/organization/basic-details',
  ORGANIZATION_TERMS: '/organization/terms',
  ORGANIZATION_DELIVERABLES: '/organization/deliverables',
  
  STORAGE: '/storage',
  SETTINGS: '/settings',
  AUDIT_TRAIL: '/audit-trail',
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
