export interface Team {
  memberId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  govtIdNumber?: string;
  roleId?: string; // Reference to Role for access level
  profileId?: string; // Reference to Profile
  userId?: string; // Reference to User for login access
  address?: string;
  isFreelancer: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
