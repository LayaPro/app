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

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'flomingo_db' });
    console.log('Connected to DB');

    // 1. Create superadmin role if it doesn't exist
    let superadminRole = await Role.findOne({ name: 'superadmin', tenantId: '-1' });
    if (!superadminRole) {
      const roleId = `role_${nanoid()}`;
      superadminRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'superadmin',
        description: 'Super administrator with full system access'
      });
      console.log('✓ Created superadmin role:', roleId);
    } else {
      console.log('✓ Superadmin role already exists');
    }

    // 2. Create LayaPro tenant if it doesn't exist
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

    // 3. Create superadmin user if it doesn't exist
    let superadminUser = await User.findOne({ email: 'productionslaya@gmail.com' });
    if (!superadminUser) {
      const userId = `user_${nanoid()}`;
      const passwordHash = await bcrypt.hash('LayaPro@2025', 10); // Change this password!
      
      superadminUser = await User.create({
        userId,
        tenantId: layaproTenant.tenantId,
        email: 'productionslaya@gmail.com',
        passwordHash,
        firstName: 'Laya',
        lastName: 'Productions',
        roleId: superadminRole.roleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✓ Created superadmin user:', userId);
      console.log('  Email: productionslaya@gmail.com');
      console.log('  Password: LayaPro@2025 (CHANGE THIS!)');
    } else {
      console.log('✓ Superadmin user already exists');
    }
// 4. Create default profiles for LayaPro tenant
    const defaultProfiles = [
      { name: 'Candid Photographer', description: 'Captures candid moments and natural expressions' },
      { name: 'Cinematographer', description: 'Creates cinematic video content' },
      { name: 'Traditional Photographer', description: 'Specializes in traditional photography styles' },
      { name: 'Traditional Videographer', description: 'Captures traditional video content' },
      { name: 'Photo Editor', description: 'Edits and enhances photographs' },
      { name: 'Video Editor', description: 'Edits and produces video content' },
      { name: 'Album Designer', description: 'Designs photo albums and layouts' }
    ];

    console.log('\n✓ Creating default profiles...');
    let createdCount = 0;
    let existingCount = 0;

    for (const profileData of defaultProfiles) {
      const existing = await Profile.findOne({ 
        name: profileData.name, 
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const profileId = `profile_${nanoid()}`;
        await Profile.create({
          profileId,
          tenantId: layaproTenant.tenantId,
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
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const eventId = `event_${nanoid()}`;
        await Event.create({
          eventId,
          tenantId: layaproTenant.tenantId,
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
      { statusCode: 'SHOOT_SCHEDULED', statusDescription: 'Scheduled', step: 1, isHidden: false },
      { statusCode: 'SHOOT_IN_PROGRESS', statusDescription: 'Shoot ongoing', step: 2, isHidden: false },
      { statusCode: 'SHOOT_COMPLETED', statusDescription: 'Shoot completed', step: 3, isHidden: false },
      { statusCode: 'AWAITING_EDITS', statusDescription: 'Awaiting editing', step: 4, isHidden: false },
      { statusCode: 'EDITING_IN_PROGRESS', statusDescription: 'Editing ongoing', step: 5, isHidden: false },
      { statusCode: 'UPLOADED_FOR_REVIEW', statusDescription: 'Admin review pending', step: 6, isHidden: false },
      { statusCode: 'CHANGES_REQUESTED', statusDescription: 'Admin changes suggested', step: 7, isHidden: true },
      { statusCode: 'CONTENT_REJECTED', statusDescription: 'Rejected by admin', step: 8, isHidden: true },
      { statusCode: 'PUBLISHED', statusDescription: 'Published', step: 9, isHidden: false },
      { statusCode: 'CLIENT_SELECTION_PENDING', statusDescription: 'Client selection pending', step: 10, isHidden: false },
      { statusCode: 'ALBUM_DESIGN_PENDING', statusDescription: 'Album design pending', step: 11, isHidden: false },
      { statusCode: 'ALBUM_DESIGNING', statusDescription: 'Album design ongoing', step: 12, isHidden: false },
      { statusCode: 'ALBUM_UPLOADED', statusDescription: 'Album client review pending', step: 13, isHidden: false },
      { statusCode: 'ALBUM_PRINT_READY', statusDescription: 'Album approved by client', step: 14, isHidden: false },
      { statusCode: 'COMPLETED', statusDescription: 'Delivered', step: 15, isHidden: false }
    ];

    console.log('\n✓ Creating default event delivery statuses...');
    let createdEventStatusCount = 0;
    let existingEventStatusCount = 0;

    for (const statusData of defaultEventStatuses) {
      const existing = await EventDeliveryStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await EventDeliveryStatus.create({
          statusId,
          tenantId: layaproTenant.tenantId,
          statusCode: statusData.statusCode,
          statusDescription: statusData.statusDescription,
          step: statusData.step,
          isHidden: statusData.isHidden || false
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
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await ProjectDeliveryStatus.create({
          statusId,
          tenantId: layaproTenant.tenantId,
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
      { statusCode: 'UPLOADED', statusDescription: 'Uploaded', step: 1 },
      { statusCode: 'REVIEW_PENDING', statusDescription: 'Review pending', step: 2 },
      { statusCode: 'CHANGES_SUGGESTED', statusDescription: 'Changes suggested', step: 3 },
      { statusCode: 'DISCARDED', statusDescription: 'Discarded', step: 4 },
      { statusCode: 'REVIEWED', statusDescription: 'Reviewed', step: 5 }
    ];

    console.log('\n✓ Creating default image statuses...');
    let createdImageStatusCount = 0;
    let existingImageStatusCount = 0;

    for (const statusData of defaultImageStatuses) {
      const existing = await ImageStatus.findOne({ 
        statusCode: statusData.statusCode, 
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const statusId = `imgstatus_${nanoid()}`;
        await ImageStatus.create({
          statusId,
          tenantId: layaproTenant.tenantId,
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
