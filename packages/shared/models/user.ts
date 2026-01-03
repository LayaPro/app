export interface User {
  tenantId: string; // tenantId the user belongs to (single tenant)
  userId: string; // UUID
  email: string;
  passwordHash?: string; // hashed password (optional for activation flow)
  passwordSalt?: string;
  firstName: string;
  lastName: string;
  roleId: string; // Reference to Role table
  isActive: boolean;
  isActivated?: boolean; // Email activation status
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  activationToken?: string | null; // Email activation token
  activationTokenExpires?: Date | null; // Token expiry
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}
