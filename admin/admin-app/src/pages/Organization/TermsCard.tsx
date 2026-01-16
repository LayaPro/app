import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Textarea, Button, Loading } from '../../components/ui/index.js';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import { sanitizeTextarea } from '../../utils/sanitize.js';
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
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    termsOfService: '',
    termsOfPayment: '',
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        termsOfService: organization.termsOfService || '',
        termsOfPayment: organization.termsOfPayment || '',
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    const sanitizedData = {
      termsOfService: sanitizeTextarea(formData.termsOfService),
      termsOfPayment: sanitizeTextarea(formData.termsOfPayment),
    };

    try {
      setIsSaving(true);
      await organizationApi.update(sanitizedData);
      onSuccess('Terms updated successfully');
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Textarea
                value={formData.termsOfService}
                onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
                placeholder="Enter your terms of service (one per line)..."
                rows={8}
                maxLength={2000}
                showCharCount
                info="General terms and conditions for your services. Each line will appear as a bullet point."
              />
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px 16px',
                backgroundColor: 'var(--background-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '280px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preview:</div>
                {formData.termsOfService ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                    {formData.termsOfService.split('\n').filter(line => line.trim()).map((line, index) => (
                      <li key={index} style={{ marginBottom: '4px', wordWrap: 'break-word' }}>{line.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    Your terms will appear here as bullet points
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Terms of Payment
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Textarea
                value={formData.termsOfPayment}
                onChange={(e) => setFormData({ ...formData, termsOfPayment: e.target.value })}
                placeholder="Enter your payment terms (one per line)..."
                rows={6}
                maxLength={1000}
                showCharCount
                info="Payment schedule, methods, and late payment policies. Each line will appear as a bullet point."
              />
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px 16px',
                backgroundColor: 'var(--background-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preview:</div>
                {formData.termsOfPayment ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                    {formData.termsOfPayment.split('\n').filter(line => line.trim()).map((line, index) => (
                      <li key={index} style={{ marginBottom: '4px', wordWrap: 'break-word' }}>{line.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    Your payment terms will appear here as bullet points
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          {organization && (
            <Button
              variant="secondary"
              onClick={() => {
                if (organization) {
                  setFormData({
                    termsOfService: organization.termsOfService || '',
                    termsOfPayment: organization.termsOfPayment || '',
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
