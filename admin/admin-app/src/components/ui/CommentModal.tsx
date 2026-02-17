import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
import { DatePicker } from './DatePicker.js';
import styles from './CommentModal.module.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, dueDate?: Date) => void;
  title: string;
  placeholder?: string;
  submitText?: string;
  isLoading?: boolean;
  uploaderName?: string;
  showDueDate?: boolean;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = 'Enter your comment...',
  submitText = 'Submit',
  isLoading = false,
  uploaderName,
  showDueDate = false
}) => {
  const [comment, setComment] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setDueDate('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (comment.trim()) {
      const dueDateObj = dueDate ? new Date(dueDate) : undefined;
      onSubmit(comment.trim(), dueDateObj);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="medium">
      <div className={styles.content}>
        {uploaderName && (
          <div className={styles.uploaderInfo}>
            <strong>Assignee:</strong> {uploaderName}
          </div>
        )}
        <Textarea
          label="Comments"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          rows={6}
          maxLength={500}
          showCharCount={true}
          info="Describe the changes needed in detail"
          disabled={isLoading}
        />
        {showDueDate && (
          <div style={{ marginTop: '1rem' }}>
            <DatePicker
              label="Due Date (Optional)"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
              allowPast={false}
              info="Set a deadline for completing the re-edit"
            />
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          variant="primary"
          isLoading={isLoading}
          disabled={!comment.trim()}
        >
          {submitText}
        </Button>
      </div>
    </Modal>
  );
};
