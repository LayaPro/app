import { Schema, model, Document } from 'mongoose';

export interface Transaction {
  transactionId: string;
  datetime: Date;
  amount: number;
  comment?: string;
  nature: 'received' | 'paid';
  createdAt?: Date;
}

export interface IProjectFinance extends Document {
  financeId: string;
  tenantId: string;
  projectId: string; // Reference to Project
  totalBudget?: number;
  receivedAmount?: number;
  receivedDate?: Date;
  nextDueDate?: Date;
  nextDueAmount?: number;
  expenseIds?: string[]; // Array of expense IDs
  isClientClosed?: boolean;
  transactions?: Transaction[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFinanceSchema = new Schema<IProjectFinance>(
  {
    financeId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, unique: true, index: true }, // One finance record per project
    totalBudget: { type: Number },
    receivedAmount: { type: Number, default: 0 },
    receivedDate: { type: Date },
    nextDueDate: { type: Date },
    nextDueAmount: { type: Number },
    expenseIds: [{ type: String }], // Array of expense IDs
    isClientClosed: { type: Boolean, default: false },
    transactions: [{
      transactionId: { type: String, required: true },
      datetime: { type: Date, required: true },
      amount: { type: Number, required: true },
      comment: { type: String },
      nature: { type: String, enum: ['received', 'paid'], required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    createdBy: { type: String },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index for tenant and project
ProjectFinanceSchema.index({ tenantId: 1, projectId: 1 });

export const ProjectFinance = model<IProjectFinance>('ProjectFinance', ProjectFinanceSchema);
export default ProjectFinance;
