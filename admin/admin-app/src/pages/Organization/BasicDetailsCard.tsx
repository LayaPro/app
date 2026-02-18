import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Input, Textarea, Button, Loading, ImageUpload, PhoneInput, InfoBox } from '../../components/ui/index.ts';
import { countries } from '../../components/ui/PhoneInput';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import { sanitizeTextInput, sanitizeTextarea, sanitizeUrl } from '../../utils/sanitize.js';
import type { Organization } from '../../types/index.js';

interface BasicDetailsCardProps {
  organization: Organization | null;
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const BasicDetailsCard: FC<BasicDetailsCardProps> = ({
  organization,
  loading,
  onSuccess,
  onError,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    companyName: '',
    tagline: '',
    logo: '',
    aboutUs: '',
    email: '',
    countryCode: '+91',
    phone: '',
    address: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
  });

  // Validation helpers
  const validateUrl = (url: string): string | null => {
    if (!url || !url.trim()) return null;
    if (!/^https?:\/\/.+\..+/.test(url)) {
      return 'URL must start with http:// or https:// and include a domain';
    }
    return null;
  };

  useEffect(() => {
    if (organization) {
      setFormData({
        companyName: organization.companyName || '',
        tagline: organization.tagline || '',
        logo: organization.logo || '',
        aboutUs: organization.aboutUs || '',
        email: organization.email || '',
        countryCode: organization.countryCode || '+91',
        phone: organization.phone || '',
        address: organization.address || '',
        website: organization.website || '',
        facebook: organization.facebook || '',
        instagram: organization.instagram || '',
        youtube: organization.youtube || '',
      });
    }
  }, [organization]);

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && formData.phone.length < 6) {
      newErrors.phone = 'Phone number must be at least 6 digits';
    }

    if (formData.countryCode && !formData.countryCode.startsWith('+')) {
      newErrors.countryCode = 'Country code must start with +';
    }

    // Validate URLs
    const urlFields = ['website', 'facebook', 'instagram', 'youtube'] as const;
    urlFields.forEach(field => {
      const value = formData[field];
      if (value && value.trim()) {
        const urlError = validateUrl(value);
        if (urlError) {
          newErrors[field] = urlError;
        }
      }
    });

    // If there are errors, set them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    const sanitizedData = {
      companyName: sanitizeTextInput(formData.companyName),
      tagline: sanitizeTextarea(formData.tagline),
      logo: formData.logo, // Don't sanitize - it's a base64 image or S3 URL
      aboutUs: sanitizeTextarea(formData.aboutUs),
      email: sanitizeTextInput(formData.email),
      phone: formData.phone, // Don't sanitize - just numbers
      countryCode: formData.countryCode, // Don't sanitize - need the + symbol
      address: sanitizeTextarea(formData.address),
      website: sanitizeUrl(formData.website),
      facebook: sanitizeUrl(formData.facebook),
      instagram: sanitizeUrl(formData.instagram),
      youtube: sanitizeUrl(formData.youtube),
    };

    try {
      setIsSaving(true);
      if (organization) {
        await organizationApi.update(sanitizedData);
        onSuccess('Organization updated successfully');
      } else {
        await organizationApi.create(sanitizedData);
        onSuccess('Organization created successfully');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to save organization');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.formColumn}>
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Enter company name"
              maxLength={100}
              showCharCount
              info="Your official company name as registered"
              error={errors.companyName}
              required
            />

            <Textarea
              label="Brand Tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Your brand tagline or punchline"
              maxLength={40}
              rows={3}
              showCharCount
              info="A brief, memorable phrase describing your business. Use line breaks for multiple lines."
            />

            <PhoneInput
              label="Phone Number"
              value={formData.countryCode + formData.phone}
              onChange={(value) => {
                // Use the same logic as PhoneInput - find matching country code (longest first)
                const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
                const matchedCountry = sortedCountries.find(c => value.startsWith(c.dialCode));
                if (matchedCountry) {
                  setFormData({ 
                    ...formData, 
                    countryCode: matchedCountry.dialCode, 
                    phone: value.substring(matchedCountry.dialCode.length) 
                  });
                } else if (value === '') {
                  setFormData({ ...formData, countryCode: '+91', phone: '' });
                }
              }}
              error={errors.phone || errors.countryCode}
              info="Contact phone number with country code"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@company.com"
              maxLength={100}
              showCharCount
              info="Primary contact email for your organization"
              error={errors.email}
              required
            />

            <div>
              <ImageUpload
                images={formData.logo ? [formData.logo] : []}
                onChange={(images: string[]) => setFormData({ ...formData, logo: images[0] || '' })}
                maxFiles={1}
                maxSizeMB={2}
                label="Company Logo"
                info="Upload your company logo (max 2MB)"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.formColumn}>
            <Textarea
              label="About Us"
              value={formData.aboutUs}
              onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
              placeholder="Tell customers about your company..."
              rows={4}
              maxLength={500}
              showCharCount
              info="Brief description of your company and services"
            />

            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Your business address..."
              rows={3}
              maxLength={300}
              showCharCount
              info="Your complete business address"
            />

            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourwebsite.com"
              maxLength={200}
              showCharCount
              info="Company website URL (must start with http:// or https://)"
              error={errors.website}
            />

            <Input
              label="Facebook"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              placeholder="Facebook URL"
              maxLength={200}
              showCharCount
              info="Link to your Facebook page"
              error={errors.facebook}
            />
            <Input
              label="Instagram"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="Instagram URL"
              maxLength={200}
              showCharCount
              info="Link to your Instagram profile"
              error={errors.instagram}
            />
            <Input
              label="YouTube"
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              placeholder="YouTube URL"
              maxLength={200}
              showCharCount
              info="Link to your YouTube channel"
              error={errors.youtube}
            />
          </div>
        </div>

        <div className={styles.buttonGroup} style={{ borderTop: 'none', paddingTop: 0 }}>
          {organization && (
            <Button
              variant="secondary"
              onClick={() => {
                if (organization) {
                  setFormData({
                    companyName: organization.companyName || '',
                    tagline: organization.tagline || '',
                    logo: organization.logo || '',
                    aboutUs: organization.aboutUs || '',
                    email: organization.email || '',
                    countryCode: organization.countryCode || '+91',
                    phone: organization.phone || '',
                    address: organization.address || '',
                    website: organization.website || '',
                    facebook: organization.facebook || '',
                    instagram: organization.instagram || '',
                    youtube: organization.youtube || '',
                  });
                }
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : organization ? 'Save Changes' : 'Create Organization'}
          </Button>
        </div>
    </>
  );
};
