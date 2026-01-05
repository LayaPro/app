import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { ActionMenu } from '../../components/ui/ActionMenu.js';
import type { MenuItem } from '../../components/ui/ActionMenu.js';
import styles from './EquipmentCard.module.css';
import { equipmentApi } from '../../services/api';
import { EquipmentForm } from './EquipmentForm.js';
import type { EquipmentFormData } from './EquipmentForm.js';
import { formatIndianAmount } from '../../utils/formatAmount';
import { ViewEquipmentModal } from './ViewEquipmentModal.js';

interface EquipmentsCardProps {
  equipments: any[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const EquipmentsCard: React.FC<EquipmentsCardProps> = ({
  equipments,
  loading,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEquipment, setViewEquipment] = useState<any>(null);

  const handleCreateEquipment = () => {
    setSelectedEquipment(null);
    setIsFormOpen(true);
  };

  const handleViewEquipment = (equipment: any) => {
    setViewEquipment(equipment);
    setIsViewModalOpen(true);
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
    if (!perDayRent || perDayRent === 0) {
      return '-';
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: '500' }}>{formatIndianAmount(perDayRent)}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          per day
        </span>
      </div>
    );
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Equipment Name',
      sortable: true,
      render: (row) => <span style={{ paddingLeft: '16px' }}>{row.name}</span>,
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
      sortable: false,
      render: (row) => {
        const menuItems: MenuItem[] = [
          {
            label: 'View',
            icon: (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ),
            onClick: () => handleViewEquipment(row),
          },
          {
            label: 'Edit',
            icon: (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => handleEditEquipment(row),
          },
          {
            label: 'Delete',
            icon: (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            onClick: () => handleDeleteEquipment(row),
            variant: 'danger',
          },
        ];

        return <ActionMenu items={menuItems} />;
      },
    },
  ];

  return (
    <>
      <div className={styles.contentWrapper}>
        <div className={styles.infoText}>
          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Manage your studio equipment including cameras, lenses, and accessories. Track equipment status, rental availability, and maintenance.</span>
        </div>
        
        <DataTable
          columns={columns}
          data={equipments}
          itemsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No equipments found"}
          onCreateClick={handleCreateEquipment}
          createButtonText="Add Equipment"
          onRowClick={handleViewEquipment}
        />
      </div>

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

      <ViewEquipmentModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewEquipment(null);
        }}
        equipment={viewEquipment}
        onEdit={() => {
          setIsViewModalOpen(false);
          handleEditEquipment(viewEquipment);
        }}
      />
    </>
  );
};
