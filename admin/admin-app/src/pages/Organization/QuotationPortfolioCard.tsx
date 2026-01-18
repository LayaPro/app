import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Loading, ImageUpload } from '../../components/ui/index.js';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import type { Organization } from '../../types/index.js';

interface QuotationPortfolioCardProps {
  organization: Organization | null;
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const QuotationPortfolioCard: FC<QuotationPortfolioCardProps> = ({
  organization,
  loading,
  onSuccess,
  onError,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.quotationPortfolioImages) {
      setImages(organization.quotationPortfolioImages);
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    try {
      setIsSaving(true);
      await organizationApi.update({ quotationPortfolioImages: images });
      onSuccess('Quotation portfolio images updated successfully');
    } catch (error: any) {
      onError(error.message || 'Failed to update images');
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

  if (!organization) {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <div className={styles.infoText}>
            <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Please create basic organization details first before adding quotation portfolio images.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.contentWrapper}>
        <div className={styles.infoText}>
          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Upload up to 3 portfolio images to display in the "About Us" section of quotations. These showcase your best work to potential clients.
          </span>
        </div>

        <ImageUpload
          images={images}
          onChange={setImages}
          maxFiles={3}
          maxSizeMB={5}
          label="Quotation Portfolio Images"
          info="Upload 3 images for the About Us section in quotations. Recommended aspect ratio: 4:5 (portrait)"
        />

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Images'}
          </Button>
        </div>
      </div>
    </div>
  );
};
