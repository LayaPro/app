import { useState } from 'react';
import { Modal, Input, Textarea, Button } from '../../../components/ui/index.js';

interface AddDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (deliverable: { name: string; description: string }) => void;
}

export const AddDeliverableModal: React.FC<AddDeliverableModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      alert('Please enter a deliverable name');
      return;
    }

    onAdd({ name: name.trim(), description: description.trim() });
    
    // Reset form
    setName('');
    setDescription('');
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Deliverable"
      size="medium"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <Input
            label="Deliverable Name"
            placeholder="e.g., High-resolution photos, Edited videos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            showCharCount={true}
            info="Name of the item to be delivered"
          />
        </div>

        <div>
          <Textarea
            label="Description"
            placeholder="Brief description of what will be delivered..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={300}
            showCharCount={true}
            info="Additional details about this deliverable"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add Deliverable
          </Button>
        </div>
      </div>
    </Modal>
  );
};
