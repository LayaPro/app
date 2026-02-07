import { Response } from 'express';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import Equipment from '../models/equipment';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('EquipmentController');

export const createEquipment = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    name,
    serialNumber,
    qr,
    brand,
    price,
    purchaseDate,
    isOnRent,
    takenOnRent,
    perDayRent,
    image,
    images,
    condition
  } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating equipment`, { 
    tenantId, 
    name,
    imagesCount: images?.length || 0 
  });

  try {
    if (!name) {
      logger.warn(`[${requestId}] Equipment name missing`, { tenantId });
      return res.status(400).json({ message: 'Equipment name is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Validate condition if provided
    if (condition !== undefined && (condition < 0 || condition > 5)) {
      logger.warn(`[${requestId}] Invalid condition value`, { tenantId, condition });
      return res.status(400).json({ message: 'Condition must be between 0 and 5' });
    }

    const equipmentId = `equipment_${nanoid()}`;
    
    // Generate QR code for the equipment ID
    const qrCodeDataURL = await QRCode.toDataURL(equipmentId, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    
    logger.info(`[${requestId}] QR code generated`, { tenantId, equipmentId });
    
    const equipment = await Equipment.create({
      equipmentId,
      tenantId,
      name,
      serialNumber,
      qr: qrCodeDataURL,
      brand,
      price,
      purchaseDate,
      isOnRent: isOnRent || takenOnRent || false,
      takenOnRent: takenOnRent || isOnRent || false,
      perDayRent,
      image,
      images: images || [],
      condition
    });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Equipment',
      entityId: equipmentId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { name, brand, price, imagesCount: images?.length || 0 },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Equipment created`, { 
      tenantId, 
      equipmentId,
      imagesCount: equipment.images?.length || 0 
    });

    return res.status(201).json({
      message: 'Equipment created successfully',
      equipment
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating equipment`, { 
      tenantId,
      name,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEquipment = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all equipment`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users only see their own tenant's equipment
    const equipment = await Equipment.find({ tenantId }).sort({ createdAt: -1 }).lean();
    
    logger.info(`[${requestId}] Equipment retrieved`, { tenantId, count: equipment.length });

    return res.status(200).json({
      message: 'Equipment retrieved successfully',
      count: equipment.length,
      equipment
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching equipment`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEquipmentById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { equipmentId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching equipment by ID`, { tenantId, equipmentId });

  try {
    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      logger.warn(`[${requestId}] Equipment not found`, { tenantId, equipmentId });
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only access their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, equipmentId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant equipment.' });
    }

    logger.info(`[${requestId}] Equipment retrieved`, { tenantId, equipmentId });

    return res.status(200).json({ equipment });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching equipment`, { 
      tenantId,
      equipmentId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { equipmentId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating equipment`, { tenantId, equipmentId });

  try {
    // Don't allow updating equipmentId or tenantId
    delete updates.equipmentId;
    delete updates.tenantId;

    // Validate condition if provided
    if (updates.condition !== undefined && (updates.condition < 0 || updates.condition > 5)) {
      logger.warn(`[${requestId}] Invalid condition value`, { tenantId, equipmentId, condition: updates.condition });
      return res.status(400).json({ message: 'Condition must be between 0 and 5' });
    }

    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      logger.warn(`[${requestId}] Equipment not found`, { tenantId, equipmentId });
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only update their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, equipmentId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant equipment.' });
    }

    const updatedEquipment = await Equipment.findOneAndUpdate(
      { equipmentId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Equipment',
      entityId: equipmentId,
      tenantId,
      performedBy: userId || 'System',
      changes: updates,
      metadata: { name: equipment.name },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Equipment updated`, { tenantId, equipmentId });

    return res.status(200).json({
      message: 'Equipment updated successfully',
      equipment: updatedEquipment
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating equipment`, { 
      tenantId,
      equipmentId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { equipmentId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting equipment`, { tenantId, equipmentId });

  try {
    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      logger.warn(`[${requestId}] Equipment not found`, { tenantId, equipmentId });
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only delete their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, equipmentId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant equipment.' });
    }

    await Equipment.deleteOne({ equipmentId });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Equipment',
      entityId: equipmentId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { deleted: true, name: equipment.name },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Equipment deleted`, { tenantId, equipmentId });

    return res.status(200).json({
      message: 'Equipment deleted successfully',
      equipmentId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting equipment`, { 
      tenantId,
      equipmentId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment
};
