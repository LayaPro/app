import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Image from '../models/image';
import ProjectFinance from '../models/projectFinance';
import EventExpense from '../models/eventExpense';
import ProjectDeliveryStatus from '../models/projectDeliveryStatus';
import EventDeliveryStatus from '../models/eventDeliveryStatus';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get counts
    const totalProjects = await Project.countDocuments({ tenantId });
    const totalClientEvents = await ClientEvent.countDocuments({ tenantId });
    const totalImages = await Image.countDocuments({ tenantId });

    // Get financial data
    const finances = await ProjectFinance.find({ tenantId }).lean();
    const totalRevenue = finances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const totalBudget = finances.reduce((sum, f) => sum + (f.totalBudget || 0), 0);
    const pendingPayments = finances.reduce((sum, f) => sum + (f.nextDueAmount || 0), 0);

    // Get expenses
    const expenses = await EventExpense.find({ tenantId }).lean();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);

    // Calculate profit
    const profit = totalRevenue - totalExpenses;

    return res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      stats: {
        projects: {
          total: totalProjects
        },
        clientEvents: {
          total: totalClientEvents
        },
        images: {
          total: totalImages
        },
        financials: {
          totalBudget,
          totalRevenue,
          totalExpenses,
          profit,
          pendingPayments
        }
      }
    });
  } catch (err: any) {
    console.error('Get dashboard stats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRevenueSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all project finances
    const finances = await ProjectFinance.find({ tenantId }).lean();

    // Calculate summary
    const totalProjects = finances.length;
    const totalBudget = finances.reduce((sum, f) => sum + (f.totalBudget || 0), 0);
    const totalReceived = finances.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
    const totalPending = finances.reduce((sum, f) => sum + (f.nextDueAmount || 0), 0);
    
    // Projects with pending payments
    const projectsWithPending = finances.filter(f => (f.nextDueAmount || 0) > 0).length;
    
    // Closed projects
    const closedProjects = finances.filter(f => f.isClientClosed === true).length;

    // Get expenses
    const expenses = await EventExpense.find({ tenantId }).lean();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
    
    // Expense breakdown by crew (salary vs other)
    const salaryExpenses = expenses.filter(e => e.crewId !== '-1').reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
    const otherExpenses = expenses.filter(e => e.crewId === '-1').reduce((sum, e) => sum + (e.expenseAmount || 0), 0);

    return res.status(200).json({
      message: 'Revenue summary retrieved successfully',
      summary: {
        projects: {
          total: totalProjects,
          closed: closedProjects,
          withPendingPayments: projectsWithPending
        },
        revenue: {
          totalBudget,
          totalReceived,
          totalPending,
          collectionRate: totalBudget > 0 ? ((totalReceived / totalBudget) * 100).toFixed(2) : 0
        },
        expenses: {
          total: totalExpenses,
          salary: salaryExpenses,
          other: otherExpenses
        },
        profit: {
          gross: totalReceived - totalExpenses,
          margin: totalReceived > 0 ? (((totalReceived - totalExpenses) / totalReceived) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (err: any) {
    console.error('Get revenue summary error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectStatusCounts = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all projects
    const projects = await Project.find({ tenantId }).lean();

    // Get all project delivery statuses
    const statuses = await ProjectDeliveryStatus.find({ tenantId }).sort({ step: 1 }).lean();

    // Count projects by status
    const statusCounts = statuses.map(status => {
      const count = projects.filter(p => p.projectDeliveryStatusId === status.statusId).length;
      return {
        statusId: status.statusId,
        statusCode: status.statusCode,
        step: status.step,
        count
      };
    });

    // Count projects without status
    const withoutStatus = projects.filter(p => !p.projectDeliveryStatusId).length;

    return res.status(200).json({
      message: 'Project status counts retrieved successfully',
      totalProjects: projects.length,
      statusCounts,
      withoutStatus
    });
  } catch (err: any) {
    console.error('Get project status counts error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventStatusCounts = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all client events
    const clientEvents = await ClientEvent.find({ tenantId }).lean();

    // Get all event delivery statuses
    const statuses = await EventDeliveryStatus.find({ tenantId }).sort({ step: 1 }).lean();

    // Count events by status
    const statusCounts = statuses.map(status => {
      const count = clientEvents.filter(e => e.eventDeliveryStatusId === status.statusId).length;
      return {
        statusId: status.statusId,
        statusCode: status.statusCode,
        step: status.step,
        count
      };
    });

    // Count events without status
    const withoutStatus = clientEvents.filter(e => !e.eventDeliveryStatusId).length;

    return res.status(200).json({
      message: 'Event status counts retrieved successfully',
      totalEvents: clientEvents.length,
      statusCounts,
      withoutStatus
    });
  } catch (err: any) {
    console.error('Get event status counts error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getStats,
  getRevenueSummary,
  getProjectStatusCounts,
  getEventStatusCounts
};
