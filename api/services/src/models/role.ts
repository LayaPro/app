import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  roleId: string; // UUID
  tenantId: string; // '-1' for global roles (Admin, Editor, Designer), tenant's tenantId for tenant-specific roles
  name: string; // e.g., 'admin', 'photographer'
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    roleId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, default: '-1', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String }
  },
  { timestamps: true }
);

// Compound index: name must be unique within a tenant (or globally if tenantId is '-1')
RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

export const Role = model<IRole>('Role', RoleSchema);
export default Role;
