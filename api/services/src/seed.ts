import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Role from './models/role';
import Tenant from './models/tenant';
import User from './models/user';
import Profile from './models/profile';

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

    
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
