import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProjectFinance from '../models/projectFinance';
import TeamFinance from '../models/teamFinance';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('FinanceStatsController');

export const getFinanceStats = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching finance stats`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
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

    logger.info(`[${requestId}] Finance stats retrieved`, { 
      tenantId, 
      totalRevenue, 
      totalExpenses, 
      netProfit,
      projectCount: projectFinances.length,
      teamFinanceCount: teamFinances.length
    });

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
    logger.error(`[${requestId}] Error fetching finance stats`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getFinanceStats
};
