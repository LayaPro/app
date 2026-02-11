import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
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
