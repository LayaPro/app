export interface Role {
  roleId: string; // UUID
  tenantId: string; // '-1' for global roles (superadmin, admin), tenant's tenantId for tenant-specific roles
  name: string; // e.g., 'admin', 'photographer'
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
