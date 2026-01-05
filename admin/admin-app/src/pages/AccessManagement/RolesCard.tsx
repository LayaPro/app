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
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const RolesCard: React.FC<RolesCardProps> = ({
  roles,
  loading,
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
      <div className={styles.contentWrapper}>
        <div className={styles.infoText}>
          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Define roles and permission levels to control user access across the system. Assign specific capabilities to each role.</span>
        </div>
        
        <DataTable
          columns={rolesColumns}
          data={roles}
          itemsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No roles found"}
          onCreateClick={handleCreateRole}
          createButtonText="Add Role"
        />
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
