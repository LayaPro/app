import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.js';
import styles from './CommentModal.module.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  title: string;
  placeholder?: string;
  submitText?: string;
  isLoading?: boolean;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = 'Enter your comment...',
  submitText = 'Submit',
  isLoading = false
}) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="medium">
      <div className={styles.content}>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          rows={6}
          autoFocus
          disabled={isLoading}
        />
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.submitButton}
          disabled={isLoading || !comment.trim()}
        >
          {isLoading ? 'Processing...' : submitText}
        </button>
      </div>
    </Modal>
  );
};
