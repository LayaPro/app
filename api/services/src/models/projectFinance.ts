import { Schema, model, Document } from 'mongoose';
import { ProjectFinance as SharedProjectFinance } from 'laya-shared';

export interface IProjectFinance extends Document, SharedProjectFinance {}

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
    createdBy: { type: String },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index for tenant and project
ProjectFinanceSchema.index({ tenantId: 1, projectId: 1 });

export const ProjectFinance = model<IProjectFinance>('ProjectFinance', ProjectFinanceSchema);
export default ProjectFinance;
