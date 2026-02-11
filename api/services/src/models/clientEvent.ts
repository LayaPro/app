import { Schema, model, Document } from 'mongoose';

export interface IClientEvent extends Document {
  clientEventId: string;
  tenantId: string;
  eventId: string; // Reference to Event master data
  projectId: string; // Reference to Project
  eventDeliveryStatusId?: string; // Reference to EventDeliveryStatus
  fromDatetime: Date;
  toDatetime: Date;
  duration: number; // Duration in hours
  venue?: string;
  venueMapUrl?: string;
  city?: string;
  teamMembersAssigned?: string[]; // Array of team member IDs
  equipmentsAssigned?: string[]; // Array of equipment IDs
  expenseId?: string; // Reference to Expense (to be created later)
  coverPhoto?: string;
  notes?: string;
  albumEditor?: string; // Team member ID assigned as album editor
  albumDesigner?: string; // Team member ID assigned as album designer
  editingDueDate?: Date; // Due date for editing completion
  albumDesignDueDate?: Date; // Due date for album design completion
  s3EventFolderName?: string; // Unique folder identifier for S3 storage
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientEventSchema = new Schema<IClientEvent>(
  {
    clientEventId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true }, // Reference to Event
    projectId: { type: String, required: true, index: true }, // Reference to Project
    eventDeliveryStatusId: { type: String, index: true }, // Reference to EventDeliveryStatus
    fromDatetime: { type: Date, required: true },
    toDatetime: { type: Date, required: true },
    duration: { type: Number, required: true, min: 0, max: 24 }, // Duration in hours (0-24)
    venue: { type: String },
    venueMapUrl: { type: String },
    city: { type: String },
    teamMembersAssigned: [{ type: String }], // Array of team member IDs
    equipmentsAssigned: [{ type: String }], // Array of equipment IDs
    expenseId: { type: String }, // Reference to Expense
    coverPhoto: { type: String },
    notes: { type: String },
    albumEditor: { type: String }, // Team member ID assigned as album editor
    albumDesigner: { type: String }, // Team member ID assigned as album designer
    editingDueDate: { type: Date }, // Due date for editing completion
    albumDesignDueDate: { type: Date }, // Due date for album design completion
    s3EventFolderName: { type: String }, // Folder identifier for S3 (unique per project via path structure)
    createdBy: { type: String },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index for project and event
ClientEventSchema.index({ projectId: 1, eventId: 1, tenantId: 1 });

export const ClientEvent = model<IClientEvent>('ClientEvent', ClientEventSchema);
export default ClientEvent;
