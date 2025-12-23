import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui';
import type { SelectOption } from '../../components/ui/Select';
import styles from './Form.module.css';

export interface EquipmentFormData {
  name: string;
  serialNumber?: string;
  qr?: string;
  brand?: string;
  price?: number;
  purchaseDate?: string;
  isOnRent: boolean;
  perDayRent?: number;
  image?: string;
  condition?: number;
}

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EquipmentFormData) => Promise<void>;
  equipment: any;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipment,
}) => {
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    serialNumber: '',
    qr: '',
    brand: '',
    price: undefined,
    purchaseDate: '',
    isOnRent: false,
    perDayRent: undefined,
    image: '',
    condition: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        serialNumber: equipment.serialNumber || '',
        qr: equipment.qr || '',
        brand: equipment.brand || '',
        price: equipment.price || undefined,
        purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : '',
        isOnRent: equipment.isOnRent || false,
        perDayRent: equipment.perDayRent || undefined,
        image: equipment.image || '',
        condition: equipment.condition || undefined,
      });
    } else {
      setFormData({
        name: '',
        serialNumber: '',
        qr: '',
        brand: '',
        price: undefined,
        purchaseDate: '',
        isOnRent: false,
        perDayRent: undefined,
        image: '',
        condition: undefined,
      });
    }
    setErrors({});
    setSubmitError('');
  }, [equipment, isOpen]);

  const handleChange = (field: keyof EquipmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Equipment name must be at least 2 characters';
    }

    if (formData.condition !== undefined && (formData.condition < 0 || formData.condition > 5)) {
      newErrors.condition = 'Condition must be between 0 and 5';
    }

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.perDayRent !== undefined && formData.perDayRent < 0) {
      newErrors.perDayRent = 'Rent cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions: SelectOption[] = [
    { value: '', label: 'Not Set' },
    { value: '5', label: '5 - Excellent' },
    { value: '4', label: '4 - Very Good' },
    { value: '3', label: '3 - Good' },
    { value: '2', label: '2 - Fair' },
    { value: '1', label: '1 - Poor' },
    { value: '0', label: '0 - Not Working' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment ? 'Edit Equipment' : 'Add Equipment'} size="medium">
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {submitError}
          </div>
        )}

        <div className={styles.formGroup}>
          <Input
            label="Equipment Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Canon EOS R5, Sony A7IV"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Brand"
            value={formData.brand || ''}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="e.g., Canon, Sony, Nikon"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Serial Number"
            value={formData.serialNumber || ''}
            onChange={(e) => handleChange('serialNumber', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="QR Code"
            value={formData.qr || ''}
            onChange={(e) => handleChange('qr', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Price"
            type="number"
            value={formData.price?.toString() || ''}
            onChange={(e) => handleChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Purchase price"
            error={errors.price}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Purchase Date"
            type="date"
            value={formData.purchaseDate || ''}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Condition"
            value={formData.condition?.toString() || ''}
            onChange={(value) => handleChange('condition', value ? parseInt(value) : undefined)}
            options={conditionOptions}
            error={errors.condition}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Image URL"
            value={formData.image || ''}
            onChange={(e) => handleChange('image', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formGroup}>
          <Checkbox
            label="Available for Rent"
            checked={formData.isOnRent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('isOnRent', e.target.checked)}
          />
        </div>

        {formData.isOnRent && (
          <div className={styles.formGroup}>
            <Input
              label="Rent Per Day"
              type="number"
              value={formData.perDayRent?.toString() || ''}
              onChange={(e) => handleChange('perDayRent', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Daily rental rate"
              error={errors.perDayRent}
            />
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : equipment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
