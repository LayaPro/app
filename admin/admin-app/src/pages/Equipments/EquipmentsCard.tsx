import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard.js';
import styles from './EquipmentCard.module.css';
import { equipmentApi } from '../../services/api';
import { EquipmentForm } from './EquipmentForm.js';
import type { EquipmentFormData } from './EquipmentForm.js';
import { formatIndianAmount } from '../../utils/formatAmount';

interface EquipmentsCardProps {
  equipments: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const EquipmentsCard: React.FC<EquipmentsCardProps> = ({
  equipments,
  loading,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<any>(null);

  const handleCreateEquipment = () => {
    setSelectedEquipment(null);
    setIsFormOpen(true);
  };

  const handleEditEquipment = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: EquipmentFormData) => {
    if (selectedEquipment) {
      await equipmentApi.update(selectedEquipment.equipmentId, data);
      onSuccess('Equipment updated successfully');
    } else {
      await equipmentApi.create(data);
      onSuccess('Equipment created successfully');
    }
    onRefresh();
  };

  const handleDeleteEquipment = (equipment: any) => {
    setEquipmentToDelete(equipment);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    
    try {
      await equipmentApi.delete(equipmentToDelete.equipmentId);
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
      onSuccess('Equipment deleted successfully');
      onRefresh();
    } catch (error: any) {
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
      onError(error.message || 'Failed to delete equipment');
    }
  };

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

    const info = conditionMap[condition] || { label: condition.toString(), className: styles.conditionDefault };

    return (
      <span className={`${styles.conditionBadge} ${info.className}`}>
        {info.label}
      </span>
    );
  };

  const getRentBadge = (isOnRent: boolean, perDayRent?: number) => {
    if (!isOnRent) {
      return <span className={styles.rentNotAvailable}>Not for Rent</span>;
    }
    return (
      <span className={styles.rentAvailable}>
        ₹{perDayRent || 0}/day
      </span>
    );
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Equipment Name',
      sortable: true,
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      render: (row) => row.brand || '-',
    },
    {
      key: 'serialNumber',
      header: 'Serial Number',
      sortable: true,
      render: (row) => row.serialNumber || '-',
    },
    {
      key: 'condition',
      header: 'Condition',
      sortable: true,
      render: (row) => getConditionBadge(row.condition),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (row) => row.price ? `₹${formatIndianAmount(row.price)}` : '-',
    },
    {
      key: 'rent',
      header: 'Rental',
      render: (row) => getRentBadge(row.isOnRent, row.perDayRent),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton}
            onClick={() => handleEditEquipment(row)}
            title="Edit"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            className={styles.deleteButton}
            onClick={() => handleDeleteEquipment(row)}
            title="Delete"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CollapsibleCard
        icon={
          <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        }
        title="Equipments"
        subtitle="Manage studio equipment, cameras, lenses, and accessories"
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <DataTable
          columns={columns}
          data={equipments}
          itemsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No equipments found"}
          onCreateClick={handleCreateEquipment}
          createButtonText="Add Equipment"
        />
      </CollapsibleCard>

      <EquipmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        equipment={selectedEquipment}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEquipmentToDelete(null);
        }}
        onConfirm={confirmDeleteEquipment}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${equipmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
