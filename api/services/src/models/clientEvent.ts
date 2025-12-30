import { Schema, model, Document } from 'mongoose';
import { ClientEvent as SharedClientEvent } from 'laya-shared';

export interface IClientEvent extends Document, SharedClientEvent {}

const ClientEventSchema = new Schema<IClientEvent>(
  {
    clientEventId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true }, // Reference to Event
    projectId: { type: String, required: true, index: true }, // Reference to Project
    eventDeliveryStatusId: { type: String, index: true }, // Reference to EventDeliveryStatus
    fromDatetime: { type: Date },
    toDatetime: { type: Date },
    venue: { type: String },
    venueMapUrl: { type: String },
    city: { type: String },
    teamMembersAssigned: [{ type: String }], // Array of team member IDs
    equipmentsAssigned: [{ type: String }], // Array of equipment IDs
    expenseId: { type: String }, // Reference to Expense
    coverPhoto: { type: String },
    notes: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    albumPdfUrl: { type: String },
    albumPdfFileName: { type: String },
    albumPdfUploadedAt: { type: Date },
    albumPdfUploadedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index for project and event
ClientEventSchema.index({ projectId: 1, eventId: 1, tenantId: 1 });

export const ClientEvent = model<IClientEvent>('ClientEvent', ClientEventSchema);
export default ClientEvent;
