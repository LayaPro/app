import { Response } from 'express';
import { nanoid } from 'nanoid';
import Equipment from '../models/equipment';
import { AuthRequest } from '../middleware/auth';

export const createEquipment = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== CREATE EQUIPMENT DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Images field:', req.body.images);
    console.log('Images length:', req.body.images?.length);
    
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

    if (!name) {
      return res.status(400).json({ message: 'Equipment name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Validate condition if provided
    if (condition !== undefined && (condition < 0 || condition > 5)) {
      return res.status(400).json({ message: 'Condition must be between 0 and 5' });
    }

    const equipmentId = `equipment_${nanoid()}`;
    
    console.log('Creating equipment with data:', {
      equipmentId,
      tenantId,
      name,
      imagesCount: images?.length || 0,
      hasImages: !!images
    });
    
    const equipment = await Equipment.create({
      equipmentId,
      tenantId,
      name,
      serialNumber,
      qr,
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

    console.log('Equipment created successfully:', {
      equipmentId: equipment.equipmentId,
      imagesInDb: equipment.images?.length || 0
    });
    console.log('=== END CREATE EQUIPMENT DEBUG ===');

    return res.status(201).json({
      message: 'Equipment created successfully',
      equipment
    });
  } catch (err: any) {
    console.error('Create equipment error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEquipment = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== GET ALL EQUIPMENT CALLED ===');
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users only see their own tenant's equipment
    const equipment = await Equipment.find({ tenantId }).sort({ createdAt: -1 }).lean();
    
    console.log(`Found ${equipment.length} equipment items`);
    if (equipment.length > 0) {
      console.log('First equipment sample:', {
        name: equipment[0].name,
        hasImages: !!equipment[0].images,
        imagesCount: equipment[0].images?.length || 0,
        hasTakenOnRent: 'takenOnRent' in equipment[0],
        fields: Object.keys(equipment[0])
      });
    }
    console.log('=== END GET ALL EQUIPMENT ===');

    return res.status(200).json({
      message: 'Equipment retrieved successfully',
      count: equipment.length,
      equipment
    });
  } catch (err: any) {
    console.error('Get all equipment error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEquipmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const tenantId = req.user?.tenantId;

    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only access their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant equipment.' });
    }

    return res.status(200).json({ equipment });
  } catch (err: any) {
    console.error('Get equipment error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating equipmentId or tenantId
    delete updates.equipmentId;
    delete updates.tenantId;

    // Validate condition if provided
    if (updates.condition !== undefined && (updates.condition < 0 || updates.condition > 5)) {
      return res.status(400).json({ message: 'Condition must be between 0 and 5' });
    }

    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only update their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant equipment.' });
    }

    const updatedEquipment = await Equipment.findOneAndUpdate(
      { equipmentId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Equipment updated successfully',
      equipment: updatedEquipment
    });
  } catch (err: any) {
    console.error('Update equipment error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const tenantId = req.user?.tenantId;

    const equipment = await Equipment.findOne({ equipmentId });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check authorization: all users can only delete their own tenant's equipment
    if (equipment.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant equipment.' });
    }

    await Equipment.deleteOne({ equipmentId });

    return res.status(200).json({
      message: 'Equipment deleted successfully',
      equipmentId
    });
  } catch (err: any) {
    console.error('Delete equipment error:', err);
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
