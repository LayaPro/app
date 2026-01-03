import { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { ActionMenu } from '../../components/ui/ActionMenu.js';
import type { MenuItem } from '../../components/ui/ActionMenu.js';
import styles from './TeamCard.module.css';
import { teamApi } from '../../services/api';
import { TeamMemberForm } from './TeamMemberForm.js';
import type { TeamMemberFormData } from './TeamMemberForm.js';
import { ViewMemberModal } from './ViewMemberModal.js';

interface TeamMembersCardProps {
  teamMembers: any[];
  profiles: any[];
  roles: any[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export const TeamMembersCard: React.FC<TeamMembersCardProps> = ({
  teamMembers,
  profiles,
  roles,
  isExpanded,
  onToggle,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState<any>(null);

  const handleCreateMember = () => {
    setSelectedMember(null);
    setIsFormOpen(true);
  };

  const handleViewMember = (member: any) => {
    setViewMember(member);
    setIsViewModalOpen(true);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleEditFromView = () => {
    setSelectedMember(viewMember);
    setIsViewModalOpen(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: TeamMemberFormData) => {
    if (selectedMember) {
      await teamApi.update(selectedMember.memberId, data);
      onSuccess('Team member updated successfully');
    } else {
      await teamApi.create(data);
      onSuccess('Team member created successfully');
    }
    onRefresh();
  };

  const handleDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      await teamApi.delete(memberToDelete.memberId);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      onSuccess('Team member deleted successfully');
      onRefresh();
    } catch (error: any) {
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      onError(error.message || 'Failed to delete team member');
    }
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
      'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', // purple to fuchsia
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // cyan to blue
      'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', // red to orange
    ];
    return gradients[(name?.charCodeAt(0) || 0) % gradients.length];
  };

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.profileId === profileId);
    return profile?.name || '-';
  };

  const columns: Column<any>[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              minHeight: '36px',
              flexShrink: 0,
              borderRadius: '50%',
              background: getAvatarGradient(row.firstName),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
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
      key: 'phoneNumber',
      header: 'Phone',
      sortable: false,
      render: (row) => row.phoneNumber || '-',
    },
    {
      key: 'profileId',
      header: 'Work Profile',
      sortable: false,
      render: (row) => getProfileName(row.profileId),
    },
    {
      key: 'isFreelancer',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <span style={{ 
          padding: '4px 12px', 
          borderRadius: '12px', 
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: row.isFreelancer ? '#fef3c7' : '#dbeafe',
          color: row.isFreelancer ? '#92400e' : '#1e40af',
        }}>
          {row.isFreelancer ? 'Freelancer' : 'In-house'}
        </span>
      ),
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
            onClick: () => handleViewMember(row),
          },
          {
            label: 'Edit',
            icon: (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => handleEditMember(row),
          },
          {
            label: 'Delete',
            icon: (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            onClick: () => handleDeleteMember(row),
            variant: 'danger' as const,
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
          <span>Manage your team members including photographers, editors, and staff. Add new members, assign roles, and track their work profiles.</span>
        </div>
        
        <DataTable
          columns={columns}
          data={teamMembers}
          itemsPerPage={10}
          emptyMessage="No team members found"
          onCreateClick={handleCreateMember}
          createButtonText="Add Team Member"
          onRowClick={handleViewMember}
        />
      </div>

      <TeamMemberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        member={selectedMember}
        profiles={profiles}
        roles={roles}
      />

      <ViewMemberModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={handleEditFromView}
        member={viewMember}
        profile={viewMember ? profiles.find((p: any) => p.profileId === viewMember.profileId) : undefined}
        role={viewMember ? roles.find((r: any) => r.roleId === viewMember.roleId) : undefined}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMember}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${memberToDelete?.firstName} ${memberToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
