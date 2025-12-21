import { Response } from 'express';
import { nanoid } from 'nanoid';
import Event from '../models/event';
import { AuthRequest } from '../middleware/auth';

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventCode, eventDesc, eventAlias } = req.body;
    const tenantId = req.user?.tenantId;

    if (!eventCode || !eventDesc) {
      return res.status(400).json({ message: 'Event code and description are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if event with same code exists for this tenant
    const existing = await Event.findOne({ eventCode, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'Event with this code already exists for your tenant' });
    }

    const eventId = `event_${nanoid()}`;
    const event = await Event.create({
      eventId,
      tenantId,
      eventCode,
      eventDesc,
      eventAlias
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err: any) {
    console.error('Create event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users (including superadmin) only see their own tenant's events
    const events = await Event.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Events retrieved successfully',
      count: events.length,
      events
    });
  } catch (err: any) {
    console.error('Get all events error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const tenantId = req.user?.tenantId;

    const event = await Event.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only access their own tenant's events
    if (event.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant events.' });
    }

    return res.status(200).json({ event });
  } catch (err: any) {
    console.error('Get event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating eventId or tenantId
    delete updates.eventId;
    delete updates.tenantId;

    const event = await Event.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only update their own tenant's events
    if (event.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant events.' });
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { eventId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (err: any) {
    console.error('Update event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const tenantId = req.user?.tenantId;

    const event = await Event.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only delete their own tenant's events
    if (event.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant events.' });
    }

    await Event.deleteOne({ eventId });

    return res.status(200).json({
      message: 'Event deleted successfully',
      eventId
    });
  } catch (err: any) {
    console.error('Delete event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
