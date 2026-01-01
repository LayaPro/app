import { Response } from 'express';
import { nanoid } from 'nanoid';
import TeamFinance from '../models/teamFinance';
import { AuthRequest } from '../middleware/auth';

export const createTeamFinance = async (req: AuthRequest, res: Response) => {
  try {
    const {
      memberId,
      monthlySalary,
      totalPaid,
      lastPaymentDate,
      nextPaymentDate,
      pendingAmount
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if team finance already exists for this member
    const existingFinance = await TeamFinance.findOne({ memberId, tenantId });
    if (existingFinance) {
      return res.status(400).json({ message: 'Finance record already exists for this team member' });
    }

    const financeId = `teamfin_${nanoid()}`;
    const teamFinance = await TeamFinance.create({
      financeId,
      tenantId,
      memberId,
      monthlySalary,
      totalPaid: totalPaid || 0,
      lastPaymentDate,
      nextPaymentDate,
      pendingAmount: pendingAmount || 0,
      transactions: [],
      createdBy: userId
    });

    return res.status(201).json({
      message: 'Team finance created successfully',
      teamFinance
    });
  } catch (err: any) {
    console.error('Create team finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTeamFinances = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const teamFinances = await TeamFinance.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Team finances retrieved successfully',
      count: teamFinances.length,
      teamFinances
    });
  } catch (err: any) {
    console.error('Get all team finances error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeamFinanceById = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const tenantId = req.user?.tenantId;

    const teamFinance = await TeamFinance.findOne({ financeId, tenantId }).lean();

    if (!teamFinance) {
      return res.status(404).json({ message: 'Team finance not found' });
    }

    return res.status(200).json({
      message: 'Team finance retrieved successfully',
      teamFinance
    });
  } catch (err: any) {
    console.error('Get team finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeamFinanceByMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const tenantId = req.user?.tenantId;

    const teamFinance = await TeamFinance.findOne({ memberId, tenantId }).lean();

    if (!teamFinance) {
      return res.status(404).json({ message: 'Team finance not found for this member' });
    }

    return res.status(200).json({
      message: 'Team finance retrieved successfully',
      teamFinance
    });
  } catch (err: any) {
    console.error('Get team finance by member error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTeamFinance = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    const teamFinance = await TeamFinance.findOne({ financeId, tenantId });

    if (!teamFinance) {
      return res.status(404).json({ message: 'Team finance not found' });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.financeId;
    delete updates.tenantId;
    delete updates.transactions;
    delete updates.createdBy;
    delete updates.createdAt;

    updates.updatedBy = userId;

    const updatedTeamFinance = await TeamFinance.findOneAndUpdate(
      { financeId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Team finance updated successfully',
      teamFinance: updatedTeamFinance
    });
  } catch (err: any) {
    console.error('Update team finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTeamFinance = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const tenantId = req.user?.tenantId;

    const teamFinance = await TeamFinance.findOne({ financeId, tenantId });

    if (!teamFinance) {
      return res.status(404).json({ message: 'Team finance not found' });
    }

    await TeamFinance.deleteOne({ financeId });

    return res.status(200).json({
      message: 'Team finance deleted successfully',
      financeId
    });
  } catch (err: any) {
    console.error('Delete team finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addSalaryTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const { amount, datetime, comment, nature } = req.body;
    const tenantId = req.user?.tenantId;

    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    if (!amount || !datetime || !nature) {
      return res.status(400).json({ message: 'Amount, datetime, and nature are required' });
    }

    if (!['paid', 'bonus', 'deduction'].includes(nature)) {
      return res.status(400).json({ message: 'Nature must be "paid", "bonus", or "deduction"' });
    }

    const teamFinance = await TeamFinance.findOne({ memberId, tenantId });

    if (!teamFinance) {
      return res.status(404).json({ message: 'Team finance not found for this member' });
    }

    // Create new transaction
    const transactionId = `txn_${nanoid()}`;
    const newTransaction = {
      transactionId,
      datetime: new Date(datetime),
      amount,
      comment,
      nature,
      createdAt: new Date()
    };

    // Add transaction to array
    teamFinance.transactions = teamFinance.transactions || [];
    teamFinance.transactions.push(newTransaction);

    // Update totalPaid
    if (nature === 'paid' || nature === 'bonus') {
      teamFinance.totalPaid = (teamFinance.totalPaid || 0) + amount;
      teamFinance.lastPaymentDate = new Date(datetime);
    } else if (nature === 'deduction') {
      teamFinance.totalPaid = (teamFinance.totalPaid || 0) - amount;
    }

    await teamFinance.save();

    return res.status(200).json({
      message: 'Salary transaction added successfully',
      transaction: newTransaction,
      teamFinance
    });
  } catch (err: any) {
    console.error('Add salary transaction error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createTeamFinance,
  getAllTeamFinances,
  getTeamFinanceById,
  getTeamFinanceByMember,
  updateTeamFinance,
  deleteTeamFinance,
  addSalaryTransaction
};
