import React, { useRef } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface BasicDetailsStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const BasicDetailsStep: React.FC<BasicDetailsStepProps> = ({ formData, onChange, errors }) => {
  const profilePicRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (field: string, file: File | null) => {
    if (!file) {
      onChange(field, undefined);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const referralOptions = [
    { value: '', label: 'Select referral source' },
    { value: 'google', label: 'Google Search' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'friend_family', label: 'Friend/Family' },
    { value: 'previous_client', label: 'Previous Client' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Project Name"
              value={formData.projectName}
              onChange={(e) => onChange('projectName', e.target.value)}
              error={errors.projectName}
              placeholder="e.g., John & Jane Wedding"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => onChange('contactPerson', e.target.value)}
              error={errors.contactPerson}
              placeholder="Primary contact name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => onChange('phoneNumber', e.target.value)}
              error={errors.phoneNumber}
              placeholder="+91 9876543210"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Bride First Name"
              value={formData.brideFirstName}
              onChange={(e) => onChange('brideFirstName', e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Bride Last Name"
              value={formData.brideLastName}
              onChange={(e) => onChange('brideLastName', e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              error={errors.email}
              placeholder="email@example.com"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Groom First Name"
              value={formData.groomFirstName}
              onChange={(e) => onChange('groomFirstName', e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Groom Last Name"
              value={formData.groomLastName}
              onChange={(e) => onChange('groomLastName', e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className={styles.formGroup}>
            <SearchableSelect
              label="Referral Source"
              value={formData.referredBy || ''}
              onChange={(value) => onChange('referredBy', value)}
              options={referralOptions}
              placeholder="How did you hear about us?"
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Textarea
              label="Address"
              value={formData.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Street address, area, etc."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="City name"
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Images
            </label>
            <input
              ref={profilePicRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('displayPic', e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <input
              ref={coverPhotoRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('coverPhoto', e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  profilePicRef.current?.click();
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: formData.displayPic ? '#10b981' : '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {formData.displayPic ? '✓ Profile' : 'Upload Profile'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  coverPhotoRef.current?.click();
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: formData.coverPhoto ? '#10b981' : '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {formData.coverPhoto ? '✓ Cover' : 'Upload Cover'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', minHeight: '80px' }}>
              {formData.displayPic && (
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '2px solid #e5e7eb' }}>
                  <img 
                    src={formData.displayPic} 
                    alt="Profile"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange('displayPic', undefined);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      lineHeight: '1',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              {formData.coverPhoto && (
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '2px solid #e5e7eb' }}>
                  <img 
                    src={formData.coverPhoto} 
                    alt="Cover"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange('coverPhoto', undefined);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      lineHeight: '1',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              {!formData.displayPic && !formData.coverPhoto && (
                <div style={{ 
                  width: '100%', 
                  height: '80px',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  No images uploaded
                </div>
              )}
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Max 5MB each
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
