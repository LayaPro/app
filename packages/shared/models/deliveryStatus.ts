export interface DeliveryStatus {
  statusId: string;
  tenantId: string;
  statusCode: string;
  lastUpdatedDate?: Date;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
