// Test script for S3 configuration
// Run with: ts-node src/test-s3-config.ts

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Checking S3 Configuration...\n');

const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
];

let allPresent = true;

requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'AWS_SECRET_ACCESS_KEY' ? '***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

console.log('\n---\n');

if (allPresent) {
  console.log('✨ All required S3 environment variables are configured!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Use the endpoint: POST /upload-batch-images');
  console.log('3. Check UPLOAD_API.md for detailed usage');
} else {
  console.log('⚠️  Some environment variables are missing.');
  console.log('Please copy .env.example to .env and fill in your AWS credentials.');
}
