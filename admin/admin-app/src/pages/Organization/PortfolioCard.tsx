import type { FC } from 'react';
import { useState } from 'react';
import { Button, Loading, Input, Modal, InfoBox } from '../../components/ui/index.js';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import { sanitizeTextInput } from '../../utils/sanitize.js';
import type { Organization } from '../../types/index.js';

interface PortfolioCardProps {
  organization: Organization | null;
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const PortfolioCard: FC<PortfolioCardProps> = ({
  organization,
  loading,
  onSuccess,
  onError,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newImage, setNewImage] = useState({
    imageUrl: '',
    title: '',
    description: '',
    category: '',
  });

  const handleAddImage = async () => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    const sanitizedImage = {
      imageUrl: sanitizeTextInput(newImage.imageUrl),
      title: sanitizeTextInput(newImage.title),
      description: sanitizeTextInput(newImage.description),
      category: sanitizeTextInput(newImage.category),
    };

    if (!sanitizedImage.imageUrl.trim()) {
      onError('Image URL is required');
      return;
    }

    try {
      setIsSaving(true);
      const currentImages = organization.portfolioImages || [];
      const updatedImages = [
        ...currentImages,
        {
          ...sanitizedImage,
          order: currentImages.length,
        },
      ];

      await organizationApi.update({ portfolioImages: updatedImages });
      onSuccess('Portfolio image added successfully');
      setIsAddModalOpen(false);
      setNewImage({ imageUrl: '', title: '', description: '', category: '' });
    } catch (error: any) {
      onError(error.message || 'Failed to add portfolio image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!organization) return;

    try {
      const updatedImages = (organization.portfolioImages || []).filter((_, i) => i !== index);
      await organizationApi.update({ portfolioImages: updatedImages });
      onSuccess('Portfolio image removed successfully');
    } catch (error: any) {
      onError(error.message || 'Failed to remove portfolio image');
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
            Please create basic organization details first before adding portfolio images.
          </InfoBox>
        </div>
      </div>
    );
  }

  const portfolioImages = organization.portfolioImages || [];

  return (
    <div>
      <div className={styles.contentWrapper}>
        <InfoBox>
          Add portfolio images to showcase your work in proposals. Upload images to your storage and paste the URLs here.
        </InfoBox>

        <div style={{ marginBottom: '24px' }}>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Portfolio Image
          </Button>
        </div>

        {portfolioImages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No portfolio images yet</p>
            <p style={{ fontSize: '14px' }}>Add images to showcase your best work to potential clients</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {portfolioImages.map((image, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-secondary)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '66.67%', backgroundColor: 'var(--surface-secondary)' }}>
                  <img
                    src={image.imageUrl}
                    alt={image.title || 'Portfolio image'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div style={{ padding: '16px' }}>
                  {image.title && (
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {image.title}
                    </h4>
                  )}
                  {image.category && (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                    }}>
                      {image.category}
                    </span>
                  )}
                  {image.description && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                      {image.description}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleRemoveImage(index)}
                    style={{ width: '100%' }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setNewImage({ imageUrl: '', title: '', description: '', category: '' });
          }}
          title="Add Portfolio Image"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Image URL *
              </label>
              <Input
                value={newImage.imageUrl}
                onChange={(e) => setNewImage({ ...newImage, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Title
              </label>
              <Input
                value={newImage.title}
                onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                placeholder="Image title"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Category
              </label>
              <Input
                value={newImage.category}
                onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                placeholder="e.g., Wedding, Birthday, Corporate"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Description
              </label>
              <Input
                value={newImage.description}
                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewImage({ imageUrl: '', title: '', description: '', category: '' });
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddImage}
                disabled={isSaving}
              >
                {isSaving ? 'Adding...' : 'Add Image'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
