import { Schema, model, Document } from 'mongoose';
import { Event as SharedEvent } from 'laya-shared';

export interface IEvent extends Document, SharedEvent {}

const EventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    eventCode: { type: String, required: true, trim: true },
    eventDesc: { type: String, required: true, trim: true },
    eventAlias: { type: String, trim: true }
  },
  { timestamps: true }
);

// Compound index: event code must be unique within a tenant
EventSchema.index({ eventCode: 1, tenantId: 1 }, { unique: true });

export const Event = model<IEvent>('Event', EventSchema);
export default Event;
