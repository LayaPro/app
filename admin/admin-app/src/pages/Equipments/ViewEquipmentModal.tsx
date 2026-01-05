import React from 'react';
import { Modal } from '../../components/ui';
import styles from './ViewEquipmentModal.module.css';

interface ViewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: any;
  onEdit?: () => void;
}

const formatIndianNumber = (num?: number): string => {
  if (num === undefined || num === null) return '-';
  const numStr = num.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  return lastThree;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const ViewEquipmentModal: React.FC<ViewEquipmentModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onEdit,
}) => {
  if (!equipment) return null;

  const getConditionBadge = (condition?: number) => {
    if (condition === undefined || condition === null) return '-';
    
    const conditionMap: Record<number, { label: string; className: string }> = {
      5: { label: 'Excellent', className: styles.conditionExcellent },
      4: { label: 'Very Good', className: styles.conditionVeryGood },
      3: { label: 'Good', className: styles.conditionGood },
      2: { label: 'Fair', className: styles.conditionFair },
      1: { label: 'Poor', className: styles.conditionPoor },
      0: { label: 'Not Working', className: styles.conditionBroken },
    };

    const info = conditionMap[condition] || { label: condition.toString(), className: '' };

    return (
      <span className={`${styles.badge} ${info.className}`}>
        {info.label}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Equipment Details">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.icon}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className={styles.nameSection}>
            <h2 className={styles.name}>{equipment.name}</h2>
          </div>
        </div>

        {/* Details Grid */}
        <div className={styles.details}>
          <div className={styles.field}>
            <label>Brand</label>
            <div className={styles.value}>{equipment.brand}</div>
          </div>

          <div className={styles.field}>
            <label>Serial Number</label>
            <div className={styles.value}>{equipment.serialNumber || '-'}</div>
          </div>

          <div className={styles.field}>
            <label>Price</label>
            <div className={styles.value}>₹{formatIndianNumber(equipment.price)}</div>
          </div>

          {equipment.perDayRent && (
            <div className={styles.field}>
              <label>Rent Per Day</label>
              <div className={styles.value}>₹{formatIndianNumber(equipment.perDayRent)}</div>
            </div>
          )}

          <div className={styles.field}>
            <label>Purchase Date</label>
            <div className={styles.value}>{formatDate(equipment.purchaseDate)}</div>
          </div>

          <div className={styles.field}>
            <label>Condition</label>
            {getConditionBadge(equipment.condition)}
          </div>

          {equipment.notes && (
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label>Notes</label>
              <div className={styles.notesValue}>{equipment.notes}</div>
            </div>
          )}
        </div>

        {/* Images Section */}
        {(equipment.images || equipment.imageUrls) && (equipment.images || equipment.imageUrls).length > 0 && (
          <div className={styles.imagesSection}>
            <label className={styles.sectionLabel}>Images</label>
            <div className={styles.imagesGrid}>
              {(equipment.images || equipment.imageUrls).map((image: string, index: number) => (
                <div key={index} className={styles.imageItem}>
                  <img src={image} alt={`${equipment.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className={styles.footer}>
          {onEdit && (
            <button onClick={onEdit} className={styles.editButton}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
