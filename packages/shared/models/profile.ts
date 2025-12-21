export interface Profile {
  profileId: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
