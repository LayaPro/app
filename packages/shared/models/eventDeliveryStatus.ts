export interface EventDeliveryStatus {
  statusId: string;
  tenantId: string;
  statusCode: string; // Uppercase with underscores (e.g., SHOOT_SCHEDULED)
  statusDescription: string; // Human-readable description
  statusExplaination?: string; // Internal note describing why the status exists
  statusCustomerNote?: string; // Customer-facing note shown to end clients
  step: number; // Sequential order of status
  isHidden?: boolean; // Hidden statuses only shown when triggered
  lastUpdatedDate?: Date;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
