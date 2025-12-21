import { Schema, model, Document } from 'mongoose';
import { Equipment as SharedEquipment } from 'laya-shared';

export interface IEquipment extends Document, SharedEquipment {}

const EquipmentSchema = new Schema<IEquipment>(
  {
    equipmentId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, trim: true },
    qr: { type: String, trim: true },
    brand: { type: String, trim: true },
    price: { type: Number },
    purchaseDate: { type: Date },
    isOnRent: { type: Boolean, required: true, default: false },
    perDayRent: { type: Number },
    image: { type: String },
    condition: { type: Number, min: 0, max: 5 } // Points out of 5
  },
  { timestamps: true }
);

// Index for searching by name
EquipmentSchema.index({ name: 1, tenantId: 1 });

export const Equipment = model<IEquipment>('Equipment', EquipmentSchema);
export default Equipment;
