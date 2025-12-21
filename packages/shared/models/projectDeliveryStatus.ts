export interface ProjectDeliveryStatus {
  statusId: string;
  tenantId: string;
  statusCode: string;
  step: number; // Sequential order of status
  lastUpdatedDate?: Date;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
