import { Button, Input, Textarea } from '../../../components/ui/index.js';
import type { ProposalFormData } from '../ProposalWizard';
import styles from '../ProposalWizard.module.css';

interface AddOnsStepProps {
  formData: ProposalFormData;
  updateFormData: (field: string, value: any) => void;
}

export const AddOnsStep: React.FC<AddOnsStepProps> = ({
  formData,
  updateFormData,
}) => {
  const addAddOn = () => {
    const newAddOn = {
      name: '',
      description: '',
      price: 0,
    };
    updateFormData('addOns', [...formData.addOns, newAddOn]);
  };

  const removeAddOn = (index: number) => {
    const updatedAddOns = formData.addOns.filter((_, i) => i !== index);
    updateFormData('addOns', updatedAddOns);
  };

  const updateAddOn = (index: number, field: string, value: any) => {
    const updatedAddOns = [...formData.addOns];
    updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
    updateFormData('addOns', updatedAddOns);
  };

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        {formData.addOns.map((addOn, index) => (
          <div key={index} className={styles.addOnCard}>
            <div className={styles.addOnHeader}>
              <h3>Add-on {index + 1}</h3>
              <button
                onClick={() => removeAddOn(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>

            <div className={styles.formGroup}>
              <Input
                label="Service Name"
                placeholder="e.g., Pre-wedding photoshoot"
                value={addOn.name}
                onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                info="Name of the additional service"
                maxLength={100}
                showCharCount={true}
              />
            </div>

            <div className={styles.formGroup}>
              <Textarea
                label="Description"
                rows={2}
                placeholder="Brief description of the service"
                value={addOn.description || ''}
                onChange={(e) => updateAddOn(index, 'description', e.target.value)}
                maxLength={200}
                showCharCount={true}
                info="Describe what's included in this add-on"
              />
            </div>

            <div className={styles.formGroup}>
              <Input
                label="Price (₹)"
                type="number"
                placeholder="0"
                value={addOn.price}
                onChange={(e) => updateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                info="Additional cost for this service"
              />
            </div>
          </div>
        ))}

        {formData.addOns.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p>No add-ons yet. Add optional services to increase proposal value.</p>
          </div>
        )}

        <Button onClick={addAddOn} variant="secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </Button>
      </div>
    </div>
  );
};
