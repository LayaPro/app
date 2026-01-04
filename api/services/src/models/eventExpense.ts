import { Schema, model, Document } from 'mongoose';

export interface IEventExpense extends Document {
  eventExpenseId: string;
  tenantId: string;
  clientEventId: string; // Reference to ClientEvent
  crewId: string; // Team member ID, or '-1' if not salary-related
  expenseComment?: string;
  expenseAmount: number;
  paymentDate?: Date;
  addedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventExpenseSchema = new Schema<IEventExpense>(
  {
    eventExpenseId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    clientEventId: { type: String, required: true, index: true }, // Reference to ClientEvent
    crewId: { type: String, required: true, index: true }, // Team member ID or '-1'
    expenseComment: { type: String },
    expenseAmount: { type: Number, required: true },
    paymentDate: { type: Date },
    addedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index for tenant and client event
EventExpenseSchema.index({ tenantId: 1, clientEventId: 1 });

export const EventExpense = model<IEventExpense>('EventExpense', EventExpenseSchema);
export default EventExpense;
