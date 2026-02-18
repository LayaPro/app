import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import Role from './models/role';
import Profile from './models/profile';
import Event from './models/event';
import EventDeliveryStatus from './models/eventDeliveryStatus';
import ProjectDeliveryStatus from './models/projectDeliveryStatus';
import ImageStatus from './models/imageStatus';
import Module from './models/module';
import RolePermission from './models/rolePermission';
import { SubscriptionPlan } from './models/subscriptionPlan';
import ExpenseType from './models/expenseType';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'flomingo_db' });
    console.log('Connected to DB');

    // 1. Create Admin role if it doesn't exist
    let adminRole = await Role.findOne({ name: 'Admin', tenantId: '-1' });
    if (!adminRole) {
      const roleId = `role_${nanoid()}`;
      adminRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Admin',
        description: 'Full control of entire system'
      });
      console.log('✓ Created Admin role:', roleId);
    } else {
      console.log('✓ Admin role already exists');
    }

    // 2. Create Photo Editor role if it doesn't exist
    let photoEditorRole = await Role.findOne({ name: 'Photo Editor', tenantId: '-1' });
    if (!photoEditorRole) {
      const roleId = `role_${nanoid()}`;
      photoEditorRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Photo Editor',
        description: 'Edits and uploads photos for assigned events'
      });
      console.log('✓ Created Photo Editor role:', roleId);
    } else {
      console.log('✓ Photo Editor role already exists');
    }

    // 3. Create Album Designer role if it doesn't exist
    let albumDesignerRole = await Role.findOne({ name: 'Album Designer', tenantId: '-1' });
    if (!albumDesignerRole) {
      const roleId = `role_${nanoid()}`;
      albumDesignerRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Album Designer',
        description: 'Designs and uploads pdf albums for events'
      });
      console.log('✓ Created Album Designer role:', roleId);
    } else {
      console.log('✓ Album Designer role already exists');
    }

    // 8. Create system modules
    const modules = [
      { name: 'Dashboard', description: 'Overview and analytics', path: '/dashboard', icon: 'dashboard', order: 1 },
      { name: 'Albums', description: 'Manage photo and video albums', path: '/albums', icon: 'albums', order: 2 },
      { name: 'Projects', description: 'Project management', path: '/projects', icon: 'projects', order: 3 },
      { name: 'Finances', description: 'Financial management and reports', path: '/finances', icon: 'finances', order: 4 },
      { name: 'Calendar', description: 'Event scheduling and calendar', path: '/calendar', icon: 'calendar', order: 5 },
      { name: 'Events Setup', description: 'Event configuration and setup', path: '/workflow/events-setup', icon: 'events', order: 6 },
      { name: 'Team Setup', description: 'Team member management', path: '/team/members', icon: 'team', order: 7 },
      { name: 'Equipments', description: 'Equipment tracking and management', path: '/team/equipments', icon: 'equipments', order: 8 },
      { name: 'Access Management', description: 'User roles and permissions', path: '/access-management', icon: 'access', order: 9 },
    ];

    console.log('\n✓ Creating system modules...');
    const moduleMap: Record<string, any> = {};
    let moduleCreatedCount = 0;
    let moduleExistingCount = 0;

    for (const moduleData of modules) {
      let module = await Module.findOne({ name: moduleData.name });
      if (!module) {
        const moduleId = `module_${nanoid()}`;
        module = await Module.create({
          moduleId,
          ...moduleData,
          isActive: true
        });
        moduleCreatedCount++;
        console.log(`  Created module: ${moduleData.name}`);
      } else {
        moduleExistingCount++;
      }
      moduleMap[moduleData.name] = module;
    }

    console.log(`✓ Modules: ${moduleCreatedCount} created, ${moduleExistingCount} already exist`);

    // 4. Create role permissions
    console.log('\n✓ Creating role permissions...');
    
    const rolePermissions = [
      // Admin - Full access to everything
      { roleName: 'Admin', modules: ['Dashboard', 'Albums', 'Projects', 'Finances', 'Calendar', 'Events Setup', 'Team Setup', 'Equipments', 'Access Management'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true } },
      
      // Photo Editor - Edits and uploads photos for assigned events
      { roleName: 'Photo Editor', modules: ['Dashboard', 'Albums', 'Calendar', 'Events Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
      
      // Album Designer - Designs and uploads PDF albums
      { roleName: 'Album Designer', modules: ['Dashboard', 'Albums', 'Calendar', 'Events Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
    ];

    let permissionCreatedCount = 0;
    let permissionExistingCount = 0;

    for (const rolePermConfig of rolePermissions) {
      const role = rolePermConfig.roleName === 'Admin' ? adminRole :
                   rolePermConfig.roleName === 'Photo Editor' ? photoEditorRole :
                   rolePermConfig.roleName === 'Album Designer' ? albumDesignerRole : null;

      if (!role) continue;

      for (const moduleName of rolePermConfig.modules) {
        const module = moduleMap[moduleName];
        if (!module) continue;

        const existing = await RolePermission.findOne({
          roleId: role.roleId,
          moduleId: module.moduleId
        });

        if (!existing) {
          const permissionId = `perm_${nanoid()}`;
          await RolePermission.create({
            permissionId,
            roleId: role.roleId,
            moduleId: module.moduleId,
            ...rolePermConfig.permissions
          });
          permissionCreatedCount++;
        } else {
          permissionExistingCount++;
        }
      }
    }

    console.log(`✓ Role Permissions: ${permissionCreatedCount} created, ${permissionExistingCount} already exist`);

// 5. Create default profiles (GLOBAL - shared across all tenants)
    const defaultProfiles = [
      { name: 'Candid Photographer', description: 'Captures candid moments and natural expressions' },
      { name: 'Cinematographer', description: 'Creates cinematic video content' },
      { name: 'Traditional Photographer', description: 'Specializes in traditional photography styles' },
      { name: 'Traditional Videographer', description: 'Captures traditional video content' },
    ];

    console.log('\n✓ Creating default profiles (Global)...');
    let createdCount = 0;
    let existingCount = 0;

    for (const profileData of defaultProfiles) {
      const existing = await Profile.findOne({ 
        name: profileData.name, 
        tenantId: -1 
      });

      if (!existing) {
        const profileId = `profile_${nanoid()}`;
        await Profile.create({
          profileId,
          tenantId: -1, // Global data
          name: profileData.name,
          description: profileData.description
        });
        createdCount++;
        console.log(`  ✓ Created profile: ${profileData.name}`);
      } else {
        existingCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Created ${createdCount} new profile(s)`);
    }
    if (existingCount > 0) {
      console.log(`✓ ${existingCount} profile(s) already exist`);
    }

    // 6. Create default events (GLOBAL - shared across all tenants)
    const defaultEvents = [
      { eventCode: 'PREWEDDING', eventDesc: 'Pre Wedding', eventAlias: 'Pre-Wedding Shoot' },
      { eventCode: 'SANGEET', eventDesc: 'Sangeet', eventAlias: 'Sangeet Ceremony' },
      { eventCode: 'HALDI', eventDesc: 'Haldi', eventAlias: 'Haldi Ceremony' },
      { eventCode: 'MEHANDI', eventDesc: 'Mehandi', eventAlias: 'Mehandi Ceremony' },
      { eventCode: 'RECEPTION', eventDesc: 'Reception', eventAlias: 'Wedding Reception' },
      { eventCode: 'WEDDING', eventDesc: 'Wedding', eventAlias: 'Wedding Ceremony' },
      { eventCode: 'PHERA', eventDesc: 'Phera', eventAlias: 'Phera Ceremony' }
    ];

    console.log('\n✓ Creating default events (Global)...');
    let createdEventCount = 0;
    let existingEventCount = 0;

    for (const eventData of defaultEvents) {
      const existing = await Event.findOne({ 
        eventCode: eventData.eventCode, 
        tenantId: -1 
      });

      if (!existing) {
        const eventId = `event_${nanoid()}`;
        await Event.create({
          eventId,
          tenantId: -1, // Global data
          eventCode: eventData.eventCode,
          eventDesc: eventData.eventDesc,
          eventAlias: eventData.eventAlias
        });
        createdEventCount++;
        console.log(`  ✓ Created event: ${eventData.eventCode}`);
      } else {
        existingEventCount++;
      }
    }

    if (createdEventCount > 0) {
      console.log(`✓ Created ${createdEventCount} new event(s)`);
    }
    if (existingEventCount > 0) {
      console.log(`✓ ${existingEventCount} event(s) already exist`);
    }

    // 7. Create default event delivery statuses (GLOBAL - shared across all tenants)
    const defaultEventStatuses = [
      {
        statusCode: 'SCHEDULED',
        statusDescription: 'Scheduled',
        statusExplaination: 'Event is created and upcoming. Shooting hasn\'t started because the scheduled date/time is in the future.',
        statusCustomerNote: 'Your event is scheduled. Our crew will arrive at the planned start time.',
        step: 1,
        isHidden: false
      },
      {
        statusCode: 'SHOOT_IN_PROGRESS',
        statusDescription: 'Shoot in progress',
        statusExplaination: 'The scheduled time has started and the crew is actively capturing the event.',
        statusCustomerNote: 'We\'re currently covering your event on-site.',
        step: 2,
        isHidden: false
      },
      {
        statusCode: 'AWAITING_EDITING',
        statusDescription: 'Awaiting editing',
        statusExplaination: 'Event dates are complete. Media is queued and ready for the editing team.',
        statusCustomerNote: 'We\'ve wrapped shooting and will begin editing shortly.',
        step: 3,
        isHidden: false
      },
      {
        statusCode: 'EDITING_ONGOING',
        statusDescription: 'Editing ongoing',
        statusExplaination: 'An editor has been assigned and is actively working on the deliverables.',
        statusCustomerNote: 'Our editors are polishing your images and videos.',
        step: 4,
        isHidden: false
      },
      {
        statusCode: 'REVIEW_ONGOING',
        statusDescription: 'Review ongoing',
        statusExplaination: 'Edited media is uploaded and internal QA/review is happening before publish.',
        statusCustomerNote: 'We\'re reviewing the edited photos before releasing them to you.',
        step: 5,
        isHidden: false
      },
      {
        statusCode: 'PUBLISHED',
        statusDescription: 'Published',
        statusExplaination: 'The album is published and visible to the customer portal.',
        statusCustomerNote: 'Your album is live and ready for viewing.',
        step: 6,
        isHidden: false
      },
      {
        statusCode: 'CLIENT_SELECTION_DONE',
        statusDescription: 'Client selection done',
        statusExplaination: 'The customer finished selecting favorites for the final album.',
        statusCustomerNote: 'Selections are locked. We\'re getting started on the album design.',
        step: 7,
        isHidden: false
      },
      {
        statusCode: 'ALBUM_DESIGN_ONGOING',
        statusDescription: 'Album design ongoing',
        statusExplaination: 'Album designer assigned and actively building layouts. This step should only start after selections are done.',
        statusCustomerNote: 'Our designer is crafting your album layout.',
        step: 8,
        isHidden: false
      },
      {
        statusCode: 'ALBUM_DESIGN_COMPLETE',
        statusDescription: 'Album design complete',
        statusExplaination: 'Album PDF/proof uploaded and awaiting the customer\'s approval.',
        statusCustomerNote: 'Your album proof is ready for review and approval.',
        step: 9,
        isHidden: false
      },
      {
        statusCode: 'ALBUM_PRINTING',
        statusDescription: 'Album printing',
        statusExplaination: 'Customer approved the album design and production/printing is underway.',
        statusCustomerNote: 'Your approved album is now being printed.',
        step: 10,
        isHidden: false
      },
      {
        statusCode: 'DELIVERY',
        statusDescription: 'Delivery',
        statusExplaination: 'Physical or digital deliverables are dispatched or handed over to the customer.',
        statusCustomerNote: 'Your order is out for delivery or ready for pickup.',
        step: 11,
        isHidden: false
      }
    ];

    console.log('\n✓ Creating default event delivery statuses (Global)...');
    let createdEventStatusCount = 0;
    let existingEventStatusCount = 0;

    for (const statusData of defaultEventStatuses) {
      const existing = await EventDeliveryStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: -1 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await EventDeliveryStatus.create({
          statusId,
          tenantId: -1, // Global data
          statusCode: statusData.statusCode,
          statusDescription: statusData.statusDescription,
          step: statusData.step,
          isHidden: statusData.isHidden || false,
          statusExplaination: statusData.statusExplaination,
          statusCustomerNote: statusData.statusCustomerNote
        });
        createdEventStatusCount++;
        const hiddenText = statusData.isHidden ? ' (Hidden)' : '';
        console.log(`  ✓ Created event status: ${statusData.statusCode} - ${statusData.statusDescription} (Step ${statusData.step})${hiddenText}`);
      } else {
        existingEventStatusCount++;
      }
    }

    if (createdEventStatusCount > 0) {
      console.log(`✓ Created ${createdEventStatusCount} new event status(es)`);
    }
    if (existingEventStatusCount > 0) {
      console.log(`✓ ${existingEventStatusCount} event status(es) already exist`);
    }

    // 8. Create default project delivery statuses (GLOBAL - shared across all tenants)
    const defaultProjectStatuses = [
      { statusCode: 'Lead', step: 1 },
      { statusCode: 'Negotiation', step: 2 },
      { statusCode: 'Booking Confirmed', step: 3 },
      { statusCode: 'Advance Paid', step: 4 },
      { statusCode: 'Event Completed', step: 5 },
      { statusCode: 'Final Payment Pending', step: 6 },
      { statusCode: 'Delivered', step: 7 },
      { statusCode: 'Closed', step: 8 }
    ];

    console.log('\n✓ Creating default project delivery statuses (Global)...');
    let createdProjectStatusCount = 0;
    let existingProjectStatusCount = 0;

    for (const statusData of defaultProjectStatuses) {
      const existing = await ProjectDeliveryStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: -1 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await ProjectDeliveryStatus.create({
          statusId,
          tenantId: -1, // Global data
          statusCode: statusData.statusCode,
          step: statusData.step
        });
        createdProjectStatusCount++;
        console.log(`  ✓ Created project status: ${statusData.statusCode} (Step ${statusData.step})`);
      } else {
        existingProjectStatusCount++;
      }
    }

    if (createdProjectStatusCount > 0) {
      console.log(`✓ Created ${createdProjectStatusCount} new project status(es)`);
    }
    if (existingProjectStatusCount > 0) {
      console.log(`✓ ${existingProjectStatusCount} project status(es) already exist`);
    }

    // 9. Create default image statuses (GLOBAL - shared across all tenants)
    const defaultImageStatuses = [
      { statusCode: 'REVIEW_PENDING', statusDescription: 'Review pending', step: 1 },
      { statusCode: 'RE_EDIT_SUGGESTED', statusDescription: 'Re-edit requested', step: 2 },
      { statusCode: 'RE_EDIT_DONE', statusDescription: 'Re-edit done', step: 3 },
      { statusCode: 'APPROVED', statusDescription: 'Approved', step: 4 },
      { statusCode: 'CLIENT_SELECTED', statusDescription: 'Client selected', step: 5 }

    ];

    console.log('\n✓ Creating default image statuses (Global)...');
    let createdImageStatusCount = 0;
    let existingImageStatusCount = 0;

    for (const statusData of defaultImageStatuses) {
      const existing = await ImageStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: -1 
      });

      if (!existing) {
        const statusId = `imgstatus_${nanoid()}`;
        await ImageStatus.create({
          statusId,
          tenantId: -1, // Global data
          statusCode: statusData.statusCode,
          statusDescription: statusData.statusDescription,
          step: statusData.step
        });
        createdImageStatusCount++;
        console.log(`  ✓ Created image status: ${statusData.statusCode} - ${statusData.statusDescription} (Step ${statusData.step})`);
      } else {
        existingImageStatusCount++;
      }
    }

    if (createdImageStatusCount > 0) {
      console.log(`✓ Created ${createdImageStatusCount} new image status(es)`);
    }
    if (existingImageStatusCount > 0) {
      console.log(`✓ ${existingImageStatusCount} image status(es) already exist`);
    }

    // 10. Create subscription plans (GLOBAL - pricing tiers)
    const subscriptionPlans = [
      {
        planName: 'Free Tier',
        planCode: 'FREE',
        storageLimit: 1, // GB
        storageDisplayGB: 1,
        price: 0,
        currency: 'INR',
        features: [
          '1 GB Storage',
          'Basic Image Upload',
          'Up to 3 Projects',
          'Email Support',
        ],
        isActive: true,
        displayOrder: 1,
        description: 'Perfect for trying out our platform with limited storage and projects.',
      },
      {
        planName: 'Basic',
        planCode: 'BASIC',
        storageLimit: 100, // GB
        storageDisplayGB: 100,
        price: 2499,
        currency: 'INR',
        features: [
          '100 GB Storage',
          'Unlimited Projects',
          'Image Compression & Optimization',
          'Customer Portal Access',
          'Priority Email Support',
        ],
        isActive: true,
        displayOrder: 2,
        description: 'Ideal for small studios managing multiple wedding projects.',
      },
      {
        planName: 'Professional',
        planCode: 'PROFESSIONAL',
        storageLimit: 300, // GB
        storageDisplayGB: 300,
        price: 6499,
        currency: 'INR',
        features: [
          '300 GB Storage',
          'Unlimited Projects',
          'Advanced Image Management',
          'Team Collaboration (Up to 5 members)',
          'Custom Branding',
          'Analytics Dashboard',
          '24/7 Email & Chat Support',
        ],
        isActive: true,
        displayOrder: 3,
        description: 'Great for growing studios with multiple team members and larger portfolios.',
      },
      {
        planName: 'Business',
        planCode: 'BUSINESS',
        storageLimit: 500, // GB
        storageDisplayGB: 500,
        price: 10499,
        currency: 'INR',
        features: [
          '500 GB Storage',
          'Unlimited Projects',
          'Unlimited Team Members',
          'Advanced Analytics & Reporting',
          'Custom Domain Support',
          'API Access',
          'White Label Options',
          'Priority 24/7 Support',
        ],
        isActive: true,
        displayOrder: 4,
        description: 'Perfect for established studios managing high volumes of projects and clients.',
      },
      {
        planName: 'Enterprise',
        planCode: 'ENTERPRISE',
        storageLimit: 1000, // GB
        storageDisplayGB: 1000,
        price: 19999,
        currency: 'INR',
        features: [
          '1 TB (1000 GB) Storage',
          'Unlimited Everything',
          'Dedicated Account Manager',
          'Custom Integrations',
          'Advanced Security Features',
          'SLA Guarantee',
          'On-boarding & Training',
          'Premium 24/7 Phone Support',
        ],
        isActive: true,
        displayOrder: 5,
        description: 'For large studios and agencies requiring maximum storage and premium support.',
      },
    ];

    console.log('\n✓ Creating subscription plans (Global)...');
    let createdPlansCount = 0;
    let existingPlansCount = 0;

    for (const planData of subscriptionPlans) {
      const existing = await SubscriptionPlan.findOne({ planCode: planData.planCode });

      if (!existing) {
        const planId = `plan_${nanoid()}`;
        await SubscriptionPlan.create({
          planId,
          ...planData,
        });
        createdPlansCount++;
        console.log(`  ✓ Created plan: ${planData.planName} - ${planData.storageDisplayGB} GB - ₹${planData.price}/month`);
      } else {
        existingPlansCount++;
      }
    }

    if (createdPlansCount > 0) {
      console.log(`✓ Created ${createdPlansCount} new subscription plan(s)`);
    }
    if (existingPlansCount > 0) {
      console.log(`✓ ${existingPlansCount} subscription plan(s) already exist`);
    }

    // 11. Create default expense types (GLOBAL - shared across all tenants)
    const defaultExpenseTypes = [
      {
        name: 'Photography Charges',
        description: 'Costs for photography services and photographers',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Videography Charges',
        description: 'Costs for videography services and videographers',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 2,
        isActive: true
      },
      {
        name: 'Drone Charges',
        description: 'Aerial photography and videography costs',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 3,
        isActive: true
      },
      {
        name: 'Album Designing Charges',
        description: 'Album design and layout costs',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 4,
        isActive: true
      },
      {
        name: 'Photo Editing Charges',
        description: 'Photo editing and retouching costs',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 5,
        isActive: true
      },
      {
        name: 'Team Salary (Monthly)',
        description: 'Team member monthly salaries',
        requiresProject: false,
        requiresEvent: false,
        requiresMember: true,
        displayOrder: 6,
        isActive: true
      },
      {
        name: 'Travel',
        description: 'Travel and transportation expenses',
        requiresProject: false,
        requiresEvent: false,
        requiresMember: false,
        displayOrder: 7,
        isActive: true
      },
      {
        name: 'Fuel',
        description: 'Fuel and vehicle costs',
        requiresProject: false,
        requiresEvent: false,
        requiresMember: false,
        displayOrder: 8,
        isActive: true
      },
      {
        name: 'Purchase of Equipments',
        description: 'Costs for purchasing equipment',
        requiresProject: false,
        requiresEvent: false,
        requiresMember: false,
        displayOrder: 9,
        isActive: true
      },
      {
        name: 'Album Printing',
        description: 'Album printing and production costs',
        requiresProject: true,
        requiresEvent: false,
        requiresMember: false,
        displayOrder: 10,
        isActive: true
      },
      {
        name: 'General',
        description: 'General and miscellaneous expenses',
        requiresProject: false,
        requiresEvent: false,
        requiresMember: false,
        displayOrder: 11,
        isActive: true
      }
    ];

    console.log('\n✓ Creating default expense types (Global)...');
    let createdExpenseTypesCount = 0;
    let existingExpenseTypesCount = 0;

    for (const expenseTypeData of defaultExpenseTypes) {
      const existing = await ExpenseType.findOne({ 
        name: expenseTypeData.name,
        tenantId: '-1'
      });

      if (!existing) {
        const expenseTypeId = `exptype_${nanoid()}`;
        await ExpenseType.create({
          expenseTypeId,
          tenantId: '-1', // Global data
          name: expenseTypeData.name,
          description: expenseTypeData.description,
          requiresProject: expenseTypeData.requiresProject,
          requiresEvent: expenseTypeData.requiresEvent,
          requiresMember: expenseTypeData.requiresMember,
          displayOrder: expenseTypeData.displayOrder,
          isActive: expenseTypeData.isActive
        });
        createdExpenseTypesCount++;
        console.log(`  ✓ Created expense type: ${expenseTypeData.name}`);
      } else {
        existingExpenseTypesCount++;
      }
    }

    if (createdExpenseTypesCount > 0) {
      console.log(`✓ Created ${createdExpenseTypesCount} new expense type(s)`);
    }
    if (existingExpenseTypesCount > 0) {
      console.log(`✓ ${existingExpenseTypesCount} expense type(s) already exist`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Login to Super Admin Portal at http://localhost:5000');
    console.log('   2. Create your first tenant');
    console.log('   3. Login with tenant email (password = email initially)');
    console.log('   4. Set a new password on first login');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
