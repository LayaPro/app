import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard.js';
import styles from './TeamCard.module.css';
import { profileApi } from '../../services/api';
import { WorkProfileForm } from './WorkProfileForm.js';
import type { WorkProfileFormData } from './WorkProfileForm.js';

interface WorkProfilesCardProps {
  profiles: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const WorkProfilesCard: React.FC<WorkProfilesCardProps> = ({
  profiles,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<any>(null);

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsFormOpen(true);
  };

  const handleEditProfile = (profile: any) => {
    setSelectedProfile(profile);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: WorkProfileFormData) => {
    if (selectedProfile) {
      await profileApi.update(selectedProfile.profileId, data);
      onSuccess('Work profile updated successfully');
    } else {
      await profileApi.create(data);
      onSuccess('Work profile created successfully');
    }
    onRefresh();
  };

  const handleDeleteProfile = (profile: any) => {
    setProfileToDelete(profile);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      await profileApi.delete(profileToDelete.profileId);
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
      onSuccess('Work profile deleted successfully');
      onRefresh();
    } catch (error: any) {
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
      onError(error.message || 'Failed to delete work profile');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Profile Name',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: false,
      render: (row) => row.description || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className={styles.actions}>
          <button
            onClick={() => handleEditProfile(row)}
            className={styles.editButton}
            title="Edit"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteProfile(row)}
            className={styles.deleteButton}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        title="Work Profiles"
        subtitle="Define roles and responsibilities for team members"
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <DataTable
          columns={columns}
          data={profiles}
          itemsPerPage={10}
          emptyMessage="No work profiles found"
          onCreateClick={handleCreateProfile}
          createButtonText="Add Work Profile"
        />
      </CollapsibleCard>

      <WorkProfileForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        profile={selectedProfile}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProfile}
        title="Delete Work Profile"
        message={`Are you sure you want to delete "${profileToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
