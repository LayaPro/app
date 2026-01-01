export interface SalaryTransaction {
  transactionId: string;
  datetime: Date;
  amount: number;
  comment?: string;
  nature: 'paid' | 'bonus' | 'deduction';
  createdAt?: Date;
}

export interface TeamFinance {
  financeId: string;
  tenantId: string;
  memberId: string; // Reference to Team Member
  monthlySalary?: number;
  totalPaid?: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  pendingAmount?: number;
  transactions?: SalaryTransaction[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
