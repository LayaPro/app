import styles from './DialogFooter.module.css';

interface DialogFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  submitDisabled = false,
}) => {
  return (
    <div className={styles.footer}>
      <button
        type="submit"
        onClick={onSubmit}
        className={styles.submitButton}
        disabled={loading || submitDisabled}
      >
        {loading ? 'Loading...' : submitText}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={styles.cancelButton}
        disabled={loading}
      >
        {cancelText}
      </button>
    </div>
  );
};
