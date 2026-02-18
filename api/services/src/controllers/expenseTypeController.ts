import { Response } from 'express';
import { nanoid } from 'nanoid';
import ExpenseType from '../models/expenseType';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('ExpenseTypeController');

export const createExpenseType = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { name, description, requiresProject, requiresEvent, requiresMember, displayOrder } = req.body;
  const tenantId = req.user?.tenantId; // Use actual tenantId for custom types
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating expense type`, { tenantId, name });

  try {
    if (!name) {
      return res.status(400).json({ message: 'Expense type name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if expense type already exists for this tenant
    const existing = await ExpenseType.findOne({ tenantId, name });
    if (existing) {
      return res.status(400).json({ message: 'Expense type with this name already exists' });
    }

    const expenseTypeId = `exptype_${nanoid()}`;
    const expenseType = await ExpenseType.create({
      expenseTypeId,
      tenantId,
      name,
      description,
      requiresProject: requiresProject !== undefined ? requiresProject : true,
      requiresEvent: requiresEvent !== undefined ? requiresEvent : true,
      requiresMember: requiresMember !== undefined ? requiresMember : false,
      displayOrder: displayOrder !== undefined ? displayOrder : 999,
      isActive: true,
    });

    logger.info(`[${requestId}] Expense type created`, { tenantId, expenseTypeId, name });

    return res.status(201).json({
      message: 'Expense type created successfully',
      expenseType,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating expense type`, {
      tenantId,
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllExpenseTypes = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all expense types`, { tenantId });

  try {
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Fetch both global (-1) and tenant-specific expense types
    const expenseTypes = await ExpenseType.find({
      $or: [
        { tenantId: '-1' },
        { tenantId: tenantId }
      ],
      isActive: true
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    logger.info(`[${requestId}] Expense types retrieved`, { tenantId, count: expenseTypes.length });

    return res.status(200).json({
      message: 'Expense types retrieved successfully',
      expenseTypes,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching expense types`, {
      tenantId,
      error: err.message,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getExpenseTypeById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { expenseTypeId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching expense type`, { tenantId, expenseTypeId });

  try {
    const expenseType = await ExpenseType.findOne({ expenseTypeId });

    if (!expenseType) {
      return res.status(404).json({ message: 'Expense type not found' });
    }

    return res.status(200).json({ expenseType });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching expense type`, {
      tenantId,
      expenseTypeId,
      error: err.message,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpenseType = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { expenseTypeId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Updating expense type`, { tenantId, expenseTypeId });

  try {
    delete updates.expenseTypeId;
    delete updates.tenantId;
    delete updates.createdAt;

    const expenseType = await ExpenseType.findOne({ expenseTypeId });

    if (!expenseType) {
      return res.status(404).json({ message: 'Expense type not found' });
    }

    // Prevent updating global expense types
    if (expenseType.tenantId === '-1') {
      return res.status(403).json({ message: 'Cannot modify global expense types' });
    }

    // Ensure user can only update their own tenant's expense types
    if (expenseType.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedExpenseType = await ExpenseType.findOneAndUpdate(
      { expenseTypeId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Expense type updated`, { tenantId, expenseTypeId });

    return res.status(200).json({
      message: 'Expense type updated successfully',
      expenseType: updatedExpenseType,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating expense type`, {
      tenantId,
      expenseTypeId,
      error: err.message,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteExpenseType = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { expenseTypeId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Deleting expense type`, { tenantId, expenseTypeId });

  try {
    const expenseType = await ExpenseType.findOne({ expenseTypeId });

    if (!expenseType) {
      return res.status(404).json({ message: 'Expense type not found' });
    }

    // Prevent deleting global expense types
    if (expenseType.tenantId === '-1') {
      return res.status(403).json({ message: 'Cannot delete global expense types' });
    }

    // Ensure user can only delete their own tenant's expense types
    if (expenseType.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete by marking as inactive
    await ExpenseType.findOneAndUpdate(
      { expenseTypeId },
      { $set: { isActive: false } }
    );

    logger.info(`[${requestId}] Expense type deleted`, { tenantId, expenseTypeId });

    return res.status(200).json({
      message: 'Expense type deleted successfully',
      expenseTypeId,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting expense type`, {
      tenantId,
      expenseTypeId,
      error: err.message,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const seedDefaultExpenseTypes = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = '-1'; // Global data for seeded types

  logger.info(`[${requestId}] Seeding default expense types`, { tenantId });

  try {
    const defaultTypes = [
      { name: 'Photography Services', description: 'Photography costs and fees', requiresProject: true, requiresEvent: true },
      { name: 'Videography Services', description: 'Videography costs and fees', requiresProject: true, requiresEvent: true },
      { name: 'Drone Services', description: 'Drone/aerial photography costs', requiresProject: true, requiresEvent: true },
      { name: 'Album Printing', description: 'Album printing and production costs', requiresProject: true, requiresEvent: false },
      { name: 'Travel', description: 'Travel and transportation costs', requiresProject: true, requiresEvent: true },
      { name: 'Fuel', description: 'Fuel expenses', requiresProject: true, requiresEvent: true },
      { name: 'Team Salary', description: 'Salary payments to team members', requiresProject: true, requiresEvent: true },
      { name: 'General', description: 'General miscellaneous expenses', requiresProject: false, requiresEvent: false },
    ];

    const created = [];
    for (const type of defaultTypes) {
      const existing = await ExpenseType.findOne({ tenantId, name: type.name });
      if (!existing) {
        const expenseTypeId = `exptype_${nanoid()}`;
        const expenseType = await ExpenseType.create({
          expenseTypeId,
          tenantId,
          ...type,
          isActive: true,
        });
        created.push(expenseType);
      }
    }

    logger.info(`[${requestId}] Default expense types seeded`, { tenantId, count: created.length });

    return res.status(200).json({
      message: 'Default expense types seeded successfully',
      created: created.length,
      expenseTypes: created,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error seeding expense types`, {
      tenantId,
      error: err.message,
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createExpenseType,
  getAllExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
  seedDefaultExpenseTypes,
};
