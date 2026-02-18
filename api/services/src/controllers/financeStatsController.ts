import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProjectFinance from '../models/projectFinance';
import TeamFinance from '../models/teamFinance';
import { Expense } from '../models/expense';
import { Project } from '../models/project';
import { ExpenseType } from '../models/expenseType';
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
    const salaryExpenses = teamFinances.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
    const pendingPayable = teamFinances.reduce((sum, f) => sum + (f.pendingAmount || 0), 0);

    // Calculate extra expenses from Expense model
    const extraExpenseAgg = await Expense.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const extraExpenses = extraExpenseAgg[0]?.total || 0;

    // Total expenses = salaries + extra expenses
    const totalExpenses = salaryExpenses + extraExpenses;

    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;

    logger.info(`[${requestId}] Finance stats retrieved`, { 
      tenantId, 
      totalRevenue, 
      totalExpenses, 
      netProfit,
      projectCount: projectFinances.length,
      teamFinanceCount: teamFinances.length,
      extraExpenses
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

export const getFinanceOverview = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching finance overview`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all projects with their finances
    const projects = await Project.find({ tenantId }).lean();
    const projectFinances = await ProjectFinance.find({ tenantId }).lean();

    // Calculate revenue stats
    const totalRevenue = projectFinances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const totalBudget = projectFinances.reduce((sum, f) => sum + (f.totalBudget || 0), 0);
    const pendingPayments = totalBudget - totalRevenue;

    // Get all expenses
    const expenses = await Expense.find({ tenantId }).lean();
    
    // Get all expense types - they are global with tenantId '-1'
    const expenseTypes = await ExpenseType.find({ tenantId: '-1' }).lean();
    const expenseTypeMap = new Map(expenseTypes.map(et => [et.expenseTypeId, et.name]));
    
    // Debug logging
    logger.info(`[${requestId}] Expense types found: ${expenseTypes.length}`, {
      expenseTypes: expenseTypes.map(et => ({ id: et.expenseTypeId, name: et.name }))
    });
    logger.info(`[${requestId}] Sample expenses:`, {
      total: expenses.length,
      sample: expenses.slice(0, 3).map(e => ({ 
        expenseTypeId: e.expenseTypeId, 
        amount: e.amount,
        hasTypeId: !!e.expenseTypeId,
        mappedName: e.expenseTypeId ? (expenseTypeMap.get(e.expenseTypeId) || 'Unknown') : 'Unknown'
      }))
    });
    
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;

    // Get team finances
    const teamFinances = await TeamFinance.find({ tenantId }).lean();
    const teamPayables = teamFinances.reduce((sum, f) => sum + (f.totalPayable || 0), 0);
    const teamPaid = teamFinances.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.totalPaid || 0), 0);

    // Project stats
    const activeProjects = projects.filter(p => 
      p.status?.toLowerCase() !== 'completed' && 
      p.status?.toLowerCase() !== 'cancelled'
    ).length;

    // Expense breakdown by type
    const expensesByType: { [key: string]: number } = {};
    expenses.forEach((expense: any) => {
      if (!expense.expenseTypeId) {
        logger.warn(`[${requestId}] Expense without expenseTypeId`, { expense });
      }
      const typeName = expense.expenseTypeId && expenseTypeMap.get(expense.expenseTypeId) 
        ? expenseTypeMap.get(expense.expenseTypeId)!
        : 'Other';
      expensesByType[typeName] = (expensesByType[typeName] || 0) + (expense.amount || 0);
    });
    
    logger.info(`[${requestId}] Expense breakdown:`, { expensesByType });

    const expenseBreakdown = Object.entries(expensesByType).map(([type, amount]) => ({
      type,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Generate monthly revenue history (last 6 months)
    const monthlyData = generateMonthlyData(projectFinances, expenses);
    
    logger.info(`[${requestId}] Monthly data generated:`, { 
      monthlyData: monthlyData.map(m => ({ month: m.month, revenue: m.revenue, expenses: m.expenses }))
    });

    // Get top customers by revenue
    const customerRevenueMap = new Map<string, { name: string; revenue: number; projects: number }>();
    
    for (const finance of projectFinances) {
      const project = projects.find(p => p.projectId === finance.projectId);
      if (project) {
        // Use contactPerson or projectName as the customer identifier
        const customerName = project.contactPerson || project.projectName || 'Unknown';
        const existing = customerRevenueMap.get(customerName) || { 
          name: customerName, 
          revenue: 0, 
          projects: 0 
        };
        existing.revenue += finance.receivedAmount || 0;
        existing.projects += 1;
        customerRevenueMap.set(customerName, existing);
      }
    }

    const topCustomers = Array.from(customerRevenueMap.values())
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get top team members by payments
    const Team = (await import('../models/team')).default;
    const teamMembers = await Team.find({ tenantId }).lean();
    
    const teamMemberPaymentMap = new Map<string, { name: string; totalPaid: number; projects: number }>();
    
    for (const finance of teamFinances) {
      const member = teamMembers.find(m => m.memberId === finance.memberId);
      if (member) {
        const memberName = `${member.firstName} ${member.lastName}`.trim();
        const existing = teamMemberPaymentMap.get(finance.memberId) || {
          name: memberName,
          totalPaid: 0,
          projects: 0
        };
        existing.totalPaid += (finance.totalPaid || 0) + (finance.paidAmount || 0);
        existing.projects += 1;
        teamMemberPaymentMap.set(finance.memberId, existing);
      }
    }
    
    const topTeamMembers = Array.from(teamMemberPaymentMap.values())
      .filter(m => m.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    logger.info(`[${requestId}] Finance overview retrieved`, { 
      tenantId, 
      totalRevenue, 
      totalExpenses, 
      netProfit,
      topCustomersCount: topCustomers.length,
      topTeamMembersCount: topTeamMembers.length
    });

    return res.status(200).json({
      message: 'Finance overview retrieved successfully',
      overview: {
        stats: {
          totalRevenue,
          totalExpenses,
          netProfit,
          pendingPayments,
          totalProjects: projects.length,
          activeProjects,
          teamPayables,
          teamPaid,
        },
        expenseBreakdown,
        revenueHistory: monthlyData,
        topCustomers,
        topTeamMembers,
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching finance overview`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const generateMonthlyData = (projectFinances: any[], expenses: any[]) => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const monthRevenue = projectFinances.reduce((sum: number, finance: any) => {
      if (finance.receivedAmount && finance.updatedAt) {
        const financeDate = new Date(finance.updatedAt);
        if (financeDate.getMonth() === date.getMonth() && financeDate.getFullYear() === date.getFullYear()) {
          return sum + finance.receivedAmount;
        }
      }
      return sum;
    }, 0);

    const monthExpenses = expenses.reduce((sum: number, expense: any) => {
      if (expense.amount && expense.date) {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear()) {
          return sum + expense.amount;
        }
      }
      return sum;
    }, 0);

    months.push({ month: monthStr, revenue: monthRevenue, expenses: monthExpenses });
  }

  return months;
};

export default {
  getFinanceStats,
  getFinanceOverview
};
