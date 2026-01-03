import { Schema, model, Document } from 'mongoose';

export interface IModule extends Document {
  moduleId: string;
  name: string;
  description: string;
  path: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

const ModuleSchema = new Schema<IModule>(
  {
    moduleId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    path: { type: String, required: true },
    icon: { type: String },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

export const Module = model<IModule>('Module', ModuleSchema);
export default Module;
