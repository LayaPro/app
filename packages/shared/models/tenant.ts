export interface Tenant {
  tenantId: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string;
  tenantUsername: string;
  tenantEmailAddress: string;
  countryCode: string;
  tenantPhoneNumber: string;
  isActive: boolean;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  subscriptionPlan: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
