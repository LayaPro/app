import { useState, useEffect } from 'react';
import { Textarea, Button, Loading } from '../../../components/ui/index.js';
import { organizationApi } from '../../../services/api.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface TermsStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [orgTerms, setOrgTerms] = useState({
    termsOfService: '',
    termsOfPayment: '',
  });

  useEffect(() => {
    const fetchOrgTerms = async () => {
      setIsLoadingOrg(true);
      try {
        const response = await organizationApi.get();
        if (response.organization) {
          setOrgTerms({
            termsOfService: response.organization.termsOfService || '',
            termsOfPayment: response.organization.termsOfPayment || '',
          });
          
          // Pre-fill if empty
          if (!formData.termsOfService && response.organization.termsOfService) {
            updateFormData('termsOfService', response.organization.termsOfService);
          }
          if (!formData.paymentTerms && response.organization.termsOfPayment) {
            updateFormData('paymentTerms', response.organization.termsOfPayment);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization terms:', error);
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrgTerms();
  }, []);

  const loadOrgTermsOfService = () => {
    updateFormData('termsOfService', orgTerms.termsOfService);
  };

  const loadOrgPaymentTerms = () => {
    updateFormData('paymentTerms', orgTerms.termsOfPayment);
  };

  if (isLoadingOrg) {
    return (
      <div className={styles.form}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <div className={styles.termsContainer}>
            <div>
              <Textarea
                label="Terms of Service"
                value={formData.termsOfService || ''}
                onChange={(e) => updateFormData('termsOfService', e.target.value)}
                placeholder="Enter terms of service (one per line)..."
                rows={8}
                maxLength={2000}
                showCharCount={true}
                info="General terms and conditions. Each line will appear as a bullet point."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {orgTerms.termsOfService && (
                <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                  <Button
                    variant="secondary"
                    onClick={loadOrgTermsOfService}
                    style={{ fontSize: '12px', padding: '4px 12px', height: 'auto' }}
                  >
                  Load from Organization
                  </Button>
                </div>
              )}
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px 16px',
                backgroundColor: 'var(--background-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                height: '210px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preview</div>
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
        </div>

        <div className={styles.termsDivider}></div>

        <div className={styles.formGroup}>
          <div className={styles.termsContainer}>
            <div>
              <Textarea
                label="Terms of Payment"
                value={formData.paymentTerms || ''}
                onChange={(e) => updateFormData('paymentTerms', e.target.value)}
                placeholder="Enter payment terms (one per line)..."
                rows={8}
                maxLength={1000}
                showCharCount={true}
                info="Payment schedule, methods, and policies. Each line will appear as a bullet point."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {orgTerms.termsOfPayment && (
                <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                  <Button
                    variant="secondary"
                    onClick={loadOrgPaymentTerms}
                    style={{ fontSize: '12px', padding: '4px 12px', height: 'auto' }}
                  >
                  Load from Organization
                  </Button>
                </div>
              )}
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px 16px',
                backgroundColor: 'var(--background-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                height: '210px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preview</div>
                {formData.paymentTerms ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                    {formData.paymentTerms.split('\n').filter(line => line.trim()).map((line, index) => (
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
      </div>
    </div>
  );
};
