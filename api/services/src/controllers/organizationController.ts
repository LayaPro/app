import { Response } from 'express';
import { nanoid } from 'nanoid';
import Organization from '../models/organization';
import Tenant from '../models/tenant';
import { AuthRequest } from '../middleware/auth';
import { uploadToS3 } from '../utils/s3';

export const getOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
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
      } else {
        return res.status(404).json({ message: 'Tenant not found' });
      }
    }

    res.json({ organization });
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: error.message || 'Error fetching organization' });
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
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

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Check if organization already exists for this tenant
    const existingOrg = await Organization.findOne({ tenantId });
    if (existingOrg) {
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

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    res.status(500).json({ message: error.message || 'Error creating organization' });
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  try {
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
      portfolioImages,
      quotationPortfolioImages
    } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const organization = await Organization.findOne({ tenantId });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Update fields
    if (companyName !== undefined) organization.companyName = companyName;
    if (tagline !== undefined) organization.tagline = tagline;
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
    if (portfolioImages !== undefined) organization.portfolioImages = portfolioImages;
    if (quotationPortfolioImages !== undefined) organization.quotationPortfolioImages = quotationPortfolioImages;

    organization.updatedBy = userId || '';

    await organization.save();

    res.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error: any) {
    console.error('Error updating organization:', error);
    res.status(500).json({ message: error.message || 'Error updating organization' });
  }
};

export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const organization = await Organization.findOne({ tenantId });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const organizationId = organization.organizationId;
    await Organization.deleteOne({ tenantId });

    res.json({
      message: 'Organization deleted successfully',
      organizationId
    });
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ message: error.message || 'Error deleting organization' });
  }
};

export const uploadQuotationImages = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    if (files.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 images allowed' });
    }

    // Get organization to check current image count
    const organization = await Organization.findOne({ tenantId });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const currentImagesCount = organization.quotationPortfolioImages?.length || 0;
    if (currentImagesCount + files.length > 3) {
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

    res.json({
      message: 'Images uploaded successfully',
      imageUrls
    });
  } catch (error: any) {
    console.error('Error uploading quotation images:', error);
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
