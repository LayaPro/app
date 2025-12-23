import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import styles from './AccessCard.module.css';
import { roleApi } from '../../services/api';
import { RoleForm } from './RoleForm';
import type { RoleFormData } from './RoleForm';

interface RolesCardProps {
  roles: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const RolesCard: React.FC<RolesCardProps> = ({
  roles,
  loading,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: RoleFormData) => {
    if (selectedRole) {
      await roleApi.update(selectedRole.roleId, data);
      onSuccess('Role updated successfully');
    } else {
      await roleApi.create(data);
      onSuccess('Role created successfully');
    }
    onRefresh();
  };

  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await roleApi.delete(roleToDelete.roleId);
      onSuccess('Role deleted successfully');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to delete role');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const rolesColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Role Name',
      sortable: true,
      render: (row) => row.name || row.roleName,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (row) => row.description || row.roleDescription || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            title="Edit"
            onClick={() => handleEditRole(row)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            className={styles.deleteButton} 
            title="Delete"
            onClick={() => handleDeleteRole(row)}
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
      <div className={styles.card}>
        <button
          className={styles.cardHeader}
          onClick={onToggle}
        >
          <div className={styles.cardHeaderContent}>
            <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h2 className={styles.cardTitle}>Roles</h2>
              <p className={styles.cardSubtitle}>Define roles and permissions for access control</p>
            </div>
          </div>
          <svg
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`${styles.cardContent} ${isExpanded ? styles.cardContentExpanded : ''}`}>
          <div className={styles.contentInner}>
            <DataTable
              columns={rolesColumns}
              data={roles}
              itemsPerPage={10}
              emptyMessage={loading ? "Loading..." : "No roles found"}
              onCreateClick={handleCreateRole}
              createButtonText="Add Role"
            />
          </div>
        </div>
      </div>

      <RoleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        role={selectedRole}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name || roleToDelete?.roleName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
