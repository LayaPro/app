import mongoose from 'mongoose';
import TeamFinance from '../models/teamFinance';
import Team from '../models/team';

async function checkTeamFinance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laya-pro');
    console.log('Connected to MongoDB');

    const finances = await TeamFinance.find({}).lean();
    
    console.log('\n=== TeamFinance Records ===');
    for (const finance of finances) {
      const member = await Team.findOne({ memberId: finance.memberId }).lean();
      console.log('\n---');
      console.log('Member:', member?.firstName, member?.lastName);
      console.log('Member ID:', finance.memberId);
      console.log('Salary:', member?.salary);
      console.log('Payment Type:', member?.paymentType);
      console.log('Total Payable:', finance.totalPayable);
      console.log('Paid Amount:', finance.paidAmount);
      console.log('Total Paid (manual):', finance.totalPaid);
      console.log('Pending:', (finance.totalPayable || 0) - (finance.paidAmount || 0));
      console.log('Transactions count:', finance.transactions?.length || 0);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeamFinance();
