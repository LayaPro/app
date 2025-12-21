export interface Event {
  eventId: string;
  tenantId: string;
  eventCode: string;
  eventDesc: string;
  eventAlias?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
