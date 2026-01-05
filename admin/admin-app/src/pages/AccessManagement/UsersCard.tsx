import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import styles from './AccessCard.module.css';
import { userApi } from '../../services/api';
import { UserForm } from './UserForm';
import type { UserFormData } from './UserForm';

interface UsersCardProps {
  users: any[];
  roles: any[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const UsersCard: React.FC<UsersCardProps> = ({
  users,
  roles,
  loading,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const _handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const _handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: UserFormData) => {
    if (selectedUser) {
      await userApi.update(selectedUser.userId, data);
      onSuccess('User updated successfully');
    } else {
      // Ensure password is provided for new users
      if (!data.password) {
        throw new Error('Password is required for new users');
      }
      await userApi.create({
        ...data,
        password: data.password
      });
      onSuccess('User created successfully');
    }
    onRefresh();
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await userApi.toggleActive(userId, !currentStatus);
      onSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to update user status');
    }
  };

  const _handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userApi.delete(userToDelete.userId);
      onSuccess('User deleted successfully');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      onRefresh();
    } catch (error: any) {
      onError(error.message || 'Failed to delete user');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // indigo to purple
      'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // pink to rose
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // blue to cyan
      'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', // emerald to teal
      'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', // amber to orange
      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', // purple to fuchsia
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // cyan to blue
      'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', // red to orange
    ];
    const index = (name?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const usersColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: getAvatarGradient(row.firstName),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '600',
              flexShrink: 0
            }}
          >
            {getInitials(row.firstName, row.lastName)}
          </div>
          <span>{`${row.firstName} ${row.lastName}`}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => row.roleName || row.role?.roleName || 'N/A',
    },
    {
      key: 'lastLoginDate',
      header: 'Last Login',
      sortable: true,
      render: (row) => formatDate(row.lastLogin || row.lastLoginDate),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={row.isActive}
            onChange={() => handleToggleActive(row.userId, row.isActive)}
          />
          <span className={styles.toggleSlider}></span>
        </label>
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
          <span>Manage user accounts, credentials, and role assignments. Active users can access the system based on their assigned permissions.</span>
        </div>
        
        <DataTable
          columns={usersColumns}
          data={users}
          itemsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No users found"}
        />
      </div>

      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        roles={roles}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
