import { Schema, model, Document } from 'mongoose';

export interface IProfile extends Document {
  profileId: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    profileId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String }
  },
  { timestamps: true }
);

// Compound index: profile name must be unique within a tenant
ProfileSchema.index({ name: 1, tenantId: 1 }, { unique: true });

export const Profile = model<IProfile>('Profile', ProfileSchema);
export default Profile;
