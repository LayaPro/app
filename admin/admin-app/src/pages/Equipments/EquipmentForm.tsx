import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { AmountInput } from '../../components/ui/AmountInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Checkbox } from '../../components/ui';
import { DialogFooter } from '../../components/ui/DialogFooter';
import type { SelectOption } from '../../components/ui/Select';
import styles from './Form.module.css';

export interface EquipmentFormData {
  name: string;
  serialNumber?: string;
  brand?: string;
  price?: number;
  purchaseDate?: string;
  takenOnRent: boolean;
  perDayRent?: number;
  images?: string[];
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
    brand: '',
    price: undefined,
    purchaseDate: '',
    takenOnRent: false,
    perDayRent: undefined,
    images: [],
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
        brand: equipment.brand || '',
        price: equipment.price || undefined,
        purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : '',
        takenOnRent: equipment.takenOnRent || equipment.isOnRent || false,
        perDayRent: equipment.perDayRent || undefined,
        images: equipment.images || equipment.imageUrls || [],
        condition: equipment.condition || undefined,
      });
    } else {
      setFormData({
        name: '',
        serialNumber: '',
        brand: '',
        price: undefined,
        purchaseDate: '',
        takenOnRent: false,
        perDayRent: undefined,
        images: [],
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

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Brand is required';
    } else if (formData.brand.trim().length < 2) {
      newErrors.brand = 'Brand must be at least 2 characters';
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={equipment ? 'Edit Equipment' : 'Add Equipment'} 
      size="medium"
      info="Manage your studio equipment inventory including cameras, lenses, lighting, and accessories. Track condition, pricing, and rental availability."
    >
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
            maxLength={100}
            showCharCount
            info="Enter the model name and type of equipment (max 100 characters)"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Brand"
            value={formData.brand || ''}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="e.g., Canon, Sony, Nikon"
            required
            error={errors.brand}
            maxLength={50}
            showCharCount
            info="Manufacturer or brand name (max 50 characters)"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Serial Number"
            value={formData.serialNumber || ''}
            onChange={(e) => handleChange('serialNumber', e.target.value)}
            placeholder="Unique serial number"
            maxLength={50}
            showCharCount
            info="Manufacturer's serial number for warranty and identification (max 50 characters)"
          />
        </div>

        <div className={styles.formGroup}>
          <AmountInput
            label="Price"
            value={formData.price?.toString() || ''}
            onChange={(value) => handleChange('price', value ? parseFloat(value) : undefined)}
            placeholder="0"
            error={errors.price}
            info="Original purchase price in INR for inventory value tracking"
          />
        </div>

        <div className={styles.formGroup}>
          <DatePicker
            label="Purchase Date"
            value={formData.purchaseDate || ''}
            onChange={(value) => handleChange('purchaseDate', value)}
            placeholder="Select purchase date"
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Condition"
            value={formData.condition?.toString() || ''}
            onChange={(value) => handleChange('condition', value ? parseInt(value) : undefined)}
            options={conditionOptions}
            error={errors.condition}
            info="Current physical and functional condition of the equipment"
          />
        </div>

        <ImageUpload
          images={formData.images || []}
          onChange={(images) => handleChange('images', images)}
          maxFiles={4}
          maxSizeMB={2}
          label="Equipment Images"
          info="Upload up to 4 images for visual identification (max 2MB each)"
        />

        <div className={styles.formGroup}>
          <Checkbox
            label="Taken on Rent"
            checked={formData.takenOnRent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('takenOnRent', e.target.checked)}
            info="Check if this equipment is currently rented out"
          />
        </div>

        {formData.takenOnRent && (
          <div className={styles.formGroup}>
            <AmountInput
              label="Rent Per Day"
              value={formData.perDayRent?.toString() || ''}
              onChange={(value) => handleChange('perDayRent', value ? parseFloat(value) : undefined)}
              placeholder="0"
              error={errors.perDayRent}
              info="Daily rental charge in INR for this equipment"
            />
          </div>
        )}

        <DialogFooter
          onCancel={onClose}
          onSubmit={() => {}}
          submitText={equipment ? 'Update Equipment' : 'Create Equipment'}
          cancelText="Cancel"
          loading={loading}
        />
      </form>
    </Modal>
  );
};
