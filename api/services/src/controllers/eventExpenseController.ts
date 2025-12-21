import { Response } from 'express';
import { nanoid } from 'nanoid';
import EventExpense from '../models/eventExpense';
import { AuthRequest } from '../middleware/auth';

export const createEventExpense = async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientEventId,
      crewId,
      expenseComment,
      expenseAmount,
      paymentDate
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!clientEventId || !expenseAmount) {
      return res.status(400).json({ message: 'Client Event ID and Expense Amount are required' });
    }

    if (!crewId) {
      return res.status(400).json({ message: 'Crew ID is required. Use "-1" for non-salary expenses' });
    }

    if (!tenantId) {
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

    return res.status(201).json({
      message: 'Event expense created successfully',
      eventExpense
    });
  } catch (err: any) {
    console.error('Create event expense error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEventExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const eventExpenses = await EventExpense.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Event expenses retrieved successfully',
      count: eventExpenses.length,
      eventExpenses
    });
  } catch (err: any) {
    console.error('Get all event expenses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventExpenseById = async (req: AuthRequest, res: Response) => {
  try {
    const { eventExpenseId } = req.params;
    const tenantId = req.user?.tenantId;

    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant event expenses.' });
    }

    return res.status(200).json({ eventExpense });
  } catch (err: any) {
    console.error('Get event expense error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventExpensesByClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const eventExpenses = await EventExpense.find({ clientEventId, tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Event expenses retrieved successfully',
      count: eventExpenses.length,
      eventExpenses
    });
  } catch (err: any) {
    console.error('Get event expenses by client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEventExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { eventExpenseId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating eventExpenseId or tenantId
    delete updates.eventExpenseId;
    delete updates.tenantId;

    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant event expenses.' });
    }

    const updatedEventExpense = await EventExpense.findOneAndUpdate(
      { eventExpenseId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Event expense updated successfully',
      eventExpense: updatedEventExpense
    });
  } catch (err: any) {
    console.error('Update event expense error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEventExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { eventExpenseId } = req.params;
    const tenantId = req.user?.tenantId;

    const eventExpense = await EventExpense.findOne({ eventExpenseId });

    if (!eventExpense) {
      return res.status(404).json({ message: 'Event expense not found' });
    }

    // Check authorization
    if (eventExpense.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant event expenses.' });
    }

    await EventExpense.deleteOne({ eventExpenseId });

    return res.status(200).json({
      message: 'Event expense deleted successfully',
      eventExpenseId
    });
  } catch (err: any) {
    console.error('Delete event expense error:', err);
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
