import { Response } from 'express';
import { nanoid } from 'nanoid';
import EventExpense from '../models/eventExpense';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('EventExpenseController');

export const createEventExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    clientEventId,
    crewId,
    expenseComment,
    expenseAmount,
    paymentDate
  } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating event expense`, { tenantId, clientEventId, expenseAmount });

  try {
    if (!clientEventId || !expenseAmount) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Client Event ID and Expense Amount are required' });
    }

    if (!crewId) {
      logger.warn(`[${requestId}] Crew ID missing`, { tenantId });
      return res.status(400).json({ message: 'Crew ID is required. Use "-1" for non-salary expenses' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const eventExpenseId = `expense_${nanoid()}`;
    const eventExpense = await EventExpense.create({
      eventExpenseId,
      tenantId,
      clientEventId,
      crewId,
      expenseComment,
      expenseAmount,
      paymentDate,
      addedBy: userId
    });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'EventExpense',
      entityId: eventExpenseId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { clientEventId, crewId, expenseAmount },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event expense created`, { tenantId, eventExpenseId, expenseAmount });

    return res.status(201).json({
      message: 'Event expense created successfully',
      eventExpense
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating event expense`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEventExpenses = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all event expenses`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const eventExpenses = await EventExpense.find({ tenantId }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Event expenses retrieved`, { tenantId, count: eventExpenses.length });

    return res.status(200).json({
      message: 'Event expenses retrieved successfully',
      count: eventExpenses.length,
      eventExpenses
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event expenses`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventExpenseById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventExpenseId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching event expense by ID`, { tenantId, eventExpenseId });

  try {
    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      logger.warn(`[${requestId}] Event expense not found`, { tenantId, eventExpenseId });
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventExpenseId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant event expenses.' });
    }

    logger.info(`[${requestId}] Event expense retrieved`, { tenantId, eventExpenseId });

    return res.status(200).json({ eventExpense });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event expense`, { 
      tenantId,
      eventExpenseId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventExpensesByClientEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching event expenses by client event`, { tenantId, clientEventId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const eventExpenses = await EventExpense.find({ clientEventId, tenantId }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Event expenses retrieved`, { tenantId, clientEventId, count: eventExpenses.length });

    return res.status(200).json({
      message: 'Event expenses retrieved successfully',
      count: eventExpenses.length,
      eventExpenses
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event expenses by client event`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEventExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventExpenseId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating event expense`, { tenantId, eventExpenseId });

  try {
    // Don't allow updating eventExpenseId or tenantId
    delete updates.eventExpenseId;
    delete updates.tenantId;

    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      logger.warn(`[${requestId}] Event expense not found`, { tenantId, eventExpenseId });
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventExpenseId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant event expenses.' });
    }

    const updatedEventExpense = await EventExpense.findOneAndUpdate(
      { eventExpenseId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'EventExpense',
      entityId: eventExpenseId,
      tenantId,
      performedBy: userId || 'System',
      changes: updates,
      metadata: { clientEventId: eventExpense.clientEventId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event expense updated`, { tenantId, eventExpenseId });

    return res.status(200).json({
      message: 'Event expense updated successfully',
      eventExpense: updatedEventExpense
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating event expense`, { 
      tenantId,
      eventExpenseId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEventExpense = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventExpenseId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting event expense`, { tenantId, eventExpenseId });

  try {
    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      logger.warn(`[${requestId}] Event expense not found`, { tenantId, eventExpenseId });
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventExpenseId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant event expenses.' });
    }

    await EventExpense.deleteOne({ eventExpenseId });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'EventExpense',
      entityId: eventExpenseId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { deleted: true, clientEventId: eventExpense.clientEventId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event expense deleted`, { tenantId, eventExpenseId });

    return res.status(200).json({
      message: 'Event expense deleted successfully',
      eventExpenseId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting event expense`, { 
      tenantId,
      eventExpenseId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEventExpense,
  getAllEventExpenses,
  getEventExpenseById,
  getEventExpensesByClientEvent,
  updateEventExpense,
  deleteEventExpense
};
