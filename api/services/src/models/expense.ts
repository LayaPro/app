import { Schema, model, Document } from 'mongoose';

export interface IExpense extends Document {
  expenseId: string;
  tenantId: string;
  projectId?: string;
  eventId?: string;
  memberId?: string;
  expenseTypeId?: string;
  amount: number;
  comment: string;
  date: Date;
  addedBy: string;
  category?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    eventId: {
      type: String,
      index: true,
    },
    memberId: {
      type: String,
      index: true,
    },
    expenseTypeId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    comment: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    addedBy: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['salary', 'equipment', 'travel', 'venue', 'food', 'printing', 'other'],
      default: 'other',
    },
    receiptUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ExpenseSchema.index({ tenantId: 1, date: -1 });
ExpenseSchema.index({ tenantId: 1, projectId: 1 });
ExpenseSchema.index({ tenantId: 1, createdAt: -1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
