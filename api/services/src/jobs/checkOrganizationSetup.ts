import Organization from '../models/organization';
import Todo from '../models/todo';
import User from '../models/user';
import Role from '../models/role';

/**
 * Check if organization has completed setup and create a system todo if not
 * This runs once per tenant and creates a single todo listing all missing fields
 */
export const checkAndCreateOrganizationSetupTodo = async (tenantId: string): Promise<void> => {
  try {
    // Check if organization setup todo already exists
    const existingTodo = await Todo.findOne({
      tenantId,
      description: { $regex: /^Complete Organization Setup/, $options: 'i' },
      addedBy: 'system'
    });

    if (existingTodo) {
      console.log(`[ORG_SETUP] Setup todo already exists for tenant: ${tenantId}`);
      return;
    }

    // Fetch organization data
    const organization = await Organization.findOne({ tenantId });

    if (!organization) {
      console.log(`[ORG_SETUP] No organization found for tenant: ${tenantId}`);
      return;
    }

    // Check which fields are missing
    const missingFields: string[] = [];

    if (!organization.tagline || organization.tagline.trim() === '') {
      missingFields.push('Tagline');
    }

    if (!organization.aboutUs || organization.aboutUs.trim() === '') {
      missingFields.push('About Us');
    }

    if (!organization.termsOfService || organization.termsOfService.trim() === '') {
      missingFields.push('Terms of Service');
    }

    if (!organization.termsOfPayment || organization.termsOfPayment.trim() === '') {
      missingFields.push('Payment Terms');
    }

    if (!organization.deliverables || organization.deliverables.length === 0) {
      missingFields.push('Deliverables');
    }

    if (!organization.addOns || organization.addOns.trim() === '') {
      missingFields.push('Add-ons/Services');
    }

    if (!organization.email || organization.email.trim() === '') {
      missingFields.push('Contact Email');
    }

    if (!organization.phone || organization.phone.trim() === '') {
      missingFields.push('Contact Phone');
    }

    if (!organization.address || organization.address.trim() === '') {
      missingFields.push('Address');
    }

    // If all fields are filled, no need to create todo
    if (missingFields.length === 0) {
      console.log(`[ORG_SETUP] Organization setup complete for tenant: ${tenantId}`);
      return;
    }

    // Find all admin users to assign the todo
    const adminRole = await Role.findOne({
      $or: [
        { tenantId: '-1', name: 'Admin' },
        { tenantId, name: 'Admin' }
      ]
    });

    if (!adminRole) {
      console.log(`[ORG_SETUP] Admin role not found for tenant: ${tenantId}`);
      return;
    }

    const adminUsers = await User.find({
      tenantId,
      roleId: adminRole.roleId,
      isActive: true
    });

    if (adminUsers.length === 0) {
      console.log(`[ORG_SETUP] No active admin users found for tenant: ${tenantId}`);
      return;
    }

    // Create description with all missing fields
    const fieldsList = missingFields.join(', ');
    const description = `Complete Organization Setup: Add ${fieldsList}`;

    // Create a todo for each admin user
    const todoPromises = adminUsers.map(admin => {
      const todoData = {
        tenantId,
        userId: admin.userId,
        description,
        priority: 'high' as const,
        redirectUrl: '/settings/organization',
        addedBy: 'system',
        isDone: false
      };

      return Todo.create(todoData);
    });

    await Promise.all(todoPromises);

    console.log(`[ORG_SETUP] Created organization setup todo for ${adminUsers.length} admin(s) in tenant: ${tenantId}`);
    console.log(`[ORG_SETUP] Missing fields: ${fieldsList}`);

  } catch (error) {
    console.error('[ORG_SETUP] Error checking organization setup:', error);
    // Don't throw - this is a background job, should not break main flow
  }
};
