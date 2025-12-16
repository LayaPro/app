export interface User {
  tenantId: string; // tenantId the user belongs to (single tenant)
  userId: string; // UUID
  email: string;
  passwordHash: string; // hashed password
  passwordSalt?: string;
  firstName: string;
  lastName: string;
  roleId: string; // Reference to Role._id (ObjectId)
  isActive: boolean;
  isPasswordSet: boolean; // false for new users with temporary password
  temporaryPassword?: string; // temporary password for first-time login
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}
