import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', SettingsSchema);
export default Settings;
