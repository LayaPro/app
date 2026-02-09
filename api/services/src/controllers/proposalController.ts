import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import Proposal from '../models/proposal';
import Organization from '../models/organization';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Event from '../models/event';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Image from '../models/image';
import ImageStatus from '../models/imageStatus';
import AlbumPdf from '../models/albumPdf';
import Team from '../models/team';
import { AuthRequest } from '../middleware/auth';
import { sendProposalEmail } from '../services/emailService';
import { NotificationUtils } from '../services/notificationUtils';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('ProposalController');

export const createProposal = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating proposal`, { tenantId, userId });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      projectName,
      weddingDate,
      venue,
      events,
      termsOfService,
      paymentTerms,
      deliverables,
      totalAmount,
      validUntil
    } = req.body;
    

    // Validation
    if (!clientName || !clientEmail || !projectName) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Client name, email, and project name are required' });
    }

    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Invalid total amount`, { tenantId, totalAmount });
      return res.status(400).json({ message: 'Total amount must be greater than 0' });
    }

    if (!events || events.length === 0) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] No events provided`, { tenantId });
      return res.status(400).json({ message: 'At least one event is required' });
    }

    // Generate unique access code from project name
    const generateAccessCode = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single
    };

    let accessCode = generateAccessCode(projectName);
    let codeExists = await Proposal.findOne({ accessCode }).session(session);
    let suffix = 1;

    // Ensure uniqueness by adding suffix if needed
    while (codeExists) {
      accessCode = `${generateAccessCode(projectName)}-${suffix}`;
      codeExists = await Proposal.findOne({ accessCode }).session(session);
      suffix++;
    }

    // Generate 4-digit PIN
    const accessPin = Math.floor(1000 + Math.random() * 9000).toString();

    const proposalId = `proposal_${nanoid()}`;
    
    logger.debug(`[${requestId}] Creating proposal with accessCode`, { 
      tenantId, 
      proposalId, 
      accessCode,
      clientEmail,
      projectName 
    });
    
    const proposal = await Proposal.create([{
      proposalId,
      tenantId,
      clientName,
      clientEmail,
      clientPhone,
      projectName,
      weddingDate,
      venue,
      events,
      termsOfService,
      paymentTerms,
      deliverables: deliverables || [],
      totalAmount,
      accessCode,
      accessPin,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      status: 'draft',
      createdBy: userId
    }], { session });

    logger.info(`[${requestId}] Proposal created successfully`, { 
      tenantId, 
      proposalId, 
      clientName,
      projectName,
      totalAmount 
    });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Proposal',
      entityId: proposalId,
      tenantId,
      performedBy: userId || 'System',
      changes: {
        clientName,
        clientEmail,
        projectName,
        totalAmount,
        status: 'draft'
      },
      metadata: {
        accessCode,
        eventsCount: events.length,
        validUntil
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Proposal created successfully',
      proposal: proposal[0]
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`[${requestId}] Error creating proposal`, { 
      tenantId, 
      error: err.message,
      stack: err.stack 
    });
    console.error(`[${requestId}] Full error:`, err);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  }
};

export const getAllProposals = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all proposals`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const { status, clientEmail, search } = req.query;

    // Build query
    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (clientEmail) {
      query.clientEmail = clientEmail;
    }

    let proposals;
    
    if (search && typeof search === 'string') {
      // Text search on client name and project name
      proposals = await Proposal.find({
        ...query,
        $text: { $search: search }
      }).sort({ createdAt: -1 });
    } else {
      proposals = await Proposal.find(query).sort({ createdAt: -1 });
    }

    logger.info(`[${requestId}] Proposals retrieved`, { tenantId, count: proposals.length });

    return res.status(200).json({
      proposals,
      count: proposals.length
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching proposals`, { 
      tenantId, 
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProposalById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching proposal`, { tenantId, proposalId: id });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, proposalId: id });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const proposal = await Proposal.findOne({ proposalId: id, tenantId });

    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    logger.info(`[${requestId}] Proposal retrieved`, { tenantId, proposalId: id });

    return res.status(200).json({ proposal });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching proposal`, { 
      tenantId, 
      proposalId: id,
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProposal = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating proposal`, { tenantId, proposalId: id });

  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      projectName,
      weddingDate,
      venue,
      events,
      termsOfService,
      paymentTerms,
      deliverables,
      totalAmount,
      validUntil,
      status
    } = req.body;

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, proposalId: id });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const proposal = await Proposal.findOne({ proposalId: id, tenantId });

    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const changes: any = {};
    const oldStatus = proposal.status;

    // Update fields
    if (clientName) {
      changes.clientName = { before: proposal.clientName, after: clientName };
      proposal.clientName = clientName;
    }
    if (clientEmail) {
      changes.clientEmail = { before: proposal.clientEmail, after: clientEmail };
      proposal.clientEmail = clientEmail;
    }
    if (clientPhone !== undefined) {
      changes.clientPhone = { before: proposal.clientPhone, after: clientPhone };
      proposal.clientPhone = clientPhone;
    }
    if (projectName) {
      changes.projectName = { before: proposal.projectName, after: projectName };
      proposal.projectName = projectName;
    }
    if (weddingDate !== undefined) proposal.weddingDate = weddingDate;
    if (venue !== undefined) proposal.venue = venue;
    if (events) proposal.events = events;
    if (termsOfService !== undefined) proposal.termsOfService = termsOfService;
    if (paymentTerms !== undefined) proposal.paymentTerms = paymentTerms;
    if (deliverables) proposal.deliverables = deliverables;
    if (totalAmount) {
      changes.totalAmount = { before: proposal.totalAmount, after: totalAmount };
      proposal.totalAmount = totalAmount;
    }
    if (validUntil) proposal.validUntil = new Date(validUntil);
    if (status) {
      changes.status = { before: proposal.status, after: status };
      const oldStatus = proposal.status;
      proposal.status = status;
      
      // Update status timestamps
      if (status === 'sent' && !proposal.sentAt) {
        proposal.sentAt = new Date();
      } else if (status === 'accepted' && !proposal.acceptedAt) {
        proposal.acceptedAt = new Date();
        
        // Send notification to admins when proposal is accepted
        try {
          await NotificationUtils.notifyProposalAccepted(
            tenantId!,
            id,
            proposal.projectName,
            proposal.clientName
          );
          logger.info(`[${requestId}] Sent proposal accepted notification`, { 
            tenantId,
            proposalId: id
          });
        } catch (notifError: any) {
          logger.error(`[${requestId}] Failed to send proposal accepted notification`, {
            error: notifError.message
          });
          // Don't fail the request if notification fails
        }
      } else if (status === 'rejected' && !proposal.rejectedAt) {
        proposal.rejectedAt = new Date();
      }
    }

    proposal.updatedBy = userId;
    await proposal.save();

    logger.info(`[${requestId}] Proposal updated`, { 
      tenantId, 
      proposalId: id,
      statusChanged: oldStatus !== proposal.status
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Proposal',
      entityId: id,
      tenantId,
      performedBy: userId || 'System',
      changes,
      metadata: {
        oldStatus,
        newStatus: proposal.status
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Proposal updated successfully',
      proposal
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating proposal`, { 
      tenantId, 
      proposalId: id,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProposal = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting proposal`, { tenantId, proposalId: id });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, proposalId: id });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // First find to get data for audit log
    const proposal = await Proposal.findOne({ proposalId: id, tenantId });

    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Store data before deletion
    const proposalData = {
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      projectName: proposal.projectName,
      status: proposal.status,
      totalAmount: proposal.totalAmount
    };

    // Delete it
    await Proposal.deleteOne({ proposalId: id, tenantId });

    logger.info(`[${requestId}] Proposal deleted`, { 
      tenantId, 
      proposalId: id,
      clientName: proposalData.clientName,
      projectName: proposalData.projectName 
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'Proposal',
      entityId: id,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: proposalData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Proposal deleted successfully'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting proposal`, { 
      tenantId, 
      proposalId: id,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyProposalPin = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { accessCode } = req.params;
  const { pin } = req.body;

  logger.info(`[${requestId}] Verifying proposal PIN`, { accessCode });

  try {
    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`, { accessCode });
      return res.status(400).json({ message: 'PIN is required' });
    }

    const proposal = await Proposal.findOne({ accessCode });

    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { accessCode });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.accessPin !== pin) {
      logger.warn(`[${requestId}] Invalid PIN`, { 
        tenantId: proposal.tenantId,
        accessCode 
      });
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Track first view and send notification to admin
    const isFirstView = !proposal.firstViewedAt;
    if (isFirstView) {
      proposal.firstViewedAt = new Date();
      await proposal.save();
      
      // Send notification to admins
      try {
        await NotificationUtils.notifyProposalViewed(
          proposal.tenantId,
          proposal.proposalId,
          proposal.projectName,
          proposal.clientName
        );
        logger.info(`[${requestId}] Sent proposal viewed notification`, { 
          tenantId: proposal.tenantId,
          proposalId: proposal.proposalId
        });
      } catch (notifError: any) {
        logger.error(`[${requestId}] Failed to send proposal viewed notification`, {
          error: notifError.message
        });
        // Don't fail the request if notification fails
      }
    }

    // Fetch organization data
    const organization = await Organization.findOne({ tenantId: proposal.tenantId });

    // Return proposal data without the PIN
    const proposalData = proposal.toObject();
    const { accessPin, ...proposalWithoutPin } = proposalData;

    logger.info(`[${requestId}] PIN verified successfully`, { 
      tenantId: proposal.tenantId,
      proposalId: proposal.proposalId,
      accessCode 
    });

    return res.status(200).json({
      message: 'PIN verified successfully',
      proposal: proposalWithoutPin,
      organization: organization ? {
        companyName: organization.companyName,
        tagline: organization.tagline,
        aboutUs: organization.aboutUs,
        addOns: organization.addOns,
      } : null
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error verifying PIN`, { 
      accessCode,
      error: err.message 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating proposal status`, { tenantId, proposalId: id, status });

  try {
    // Validate status
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'project_created'];
    if (!validStatuses.includes(status)) {
      logger.warn(`[${requestId}] Invalid status`, { tenantId, proposalId: id, status });
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Find and update proposal
    const proposal = await Proposal.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    logger.info(`[${requestId}] Proposal status updated`, { 
      tenantId: proposal.tenantId,
      proposalId: proposal.proposalId,
      newStatus: status 
    });

    // Audit log for status change
    logAudit({
      action: auditEvents.TENANT_STATUS_CHANGED,
      entityType: 'Proposal',
      entityId: proposal.proposalId,
      tenantId: proposal.tenantId,
      performedBy: userId || 'System',
      changes: {
        status: { after: status }
      },
      metadata: {
        clientName: proposal.clientName,
        projectName: proposal.projectName
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Proposal status updated successfully',
      proposal
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating proposal status`, { 
      tenantId,
      proposalId: id,
      status,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendProposal = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Sending proposal`, { tenantId, proposalId: id });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, proposalId: id });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get proposal by proposalId
    const proposal = await Proposal.findOne({ proposalId: id, tenantId });
    if (!proposal) {
      logger.warn(`[${requestId}] Proposal not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Get organization details
    const organization = await Organization.findOne({ tenantId });
    if (!organization) {
      logger.warn(`[${requestId}] Organization not found`, { tenantId, proposalId: id });
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Construct proposal URL
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
    const proposalUrl = `${customerAppUrl}/proposal/${proposal.accessCode}`;

    logger.debug(`[${requestId}] Sending proposal email`, { 
      tenantId,
      proposalId: id,
      clientEmail: proposal.clientEmail,
      proposalUrl 
    });

    // Send email
    await sendProposalEmail(
      proposal.clientEmail,
      proposal.clientName,
      organization.companyName || 'Our Studio',
      proposalUrl,
      proposal.accessPin,
      proposal.projectName
    );

    // Update proposal status to 'sent'
    proposal.status = 'sent';
    proposal.updatedAt = new Date();
    await proposal.save();

    logger.info(`[${requestId}] Proposal sent successfully`, { 
      tenantId,
      proposalId: id,
      clientEmail: proposal.clientEmail 
    });

    return res.status(200).json({
      message: 'Proposal sent successfully',
      proposal
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error sending proposal`, { 
      tenantId,
      proposalId: id,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

/**
 * Get customer portal data based on access code
 * Returns what the customer should see based on their progress:
 * - Proposal stage: Show quotation (can accept)
 * - Accepted stage: Show "Quotation Accepted" until project is created
 * - Project stage: Show timeline with events
 */
export const getCustomerPortalData = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { accessCode } = req.params;
  const { pin } = req.body;

  logger.info(`[${requestId}] Fetching customer portal data`, { accessCode });

  try {
    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`, { accessCode });
      return res.status(400).json({ message: 'PIN is required' });
    }

    // Find proposal
    const proposal = await Proposal.findOne({ accessCode });

    if (!proposal) {
      logger.warn(`[${requestId}] Portal not found`, { accessCode });
      return res.status(404).json({ message: 'Portal not found' });
    }

    if (proposal.accessPin !== pin) {
      logger.warn(`[${requestId}] Invalid PIN`, { 
        tenantId: proposal.tenantId,
        accessCode 
      });
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Fetch organization data
    const organization = await Organization.findOne({ tenantId: proposal.tenantId });

    // Remove sensitive data from proposal
    const proposalData = proposal.toObject();
    const { accessPin, ...proposalWithoutPin } = proposalData;

    // Determine portal stage based on proposal status
    let portalStage: 'proposal' | 'accepted' | 'project' | 'gallery';
    let projectData = null;
    let eventsData = null;
    let galleryData = null;

    if (proposal.status === 'project_created') {
      // Default to project stage (timeline)
      portalStage = 'project';

      // Find the project created from this proposal
      const project = await Project.findOne({ 
        proposalId: proposal.proposalId,
        tenantId: proposal.tenantId 
      });

      if (project) {
        // Check if any event/album has been published or is in any status after publishing
        // Published and onwards: PUBLISHED, CLIENT_SELECTION_DONE, ALBUM_DESIGN_ONGOING, 
        // ALBUM_DESIGN_COMPLETE, ALBUM_PRINTING, DELIVERY
        const galleryStatuses = await EventDeliveryStatus.find({ 
          statusCode: { 
            $in: [
              'PUBLISHED', 
              'CLIENT_SELECTION_DONE', 
              'ALBUM_DESIGN_ONGOING',
              'ALBUM_DESIGN_COMPLETE',
              'ALBUM_PRINTING',
              'DELIVERY'
            ] 
          },
          tenantId: { $in: [proposal.tenantId, -1] }
        });

        const galleryStatusIds = galleryStatuses.map(s => s.statusId);

        // Check if any event has a gallery-ready status
        const hasPublishedAlbum = await ClientEvent.exists({ 
          projectId: project.projectId,
          eventDeliveryStatusId: { $in: galleryStatusIds }
        });


        if (hasPublishedAlbum) {
          // Show gallery view with published album images
          portalStage = 'gallery';

          // Fetch ALL events for this project
          const allEvents = await ClientEvent.find({
            projectId: project.projectId
          }).sort({ fromDatetime: 1 });

          // Create mapping: clientEventId -> eventId
          const eventMap = new Map(allEvents.map(e => [e.clientEventId, e.eventId]));

          // Fetch ALL images for this project
          const allEventImages = await Image.find({
            projectId: project.projectId,
            uploadStatus: 'completed'
          })
          .sort({ sortOrder: 1 });


          // Add eventId and selectedByClient to each image
          const imagesWithEventId = allEventImages.map(img => ({
            imageId: img.imageId,
            thumbnailUrl: img.thumbnailUrl,
            compressedUrl: img.compressedUrl,
            originalUrl: img.originalUrl,
            eventId: eventMap.get(img.clientEventId), // Map clientEventId -> eventId
            selectedByClient: img.selectedByClient || false
          }));

          galleryData = {
            projectName: project.projectName,
            coverPhoto: project.coverPhoto || project.displayPic,
            mobileCoverUrl: project.mobileCoverUrl,
            tabletCoverUrl: project.tabletCoverUrl,
            desktopCoverUrl: project.desktopCoverUrl,
            clientName: proposal.clientName,
            albumImages: imagesWithEventId
          };

          projectData = {
            projectId: project.projectId,
            projectName: project.projectName,
            displayPic: project.displayPic,
            coverPhoto: project.coverPhoto,
          };
        } else {
          // Show timeline view
          portalStage = 'project';
        }

        // Fetch project events (for timeline view or reference)
        const events = await ClientEvent.find({ 
          projectId: project.projectId,
          tenantId: proposal.tenantId 
        }).sort({ fromDatetime: 1 }); // Sort chronologically

        // Fetch event names from Event master data (include global events)
        const eventIds = events.map(e => e.eventId);
        const eventMasterData = await Event.find({ 
          eventId: { $in: eventIds },
          tenantId: { $in: [proposal.tenantId, -1] }
        });
        
        const eventNameMap = new Map(
          eventMasterData.map(e => [e.eventId, e.eventDesc || e.eventCode])
        );

        // Fetch event delivery status details (include global statuses)
        const statusIds = events.map(e => e.eventDeliveryStatusId).filter(Boolean);
        const statusData = await EventDeliveryStatus.find({
          statusId: { $in: statusIds },
          tenantId: { $in: [proposal.tenantId, -1] }
        });

        const statusMap = new Map(
          statusData.map(s => [s.statusId, { 
            statusCode: s.statusCode, 
            statusDescription: s.statusDescription,
            statusCustomerNote: s.statusCustomerNote 
          }])
        );

        if (!projectData) {
          projectData = {
            projectId: project.projectId,
            projectName: project.projectName,
            displayPic: project.displayPic,
            coverPhoto: project.coverPhoto,
          };
        }

        // Fetch album PDFs for this project
        const albumPdfs = await AlbumPdf.find({ projectId: project.projectId });
        const albumPdfMap = new Map<string, string>();
        albumPdfs.forEach(pdf => {
          pdf.eventIds.forEach(eventId => {
            albumPdfMap.set(eventId, pdf.albumPdfUrl);
          });
        });

        eventsData = events.map(event => {
          const fromDate = event.fromDatetime ? new Date(event.fromDatetime).toISOString().split('T')[0] : undefined;
          const toDate = event.toDatetime ? new Date(event.toDatetime).toISOString().split('T')[0] : undefined;
          const fromTime = event.fromDatetime ? new Date(event.fromDatetime).toTimeString().slice(0, 5) : undefined;
          const toTime = event.toDatetime ? new Date(event.toDatetime).toTimeString().slice(0, 5) : undefined;

          const statusInfo = event.eventDeliveryStatusId ? statusMap.get(event.eventDeliveryStatusId) : null;

          return {
            eventId: event.eventId,
            clientEventId: event.clientEventId,
            eventName: eventNameMap.get(event.eventId) || 'Event',
            fromDate,
            toDate,
            fromTime,
            toTime,
            venue: event.venue,
            venueLocation: event.venueMapUrl,
            eventDeliveryStatusId: event.eventDeliveryStatusId,
            statusCode: statusInfo?.statusCode,
            statusDescription: statusInfo?.statusDescription,
            statusCustomerNote: statusInfo?.statusCustomerNote,
            albumPdfUrl: albumPdfMap.get(event.clientEventId) || null,
          };
        });
      }
    } else if (proposal.status === 'accepted') {
      // Proposal accepted but project not created yet
      portalStage = 'accepted';
    } else {
      // Draft or sent - show proposal for review/acceptance
      portalStage = 'proposal';
    }

    logger.info(`[${requestId}] Customer portal data retrieved`, { 
      tenantId: proposal.tenantId,
      proposalId: proposal.proposalId,
      accessCode,
      portalStage 
    });

    return res.status(200).json({
      message: 'Portal data retrieved successfully',
      portalStage,
      proposal: proposalWithoutPin,
      project: projectData,
      events: eventsData,
      gallery: galleryData,
      organization: organization ? {
        companyName: organization.companyName,
        tagline: organization.tagline,
        aboutUs: organization.aboutUs,
        addOns: organization.addOns,
      } : null
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching customer portal data`, { 
      accessCode,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle image selection for customer portal (PIN authenticated)
export const toggleImageSelection = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds, selected = true } = req.body;
  const pin = req.headers['x-portal-pin'] as string;

  logger.info(`[${requestId}] Toggling image selection`, { 
    imageCount: imageIds?.length,
    selected 
  });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] Invalid image IDs`);
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`);
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN is valid by finding a proposal with this PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      logger.warn(`[${requestId}] Invalid PIN`);
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get tenant ID from the proposal's project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { 
        tenantId: proposal.tenantId,
        proposalId: proposal.proposalId 
      });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get CLIENT_SELECTED status ID
    const clientSelectedStatus = await ImageStatus.findOne({ 
      statusCode: 'CLIENT_SELECTED',
      tenantId: { $in: [project.tenantId, -1] }
    });

    if (!clientSelectedStatus && selected) {
      logger.warn(`[${requestId}] CLIENT_SELECTED status not found`, { 
        tenantId: project.tenantId 
      });
      return res.status(404).json({ message: 'CLIENT_SELECTED status not found' });
    }

    // Get APPROVED status ID for deselection
    const approvedStatus = await ImageStatus.findOne({ 
      statusCode: 'APPROVED',
      tenantId: { $in: [project.tenantId, -1] }
    });

    if (!approvedStatus && !selected) {
      logger.warn(`[${requestId}] APPROVED status not found`, { 
        tenantId: project.tenantId 
      });
      return res.status(404).json({ message: 'APPROVED status not found' });
    }

    // Update images with both selectedByClient flag and imageStatusId
    const updateData: any = { selectedByClient: selected };
    
    // If selecting, set status to CLIENT_SELECTED
    // If deselecting, set it back to APPROVED
    if (selected && clientSelectedStatus) {
      updateData.imageStatusId = clientSelectedStatus.statusId;
    } else if (!selected && approvedStatus) {
      updateData.imageStatusId = approvedStatus.statusId;
    }

    const result = await Image.updateMany(
      { imageId: { $in: imageIds }, tenantId: project.tenantId },
      { $set: updateData }
    );

    logger.info(`[${requestId}] Images ${selected ? 'selected' : 'deselected'}`, { 
      tenantId: project.tenantId,
      projectId: project.projectId,
      modifiedCount: result.modifiedCount 
    });

    // Send notifications to admins based on selection progress
    if (selected && result.modifiedCount > 0) {
      try {
        // Get the clientEventId from one of the selected images
        const sampleImage = await Image.findOne({ 
          imageId: { $in: imageIds }, 
          tenantId: project.tenantId 
        });
        
        if (!sampleImage || !sampleImage.clientEventId) {
          return res.status(200).json({
            message: `${result.modifiedCount} image(s) ${selected ? 'selected' : 'deselected'}`,
            modifiedCount: result.modifiedCount
          });
        }

        const clientEventId = sampleImage.clientEventId;

        // Get selection counts for THIS EVENT only
        const selectedCount = await Image.countDocuments({
          clientEventId: clientEventId,
          selectedByClient: true,
          tenantId: project.tenantId
        });

        const totalCount = await Image.countDocuments({
          clientEventId: clientEventId,
          tenantId: project.tenantId
        });

        const clientEvent = await ClientEvent.findOne({ clientEventId: clientEventId });
        const event = clientEvent ? await Event.findOne({ eventId: clientEvent.eventId }) : null;
        const eventName = event?.eventDesc || 'event';
        const clientName = proposal.clientName || 'Client';

        // Notify if this is the first time client is selecting
        if (selectedCount === result.modifiedCount) {
          await NotificationUtils.notifyClientSelectionStarted(
            project.tenantId,
            clientName,
            project.projectName,
            eventName
          );
        }

        // Notify when 50% threshold is reached
        const selectionPercentage = (selectedCount / totalCount) * 100;
        const previousCount = selectedCount - result.modifiedCount;
        const previousPercentage = (previousCount / totalCount) * 100;

        // Check if we just crossed the 50% threshold
        if (previousPercentage < 50 && selectionPercentage >= 50) {
          await NotificationUtils.notifyClientSelection50Percent(
            project.tenantId,
            clientName,
            project.projectName,
            eventName,
            selectedCount,
            totalCount
          );
        }

        // Check if we just reached 100% selection
        if (previousCount < totalCount && selectedCount === totalCount) {
          await NotificationUtils.notifyClientSelection100Percent(
            project.tenantId,
            clientName,
            project.projectName,
            eventName,
            totalCount
          );
        }
      } catch (notifError) {
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: `${result.modifiedCount} image(s) ${selected ? 'selected' : 'deselected'}`,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error toggling image selection`, { 
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markEventSelectionDone = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.body;
  const pin = req.headers['x-portal-pin'] as string;

  logger.info(`[${requestId}] Marking event selection done`, { eventId });

  try { 
    if (!eventId) {
      logger.warn(`[${requestId}] Event ID missing`);
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`);
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      logger.warn(`[${requestId}] Invalid PIN`);
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { 
        tenantId: proposal.tenantId,
        proposalId: proposal.proposalId 
      });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find CLIENT_SELECTION_DONE status
    const clientSelectionDoneStatus = await EventDeliveryStatus.findOne({
      statusCode: 'CLIENT_SELECTION_DONE',
      tenantId: { $in: [project.tenantId, -1] }
    });


    if (!clientSelectionDoneStatus) {
      logger.warn(`[${requestId}] CLIENT_SELECTION_DONE status not found`, { 
        tenantId: project.tenantId 
      });
      return res.status(404).json({ message: 'CLIENT_SELECTION_DONE status not found' });
    }

    // First check if the event exists
    const existingEvent = await ClientEvent.findOne({
      clientEventId: eventId,
      tenantId: project.tenantId
    });

    // Update event status
    const result = await ClientEvent.updateOne(
      { clientEventId: eventId, tenantId: project.tenantId },
      { $set: { eventDeliveryStatusId: clientSelectionDoneStatus.statusId } }
    );

    logger.info(`[${requestId}] Event marked as selection done`, { 
      tenantId: project.tenantId,
      projectId: project.projectId,
      eventId,
      modifiedCount: result.modifiedCount 
    });

    // Send notification to admins
    if (result.modifiedCount > 0) {
      try {
        // Get event details
        const event = existingEvent ? await Event.findOne({ eventId: existingEvent.eventId }) : null;
        const eventName = event?.eventDesc || 'event';

        // Count selected images for THIS EVENT only
        const selectedCount = await Image.countDocuments({
          clientEventId: eventId,
          selectedByClient: true,
          tenantId: project.tenantId
        });

        await NotificationUtils.notifyClientSelectionFinalized(
          project.tenantId,
          proposal.clientName || 'Client',
          project.projectName,
          eventName,
          selectedCount
        );

        // Also notify admins to assign designer
        await NotificationUtils.notifyAssignDesignerAfterSelection(
          project.tenantId,
          project.projectName,
          eventName,
          selectedCount
        );
      } catch (notifError) {
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Event marked as selection done',
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error marking event selection done`, { 
      eventId: req.body.eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveAlbum = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.body;
  const pin = req.headers['x-portal-pin'] as string;

  logger.info(`[${requestId}] Approving album`, { eventId });

  try {
    if (!eventId) {
      logger.warn(`[${requestId}] Event ID missing`);
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`);
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      logger.warn(`[${requestId}] Invalid PIN`);
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { 
        tenantId: proposal.tenantId,
        proposalId: proposal.proposalId 
      });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find ALBUM_PRINTING status
    const albumPrintingStatus = await EventDeliveryStatus.findOne({
      statusCode: 'ALBUM_PRINTING',
      tenantId: { $in: [project.tenantId, -1] }
    });


    if (!albumPrintingStatus) {
      logger.warn(`[${requestId}] ALBUM_PRINTING status not found`, { 
        tenantId: project.tenantId 
      });
      return res.status(404).json({ message: 'ALBUM_PRINTING status not found' });
    }

    // Update event status
    const result = await ClientEvent.updateOne(
      { clientEventId: eventId, tenantId: project.tenantId },
      { $set: { eventDeliveryStatusId: albumPrintingStatus.statusId } }
    );

    logger.info(`[${requestId}] Album approved`, { 
      tenantId: project.tenantId,
      projectId: project.projectId,
      eventId,
      modifiedCount: result.modifiedCount 
    });

    // Send notification to admins and designer
    if (result.modifiedCount > 0) {
      try {
        const clientEvent = await ClientEvent.findOne({ 
          clientEventId: eventId, 
          tenantId: project.tenantId 
        });
        const event = clientEvent ? await Event.findOne({ eventId: clientEvent.eventId }) : null;

        await NotificationUtils.notifyAlbumApprovedByCustomer(
          project.tenantId,
          proposal.clientName || 'Customer',
          project.projectName,
          event?.eventDesc || 'event',
          clientEvent?.albumDesigner
        );
      } catch (notifError) {
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Album approved and marked for printing',
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error approving album`, { 
      eventId: req.body.eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const notifyAlbumView = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.body;
  const pin = req.headers['x-portal-pin'] as string;

  logger.info(`[${requestId}] Notifying album view`, { eventId });

  try {
    if (!eventId) {
      logger.warn(`[${requestId}] Event ID missing`);
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      logger.warn(`[${requestId}] PIN missing`);
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      logger.warn(`[${requestId}] Invalid PIN`);
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project and event
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { 
        tenantId: proposal.tenantId,
        proposalId: proposal.proposalId 
      });
      return res.status(404).json({ message: 'Project not found' });
    }

    const clientEvent = await ClientEvent.findOne({ 
      clientEventId: eventId, 
      tenantId: project.tenantId 
    });
    if (!clientEvent) {
      logger.warn(`[${requestId}] Event not found`, { 
        tenantId: project.tenantId,
        eventId 
      });
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findOne({ eventId: clientEvent.eventId });

    // Send notification to admins
    await NotificationUtils.notifyCustomerAlbumReviewStarted(
      project.tenantId,
      proposal.clientName || 'Customer',
      project.projectName,
      event?.eventDesc || 'event'
    );

    logger.info(`[${requestId}] Album view notification sent`, { 
      tenantId: project.tenantId,
      projectId: project.projectId,
      eventId 
    });

    return res.status(200).json({ message: 'Notification sent successfully' });
  } catch (err: any) {
    logger.error(`[${requestId}] Error sending album view notification`, { 
      eventId: req.body.eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

