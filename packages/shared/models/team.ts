export interface Team {
  memberId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  govtIdNumber?: string;
  profileId?: string; // Reference to Profile
  userId?: string; // Reference to User for login access
  address?: string;
  isFreelancer: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
