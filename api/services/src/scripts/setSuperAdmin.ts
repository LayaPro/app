import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

async function setSuperAdmin() {
  try {
    // Get email from command line args
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: npm run set-super-admin <email>');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(MONGO_URI, { dbName: 'flomingo_db' });
    console.log('✅ Connected to database');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Update user to super admin
    user.isSuperAdmin = true;
    await user.save();

    console.log('✅ Successfully set super admin privileges for:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.userId}`);
    console.log('\n🎉 You can now access the super admin portal at: /super-admin.html');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setSuperAdmin();
