import dotenv from 'dotenv';
import path from 'path';

// Load .env from the services directory
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('=== ENV CHECK ===');
console.log('Current directory:', __dirname);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET preview:', process.env.JWT_SECRET?.substring(0, 20));
console.log('=================');

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import testController from './controllers/testController';
import roleController from './controllers/roleController';
import authController from './controllers/authController';
import profileController from './controllers/profileController';
import teamController from './controllers/teamController';
import eventController from './controllers/eventController';
import eventDeliveryStatusController from './controllers/eventDeliveryStatusController';
import projectDeliveryStatusController from './controllers/projectDeliveryStatusController';
import imageStatusController from './controllers/imageStatusController';
import equipmentController from './controllers/equipmentController';
import projectController from './controllers/projectController';
import clientEventController from './controllers/clientEventController';
import eventExpenseController from './controllers/eventExpenseController';
import projectFinanceController from './controllers/projectFinanceController';
import teamFinanceController from './controllers/teamFinanceController';
import imageController from './controllers/imageController';
import dashboardController from './controllers/dashboardController';
import './models/notification';
import dashboardStatsController from './controllers/dashboardStatsController';
import financeStatsController from './controllers/financeStatsController';
import searchController from './controllers/searchController';
import userController from './controllers/userController';
import albumPdfController from './controllers/albumPdfController';
import organizationController from './controllers/organizationController';
import * as proposalController from './controllers/proposalController';
import * as superAdminController from './controllers/superAdminController';
import * as storageController from './controllers/storageController';
import { NotificationController } from './controllers/notificationController';
import { authenticate } from './middleware/auth';
import requireAdmin from './middleware/requireAdmin';
import { requireSuperAdmin } from './middleware/requireSuperAdmin';
import { upload, uploadPdf } from './middleware/upload';
import { startEventStatusUpdater } from './jobs/eventStatusUpdater';
import { startDueDateChecker } from './jobs/dueDateChecker';
import { initializeSocketIO } from './services/socketService';
import http from 'http';

const app = express();
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Proposal-Pin', 'X-Portal-Pin']
}));

// ---------- Miscellaneous routes ----------
app.get('/test', testController.getTest);

// ---------- Due Date Check routes ----------
app.post('/check-due-dates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { triggerDueDateCheck } = await import('./jobs/dueDateChecker');
    await triggerDueDateCheck();
    res.json({ message: 'Due date check completed successfully' });
  } catch (error) {
    console.error('Error triggering due date check:', error);
    res.status(500).json({ message: 'Failed to check due dates' });
  }
});

// ---------- Auth routes ----------
app.post('/login', authController.login);
app.post('/logout', authController.logout);
app.get('/verify-token', authController.verifyToken);
app.get('/auth/me', authenticate, authController.getCurrentUser);
app.post('/refresh-token', authController.refreshToken);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password', authController.resetPassword);
app.post('/setup-password', authController.setupPassword);
app.post('/send-activation-link', authenticate, authController.sendActivationLink);
app.post('/resend-activation-link', authController.resendActivationLink);

// ---------- Roles routes ----------
app.post('/create-role', authenticate, roleController.createRole);
app.get('/get-all-roles', authenticate, roleController.getRoles);
app.get('/get-roles', authenticate, roleController.getRoles);
app.put('/update-role/:roleId', authenticate, requireAdmin, roleController.updateRole);
app.delete('/delete-role/:roleId', authenticate, requireAdmin, roleController.deleteRole);

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
app.get('/get-all-events', authenticate, eventController.getAllEvents);
app.get('/get-event/:eventId', authenticate, eventController.getEventById);
app.put('/update-event/:eventId', authenticate, requireAdmin, eventController.updateEvent);
app.delete('/delete-event/:eventId', authenticate, requireAdmin, eventController.deleteEvent);

// ---------- Event Delivery Status routes ----------
app.post('/create-event-delivery-status', authenticate, requireAdmin, eventDeliveryStatusController.createEventDeliveryStatus);
app.get('/get-all-event-delivery-statuses', authenticate, eventDeliveryStatusController.getAllEventDeliveryStatuses);
app.get('/get-event-delivery-status/:statusId', authenticate, eventDeliveryStatusController.getEventDeliveryStatusById);
app.put('/update-event-delivery-status/:statusId', authenticate, requireAdmin, eventDeliveryStatusController.updateEventDeliveryStatus);
app.put('/bulk-update-event-delivery-status-steps', authenticate, requireAdmin, eventDeliveryStatusController.bulkUpdateSteps);
app.delete('/delete-event-delivery-status/:statusId', authenticate, requireAdmin, eventDeliveryStatusController.deleteEventDeliveryStatus);

// ---------- Image Status routes ----------
app.get('/get-all-image-statuses', authenticate, imageStatusController.getAllImageStatuses);

// ---------- Equipment routes ----------
app.post('/create-equipment', authenticate, requireAdmin, (req, res, next) => {
  console.log('=== EQUIPMENT ROUTE HIT ===');
  console.log('Body keys:', Object.keys(req.body));
  console.log('Has images:', !!req.body.images);
  console.log('Images length:', req.body.images?.length);
  next();
}, equipmentController.createEquipment);
app.get('/get-all-equipment', authenticate, requireAdmin, equipmentController.getAllEquipment);
app.get('/get-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.getEquipmentById);
app.put('/update-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.updateEquipment);
app.delete('/delete-equipment/:equipmentId', authenticate, requireAdmin, equipmentController.deleteEquipment);

// ---------- Project routes ----------
app.post('/projects', authenticate, requireAdmin, projectController.createProjectWithDetails);
app.post('/create-project', authenticate, requireAdmin, projectController.createProject);
app.get('/get-all-projects', authenticate, projectController.getAllProjects);
app.get('/get-project/:projectId', authenticate, projectController.getProjectById);
app.put('/update-project/:projectId', authenticate, requireAdmin, projectController.updateProject);
app.put('/update-project-with-details/:projectId', authenticate, requireAdmin, projectController.updateProjectWithDetails);
app.delete('/delete-project/:projectId', authenticate, requireAdmin, projectController.deleteProject);

// ---------- Client Event routes ----------
app.post('/create-client-event', authenticate, requireAdmin, clientEventController.createClientEvent);
app.get('/get-all-client-events', authenticate, clientEventController.getAllClientEvents);
app.get('/get-client-event/:clientEventId', authenticate, clientEventController.getClientEventById);
app.get('/get-client-events-by-project/:projectId', authenticate, clientEventController.getClientEventsByProject);
app.put('/update-client-event/:clientEventId', authenticate, clientEventController.updateClientEvent);
app.delete('/delete-client-event/:clientEventId', authenticate, requireAdmin, clientEventController.deleteClientEvent);
app.post('/upload-album-pdf', authenticate, uploadPdf.single('albumPdf'), clientEventController.uploadAlbumPdf);
app.post('/upload-album-pdf-batch', authenticate, uploadPdf.array('albumPdfs', 20), clientEventController.uploadAlbumPdfBatch);

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
app.post('/add-project-finance-transaction/:projectId', authenticate, requireAdmin, projectFinanceController.addTransaction);

// ---------- Team Finance routes ----------
app.post('/create-team-finance', authenticate, requireAdmin, teamFinanceController.createTeamFinance);
app.get('/get-all-team-finances', authenticate, teamFinanceController.getAllTeamFinances);
app.get('/get-team-finance/:financeId', authenticate, teamFinanceController.getTeamFinanceById);
app.get('/get-team-finance-by-member/:memberId', authenticate, teamFinanceController.getTeamFinanceByMember);
app.put('/update-team-finance/:financeId', authenticate, requireAdmin, teamFinanceController.updateTeamFinance);
app.delete('/delete-team-finance/:financeId', authenticate, requireAdmin, teamFinanceController.deleteTeamFinance);
app.post('/add-team-salary-transaction/:memberId', authenticate, requireAdmin, teamFinanceController.addSalaryTransaction);

// ---------- Image routes ----------
app.post('/create-image', authenticate, requireAdmin, imageController.createImage);
app.post('/bulk-create-images', authenticate, requireAdmin, imageController.bulkCreateImages);
app.post('/upload-batch-images', authenticate, upload.array('images', 500), imageController.uploadBatchImages);
app.post('/reupload-images', authenticate, upload.array('images', 500), imageController.reuploadImages);
app.post('/reorder-images', authenticate, imageController.reorderImages);
app.put('/approve-images', authenticate, requireAdmin, imageController.approveImages);
app.post('/download-selected-images', authenticate, imageController.downloadSelectedImagesZip);
app.get('/download-event-images/:clientEventId', authenticate, imageController.downloadEventImagesZip);
app.get('/get-all-images', authenticate, imageController.getAllImages);
app.get('/get-images-by-client-event/:clientEventId', authenticate, imageController.getImagesByClientEvent);
app.get('/get-images-by-project/:projectId', authenticate, imageController.getImagesByProject);
app.get('/get-image/:imageId', authenticate, imageController.getImageById);
app.get('/get-image-properties/:imageId', authenticate, imageController.getImageProperties);
app.put('/update-image/:imageId', authenticate, imageController.updateImage);
app.put('/bulk-update-images', authenticate, imageController.bulkUpdateImages);
app.delete('/delete-image/:imageId', authenticate, requireAdmin, imageController.deleteImage);
app.delete('/bulk-delete-images', authenticate, requireAdmin, imageController.bulkDeleteImages);app.post('/mark-images-client-selected', authenticate, imageController.markImagesAsClientSelected);
app.post('/finalize-client-selection', authenticate, imageController.finalizeClientSelection);
app.post('/notify-images-uploaded', authenticate, imageController.notifyImagesUploaded);
app.post('/notify-reedit-requested', authenticate, imageController.notifyReEditRequested);
app.post('/approve-album-design', authenticate, clientEventController.approveAlbumDesign);
// ---------- Album PDF routes ----------
app.post('/create-album-pdf', authenticate, albumPdfController.createAlbumPdf);
app.post('/check-existing-album-pdf', authenticate, albumPdfController.checkExistingAlbumPdf);
app.get('/get-all-album-pdfs', authenticate, albumPdfController.getAllAlbumPdfs);
app.get('/get-album-pdfs-by-project/:projectId', authenticate, albumPdfController.getAlbumPdfsByProject);
app.get('/get-album-pdfs-by-event/:clientEventId', authenticate, albumPdfController.getAlbumPdfsByEventId);
app.get('/get-album-pdf/:albumId', authenticate, albumPdfController.getAlbumPdfById);
app.patch('/update-album-pdf-status/:albumId', authenticate, albumPdfController.updateAlbumPdfStatus);
app.delete('/delete-album-pdf/:albumId', authenticate, requireAdmin, albumPdfController.deleteAlbumPdf);

// ---------- Dashboard routes ----------
app.get('/dashboard/stats', authenticate, dashboardController.getStats);
app.get('/dashboard/comparison-stats', authenticate, dashboardStatsController.getDashboardStats);
app.get('/dashboard/upcoming-events', authenticate, dashboardStatsController.getUpcomingEvents);
app.get('/dashboard/team-assignments', authenticate, dashboardStatsController.getTeamAssignments);
app.get('/dashboard/monthly-sales', authenticate, dashboardStatsController.getMonthlySales);
app.get('/dashboard/revenue-summary', authenticate, requireAdmin, dashboardController.getRevenueSummary);
app.get('/dashboard/project-status-counts', authenticate, dashboardController.getProjectStatusCounts);
app.get('/dashboard/event-status-counts', authenticate, dashboardController.getEventStatusCounts);

// ---------- Storage & Subscription routes ----------
app.get('/storage/stats/:tenantId', authenticate, storageController.getStorageStats);
app.post('/storage/refresh/:tenantId', authenticate, requireAdmin, storageController.refreshStorageUsage);
app.post('/storage/check-upload', authenticate, storageController.checkUploadCapacity);
app.get('/storage/plans', authenticate, storageController.getSubscriptionPlans);
app.put('/storage/subscription/:tenantId', authenticate, requireAdmin, storageController.updateTenantSubscription);

// ---------- Finance Stats routes ----------
app.get('/finance-stats', authenticate, financeStatsController.getFinanceStats);

// ---------- Search routes ----------
app.get('/search', authenticate, searchController.globalSearch);

// ---------- Organization routes ----------
app.get('/get-organization', authenticate, organizationController.getOrganization);
app.post('/create-organization', authenticate, requireAdmin, organizationController.createOrganization);
app.put('/update-organization', authenticate, requireAdmin, organizationController.updateOrganization);
app.delete('/delete-organization', authenticate, requireAdmin, organizationController.deleteOrganization);

// ---------- Proposal routes ----------
app.post('/create-proposal', authenticate, requireAdmin, proposalController.createProposal);
app.get('/get-all-proposals', authenticate, proposalController.getAllProposals);
app.get('/get-proposal/:id', authenticate, proposalController.getProposalById);
app.put('/update-proposal/:id', authenticate, requireAdmin, proposalController.updateProposal);
app.delete('/delete-proposal/:id', authenticate, requireAdmin, proposalController.deleteProposal);
app.post('/verify-proposal-pin/:accessCode', proposalController.verifyProposalPin);
app.post('/customer-portal/toggle-image-selection', proposalController.toggleImageSelection);
app.post('/customer-portal/mark-selection-done', proposalController.markEventSelectionDone);
app.post('/customer-portal/approve-album', proposalController.approveAlbum);
app.post('/customer-portal/notify-album-view', proposalController.notifyAlbumView);
app.post('/customer-portal/:accessCode', proposalController.getCustomerPortalData);
app.patch('/proposals/:id/status', proposalController.updateProposalStatus);
app.post('/send-proposal/:id', authenticate, requireAdmin, proposalController.sendProposal);

// ---------- Users routes ----------
app.post('/create-user', authenticate, requireAdmin, userController.createUser);
app.get('/get-all-users', authenticate, requireAdmin, userController.getAllUsers);
app.get('/get-user/:userId', authenticate, userController.getUserById);
app.put('/update-user/:userId', authenticate, userController.updateUser);
app.delete('/delete-user/:userId', authenticate, requireAdmin, userController.deleteUser);
app.patch('/toggle-user-active/:userId', authenticate, requireAdmin, userController.toggleUserActive);
app.post('/change-password', authenticate, userController.changePassword);
app.post('/admin-reset-password/:userId', authenticate, requireAdmin, userController.adminResetPassword);

// ---------- Notification routes ----------
app.get('/notifications', authenticate, NotificationController.getNotifications);
app.get('/notifications/unread-count', authenticate, NotificationController.getUnreadCount);
app.post('/notifications/:id/read', authenticate, NotificationController.markAsRead);
app.post('/notifications/read-all', authenticate, NotificationController.markAllAsRead);
app.delete('/notifications/:id', authenticate, NotificationController.deleteNotification);
app.post('/notifications/test', authenticate, NotificationController.createTestNotification);

// ---------- Super Admin routes ----------
app.get('/super-admin/tenants', authenticate, requireSuperAdmin, superAdminController.getAllTenants);
app.get('/super-admin/tenants/:tenantId', authenticate, requireSuperAdmin, superAdminController.getTenantById);
app.post('/super-admin/tenants', authenticate, requireSuperAdmin, superAdminController.createTenant);
app.put('/super-admin/tenants/:tenantId', authenticate, requireSuperAdmin, superAdminController.updateTenant);
app.patch('/super-admin/tenants/:tenantId', authenticate, requireSuperAdmin, superAdminController.toggleTenantStatus);
app.delete('/super-admin/tenants/:tenantId', authenticate, requireSuperAdmin, superAdminController.deleteTenant);

// ---------- Static files ----------
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

console.log("MONGO_URI:", process.env.MONGO_URI);

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
initializeSocketIO(server);

mongoose
  .connect(MONGO_URI, { dbName: 'flomingo_db' })
  .then(() => {
    console.log('Connected to DB:', mongoose.connection.name);
    
    // Start cron jobs
    startEventStatusUpdater();
    startDueDateChecker();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Socket.io enabled for real-time notifications');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
