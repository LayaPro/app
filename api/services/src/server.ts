import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import testController from './controllers/testController';
import roleController from './controllers/roleController';
import * as authController from './controllers/authController';
import * as tenantController from './controllers/tenantController';
import { authenticate, authorizePermission, validateRoleExists } from './middleware/auth';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------- Authentication routes (public) ----------
app.post('/auth/login', authController.login);
app.post('/auth/set-password', authController.setPassword);
app.post('/bootstrap/create-superuser', authController.createSuperuser);

// ---------- Protected routes ----------
app.get('/auth/me', authenticate, validateRoleExists, authController.getMe);

// ---------- Miscellaneous routes ----------
app.get('/test', testController.getTest);

// ---------- Roles routes ----------
app.post('/create-role', authenticate, validateRoleExists, authorizePermission('MANAGE_ROLES'), roleController.createRole);
app.get('/get-roles', authenticate, validateRoleExists, authorizePermission('ACCESS_API'), roleController.getRoles);

// ---------- Tenants routes ----------
app.post('/create-tenant', authenticate, validateRoleExists, authorizePermission('CREATE_TENANT'), tenantController.createTenant);
app.get('/get-tenants', authenticate, validateRoleExists, authorizePermission('VIEW_TENANTS'), tenantController.getAllTenants);
app.get('/get-tenant/:tenantId', authenticate, validateRoleExists, authorizePermission('VIEW_TENANTS'), tenantController.getTenantById);
app.put('/update-tenant/:tenantId', authenticate, validateRoleExists, authorizePermission('UPDATE_TENANT'), tenantController.updateTenant);
app.delete('/delete-tenant/:tenantId', authenticate, validateRoleExists, authorizePermission('DELETE_TENANT'), tenantController.deleteTenant);
app.patch('/deactivate-tenant/:tenantId', authenticate, validateRoleExists, authorizePermission('DEACTIVATE_TENANT'), tenantController.deactivateTenant);

// ---------- Users routes ----------
app.post('/auth/create-user', authenticate, validateRoleExists, authorizePermission('MANAGE_USERS'), authController.createTenantUser);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

mongoose
  .connect(MONGO_URI, { dbName: 'flomingo_db' })
  .then(() => {
    console.log('Connected to DB:', mongoose.connection.name);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
