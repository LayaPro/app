import { Schema, model, Document } from 'mongoose';

export interface SalaryTransaction {
  transactionId: string;
  datetime: Date;
  amount: number;
  comment?: string;
  nature: 'paid' | 'bonus' | 'deduction';
  createdAt?: Date;
}

export interface ITeamFinance extends Document {
  financeId: string;
  tenantId: string;
  memberId: string; // Reference to Team Member
  monthlySalary?: number;
  totalPaid?: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  pendingAmount?: number;
  transactions?: SalaryTransaction[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryTransactionSchema = new Schema<SalaryTransaction>({
  transactionId: { type: String, required: true },
  datetime: { type: Date, required: true },
  amount: { type: Number, required: true },
  comment: { type: String },
  nature: { type: String, enum: ['paid', 'bonus', 'deduction'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const TeamFinanceSchema = new Schema<ITeamFinance>(
  {
    financeId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    memberId: { type: String, required: true, index: true },
    monthlySalary: { type: Number },
    totalPaid: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    nextPaymentDate: { type: Date },
    pendingAmount: { type: Number, default: 0 },
    transactions: [SalaryTransactionSchema],
    createdBy: { type: String },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

TeamFinanceSchema.index({ tenantId: 1, memberId: 1 });

const TeamFinance = model<ITeamFinance>('TeamFinance', TeamFinanceSchema);

export default TeamFinance;
