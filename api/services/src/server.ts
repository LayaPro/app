import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import testController from './controllers/testController';
import roleController from './controllers/roleController';
import authController from './controllers/authController';
import tenantController from './controllers/tenantController';
import { authenticate, requireSuperAdmin } from './middleware/auth';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------- Miscellaneous routes ----------
app.get('/test', testController.getTest);

// ---------- Auth routes ----------
app.post('/login', authController.login);
app.post('/logout', authController.logout);
app.get('/verify-token', authController.verifyToken);

// ---------- Roles routes ----------
app.post('/create-role', roleController.createRole);
app.get('/get-roles', roleController.getRoles);

// ---------- Tenants routes ----------
app.post('/create-tenant', authenticate, requireSuperAdmin, tenantController.createTenant);
app.get('/get-all-tenants', authenticate, requireSuperAdmin, tenantController.getAllTenants);
app.get('/get-tenant/:tenantId', authenticate, tenantController.getTenantById);
app.put('/update-tenant/:tenantId', authenticate, requireSuperAdmin, tenantController.updateTenant);
app.delete('/delete-tenant/:tenantId', authenticate, requireSuperAdmin, tenantController.deleteTenant);
app.patch('/toggle-tenant-status/:tenantId', authenticate, requireSuperAdmin, tenantController.toggleTenantStatus);

// ---------- Users routes ----------
// TODO: add user controllers and mount endpoints here (e.g., /create-user, /get-users)

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
