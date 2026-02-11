import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Loading, Modal, Input, Textarea } from '../../components/ui/index.js';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal.js';
import { DataTable } from '../../components/ui/DataTable.js';
import type { Column } from '../../components/ui/DataTable.js';
import { ActionMenu } from '../../components/ui/ActionMenu.js';
import type { MenuItem } from '../../components/ui/ActionMenu.js';
import styles from '../EventsSetup/EventCard.module.css';
import { organizationApi } from '../../services/api.js';
import { sanitizeTextInput, sanitizeTextarea } from '../../utils/sanitize.js';
import type { Organization } from '../../types/index.js';

interface DeliverablesCardProps {
  organization: Organization | null;
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface Deliverable {
  name: string;
  description?: string;
}

export const DeliverablesCard: FC<DeliverablesCardProps> = ({
  organization,
  loading,
  onSuccess,
  onError,
}) => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [addOns, setAddOns] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; index: number | null }>({ isOpen: false, index: null });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (organization?.deliverables) {
      setDeliverables(organization.deliverables);
    }
    if (organization?.addOns) {
      setAddOns(organization.addOns);
    }
  }, [organization]);

  const handleSave = async (updatedDeliverables: Deliverable[]) => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    try {
      setIsSaving(true);
      await organizationApi.update({ deliverables: updatedDeliverables });
      setDeliverables(updatedDeliverables);
      onSuccess('Deliverables updated successfully');
    } catch (error: any) {
      onError(error.message || 'Failed to update deliverables');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      onError('Deliverable name is required');
      return;
    }

    const sanitizedData = {
      name: sanitizeTextInput(formData.name),
      description: sanitizeTextarea(formData.description),
    };

    const updated = [...deliverables, sanitizedData];
    await handleSave(updated);
    setIsAddModalOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleEdit = async () => {
    if (editingIndex === null) return;
    
    if (!formData.name.trim()) {
      onError('Deliverable name is required');
      return;
    }

    const sanitizedData = {
      name: sanitizeTextInput(formData.name),
      description: sanitizeTextarea(formData.description),
    };

    const updated = [...deliverables];
    updated[editingIndex] = sanitizedData;
    await handleSave(updated);
    setIsEditModalOpen(false);
    setEditingIndex(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async () => {
    if (deleteConfirmation.index === null) return;
    const updated = deliverables.filter((_, i) => i !== deleteConfirmation.index);
    await handleSave(updated);
    setDeleteConfirmation({ isOpen: false, index: null });
  };

  const handleSaveAddOns = async () => {
    if (!organization) {
      onError('Please create basic organization details first');
      return;
    }

    try {
      setIsSaving(true);
      await organizationApi.update({ addOns: sanitizeTextarea(addOns) });
      onSuccess('Add-ons updated successfully');
    } catch (error: any) {
      onError(error.message || 'Failed to update add-ons');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setFormData({
      name: deliverables[index].name,
      description: deliverables[index].description || '',
    });
    setIsEditModalOpen(true);
  };

  const columns: Column<Deliverable>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (deliverable) => (
        <div>
          <div style={{ fontWeight: 600 }}>{deliverable.name}</div>
          {deliverable.description && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {deliverable.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (deliverable: Deliverable) => {
        const index = deliverables.indexOf(deliverable);
        const menuItems: MenuItem[] = [
          {
            label: 'Edit',
            onClick: () => openEditModal(index),
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
          },
          {
            label: 'Delete',
            onClick: () => setDeleteConfirmation({ isOpen: true, index }),
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            variant: 'danger' as const,
          },
        ];

        return <ActionMenu items={menuItems} />;
      },
    },
  ];

  if (loading) {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <Loading />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <div className={styles.infoText}>
            <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Please create basic organization details first before adding deliverables.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.contentWrapper}>
        <div className={styles.infoText}>
          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Define deliverables that will be included in your proposals. These items will be shown to clients in proposals.
          </span>
        </div>

        <DataTable
          columns={columns}
          data={deliverables}
          itemsPerPage={10}
          emptyMessage="No deliverables added yet"
          onCreateClick={() => setIsAddModalOpen(true)}
          createButtonText="Add Deliverable"
          getRowKey={(deliverable) => deliverable.name}
        />

        {/* Add-ons Section */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Add-ons
            </h3>
            <p className={styles.sectionDescription}>
              Define additional services or items that can be offered as extras in your proposals.
            </p>
          </div>

          <div className={styles.formGrid} style={{ gap: '16px' }}>
            <Textarea
              value={addOns}
              onChange={(e) => setAddOns(e.target.value)}
              placeholder="Enter add-ons (one per line)..."
              rows={8}
              maxLength={2000}
              showCharCount
              info="Each line will appear as a separate add-on item that can be included in proposals."
            />
            <div className={styles.previewBox}>
              <div className={styles.previewLabel}>Preview:</div>
              {addOns ? (
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                  {addOns.split('\n').filter(line => line.trim()).map((line, index) => (
                    <li key={index} style={{ marginBottom: '4px', wordWrap: 'break-word' }}>{line.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  Your add-ons will appear here as bullet points
                </p>
              )}
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <Button 
              onClick={handleSaveAddOns} 
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Add-ons'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ name: '', description: '' });
        }}
        title="Add Deliverable"
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Deliverable Name"
            placeholder="e.g., High-resolution photos, Edited videos"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={100}
            showCharCount={true}
            info="Name of the item to be delivered"
          />

          <Textarea
            label="Description"
            placeholder="Brief description of what will be delivered..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            maxLength={300}
            showCharCount={true}
            info="Additional details about this deliverable"
          />

          <div className={styles.modalButtonGroup}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ name: '', description: '' });
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd} disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add Deliverable'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingIndex(null);
          setFormData({ name: '', description: '' });
        }}
        title="Edit Deliverable"
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Deliverable Name"
            placeholder="e.g., High-resolution photos, Edited videos"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={100}
            showCharCount={true}
            info="Name of the item to be delivered"
          />

          <Textarea
            label="Description"
            placeholder="Brief description of what will be delivered..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            maxLength={300}
            showCharCount={true}
            info="Additional details about this deliverable"
          />

          <div className={styles.modalButtonGroup}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingIndex(null);
                setFormData({ name: '', description: '' });
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, index: null })}
        onConfirm={handleDelete}
        title="Delete Deliverable"
        message="Are you sure you want to delete this deliverable? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
};

