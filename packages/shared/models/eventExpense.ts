export interface EventExpense {
  eventExpenseId: string;
  tenantId: string;
  clientEventId: string; // Reference to ClientEvent
  crewId: string; // Team member ID, or '-1' if not salary-related
  expenseComment?: string;
  expenseAmount: number;
  paymentDate?: Date;
  addedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
