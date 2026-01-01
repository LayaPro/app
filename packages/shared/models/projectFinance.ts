export interface Transaction {
  transactionId: string;
  datetime: Date;
  amount: number;
  comment?: string;
  nature: 'received' | 'paid';
  createdAt?: Date;
}

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
  transactions?: Transaction[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
