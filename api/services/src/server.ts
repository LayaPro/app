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
import eventController from './controllers/eventController';
import eventDeliveryStatusController from './controllers/eventDeliveryStatusController';
import projectDeliveryStatusController from './controllers/projectDeliveryStatusController';
import equipmentController from './controllers/equipmentController';
import projectController from './controllers/projectController';
import clientEventController from './controllers/clientEventController';
import eventExpenseController from './controllers/eventExpenseController';
import projectFinanceController from './controllers/projectFinanceController';
import imageController from './controllers/imageController';
import dashboardController from './controllers/dashboardController';
import searchController from './controllers/searchController';
import userController from './controllers/userController';
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
app.post('/refresh-token', authController.refreshToken);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password', authController.resetPassword);

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

// ---------- Event routes ----------
app.post('/create-event', authenticate, requireAdmin, eventController.createEvent);
app.get('/get-all-events', authenticate, requireAdmin, eventController.getAllEvents);
app.get('/get-event/:eventId', authenticate, requireAdmin, eventController.getEventById);
app.put('/update-event/:eventId', authenticate, requireAdmin, eventController.updateEvent);
app.delete('/delete-event/:eventId', authenticate, requireAdmin, eventController.deleteEvent);

// ---------- Event Delivery Status routes ----------
app.post('/create-event-delivery-status', authenticate, requireAdmin, eventDeliveryStatusController.createEventDeliveryStatus);
app.get('/get-all-event-delivery-statuses', authenticate, requireAdmin, eventDeliveryStatusController.getAllEventDeliveryStatuses);
app.get('/get-event-delivery-status/:statusId', authenticate, requireAdmin, eventDeliveryStatusController.getEventDeliveryStatusById);
app.put('/update-event-delivery-status/:statusId', authenticate, requireAdmin, eventDeliveryStatusController.updateEventDeliveryStatus);
app.delete('/delete-event-delivery-status/:statusId', authenticate, requireAdmin, eventDeliveryStatusController.deleteEventDeliveryStatus);

// ---------- Project Delivery Status routes ----------
app.post('/create-project-delivery-status', authenticate, requireAdmin, projectDeliveryStatusController.createProjectDeliveryStatus);
app.get('/get-all-project-delivery-statuses', authenticate, requireAdmin, projectDeliveryStatusController.getAllProjectDeliveryStatuses);
app.get('/get-project-delivery-status/:statusId', authenticate, requireAdmin, projectDeliveryStatusController.getProjectDeliveryStatusById);
app.put('/update-project-delivery-status/:statusId', authenticate, requireAdmin, projectDeliveryStatusController.updateProjectDeliveryStatus);
app.delete('/delete-project-delivery-status/:statusId', authenticate, requireAdmin, projectDeliveryStatusController.deleteProjectDeliveryStatus);

// ---------- Equipment routes ----------
app.post('/create-equipment', authenticate, requireAdmin, equipmentController.createEquipment);
app.get('/get-all-equipment', authenticate, requireAdmin, equipmentController.getAllEquipment);
app.get('/get-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.getEquipmentById);
app.put('/update-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.updateEquipment);
app.delete('/delete-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.deleteEquipment);

// ---------- Project routes ----------
app.post('/create-project', authenticate, requireAdmin, projectController.createProject);
app.get('/get-all-projects', authenticate, requireAdmin, projectController.getAllProjects);
app.get('/get-project/:projectId', authenticate, requireAdmin, projectController.getProjectById);
app.put('/update-project/:projectId', authenticate, requireAdmin, projectController.updateProject);
app.delete('/delete-project/:projectId', authenticate, requireAdmin, projectController.deleteProject);

// ---------- Client Event routes ----------
app.post('/create-client-event', authenticate, requireAdmin, clientEventController.createClientEvent);
app.get('/get-all-client-events', authenticate, clientEventController.getAllClientEvents);
app.get('/get-client-event/:clientEventId', authenticate, clientEventController.getClientEventById);
app.get('/get-client-events-by-project/:projectId', authenticate, clientEventController.getClientEventsByProject);
app.put('/update-client-event/:clientEventId', authenticate, clientEventController.updateClientEvent);
app.delete('/delete-client-event/:clientEventId', authenticate, requireAdmin, clientEventController.deleteClientEvent);

// ---------- Event Expense routes ----------
app.post('/create-event-expense', authenticate, requireAdmin, eventExpenseController.createEventExpense);
app.get('/get-all-event-expenses', authenticate, eventExpenseController.getAllEventExpenses);
app.get('/get-event-expense/:eventExpenseId', authenticate, eventExpenseController.getEventExpenseById);
app.get('/get-event-expenses-by-client-event/:clientEventId', authenticate, eventExpenseController.getEventExpensesByClientEvent);
app.put('/update-event-expense/:eventExpenseId', authenticate, requireAdmin, eventExpenseController.updateEventExpense);
app.delete('/delete-event-expense/:eventExpenseId', authenticate, requireAdmin, eventExpenseController.deleteEventExpense);

// ---------- Project Finance routes ----------
app.post('/create-project-finance', authenticate, requireAdmin, projectFinanceController.createProjectFinance);
app.get('/get-all-project-finances', authenticate, projectFinanceController.getAllProjectFinances);
app.get('/get-project-finance/:financeId', authenticate, projectFinanceController.getProjectFinanceById);
app.get('/get-project-finance-by-project/:projectId', authenticate, projectFinanceController.getProjectFinanceByProjectId);
app.put('/update-project-finance/:financeId', authenticate, requireAdmin, projectFinanceController.updateProjectFinance);
app.delete('/delete-project-finance/:financeId', authenticate, requireAdmin, projectFinanceController.deleteProjectFinance);

// ---------- Image routes ----------
app.post('/create-image', authenticate, requireAdmin, imageController.createImage);
app.post('/bulk-create-images', authenticate, requireAdmin, imageController.bulkCreateImages);
app.get('/get-all-images', authenticate, imageController.getAllImages);
app.get('/get-images-by-client-event/:clientEventId', authenticate, imageController.getImagesByClientEvent);
app.get('/get-images-by-project/:projectId', authenticate, imageController.getImagesByProject);
app.get('/get-image/:imageId', authenticate, imageController.getImageById);
app.put('/update-image/:imageId', authenticate, imageController.updateImage);
app.put('/bulk-update-images', authenticate, imageController.bulkUpdateImages);
app.delete('/delete-image/:imageId', authenticate, requireAdmin, imageController.deleteImage);
app.delete('/bulk-delete-images', authenticate, requireAdmin, imageController.bulkDeleteImages);

// ---------- Dashboard routes ----------
app.get('/dashboard/stats', authenticate, dashboardController.getStats);
app.get('/dashboard/revenue-summary', authenticate, requireAdmin, dashboardController.getRevenueSummary);
app.get('/dashboard/project-status-counts', authenticate, dashboardController.getProjectStatusCounts);
app.get('/dashboard/event-status-counts', authenticate, dashboardController.getEventStatusCounts);

// ---------- Search routes ----------
app.get('/search', authenticate, searchController.globalSearch);

// ---------- Users routes ----------
app.post('/create-user', authenticate, requireAdmin, userController.createUser);
app.get('/get-all-users', authenticate, requireAdmin, userController.getAllUsers);
app.get('/get-user/:userId', authenticate, userController.getUserById);
app.put('/update-user/:userId', authenticate, userController.updateUser);
app.delete('/delete-user/:userId', authenticate, requireAdmin, userController.deleteUser);
app.post('/change-password', authenticate, userController.changePassword);
app.post('/admin-reset-password/:userId', authenticate, requireAdmin, userController.adminResetPassword);

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
