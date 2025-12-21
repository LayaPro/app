export interface ClientEvent {
  clientEventId: string;
  tenantId: string;
  eventId: string; // Reference to Event master data
  projectId: string; // Reference to Project
  eventDeliveryStatusId?: string; // Reference to EventDeliveryStatus
  fromDatetime?: Date;
  toDatetime?: Date;
  venue?: string;
  venueMapUrl?: string;
  city?: string;
  teamMembersAssigned?: string[]; // Array of team member IDs
  equipmentsAssigned?: string[]; // Array of equipment IDs
  expenseId?: string; // Reference to Expense (to be created later)
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
