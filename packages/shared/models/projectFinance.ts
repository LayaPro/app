export interface ProjectFinance {
  financeId: string;
  tenantId: string;
  projectId: string; // Reference to Project
  totalBudget?: number;
  receivedAmount?: number;
  receivedDate?: Date;
  nextDueDate?: Date;
  nextDueAmount?: number;
  expenseIds?: string[]; // Array of expense IDs
  isClientClosed?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
