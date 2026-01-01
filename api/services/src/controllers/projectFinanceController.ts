import { Response } from 'express';
import { nanoid } from 'nanoid';
import ProjectFinance from '../models/projectFinance';
import { AuthRequest } from '../middleware/auth';

export const createProjectFinance = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId,
      totalBudget,
      receivedAmount,
      receivedDate,
      nextDueDate,
      nextDueAmount,
      expenseIds,
      isClientClosed
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if finance record already exists for this project
    const existingFinance = await ProjectFinance.findOne({ projectId, tenantId });
    if (existingFinance) {
      return res.status(400).json({ message: 'Finance record already exists for this project' });
    }

    const financeId = `finance_${nanoid()}`;
    const projectFinance = await ProjectFinance.create({
      financeId,
      tenantId,
      projectId,
      totalBudget,
      receivedAmount,
      receivedDate,
      nextDueDate,
      nextDueAmount,
      expenseIds,
      isClientClosed,
      createdBy: userId
    });

    return res.status(201).json({
      message: 'Project finance created successfully',
      projectFinance
    });
  } catch (err: any) {
    console.error('Create project finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProjectFinances = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectFinances = await ProjectFinance.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Project finances retrieved successfully',
      count: projectFinances.length,
      projectFinances
    });
  } catch (err: any) {
    console.error('Get all project finances error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectFinanceById = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const tenantId = req.user?.tenantId;

    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant project finances.' });
    }

    return res.status(200).json({ projectFinance });
  } catch (err: any) {
    console.error('Get project finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectFinanceByProjectId = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectFinance = await ProjectFinance.findOne({ projectId, tenantId });

    if (!projectFinance) {
      return res.status(404).json({ message: 'Project finance not found for this project' });
    }

    return res.status(200).json({ projectFinance });
  } catch (err: any) {
    console.error('Get project finance by project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProjectFinance = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    // Don't allow updating financeId, tenantId, or projectId
    delete updates.financeId;
    delete updates.tenantId;
    delete updates.projectId;

    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant project finances.' });
    }

    // Add updatedBy field
    updates.updatedBy = userId;

    const updatedProjectFinance = await ProjectFinance.findOneAndUpdate(
      { financeId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Project finance updated successfully',
      projectFinance: updatedProjectFinance
    });
  } catch (err: any) {
    console.error('Update project finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProjectFinance = async (req: AuthRequest, res: Response) => {
  try {
    const { financeId } = req.params;
    const tenantId = req.user?.tenantId;

    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant project finances.' });
    }

    await ProjectFinance.deleteOne({ financeId });

    return res.status(200).json({
      message: 'Project finance deleted successfully',
      financeId
    });
  } catch (err: any) {
    console.error('Delete project finance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { amount, datetime, comment, nature } = req.body;
    const tenantId = req.user?.tenantId;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!amount || !datetime || !nature) {
      return res.status(400).json({ message: 'Amount, datetime, and nature are required' });
    }

    if (!['received', 'paid'].includes(nature)) {
      return res.status(400).json({ message: 'Nature must be either "received" or "paid"' });
    }

    const projectFinance = await ProjectFinance.findOne({ projectId, tenantId });

    if (!projectFinance) {
      return res.status(404).json({ message: 'Project finance not found for this project' });
    }

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
    projectFinance.transactions = projectFinance.transactions || [];
    projectFinance.transactions.push(newTransaction);

    // Update receivedAmount if nature is 'received'
    if (nature === 'received') {
      projectFinance.receivedAmount = (projectFinance.receivedAmount || 0) + amount;
    }

    await projectFinance.save();

    return res.status(200).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
      projectFinance
    });
  } catch (err: any) {
    console.error('Add transaction error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createProjectFinance,
  getAllProjectFinances,
  getProjectFinanceById,
  getProjectFinanceByProjectId,
  updateProjectFinance,
  deleteProjectFinance,
  addTransaction
};
