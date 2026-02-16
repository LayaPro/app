import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Loading, ImageUpload, InfoBox } from '../../components/ui/index.js';
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
          <InfoBox>
            Please create basic organization details first before adding quotation portfolio images.
          </InfoBox>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.contentWrapper}>
        <InfoBox>
          Upload up to 3 portfolio images to display in the "About Us" section of quotations. These showcase your best work to potential clients.
        </InfoBox>

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
