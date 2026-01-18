import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
  organizationId: string;
  tenantId: string;
  
  // Basic Details
  companyName: string;
  tagline?: string;
  logo?: string; // S3 URL
  primaryColor?: string;
  secondaryColor?: string;
  
  // About Us
  aboutUs?: string;
  mission?: string;
  vision?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  website?: string;
  
  // Social Media Links
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  
  // Terms of Service
  termsOfService?: string;
  termsOfPayment?: string;
  cancellationPolicy?: string;
  refundPolicy?: string;
  
  // Portfolio Images
  portfolioImages?: {
    imageUrl: string;
    title?: string;
    description?: string;
    category?: string;
    order?: number;
  }[];
  
  // Quotation Portfolio Images (simple array for About Us section)
  quotationPortfolioImages?: string[];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    organizationId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    
    // Basic Details
    companyName: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    logo: { type: String, trim: true },
    primaryColor: { type: String, trim: true },
    secondaryColor: { type: String, trim: true },
    
    // About Us
    aboutUs: { type: String },
    mission: { type: String },
    vision: { type: String },
    
    // Contact Information
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    address: { type: String },
    website: { type: String, trim: true },
    
    // Social Media Links
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    youtube: { type: String, trim: true },
    
    // Terms of Service
    termsOfService: { type: String },
    termsOfPayment: { type: String },
    cancellationPolicy: { type: String },
    refundPolicy: { type: String },
    
    // Portfolio Images
    portfolioImages: [{
      imageUrl: { type: String, required: true },
      title: { type: String, trim: true },
      description: { type: String },
      category: { type: String, trim: true },
      order: { type: Number, default: 0 }
    }],
    
    // Quotation Portfolio Images
    quotationPortfolioImages: [{ type: String }],
    
    createdBy: { type: String },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Index for tenant-based queries
OrganizationSchema.index({ tenantId: 1 });

export const Organization = model<IOrganization>('Organization', OrganizationSchema);
export default Organization;
