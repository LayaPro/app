import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Role from './models/role';
import Tenant from './models/tenant';
import User from './models/user';
import Profile from './models/profile';
import Event from './models/event';
import DeliveryStatus from './models/deliveryStatus';

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

    // 6. Create default delivery statuses for LayaPro tenant
    const defaultStatuses = [
      'Shoot Done',
      'Editor Upload',
      'Admin Reviewed',
      'Client Selected',
      'Album Selected',
      'Album Designed',
      'Album Printed',
      'Album Delivered'
    ];

    console.log('\n✓ Creating default delivery statuses...');
    let createdStatusCount = 0;
    let existingStatusCount = 0;

    for (const statusCode of defaultStatuses) {
      const existing = await DeliveryStatus.findOne({ 
        statusCode, 
        tenantId: layaproTenant.tenantId 
      });

      if (!existing) {
        const statusId = `status_${nanoid()}`;
        await DeliveryStatus.create({
          statusId,
          tenantId: layaproTenant.tenantId,
          statusCode
        });
        createdStatusCount++;
        console.log(`  ✓ Created status: ${statusCode}`);
      } else {
        existingStatusCount++;
      }
    }

    if (createdStatusCount > 0) {
      console.log(`✓ Created ${createdStatusCount} new status(es)`);
    }
    if (existingStatusCount > 0) {
      console.log(`✓ ${existingStatusCount} status(es) already exist`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
