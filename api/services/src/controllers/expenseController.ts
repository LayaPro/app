import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Expense } from '../models/expense';
import Project from '../models/project';
import Event from '../models/event';
import ExpenseType from '../models/expenseType';
import Team from '../models/team';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';
import { updateTeamMemberPaidAmount } from '../utils/teamFinanceUtils';

const logger = createModuleLogger('ExpenseController');

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

// Create expense
export const createExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { expenseTypeId, projectId, eventId, memberId, amount, comment, date, category, receiptUrl } = req.body;
    const tenantId = req.user?.tenantId;
    const addedBy = req.user?.userId;

    if (!tenantId || !addedBy) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Missing tenant or user info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!expenseTypeId) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Missing expense type`);
      return res.status(400).json({ message: 'Expense type is required' });
    }

    // Validate expense type
    const expenseType = await ExpenseType.findOne({ 
      expenseTypeId, 
      $or: [{ tenantId: '-1' }, { tenantId }],
      isActive: true 
    }).session(session);

    if (!expenseType) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Invalid expense type`, { expenseTypeId });
      return res.status(400).json({ message: 'Invalid expense type' });
    }

    // Validate required fields based on expense type
    if (expenseType.requiresProject && !projectId) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Project required for expense type`, { expenseTypeId });
      return res.status(400).json({ message: 'Project is required for this expense type' });
    }

    if (expenseType.requiresEvent && !eventId) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Event required for expense type`, { expenseTypeId });
      return res.status(400).json({ message: 'Event is required for this expense type' });
    }

    if (expenseType.requiresMember && !memberId) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Member required for expense type`, { expenseTypeId });
      return res.status(400).json({ message: 'Team member is required for this expense type' });
    }

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Invalid amount`);
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (!comment || !comment.trim()) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`[${requestId}] Missing comment`);
      return res.status(400).json({ message: 'Comment is required' });
    }

    const expenseId = `exp_${nanoid()}`;

    const [expense] = await Expense.create([{
      expenseId,
      tenantId,
      expenseTypeId,
      projectId: projectId || undefined,
      eventId: eventId || undefined,
      memberId: memberId || undefined,
      amount: parseFloat(amount),
      comment: comment.trim(),
      date: date ? new Date(date) : new Date(),
      addedBy,
      category: category || 'other',
      receiptUrl: receiptUrl || undefined,
    }], { session });

    logger.info(`[${requestId}] Expense created`, { expenseId, tenantId, amount });

    // Update team member paid amount if this expense is a payment to a team member
    // Any expense type that requires a member is considered a payment to them
    if (memberId && expenseType.requiresMember) {
      try {
        await updateTeamMemberPaidAmount(memberId, tenantId, parseFloat(amount), session);
        logger.info(`[${requestId}] Updated team member paid amount`, { memberId, amount, expenseType: expenseType.name });
      } catch (payableError: any) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`[${requestId}] Failed to update paid amount`, { 
          memberId, 
          error: payableError.message 
        });
        return res.status(500).json({ message: 'Failed to update team finance', error: payableError.message });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Expense created successfully',
      expense,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`[${requestId}] Error creating expense:`, error);
    return res.status(500).json({ message: 'Failed to create expense', error: error.message });
  }
};

// Get all expenses
export const getAllExpenses = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      logger.error(`[${requestId}] Missing tenant info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, startDate, endDate, page = '1', limit = '50' } = req.query;

    const query: any = { tenantId };

    if (projectId) {
      query.projectId = projectId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Populate project and event names
    const enrichedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        let projectName = undefined;
        let eventName = undefined;
        let expenseTypeName = undefined;
        let memberName = undefined;

        if (expense.projectId) {
          const project = await Project.findOne({ projectId: expense.projectId }).lean();
          projectName = project?.projectName;
        }

        if (expense.eventId) {
          const event = await Event.findOne({ eventId: expense.eventId }).lean();
          eventName = event?.eventDesc || event?.eventCode;
        }

        if (expense.expenseTypeId) {
          const expenseType = await ExpenseType.findOne({ expenseTypeId: expense.expenseTypeId }).lean();
          expenseTypeName = expenseType?.name;
        }

        if (expense.memberId) {
          const member = await Team.findOne({ memberId: expense.memberId }).lean();
          memberName = member ? `${member.firstName} ${member.lastName}` : undefined;
        }

        return {
          ...expense,
          projectName,
          eventName,
          expenseTypeName,
          memberName,
        };
      })
    );

    logger.info(`[${requestId}] Expenses retrieved`, { tenantId, count: enrichedExpenses.length });

    return res.status(200).json({
      expenses: enrichedExpenses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching expenses:`, error);
    return res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};

// Get expense by ID
export const getExpenseById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  
  try {
    const { expenseId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      logger.error(`[${requestId}] Missing tenant info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const expense = await Expense.findOne({ expenseId, tenantId }).lean();

    if (!expense) {
      logger.warn(`[${requestId}] Expense not found`, { expenseId });
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Populate project and event names
    let projectName = undefined;
    let eventName = undefined;
    let expenseTypeName = undefined;
    let memberName = undefined;

    if (expense.projectId) {
      const project = await Project.findOne({ projectId: expense.projectId }).lean();
      projectName = project?.projectName;
    }

    if (expense.eventId) {
      const event = await Event.findOne({ eventId: expense.eventId }).lean();
      eventName = event?.eventDesc || event?.eventCode;
    }

    if (expense.expenseTypeId) {
      const expenseType = await ExpenseType.findOne({ expenseTypeId: expense.expenseTypeId }).lean();
      expenseTypeName = expenseType?.name;
    }

    if (expense.memberId) {
      const member = await Team.findOne({ memberId: expense.memberId }).lean();
      memberName = member ? `${member.firstName} ${member.lastName}` : undefined;
    }

    const enrichedExpense = {
      ...expense,
      projectName,
      eventName,
      expenseTypeName,
      memberName,
    };

    logger.info(`[${requestId}] Expense retrieved`, { expenseId });

    return res.status(200).json({ expense: enrichedExpense });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching expense:`, error);
    return res.status(500).json({ message: 'Failed to fetch expense', error: error.message });
  }
};

// Update expense
export const updateExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  
  try {
    const { expenseId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      logger.error(`[${requestId}] Missing tenant info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const expense = await Expense.findOne({ expenseId, tenantId });

    if (!expense) {
      logger.warn(`[${requestId}] Expense not found`, { expenseId });
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { expenseTypeId, projectId, eventId, memberId, amount, comment, date, category, receiptUrl } = req.body;

    // If expenseTypeId is being updated, validate it and its requirements
    if (expenseTypeId !== undefined) {
      const expenseType = await ExpenseType.findOne({ 
        expenseTypeId, 
        $or: [{ tenantId: '-1' }, { tenantId }],
        isActive: true 
      });

      if (!expenseType) {
        logger.error(`[${requestId}] Invalid expense type`, { expenseTypeId });
        return res.status(400).json({ message: 'Invalid expense type' });
      }

      // Validate required fields based on new expense type
      if (expenseType.requiresProject && !projectId && !expense.projectId) {
        return res.status(400).json({ message: 'Project is required for this expense type' });
      }

      if (expenseType.requiresEvent && !eventId && !expense.eventId) {
        return res.status(400).json({ message: 'Event is required for this expense type' });
      }

      if (expenseType.requiresMember && !memberId && !expense.memberId) {
        return res.status(400).json({ message: 'Team member is required for this expense type' });
      }

      expense.expenseTypeId = expenseTypeId;
    }

    if (projectId !== undefined) expense.projectId = projectId || undefined;
    if (eventId !== undefined) expense.eventId = eventId || undefined;
    if (memberId !== undefined) expense.memberId = memberId || undefined;
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }
      expense.amount = parseFloat(amount);
    }
    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ message: 'Comment cannot be empty' });
      }
      expense.comment = comment.trim();
    }
    if (date !== undefined) expense.date = new Date(date);
    if (category !== undefined) expense.category = category;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl || undefined;

    await expense.save();

    logger.info(`[${requestId}] Expense updated`, { expenseId, tenantId });

    return res.status(200).json({
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating expense:`, error);
    return res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  
  try {
    const { expenseId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      logger.error(`[${requestId}] Missing tenant info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const expense = await Expense.findOneAndDelete({ expenseId, tenantId });

    if (!expense) {
      logger.warn(`[${requestId}] Expense not found`, { expenseId });
      return res.status(404).json({ message: 'Expense not found' });
    }

    logger.info(`[${requestId}] Expense deleted`, { expenseId, tenantId });

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    logger.error(`[${requestId}] Error deleting expense:`, error);
    return res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};

// Get expense statistics
export const getExpenseStats = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid();
  
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      logger.error(`[${requestId}] Missing tenant info`);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, projectId } = req.query;

    const matchQuery: any = { tenantId };

    if (projectId) {
      matchQuery.projectId = projectId;
    }

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) {
        matchQuery.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        matchQuery.date.$lte = new Date(endDate as string);
      }
    }

    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
        },
      },
    ]);

    const categoryStats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    logger.info(`[${requestId}] Expense stats retrieved`, { tenantId });

    return res.status(200).json({
      stats: stats[0] || { totalExpenses: 0, expenseCount: 0, avgExpense: 0 },
      categoryBreakdown: categoryStats,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching expense stats:`, error);
    return res.status(500).json({ message: 'Failed to fetch expense stats', error: error.message });
  }
};
