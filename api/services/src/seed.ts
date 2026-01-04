import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Role from './models/role';
import Tenant from './models/tenant';
import User from './models/user';
import Profile from './models/profile';
import Event from './models/event';
import EventDeliveryStatus from './models/eventDeliveryStatus';
import ProjectDeliveryStatus from './models/projectDeliveryStatus';
import ImageStatus from './models/imageStatus';
import Module from './models/module';
import RolePermission from './models/rolePermission';

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

    // 2. Create HR role if it doesn't exist
    let hrRole = await Role.findOne({ name: 'HR', tenantId: '-1' });
    if (!hrRole) {
      const roleId = `role_${nanoid()}`;
      hrRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'HR',
        description: 'Access to finances, team members, salaries etc'
      });
      console.log('✓ Created HR role:', roleId);
    } else {
      console.log('✓ HR role already exists');
    }

    // 3. Create Co-ordinator role if it doesn't exist
    let coordinatorRole = await Role.findOne({ name: 'Co-ordinator', tenantId: '-1' });
    if (!coordinatorRole) {
      const roleId = `role_${nanoid()}`;
      coordinatorRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Co-ordinator',
        description: 'Access to assigned projects, finances, events, teams'
      });
      console.log('✓ Created Co-ordinator role:', roleId);
    } else {
      console.log('✓ Co-ordinator role already exists');
    }

    // 4. Create Team Lead role if it doesn't exist
    let teamLeadRole = await Role.findOne({ name: 'Team Lead', tenantId: '-1' });
    if (!teamLeadRole) {
      const roleId = `role_${nanoid()}`;
      teamLeadRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Team Lead',
        description: 'Handles technical stuff and assigns editor, designer to events'
      });
      console.log('✓ Created Team Lead role:', roleId);
    } else {
      console.log('✓ Team Lead role already exists');
    }

    // 5. Create Photo Editor role if it doesn't exist
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

    // 6. Create Video Editor role if it doesn't exist
    let videoEditorRole = await Role.findOne({ name: 'Video Editor', tenantId: '-1' });
    if (!videoEditorRole) {
      const roleId = `role_${nanoid()}`;
      videoEditorRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'Video Editor',
        description: 'Edits and uploads videos for assigned events'
      });
      console.log('✓ Created Video Editor role:', roleId);
    } else {
      console.log('✓ Video Editor role already exists');
    }

    // 7. Create Album Designer role if it doesn't exist
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

    // 8. Create LayaPro tenant if it doesn't exist
    let layaproTenant = await Tenant.findOne({ tenantUsername: 'LayaPro' });
    if (!layaproTenant) {
      const tenantId = `tenant_${nanoid()}`;
      layaproTenant = await Tenant.create({
        tenantId,
        tenantFirstName: 'Laya',
        tenantLastName: 'Productions',
        tenantCompanyName: 'Laya Productions',
        tenantUsername: 'LayaPro',
        tenantEmailAddress: 'productionslaya@gmail.com',
        countryCode: '+91',
        tenantPhoneNumber: '',
        isActive: true
      });
      console.log('✓ Created LayaPro tenant:', tenantId);
    } else {
      console.log('✓ LayaPro tenant already exists');
    }

    // 9. Create admin user if it doesn't exist
    let adminUser = await User.findOne({ email: 'productionslaya@gmail.com' });
    if (!adminUser) {
      const userId = `user_${nanoid()}`;
      const passwordHash = await bcrypt.hash('LayaPro@2025', 10); // Change this password!
      
      adminUser = await User.create({
        userId,
        tenantId: layaproTenant.tenantId,
        email: 'productionslaya@gmail.com',
        passwordHash,
        firstName: 'Laya',
        lastName: 'Productions',
        roleId: adminRole.roleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✓ Created admin user:', userId);
      console.log('  Email: productionslaya@gmail.com');
      console.log('  Password: LayaPro@2025 (CHANGE THIS!)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // 10. Create system modules
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

    // 11. Create role permissions
    console.log('\n✓ Creating role permissions...');
    
    const rolePermissions = [
      // Admin - Full access to everything
      { roleName: 'Admin', modules: ['Dashboard', 'Albums', 'Projects', 'Finances', 'Calendar', 'Events Setup', 'Team Setup', 'Equipments', 'Access Management'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true } },
      
      // HR - Access to finances, team members, salaries
      { roleName: 'HR', modules: ['Dashboard', 'Finances', 'Team Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true } },
      
      // Co-ordinator - Access to projects, finances, events, teams assigned to him
      { roleName: 'Co-ordinator', modules: ['Dashboard', 'Projects', 'Finances', 'Calendar', 'Events Setup', 'Team Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
      
      // Team Lead - Technical stuff, assigns editors and designers
      { roleName: 'Team Lead', modules: ['Dashboard', 'Projects', 'Calendar', 'Events Setup', 'Team Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
      
      // Photo Editor - Edits and uploads photos for assigned events
      { roleName: 'Photo Editor', modules: ['Dashboard', 'Albums', 'Calendar', 'Events Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
      
      // Video Editor - Edits and uploads videos for assigned events
      { roleName: 'Video Editor', modules: ['Dashboard', 'Albums', 'Calendar', 'Events Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
      
      // Album Designer - Designs and uploads PDF albums
      { roleName: 'Album Designer', modules: ['Dashboard', 'Albums', 'Calendar', 'Events Setup'], permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false } },
    ];

    let permissionCreatedCount = 0;
    let permissionExistingCount = 0;

    for (const rolePermConfig of rolePermissions) {
      const role = rolePermConfig.roleName === 'Admin' ? adminRole :
                   rolePermConfig.roleName === 'HR' ? hrRole :
                   rolePermConfig.roleName === 'Co-ordinator' ? coordinatorRole :
                   rolePermConfig.roleName === 'Team Lead' ? teamLeadRole :
                   rolePermConfig.roleName === 'Photo Editor' ? photoEditorRole :
                   rolePermConfig.roleName === 'Video Editor' ? videoEditorRole :
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

// 5. Create default profiles for LayaPro tenant
    const defaultProfiles = [
      { name: 'Candid Photographer', description: 'Captures candid moments and natural expressions' },
      { name: 'Cinematographer', description: 'Creates cinematic video content' },
      { name: 'Traditional Photographer', description: 'Specializes in traditional photography styles' },
      { name: 'Traditional Videographer', description: 'Captures traditional video content' },
    ];

    console.log('\n✓ Creating default profiles...');
    let createdCount = 0;
    let existingCount = 0;

    for (const profileData of defaultProfiles) {
      const existing = await Profile.findOne({ 
        name: profileData.name, 
        tenantId: (layaproTenant as any).tenantId 
      });

      if (!existing) {
        const profileId = `profile_${nanoid()}`;
        await Profile.create({
          profileId,
          tenantId: (layaproTenant as any).tenantId,
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

    // 5. Create default events for LayaPro tenant
    const defaultEvents = [
      { eventCode: 'PREWEDDING', eventDesc: 'Pre Wedding', eventAlias: 'Pre-Wedding Shoot' },
      { eventCode: 'SANGEET', eventDesc: 'Sangeet', eventAlias: 'Sangeet Ceremony' },
      { eventCode: 'HALDI', eventDesc: 'Haldi', eventAlias: 'Haldi Ceremony' },
      { eventCode: 'MEHANDI', eventDesc: 'Mehandi', eventAlias: 'Mehandi Ceremony' },
      { eventCode: 'RECEPTION', eventDesc: 'Reception', eventAlias: 'Wedding Reception' },
      { eventCode: 'WEDDING', eventDesc: 'Wedding', eventAlias: 'Wedding Ceremony' },
      { eventCode: 'PHERA', eventDesc: 'Phera', eventAlias: 'Phera Ceremony' }
    ];

    console.log('\n✓ Creating default events...');
    let createdEventCount = 0;
    let existingEventCount = 0;

    for (const eventData of defaultEvents) {
      const existing = await Event.findOne({ 
        eventCode: eventData.eventCode, 
        tenantId: (layaproTenant as any).tenantId 
      });

      if (!existing) {
        const eventId = `event_${nanoid()}`;
        await Event.create({
          eventId,
          tenantId: (layaproTenant as any).tenantId,
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

    // 6. Create default event delivery statuses for LayaPro tenant
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

    console.log('\n✓ Creating default event delivery statuses...');
    let createdEventStatusCount = 0;
    let existingEventStatusCount = 0;

    for (const statusData of defaultEventStatuses) {
      const existing = await EventDeliveryStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: (layaproTenant as any).tenantId 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await EventDeliveryStatus.create({
          statusId,
          tenantId: (layaproTenant as any).tenantId,
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

    // 7. Create default project delivery statuses for LayaPro tenant
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

    console.log('\n✓ Creating default project delivery statuses...');
    let createdProjectStatusCount = 0;
    let existingProjectStatusCount = 0;

    for (const statusData of defaultProjectStatuses) {
      const existing = await ProjectDeliveryStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: (layaproTenant as any).tenantId 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await ProjectDeliveryStatus.create({
          statusId,
          tenantId: (layaproTenant as any).tenantId,
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

    // 8. Create default image statuses for LayaPro tenant
    const defaultImageStatuses = [
      { statusCode: 'REVIEW_PENDING', statusDescription: 'Review pending', step: 1 },
      { statusCode: 'RE_EDIT_SUGGESTED', statusDescription: 'Re-edit requested', step: 2 },
      { statusCode: 'RE_EDIT_DONE', statusDescription: 'Re-edit done', step: 3 },
      { statusCode: 'APPROVED', statusDescription: 'Approved', step: 4 },
      { statusCode: 'CLIENT_SELECTED', statusDescription: 'Client selected', step: 5 }

    ];

    console.log('\n✓ Creating default image statuses...');
    let createdImageStatusCount = 0;
    let existingImageStatusCount = 0;

    for (const statusData of defaultImageStatuses) {
      const existing = await ImageStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: (layaproTenant as any).tenantId 
      });

      if (!existing) {
        const statusId = `imgstatus_${nanoid()}`;
        await ImageStatus.create({
          statusId,
          tenantId: (layaproTenant as any).tenantId,
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

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
