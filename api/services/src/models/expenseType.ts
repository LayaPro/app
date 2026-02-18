import { Schema, model, Document } from 'mongoose';

export interface IExpenseType extends Document {
  expenseTypeId: string;
  tenantId: string;
  name: string;
  description?: string;
  requiresProject: boolean;
  requiresEvent: boolean;
  requiresMember: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseTypeSchema = new Schema<IExpenseType>(
  {
    expenseTypeId: {
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
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    requiresProject: {
      type: Boolean,
      required: true,
      default: true,
    },
    requiresEvent: {
      type: Boolean,
      required: true,
      default: true,
    },
    requiresMember: {
      type: Boolean,
      required: true,
      default: false,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 999,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant and name uniqueness
ExpenseTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const ExpenseType = model<IExpenseType>('ExpenseType', ExpenseTypeSchema);
export default ExpenseType;
