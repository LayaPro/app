import { Response } from 'express';
import { nanoid } from 'nanoid';
import Organization from '../models/organization';
import Tenant from '../models/tenant';
import { AuthRequest } from '../middleware/auth';
import { uploadToS3 } from '../utils/s3';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('OrganizationController');

export const getOrganization = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Fetching organization`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    let organization = await Organization.findOne({ tenantId });

    // If organization doesn't exist, create it from tenant data
    if (!organization) {
      const tenant = await Tenant.findOne({ tenantId });
      
      if (tenant) {
        const organizationId = `org_${nanoid()}`;
        organization = await Organization.create({
          organizationId,
          tenantId,
          companyName: tenant.tenantCompanyName,
          email: tenant.tenantEmailAddress,
          countryCode: tenant.countryCode,
          phone: tenant.tenantPhoneNumber,
          createdBy: userId,
          updatedBy: userId
        });
        logger.info(`[${requestId}] Organization auto-created from tenant data`, { tenantId, organizationId });
      } else {
        logger.warn(`[${requestId}] Tenant not found`, { tenantId });
        return res.status(404).json({ message: 'Tenant not found' });
      }
    }

    logger.info(`[${requestId}] Organization retrieved`, { tenantId });

    res.json({ organization });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching organization`, { 
      tenantId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: error.message || 'Error fetching organization' });
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    companyName,
    tagline,
    logo,
    primaryColor,
    secondaryColor,
    aboutUs,
    mission,
    vision,
    email,
    phone,
    countryCode,
    address,
    website,
    facebook,
    instagram,
    twitter,
    linkedin,
    youtube,
    termsOfService,
    termsOfPayment,
    cancellationPolicy,
    refundPolicy,
    portfolioImages
  } = req.body;

  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating organization`, { tenantId, companyName });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!companyName) {
      logger.warn(`[${requestId}] Company name missing`, { tenantId });
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Check if organization already exists for this tenant
    const existingOrg = await Organization.findOne({ tenantId });
    if (existingOrg) {
      logger.warn(`[${requestId}] Organization already exists`, { tenantId });
      return res.status(400).json({ message: 'Organization already exists for this tenant' });
    }

    const organizationId = `org_${nanoid()}`;

    const organization = await Organization.create({
      organizationId,
      tenantId,
      companyName,
      tagline,
      logo,
      primaryColor,
      secondaryColor,
      aboutUs,
      mission,
      vision,
      email,
      phone,
      countryCode,
      address,
      website,
      facebook,
      instagram,
      twitter,
      linkedin,
      youtube,
      termsOfService,
      termsOfPayment,
      cancellationPolicy,
      refundPolicy,
      portfolioImages: portfolioImages || [],
      createdBy: userId,
      updatedBy: userId
    });

    logger.info(`[${requestId}] Organization created`, { tenantId, organizationId, companyName });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Organization',
      entityId: organizationId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: {
        companyName
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error creating organization`, { 
      tenantId,
      companyName,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: error.message || 'Error creating organization' });
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    companyName,
    tagline,
    logo,
    primaryColor,
    secondaryColor,
    aboutUs,
    mission,
    vision,
    email,
    phone,
    countryCode,
    address,
    website,
    facebook,
    instagram,
    twitter,
    linkedin,
    youtube,
    termsOfService,
    termsOfPayment,
    cancellationPolicy,
    refundPolicy,
    deliverables,
    addOns,
    portfolioImages,
    quotationPortfolioImages
  } = req.body;

  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating organization`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const organization = await Organization.findOne({ tenantId });

    if (!organization) {
      logger.warn(`[${requestId}] Organization not found`, { tenantId });
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Track changes for audit
    const changes: any = {};
    const fieldsToUpdate = [
      'companyName', 'tagline', 'logo', 'primaryColor', 'secondaryColor',
      'aboutUs', 'mission', 'vision', 'email', 'phone', 'countryCode',
      'address', 'website', 'facebook', 'instagram', 'twitter', 'linkedin',
      'youtube', 'termsOfService', 'termsOfPayment', 'cancellationPolicy',
      'refundPolicy', 'deliverables', 'addOns', 'portfolioImages',
      'quotationPortfolioImages'
    ];

    // Update fields and track changes
    if (companyName !== undefined && organization.companyName !== companyName) {
      changes.companyName = { before: organization.companyName, after: companyName };
      organization.companyName = companyName;
    }
    if (tagline !== undefined && organization.tagline !== tagline) {
      changes.tagline = { before: organization.tagline, after: tagline };
      organization.tagline = tagline;
    }
    if (logo !== undefined) organization.logo = logo;
    if (primaryColor !== undefined) organization.primaryColor = primaryColor;
    if (secondaryColor !== undefined) organization.secondaryColor = secondaryColor;
    if (aboutUs !== undefined) organization.aboutUs = aboutUs;
    if (mission !== undefined) organization.mission = mission;
    if (vision !== undefined) organization.vision = vision;
    if (email !== undefined) organization.email = email;
    if (phone !== undefined) organization.phone = phone;
    if (countryCode !== undefined) organization.countryCode = countryCode;
    if (address !== undefined) organization.address = address;
    if (website !== undefined) organization.website = website;
    if (facebook !== undefined) organization.facebook = facebook;
    if (instagram !== undefined) organization.instagram = instagram;
    if (twitter !== undefined) organization.twitter = twitter;
    if (linkedin !== undefined) organization.linkedin = linkedin;
    if (youtube !== undefined) organization.youtube = youtube;
    if (termsOfService !== undefined) organization.termsOfService = termsOfService;
    if (termsOfPayment !== undefined) organization.termsOfPayment = termsOfPayment;
    if (cancellationPolicy !== undefined) organization.cancellationPolicy = cancellationPolicy;
    if (refundPolicy !== undefined) organization.refundPolicy = refundPolicy;
    if (deliverables !== undefined) organization.deliverables = deliverables;
    if (addOns !== undefined) organization.addOns = addOns;
    if (portfolioImages !== undefined) organization.portfolioImages = portfolioImages;
    if (quotationPortfolioImages !== undefined) organization.quotationPortfolioImages = quotationPortfolioImages;

    organization.updatedBy = userId || '';

    await organization.save();

    logger.info(`[${requestId}] Organization updated`, { tenantId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Organization',
      entityId: organization.organizationId,
      tenantId,
      performedBy: userId || 'System',
      changes,
      metadata: {
        companyName: organization.companyName
      },
      ipAddress: req.ip
    });

    res.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating organization`, { 
      tenantId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: error.message || 'Error updating organization' });
  }
};

export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting organization`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const organization = await Organization.findOne({ tenantId });

    if (!organization) {
      logger.warn(`[${requestId}] Organization not found`, { tenantId });
      return res.status(404).json({ message: 'Organization not found' });
    }

    const organizationId = organization.organizationId;
    const organizationData = {
      companyName: organization.companyName
    };

    await Organization.deleteOne({ tenantId });

    logger.info(`[${requestId}] Organization deleted`, { tenantId, organizationId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'Organization',
      entityId: organizationId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: organizationData,
      ipAddress: req.ip
    });

    res.json({
      message: 'Organization deleted successfully',
      organizationId
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error deleting organization`, { 
      tenantId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: error.message || 'Error deleting organization' });
  }
};

export const uploadQuotationImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Uploading quotation images`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      logger.warn(`[${requestId}] No images provided`, { tenantId });
      return res.status(400).json({ message: 'No images provided' });
    }

    if (files.length > 3) {
      logger.warn(`[${requestId}] Too many images`, { tenantId, count: files.length });
      return res.status(400).json({ message: 'Maximum 3 images allowed' });
    }

    // Get organization to check current image count
    const organization = await Organization.findOne({ tenantId });
    if (!organization) {
      logger.warn(`[${requestId}] Organization not found`, { tenantId });
      return res.status(404).json({ message: 'Organization not found' });
    }

    const currentImagesCount = organization.quotationPortfolioImages?.length || 0;
    if (currentImagesCount + files.length > 3) {
      logger.warn(`[${requestId}] Image limit exceeded`, { tenantId, current: currentImagesCount, adding: files.length });
      return res.status(400).json({ 
        message: `Can only add ${3 - currentImagesCount} more image(s). Maximum 3 images allowed.` 
      });
    }

    // Upload images to S3
    const imageUrls: string[] = [];
    
    for (const file of files) {
      const fileName = `quotation-portfolio-${Date.now()}-${nanoid(8)}.${file.originalname.split('.').pop()}`;
      
      const imageUrl = await uploadToS3({
        buffer: file.buffer,
        fileName,
        mimeType: file.mimetype,
        folder: `portfolio`,
      });
      
      imageUrls.push(imageUrl);
    }

    logger.info(`[${requestId}] Quotation images uploaded`, { tenantId, count: imageUrls.length });

    res.json({
      message: 'Images uploaded successfully',
      imageUrls
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error uploading quotation images`, { 
      tenantId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ message: error.message || 'Error uploading images' });
  }
};

export default {
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadQuotationImages
};
