import { Schema, model, Document } from 'mongoose';
import { Profile as SharedProfile } from 'laya-shared';

export interface IProfile extends Document, SharedProfile {}

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
