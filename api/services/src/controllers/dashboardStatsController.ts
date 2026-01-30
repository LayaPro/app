import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import ProjectFinance from '../models/projectFinance';
import Proposal from '../models/proposal';

interface StatsComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

const calculateComparison = (current: number, previous: number): StatsComparison => {
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
  return {
    current,
    previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
  };
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Projects Stats
    const currentMonthProjects = await Project.countDocuments({
      tenantId,
      createdAt: { $gte: currentMonthStart }
    });

    const lastMonthProjects = await Project.countDocuments({
      tenantId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const totalProjects = await Project.countDocuments({ tenantId });
    const activeProjects = await Project.countDocuments({ tenantId, isCompleted: { $ne: true } });

    // Revenue Stats
    const currentMonthFinances = await ProjectFinance.find({
      tenantId,
      'transactions.datetime': { $gte: currentMonthStart }
    }).lean();

    const lastMonthFinances = await ProjectFinance.find({
      tenantId,
      'transactions.datetime': { $gte: lastMonthStart, $lte: lastMonthEnd }
    }).lean();

    const currentMonthRevenue = currentMonthFinances.reduce((sum, finance) => {
      const monthTransactions = (finance.transactions || []).filter(
        (t: any) => new Date(t.datetime) >= currentMonthStart && t.nature === 'received'
      );
      return sum + monthTransactions.reduce((tSum, t: any) => tSum + t.amount, 0);
    }, 0);

    const lastMonthRevenue = lastMonthFinances.reduce((sum, finance) => {
      const monthTransactions = (finance.transactions || []).filter(
        (t: any) => new Date(t.datetime) >= lastMonthStart && 
                   new Date(t.datetime) <= lastMonthEnd && 
                   t.nature === 'received'
      );
      return sum + monthTransactions.reduce((tSum, t: any) => tSum + t.amount, 0);
    }, 0);

    const allFinances = await ProjectFinance.find({ tenantId }).lean();
    const totalRevenue = allFinances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const pendingReceivable = allFinances.reduce((sum, f) => {
      const pending = (f.totalBudget || 0) - (f.receivedAmount || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

    // Proposals Stats
    const currentMonthProposals = await Proposal.countDocuments({
      tenantId,
      createdAt: { $gte: currentMonthStart }
    });

    const lastMonthProposals = await Proposal.countDocuments({
      tenantId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const totalProposals = await Proposal.countDocuments({ tenantId });
    const pendingProposals = await Proposal.countDocuments({
      tenantId,
      status: { $in: ['draft', 'sent'] }
    });

    // Events Stats - Compare current month events with last month
    // Count events where fromDatetime falls within the month
    const currentMonthEvents = await ClientEvent.countDocuments({
      tenantId,
      fromDatetime: { 
        $gte: currentMonthStart, 
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month
      }
    });

    const lastMonthEvents = await ClientEvent.countDocuments({
      tenantId,
      fromDatetime: { 
        $gte: lastMonthStart, 
        $lt: currentMonthStart // First day of current month
      }
    });

    // Calculate comparisons
    const projectsComparison = calculateComparison(currentMonthProjects, lastMonthProjects);
    const revenueComparison = calculateComparison(currentMonthRevenue, lastMonthRevenue);
    const proposalsComparison = calculateComparison(currentMonthProposals, lastMonthProposals);
    const eventsComparison = calculateComparison(currentMonthEvents, lastMonthEvents);

    return res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      stats: {
        totalProjects,
        activeProjects,
        totalRevenue,
        pendingReceivable,
        totalProposals,
        pendingProposals,
        upcomingEvents: currentMonthEvents,
        comparisons: {
          projects: projectsComparison,
          revenue: revenueComparison,
          proposals: proposalsComparison,
          events: eventsComparison,
        }
      }
    });
  } catch (err: any) {
    console.error('Get dashboard stats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getDashboardStats
};
