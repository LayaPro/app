import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import Role from '../models/role';

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const existing = await Role.findOne({ name });
    if (existing) return res.status(409).json({ message: 'role already exists' });
    
    const roleId = `role_${nanoid()}`;
    const doc = await Role.create({ roleId, name, description });
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error('createRole error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const docs = await Role.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  } catch (err: any) {
    console.error('getRoles error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export default { createRole, getRoles };
