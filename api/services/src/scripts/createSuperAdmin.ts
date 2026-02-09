import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import User from '../models/user';
import Role from '../models/role';
import Tenant from '../models/tenant';
import { ensureMainBucketExists } from '../utils/s3Bucket';

const MONGO_URI = process.env.MONGO_URI || '';

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'flomingo_db' });
    console.log('Connected to MongoDB');

    // Get email and password from command line
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Usage: npm run create-super-admin <email> <password>');
      console.error('Example: npm run create-super-admin admin@laya.pro MySecurePass123');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists. Updating to super admin...');
      existingUser.isSuperAdmin = true;
      
      // Update password if provided
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      existingUser.passwordHash = hash;
      existingUser.passwordSalt = salt;
      existingUser.isActivated = true;
      existingUser.isActive = true;
      
      await existingUser.save();
      console.log('✅ User updated successfully!');
      console.log('Email:', existingUser.email);
      console.log('Super Admin:', existingUser.isSuperAdmin);
      console.log('\nYou can now login at: http://localhost:4000/super-admin.html');
      process.exit(0);
    }

    // Find or create a tenant for super admin
    let tenant = await Tenant.findOne({ isInternal: true });
    if (!tenant) {
      console.log('Creating internal tenant for super admin...');
      
      // Ensure S3 bucket exists before creating tenant
      console.log('Ensuring S3 bucket exists...');
      try {
        await ensureMainBucketExists();
        console.log('✅ S3 bucket verified');
      } catch (s3Error: any) {
        console.error('❌ Failed to initialize S3 bucket:', s3Error.message);
        console.error('Please check your AWS credentials in .env file');
        process.exit(1);
      }
      
      tenant = new Tenant({
        tenantId: nanoid(12),
        tenantFirstName: 'Super',
        tenantLastName: 'Admin',
        tenantCompanyName: 'Laya Pro Internal',
        tenantUsername: 'internal_admin',
        tenantEmailAddress: 'internal@laya.pro',
        countryCode: '+1',
        tenantPhoneNumber: '',
        isActive: true,
        isInternal: true,
        subscriptionPlan: 'enterprise',
        createdBy: 'system',
        updatedBy: 'system',
      });
      await tenant.save();
      console.log('✅ Internal tenant created');
    }

    // Find or create Admin role
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      console.log('Creating Admin role...');
      adminRole = new Role({
        roleId: nanoid(12),
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: ['all'],
        isActive: true,
      });
      await adminRole.save();
      console.log('✅ Admin role created');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create super admin user
    const nameParts = email.split('@')[0].split('.');
    const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'Super';
    const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || 'Admin';

    const superAdminUser = new User({
      tenantId: tenant.tenantId,
      userId: nanoid(12),
      email: email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      firstName,
      lastName,
      roleId: adminRole.roleId,
      isActive: true,
      isActivated: true,
      isSuperAdmin: true,
      tokenVersion: 0,
    });

    await superAdminUser.save();

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdminUser.email);
    console.log('👤 Name:', `${superAdminUser.firstName} ${superAdminUser.lastName}`);
    console.log('🔑 Password:', password);
    console.log('⭐ Super Admin:', superAdminUser.isSuperAdmin);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Access portal at: http://localhost:4000/super-admin.html');
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSuperAdmin();
