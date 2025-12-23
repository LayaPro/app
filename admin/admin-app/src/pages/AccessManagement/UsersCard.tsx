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
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const UsersCard: React.FC<UsersCardProps> = ({
  users,
  roles,
  loading,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: any) => {
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

  const handleDeleteUser = (user: any) => {
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
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            title="Edit"
            onClick={() => handleEditUser(row)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            className={styles.deleteButton} 
            title="Delete"
            onClick={() => handleDeleteUser(row)}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <h2 className={styles.cardTitle}>Users</h2>
              <p className={styles.cardSubtitle}>Manage user accounts and assignments</p>
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
              columns={usersColumns}
              data={users}
              itemsPerPage={10}
              emptyMessage={loading ? "Loading..." : "No users found"}
              onCreateClick={handleCreateUser}
              createButtonText="Add User"
            />
          </div>
        </div>
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
