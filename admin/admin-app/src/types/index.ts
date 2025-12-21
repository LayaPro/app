// Auth Types
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  tenantId: string;
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// Theme Types
export interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// UI Types
export interface UIState {
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  profilePanelOpen: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  message: string;
  count: number;
  data: T[];
  page?: number;
  totalPages?: number;
}

// Project Types
export interface Project {
  projectId: string;
  tenantId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  budget?: number;
  address?: string;
  referredBy?: string;
  projectDeliveryStatusId?: string;
  s3BucketName?: string;
  displayPic?: string;
  coverPhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Team Types
export interface TeamMember {
  memberId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileId: string;
  userId: string;
  address?: string;
  isFreelancer?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Equipment Types
export interface Equipment {
  equipmentId: string;
  tenantId: string;
  name: string;
  serialNumber?: string;
  qr?: string;
  brand?: string;
  price?: number;
  purchaseDate?: Date;
  isOnRent?: boolean;
  perDayRent?: number;
  image?: string;
  condition?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Event Types
export interface Event {
  eventId: string;
  tenantId: string;
  eventCode: string;
  eventDesc?: string;
  eventAlias?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Client Event Types
export interface ClientEvent {
  clientEventId: string;
  tenantId: string;
  eventId: string;
  projectId: string;
  eventDeliveryStatusId?: string;
  fromDatetime?: Date;
  toDatetime?: Date;
  venue?: string;
  venueMapUrl?: string;
  city?: string;
  teamMembersAssigned?: string[];
  equipmentsAssigned?: string[];
  expenseId?: string;
  coverPhoto?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Finance Types
export interface ProjectFinance {
  financeId: string;
  tenantId: string;
  projectId: string;
  totalBudget?: number;
  receivedAmount?: number;
  receivedDate?: Date;
  nextDueDate?: Date;
  nextDueAmount?: number;
  expenseIds?: string[];
  isClientClosed?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Dashboard Stats Types
export interface DashboardStats {
  projects: {
    total: number;
  };
  clientEvents: {
    total: number;
  };
  images: {
    total: number;
  };
  financials: {
    totalBudget: number;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    pendingPayments: number;
  };
}
