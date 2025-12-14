export interface Role {
  roleId: string; // UUID
  name: string; // e.g., 'admin', 'photographer'
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
