import { Response } from 'express';
import { nanoid } from 'nanoid';
import Proposal from '../models/proposal';
import Organization from '../models/organization';
import { AuthRequest } from '../middleware/auth';

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
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected'];
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
