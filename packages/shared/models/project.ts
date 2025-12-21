export interface Project {
  projectId: string;
  tenantId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  budget?: number;
  address?: string;
  referredBy?: string;
  projectDeliveryStatusId?: string; // Reference to ProjectDeliveryStatus
  s3BucketName?: string;
  displayPic?: string;
  coverPhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
