import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import testController from './controllers/testController';
import roleController from './controllers/roleController';
import authController from './controllers/authController';
import tenantController from './controllers/tenantController';
import profileController from './controllers/profileController';
import teamController from './controllers/teamController';
import { authenticate, requireSuperAdmin } from './middleware/auth';
import requireAdmin from './middleware/requireAdmin';

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
app.post('/create-role', authenticate, roleController.createRole);
app.get('/get-roles', authenticate, roleController.getRoles);

// ---------- Tenants routes ----------
app.post('/create-tenant', authenticate, requireSuperAdmin, tenantController.createTenant);
app.get('/get-all-tenants', authenticate, requireSuperAdmin, tenantController.getAllTenants);
app.get('/get-tenant/:tenantId', authenticate, tenantController.getTenantById);
app.put('/update-tenant/:tenantId', authenticate, requireSuperAdmin, tenantController.updateTenant);
app.delete('/delete-tenant/:tenantId', authenticate, requireSuperAdmin, tenantController.deleteTenant);
app.patch('/toggle-tenant-status/:tenantId', authenticate, requireSuperAdmin, tenantController.toggleTenantStatus);

// ---------- Profile routes ----------
app.post('/create-profile', authenticate, requireAdmin, profileController.createProfile);
app.get('/get-all-profiles', authenticate, requireAdmin, profileController.getAllProfiles);
app.get('/get-profile/:profileId', authenticate, requireAdmin, profileController.getProfileById);
app.put('/update-profile/:profileId', authenticate, requireAdmin, profileController.updateProfile);
app.delete('/delete-profile/:profileId', authenticate, requireAdmin, profileController.deleteProfile);

// ---------- Team routes ----------
app.post('/create-team-member', authenticate, requireAdmin, teamController.createTeamMember);
app.get('/get-all-team-members', authenticate, requireAdmin, teamController.getAllTeamMembers);
app.get('/get-team-member/:memberId', authenticate, teamController.getTeamMemberById);
app.put('/update-team-member/:memberId', authenticate, teamController.updateTeamMember);
app.delete('/delete-team-member/:memberId', authenticate, requireAdmin, teamController.deleteTeamMember);

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
