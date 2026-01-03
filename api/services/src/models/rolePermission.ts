import { Schema, model, Document } from 'mongoose';

export interface IRolePermission extends Document {
  permissionId: string;
  roleId: string;
  moduleId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    permissionId: { type: String, required: true, unique: true },
    roleId: { type: String, required: true, index: true },
    moduleId: { type: String, required: true, index: true },
    canView: { type: Boolean, required: true, default: false },
    canCreate: { type: Boolean, required: true, default: false },
    canEdit: { type: Boolean, required: true, default: false },
    canDelete: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

// Compound index: one permission record per role-module combination
RolePermissionSchema.index({ roleId: 1, moduleId: 1 }, { unique: true });

export const RolePermission = model<IRolePermission>('RolePermission', RolePermissionSchema);
export default RolePermission;
