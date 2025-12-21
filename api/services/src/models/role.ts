import { Schema, model, Document } from 'mongoose';
import { Role as SharedRole } from 'laya-shared';

export interface IRole extends Document, SharedRole {}

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
