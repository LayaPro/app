import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/index.js';
import { AddDeliverableModal } from './AddDeliverableModal.js';
import { organizationApi } from '../../../services/api.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface DeliverablesStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
}

export const DeliverablesStep: React.FC<DeliverablesStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [orgDeliverables, setOrgDeliverables] = useState<Array<{ name: string; description?: string }>>([]);

  useEffect(() => {
    const fetchOrgDeliverables = async () => {
      setIsLoadingOrg(true);
      try {
        const response = await organizationApi.get();
        if (response.organization?.deliverables) {
          setOrgDeliverables(response.organization.deliverables);
          
          // Pre-fill if empty
          if (!formData.addOns || formData.addOns.length === 0) {
            const prefilledDeliverables = response.organization.deliverables.map((d: any) => ({
              name: d.name,
              description: d.description || '',
              price: 0,
            }));
            updateFormData('addOns', prefilledDeliverables);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization deliverables:', error);
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrgDeliverables();
  }, []);

  const loadOrgDeliverables = () => {
    const deliverables = orgDeliverables.map(d => ({
      name: d.name,
      description: d.description || '',
      price: 0,
    }));
    updateFormData('addOns', deliverables);
  };

  const handleAddDeliverable = (deliverable: { name: string; description: string }) => {
    const newDeliverable = {
      name: deliverable.name,
      description: deliverable.description,
      price: 0,
    };
    updateFormData('addOns', [...formData.addOns, newDeliverable]);
    setIsModalOpen(false);
  };

  const removeDeliverable = (index: number) => {
    const updatedDeliverables = formData.addOns.filter((_, i) => i !== index);
    updateFormData('addOns', updatedDeliverables);
  };

  if (isLoadingOrg) {
    return null;
  }

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="primary"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Deliverable
          </Button>
        </div>

        {formData.addOns.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No deliverables added yet</p>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Add items that will be delivered to the client
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formData.addOns.map((deliverable, index) => (
              <div key={index} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <div className={styles.eventInfo}>
                    <div className={styles.eventName}>{String(deliverable.name || 'Deliverable')}</div>
                    {deliverable.description && (
                      <div className={styles.eventSummary}>{String(deliverable.description)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeDeliverable(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDeliverableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddDeliverable}
      />
    </div>
  );
};
