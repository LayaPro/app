export interface ImageStatus {
  statusId: string;
  tenantId: string;
  statusCode: string; // Uppercase with underscores (e.g., UPLOADED, REVIEW_PENDING)
  statusDescription: string; // Human-readable description
  step: number; // Sequential order of status
  createdAt?: Date;
  updatedAt?: Date;
}
