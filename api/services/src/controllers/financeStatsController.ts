import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProjectFinance from '../models/projectFinance';
import TeamFinance from '../models/teamFinance';

export const getFinanceStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all project finances
    const projectFinances = await ProjectFinance.find({ tenantId }).lean();
    
    // Calculate customer-related stats
    const totalRevenue = projectFinances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const totalBudget = projectFinances.reduce((sum, f) => sum + (f.totalBudget || 0), 0);
    const pendingReceivable = totalBudget - totalRevenue;

    // Get all team finances
    const teamFinances = await TeamFinance.find({ tenantId }).lean();
    
    // Calculate team salary expenses
    const totalExpenses = teamFinances.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
    const pendingPayable = teamFinances.reduce((sum, f) => sum + (f.pendingAmount || 0), 0);

    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;

    return res.status(200).json({
      message: 'Finance stats retrieved successfully',
      stats: {
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingReceivable,
        pendingPayable,
        totalBudget
      }
    });
  } catch (err: any) {
    console.error('Get finance stats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getFinanceStats
};
