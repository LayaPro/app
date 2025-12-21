import { Response } from 'express';
import { nanoid } from 'nanoid';
import ClientEvent from '../models/clientEvent';
import { AuthRequest } from '../middleware/auth';

export const createClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      eventId,
      projectId,
      eventDeliveryStatusId,
      fromDatetime,
      toDatetime,
      venue,
      venueMapUrl,
      city,
      teamMembersAssigned,
      equipmentsAssigned,
      expenseId,
      coverPhoto,
      notes
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!eventId || !projectId) {
      return res.status(400).json({ message: 'Event ID and Project ID are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const clientEventId = `clientevent_${nanoid()}`;
    const clientEvent = await ClientEvent.create({
      clientEventId,
      tenantId,
      eventId,
      projectId,
      eventDeliveryStatusId,
      fromDatetime,
      toDatetime,
      venue,
      venueMapUrl,
      city,
      teamMembersAssigned,
      equipmentsAssigned,
      expenseId,
      coverPhoto,
      notes,
      createdBy: userId
    });

    return res.status(201).json({
      message: 'Client event created successfully',
      clientEvent
    });
  } catch (err: any) {
    console.error('Create client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllClientEvents = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users see their own tenant's client events
    const clientEvents = await ClientEvent.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    console.error('Get all client events error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization: all users can only access their own tenant's events
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant client events.' });
    }

    return res.status(200).json({ clientEvent });
  } catch (err: any) {
    console.error('Get client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    // Don't allow updating clientEventId or tenantId
    delete updates.clientEventId;
    delete updates.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant client events.' });
    }

    // Check if user is admin or superadmin
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';

    // If not admin, only allow updating eventDeliveryStatusId
    if (!isAdmin) {
      const allowedFields = ['eventDeliveryStatusId'];
      const updateKeys = Object.keys(updates);
      const hasUnauthorizedFields = updateKeys.some(key => !allowedFields.includes(key));

      if (hasUnauthorizedFields) {
        return res.status(403).json({ 
          message: 'Access denied. You can only update the delivery status. Other fields require admin access.' 
        });
      }
    }

    // Add updatedBy field
    updates.updatedBy = userId;

    const updatedClientEvent = await ClientEvent.findOneAndUpdate(
      { clientEventId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Client event updated successfully',
      clientEvent: updatedClientEvent
    });
  } catch (err: any) {
    console.error('Update client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant client events.' });
    }

    await ClientEvent.deleteOne({ clientEventId });

    return res.status(200).json({
      message: 'Client event deleted successfully',
      clientEventId
    });
  } catch (err: any) {
    console.error('Delete client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventsByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all client events for a specific project
    const clientEvents = await ClientEvent.find({ projectId, tenantId }).sort({ fromDatetime: 1 }).lean();

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    console.error('Get client events by project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createClientEvent,
  getAllClientEvents,
  getClientEventById,
  updateClientEvent,
  deleteClientEvent,
  getClientEventsByProject
};
