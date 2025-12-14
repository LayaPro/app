import { Schema, model, Document } from 'mongoose';
import { Role as SharedRole } from '@laya/shared';

export interface IRole extends Document, SharedRole {}

const RoleSchema = new Schema<IRole>(
  {
    roleId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String }
  },
  { timestamps: true }
);

export const Role = model<IRole>('Role', RoleSchema);
export default Role;
