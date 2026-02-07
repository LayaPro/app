import { Response } from 'express';
import { nanoid } from 'nanoid';
import ProjectFinance from '../models/projectFinance';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('ProjectFinanceController');

export const createProjectFinance = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating project finance`, { tenantId, userId });

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

    if (!projectId) {
      logger.warn(`[${requestId}] Project ID missing`, { tenantId });
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if finance record already exists for this project
    const existingFinance = await ProjectFinance.findOne({ projectId, tenantId });
    if (existingFinance) {
      logger.warn(`[${requestId}] Finance record already exists`, { tenantId, projectId });
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

    logger.info(`[${requestId}] Project finance created`, { 
      tenantId, 
      financeId,
      projectId,
      totalBudget 
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ProjectFinance',
      entityId: financeId,
      tenantId,
      performedBy: userId || 'System',
      changes: {
        projectId,
        totalBudget,
        receivedAmount,
        isClientClosed
      },
      metadata: {
        nextDueDate,
        nextDueAmount
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Project finance created successfully',
      projectFinance
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating project finance`, { 
      tenantId, 
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProjectFinances = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all project finances`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectFinances = await ProjectFinance.find({ tenantId }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Project finances retrieved`, { tenantId, count: projectFinances.length });

    return res.status(200).json({
      message: 'Project finances retrieved successfully',
      count: projectFinances.length,
      projectFinances
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching project finances`, { 
      tenantId, 
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectFinanceById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { financeId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching project finance`, { tenantId, financeId });

  try {
    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      logger.warn(`[${requestId}] Project finance not found`, { tenantId, financeId });
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, financeId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant project finances.' });
    }

    logger.info(`[${requestId}] Project finance retrieved`, { tenantId, financeId });

    return res.status(200).json({ projectFinance });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching project finance`, { 
      tenantId, 
      financeId,
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectFinanceByProjectId = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching project finance by project`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, projectId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectFinance = await ProjectFinance.findOne({ projectId, tenantId });

    if (!projectFinance) {
      logger.warn(`[${requestId}] Project finance not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project finance not found for this project' });
    }

    logger.info(`[${requestId}] Project finance retrieved`, { tenantId, projectId });

    return res.status(200).json({ projectFinance });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching project finance by project`, { 
      tenantId, 
      projectId,
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProjectFinance = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { financeId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating project finance`, { tenantId, financeId });

  try {
    // Don't allow updating financeId, tenantId, or projectId
    delete updates.financeId;
    delete updates.tenantId;
    delete updates.projectId;

    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      logger.warn(`[${requestId}] Project finance not found`, { tenantId, financeId });
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, financeId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant project finances.' });
    }

    // Track changes for audit
    const changes: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && (projectFinance as any)[key] !== updates[key]) {
        changes[key] = { before: (projectFinance as any)[key], after: updates[key] };
      }
    });

    // Add updatedBy field
    updates.updatedBy = userId;

    const updatedProjectFinance = await ProjectFinance.findOneAndUpdate(
      { financeId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Project finance updated`, { tenantId, financeId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ProjectFinance',
      entityId: financeId,
      tenantId,
      performedBy: userId || 'System',
      changes,
      metadata: {
        projectId: projectFinance.projectId
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Project finance updated successfully',
      projectFinance: updatedProjectFinance
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating project finance`, { 
      tenantId, 
      financeId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProjectFinance = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { financeId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting project finance`, { tenantId, financeId });

  try {
    const projectFinance = await ProjectFinance.findOne({ financeId });

    if (!projectFinance) {
      logger.warn(`[${requestId}] Project finance not found`, { tenantId, financeId });
      return res.status(404).json({ message: 'Project finance not found' });
    }

    // Check authorization
    if (projectFinance.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, financeId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant project finances.' });
    }

    // Store data for audit
    const financeData = {
      projectId: projectFinance.projectId,
      totalBudget: projectFinance.totalBudget,
      receivedAmount: projectFinance.receivedAmount
    };

    await ProjectFinance.deleteOne({ financeId });

    logger.info(`[${requestId}] Project finance deleted`, { tenantId, financeId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'ProjectFinance',
      entityId: financeId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: financeData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Project finance deleted successfully',
      financeId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting project finance`, { 
      tenantId, 
      financeId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addTransaction = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const { amount, datetime, comment, nature } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Adding transaction`, { tenantId, projectId, nature, amount });

  try {
    if (!projectId) {
      logger.warn(`[${requestId}] Project ID missing`, { tenantId });
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!amount || !datetime || !nature) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId, projectId });
      return res.status(400).json({ message: 'Amount, datetime, and nature are required' });
    }

    if (!['received', 'paid'].includes(nature)) {
      logger.warn(`[${requestId}] Invalid nature value`, { tenantId, projectId, nature });
      return res.status(400).json({ message: 'Nature must be either "received" or "paid"' });
    }

    const projectFinance = await ProjectFinance.findOne({ projectId, tenantId });

    if (!projectFinance) {
      logger.warn(`[${requestId}] Project finance not found`, { tenantId, projectId });
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
    const oldReceivedAmount = projectFinance.receivedAmount || 0;
    if (nature === 'received') {
      projectFinance.receivedAmount = oldReceivedAmount + amount;
    }

    await projectFinance.save();

    logger.info(`[${requestId}] Transaction added`, { 
      tenantId, 
      projectId,
      transactionId,
      nature,
      amount 
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ProjectFinance',
      entityId: projectFinance.financeId,
      tenantId,
      performedBy: userId || 'System',
      changes: {
        transaction: {
          transactionId,
          nature,
          amount,
          datetime
        }
      },
      metadata: {
        projectId,
        oldReceivedAmount,
        newReceivedAmount: projectFinance.receivedAmount
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
      projectFinance
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error adding transaction`, { 
      tenantId, 
      projectId,
      error: err.message,
      stack: err.stack 
    });
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
