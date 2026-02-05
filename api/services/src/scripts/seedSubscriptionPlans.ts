import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { SubscriptionPlan } from '../models/subscriptionPlan';

const seedSubscriptionPlans = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/laya-pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing subscription plans');

    // Define subscription plans
    const plans = [
      {
        planId: nanoid(),
        planName: 'Free Tier',
        planCode: 'FREE',
        storageLimit: 1 * 1024 * 1024 * 1024, // 1 GB in bytes
        storageDisplayGB: 1,
        price: 0,
        currency: 'USD',
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
        planId: nanoid(),
        planName: 'Basic',
        planCode: 'BASIC',
        storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB in bytes
        storageDisplayGB: 100,
        price: 29.99,
        currency: 'USD',
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
        planId: nanoid(),
        planName: 'Professional',
        planCode: 'PROFESSIONAL',
        storageLimit: 300 * 1024 * 1024 * 1024, // 300 GB in bytes
        storageDisplayGB: 300,
        price: 79.99,
        currency: 'USD',
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
        planId: nanoid(),
        planName: 'Business',
        planCode: 'BUSINESS',
        storageLimit: 500 * 1024 * 1024 * 1024, // 500 GB in bytes
        storageDisplayGB: 500,
        price: 129.99,
        currency: 'USD',
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
        planId: nanoid(),
        planName: 'Enterprise',
        planCode: 'ENTERPRISE',
        storageLimit: 1000 * 1024 * 1024 * 1024, // 1 TB (1000 GB) in bytes
        storageDisplayGB: 1000,
        price: 249.99,
        currency: 'USD',
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

    // Insert plans
    const createdPlans = await SubscriptionPlan.insertMany(plans);
    console.log(`Successfully created ${createdPlans.length} subscription plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`  - ${plan.planName} (${plan.planCode}): ${plan.storageDisplayGB} GB - $${plan.price}/month`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    process.exit(1);
  }
};

seedSubscriptionPlans();
