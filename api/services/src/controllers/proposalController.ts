import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
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

export const createProposal = async (req: AuthRequest, res: Response) => {
  console.log('[Proposal] ========== CREATE PROPOSAL REQUEST RECEIVED ==========');
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
    
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    console.log('[Proposal] Request data:', { projectName, clientEmail, tenantId });

    // Validation
    if (!clientName || !clientEmail || !projectName) {
      return res.status(400).json({ message: 'Client name, email, and project name are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Total amount must be greater than 0' });
    }

    if (!events || events.length === 0) {
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
    let codeExists = await Proposal.findOne({ accessCode });
    let suffix = 1;

    // Ensure uniqueness by adding suffix if needed
    while (codeExists) {
      accessCode = `${generateAccessCode(projectName)}-${suffix}`;
      codeExists = await Proposal.findOne({ accessCode });
      suffix++;
    }

    // Generate 4-digit PIN
    const accessPin = Math.floor(1000 + Math.random() * 9000).toString();

    const proposalId = `proposal_${nanoid()}`;
    
    console.log(`[Proposal] Creating proposal ${proposalId} with access code: ${accessCode} and PIN: ${accessPin}`);
    
    const proposal = await Proposal.create({
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
    });

    console.log('[Proposal] Proposal created successfully:', proposalId);

    return res.status(201).json({
      message: 'Proposal created successfully',
      proposal
    });
  } catch (err: any) {
    console.error('[Proposal] Create proposal error:', err);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  }
};

export const getAllProposals = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
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

    return res.status(200).json({
      proposals,
      count: proposals.length
    });
  } catch (err: any) {
    console.error('[Proposal] Get all proposals error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProposalById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const proposal = await Proposal.findOne({ proposalId: id, tenantId });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    return res.status(200).json({ proposal });
  } catch (err: any) {
    console.error('[Proposal] Get proposal error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const proposal = await Proposal.findOne({ proposalId: id, tenantId });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Update fields
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

    if (clientName) proposal.clientName = clientName;
    if (clientEmail) proposal.clientEmail = clientEmail;
    if (clientPhone !== undefined) proposal.clientPhone = clientPhone;
    if (projectName) proposal.projectName = projectName;
    if (weddingDate !== undefined) proposal.weddingDate = weddingDate;
    if (venue !== undefined) proposal.venue = venue;
    if (events) proposal.events = events;
    if (termsOfService !== undefined) proposal.termsOfService = termsOfService;
    if (paymentTerms !== undefined) proposal.paymentTerms = paymentTerms;
    if (deliverables) proposal.deliverables = deliverables;
    if (totalAmount) proposal.totalAmount = totalAmount;
    if (validUntil) proposal.validUntil = new Date(validUntil);
    if (status) {
      proposal.status = status;
      
      // Update status timestamps
      if (status === 'sent' && !proposal.sentAt) {
        proposal.sentAt = new Date();
      } else if (status === 'accepted' && !proposal.acceptedAt) {
        proposal.acceptedAt = new Date();
      } else if (status === 'rejected' && !proposal.rejectedAt) {
        proposal.rejectedAt = new Date();
      }
    }

    proposal.updatedBy = userId;
    await proposal.save();

    return res.status(200).json({
      message: 'Proposal updated successfully',
      proposal
    });
  } catch (err: any) {
    console.error('[Proposal] Update proposal error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const proposal = await Proposal.findOneAndDelete({ proposalId: id, tenantId });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    return res.status(200).json({
      message: 'Proposal deleted successfully'
    });
  } catch (err: any) {
    console.error('[Proposal] Delete proposal error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyProposalPin = async (req: AuthRequest, res: Response) => {
  try {
    const { accessCode } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    const proposal = await Proposal.findOne({ accessCode });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.accessPin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Fetch organization data
    const organization = await Organization.findOne({ tenantId: proposal.tenantId });

    // Return proposal data without the PIN
    const proposalData = proposal.toObject();
    const { accessPin, ...proposalWithoutPin } = proposalData;

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
    console.error('[Proposal] Verify PIN error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response) => {
  console.log('[Proposal] ========== UPDATE PROPOSAL STATUS REQUEST ==========');
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('[Proposal] Update status:', { id, status });

    // Validate status
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'project_created'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Find and update proposal
    const proposal = await Proposal.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    console.log('[Proposal] Status updated successfully:', proposal._id);

    return res.status(200).json({
      message: 'Proposal status updated successfully',
      proposal
    });
  } catch (err: any) {
    console.error('[Proposal] Update status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendProposal = async (req: AuthRequest, res: Response) => {
  console.log('[Proposal] ========== SEND PROPOSAL REQUEST ==========');
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('[Proposal] Send proposal ID:', id);

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get proposal by proposalId
    const proposal = await Proposal.findOne({ proposalId: id, tenantId });
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Get organization details
    const organization = await Organization.findOne({ tenantId });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Construct proposal URL
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
    const proposalUrl = `${customerAppUrl}/proposal/${proposal.accessCode}`;

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

    console.log('[Proposal] Proposal sent successfully to:', proposal.clientEmail);

    return res.status(200).json({
      message: 'Proposal sent successfully',
      proposal
    });
  } catch (err: any) {
    console.error('[Proposal] Send proposal error:', err);
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
  try {
    const { accessCode } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    // Find proposal
    const proposal = await Proposal.findOne({ accessCode });

    if (!proposal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    if (proposal.accessPin !== pin) {
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
        console.log('[Customer Portal] Gallery status IDs:', galleryStatusIds);

        // Check if any event has a gallery-ready status
        const hasPublishedAlbum = await ClientEvent.exists({ 
          projectId: project.projectId,
          eventDeliveryStatusId: { $in: galleryStatusIds }
        });

        console.log('[Customer Portal] Has published album:', hasPublishedAlbum);

        if (hasPublishedAlbum) {
          // Show gallery view with published album images
          portalStage = 'gallery';
          console.log('[Customer Portal] Switching to GALLERY stage');

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

          console.log('[Customer Portal] Found images across all events:', allEventImages.length);

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

    console.log('[Customer Portal] Final portalStage:', portalStage);
    console.log('[Customer Portal] Gallery data:', galleryData ? `${galleryData.albumImages?.length} images` : 'null');

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
    console.error('[Proposal] Get customer portal data error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle image selection for customer portal (PIN authenticated)
export const toggleImageSelection = async (req: Request, res: Response) => {
  try {
    const { imageIds, selected = true } = req.body;
    const pin = req.headers['x-portal-pin'] as string;

    console.log('[Customer Portal] Toggle image selection request received');
    console.log('[Customer Portal] Headers:', req.headers);
    console.log('[Customer Portal] Body:', { imageIds, selected });
    console.log('[Customer Portal] PIN from header:', pin);

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      console.log('[Customer Portal] Invalid imageIds:', imageIds);
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!pin) {
      console.log('[Customer Portal] PIN is missing from headers');
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN is valid by finding a proposal with this PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    console.log('[Customer Portal] Proposal found:', proposal ? proposal.proposalId : 'not found');
    if (!proposal) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get tenant ID from the proposal's project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    console.log('[Customer Portal] Project found:', project ? project.projectId : 'not found');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get CLIENT_SELECTED status ID
    const clientSelectedStatus = await ImageStatus.findOne({ 
      statusCode: 'CLIENT_SELECTED',
      tenantId: { $in: [project.tenantId, -1] }
    });

    if (!clientSelectedStatus && selected) {
      console.log('[Customer Portal] CLIENT_SELECTED status not found');
      return res.status(404).json({ message: 'CLIENT_SELECTED status not found' });
    }

    // Get APPROVED status ID for deselection
    const approvedStatus = await ImageStatus.findOne({ 
      statusCode: 'APPROVED',
      tenantId: { $in: [project.tenantId, -1] }
    });

    if (!approvedStatus && !selected) {
      console.log('[Customer Portal] APPROVED status not found');
      return res.status(404).json({ message: 'APPROVED status not found' });
    }

    // Update images with both selectedByClient flag and imageStatusId
    console.log('[Customer Portal] Updating images:', { imageIds, tenantId: project.tenantId, selected });
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

    console.log('[Customer Portal] Images updated:', { modifiedCount: result.modifiedCount });

    // Send notifications to admins based on selection progress
    if (selected && result.modifiedCount > 0) {
      try {
        // Get the clientEventId from one of the selected images
        const sampleImage = await Image.findOne({ 
          imageId: { $in: imageIds }, 
          tenantId: project.tenantId 
        });
        
        if (!sampleImage || !sampleImage.clientEventId) {
          console.log('[Customer Portal] Could not determine event from images');
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
        console.error('[Customer Portal] Failed to send client selection notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: `${result.modifiedCount} image(s) ${selected ? 'selected' : 'deselected'}`,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('[Customer Portal] Toggle image selection error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markEventSelectionDone = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    const pin = req.headers['x-portal-pin'] as string;

    console.log('[Customer Portal] Mark event selection done request received');
    console.log('[Customer Portal] EventId:', eventId, 'PIN:', pin);

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find CLIENT_SELECTION_DONE status
    const clientSelectionDoneStatus = await EventDeliveryStatus.findOne({
      statusCode: 'CLIENT_SELECTION_DONE',
      tenantId: { $in: [project.tenantId, -1] }
    });

    console.log('[Customer Portal] CLIENT_SELECTION_DONE status found:', clientSelectionDoneStatus);

    if (!clientSelectionDoneStatus) {
      return res.status(404).json({ message: 'CLIENT_SELECTION_DONE status not found' });
    }

    // First check if the event exists
    const existingEvent = await ClientEvent.findOne({
      clientEventId: eventId,
      tenantId: project.tenantId
    });
    console.log('[Customer Portal] Existing event:', existingEvent);

    // Update event status
    const result = await ClientEvent.updateOne(
      { clientEventId: eventId, tenantId: project.tenantId },
      { $set: { eventDeliveryStatusId: clientSelectionDoneStatus.statusId } }
    );

    console.log('[Customer Portal] Event status updated:', result);

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
        console.error('[Customer Portal] Failed to send selection finalized notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Event marked as selection done',
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('[Customer Portal] Mark event selection done error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveAlbum = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    const pin = req.headers['x-portal-pin'] as string;

    console.log('[Customer Portal] Approve album request received');
    console.log('[Customer Portal] EventId:', eventId, 'PIN:', pin);

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find ALBUM_PRINTING status
    const albumPrintingStatus = await EventDeliveryStatus.findOne({
      statusCode: 'ALBUM_PRINTING',
      tenantId: { $in: [project.tenantId, -1] }
    });

    console.log('[Customer Portal] ALBUM_PRINTING status found:', albumPrintingStatus);

    if (!albumPrintingStatus) {
      return res.status(404).json({ message: 'ALBUM_PRINTING status not found' });
    }

    // Update event status
    const result = await ClientEvent.updateOne(
      { clientEventId: eventId, tenantId: project.tenantId },
      { $set: { eventDeliveryStatusId: albumPrintingStatus.statusId } }
    );

    console.log('[Customer Portal] Album approved, event status updated:', result);

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
        console.error('[Customer Portal] Failed to send album approval notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Album approved and marked for printing',
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('[Customer Portal] Approve album error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const notifyAlbumView = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    const pin = req.headers['x-portal-pin'] as string;

    console.log('[Customer Portal] Album view notification request');

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!pin) {
      return res.status(401).json({ message: 'PIN is required' });
    }

    // Verify PIN
    const proposal = await Proposal.findOne({ accessPin: pin });
    if (!proposal) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Get project and event
    const project = await Project.findOne({ 
      proposalId: proposal.proposalId,
      tenantId: proposal.tenantId 
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const clientEvent = await ClientEvent.findOne({ 
      clientEventId: eventId, 
      tenantId: project.tenantId 
    });
    if (!clientEvent) {
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

    return res.status(200).json({ message: 'Notification sent successfully' });
  } catch (err: any) {
    console.error('[Customer Portal] Album view notification error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

