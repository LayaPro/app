import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Textarea, Button, Loading } from '../../components/ui/index.js';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import { sanitizeTextInput } from '../../utils/sanitize.js';
import type { Organization } from '../../types/index.js';

interface TermsCardProps {
  organization: Organization | null;
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const TermsCard: FC<TermsCardProps> = ({
  organization,
  loading,
  onSuccess,
  onError,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    termsOfService: '',
    termsOfPayment: '',
    cancellationPolicy: '',
    refundPolicy: '',
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        termsOfService: organization.termsOfService || '',
        termsOfPayment: organization.termsOfPayment || '',
        cancellationPolicy: organization.cancellationPolicy || '',
        refundPolicy: organization.refundPolicy || '',
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    const sanitizedData = {
      termsOfService: sanitizeTextInput(formData.termsOfService),
      termsOfPayment: sanitizeTextInput(formData.termsOfPayment),
      cancellationPolicy: sanitizeTextInput(formData.cancellationPolicy),
      refundPolicy: sanitizeTextInput(formData.refundPolicy),
    };

    try {
      setIsSaving(true);
      await organizationApi.update(sanitizedData);
      onSuccess('Terms and policies updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      onError(error.message || 'Failed to update terms and policies');
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
              Please create basic organization details first before adding terms and policies.
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
            Define your terms of service, payment terms, and policies. These will be included in proposals and customer agreements.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Terms of Service
            </label>
            <Textarea
              value={formData.termsOfService}
              onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
              placeholder="Enter your terms of service..."
              disabled={!isEditing}
              rows={8}
            />
            <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              General terms and conditions for your services
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Terms of Payment
            </label>
            <Textarea
              value={formData.termsOfPayment}
              onChange={(e) => setFormData({ ...formData, termsOfPayment: e.target.value })}
              placeholder="Enter your payment terms..."
              disabled={!isEditing}
              rows={6}
            />
            <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Payment schedule, methods, and late payment policies
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Cancellation Policy
            </label>
            <Textarea
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              placeholder="Enter your cancellation policy..."
              disabled={!isEditing}
              rows={6}
            />
            <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Rules and conditions for booking cancellations
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Refund Policy
            </label>
            <Textarea
              value={formData.refundPolicy}
              onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
              placeholder="Enter your refund policy..."
              disabled={!isEditing}
              rows={6}
            />
            <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Conditions and process for refunds
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  if (organization) {
                    setFormData({
                      termsOfService: organization.termsOfService || '',
                      termsOfPayment: organization.termsOfPayment || '',
                      cancellationPolicy: organization.cancellationPolicy || '',
                      refundPolicy: organization.refundPolicy || '',
                    });
                  }
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Terms
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
