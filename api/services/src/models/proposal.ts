import { Schema, model, Document } from 'mongoose';

export interface IProposalEvent {
  eventId: string;
  eventName: string;
  eventType?: string;
  date?: string;
  venue?: string;
  photographyServices?: {
    type: string;
    label: string;
    count: number;
  }[];
  videographyServices?: {
    type: string;
    label: string;
    count: number;
  }[];
}

export interface IProposalDeliverable {
  name: string;
  description?: string;
  price: number;
}

export interface IProposal extends Document {
  proposalId: string;
  tenantId: string;
  
  // Basic Details
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  projectName: string;
  weddingDate?: string;
  venue?: string;
  
  // Events - Customer specific
  events: IProposalEvent[];
  
  // Terms - Customer specific
  termsOfService?: string;
  paymentTerms?: string;
  
  // Deliverables - Customer specific
  deliverables: IProposalDeliverable[];
  
  // Pricing - Customer specific
  totalAmount: number;
  
  // Access Control
  accessCode: string; // Unique URL-friendly code for customer portal access
  accessPin: string; // 4-digit PIN for customer portal access
  
  // Validity
  validUntil?: Date;
  
  // Status
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'project_created';
  
  // Common fields (from organization) - stored as reference, not duplicated
  // These will be fetched from organization at generation time:
  // - companyName, tagline, aboutUs (from organization.companyName, organization.tagline, organization.aboutUs)
  
  // Metadata
  sentAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

const ProposalEventSchema = new Schema({
  eventId: { type: String, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String },
  date: { type: String },
  venue: { type: String },
  photographyServices: [{
    type: { type: String, required: true },
    label: { type: String, required: true },
    count: { type: Number, required: true, min: 0 }
  }],
  videographyServices: [{
    type: { type: String, required: true },
    label: { type: String, required: true },
    count: { type: Number, required: true, min: 0 }
  }]
}, { _id: false });

const ProposalDeliverableSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProposalSchema = new Schema<IProposal>(
  {
    proposalId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    
    // Basic Details
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    clientPhone: { type: String, trim: true },
    projectName: { type: String, required: true, trim: true },
    weddingDate: { type: String },
    venue: { type: String, trim: true },
    
    // Events
    events: { type: [ProposalEventSchema], default: [] },
    
    // Terms
    termsOfService: { type: String },
    paymentTerms: { type: String },
    
    // Deliverables
    deliverables: { type: [ProposalDeliverableSchema], default: [] },
    
    // Pricing
    totalAmount: { type: Number, required: true, min: 0 },
    
    // Access Control
    accessCode: { type: String, required: true, unique: true, index: true },
    accessPin: { type: String, required: true, length: 4 },
    
    // Validity
    validUntil: { type: Date },
    
    // Status
    status: { 
      type: String, 
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'project_created'],
      default: 'draft',
      required: true 
    },
    
    // Metadata
    sentAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    
    createdBy: { type: String, required: true },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Indexes for efficient querying
ProposalSchema.index({ tenantId: 1, status: 1 });
ProposalSchema.index({ clientEmail: 1, tenantId: 1 });
ProposalSchema.index({ projectName: 1, tenantId: 1 });
ProposalSchema.index({ createdAt: -1 });

// Index for searching by client name
ProposalSchema.index({ clientName: 'text', projectName: 'text' });

export const Proposal = model<IProposal>('Proposal', ProposalSchema);
export default Proposal;
