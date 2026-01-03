import { Modal } from '../../components/ui/Modal';
import styles from './ViewMemberModal.module.css';

interface ViewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  member: any;
  profile?: any;
  role?: any;
  onSuccess: (message: string) => void;
}

export const ViewMemberModal: React.FC<ViewMemberModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  member,
  profile,
  role,
  onSuccess,
}) => {
  if (!member) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatIndianNumber = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-IN');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Member Details">
      <div className={styles.container}>
        {/* Avatar and Name Section */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {getInitials(member.firstName, member.lastName)}
          </div>
          <div className={styles.nameSection}>
            <h2 className={styles.name}>
              {member.firstName} {member.lastName}
            </h2>
            {profile && (
              <div className={styles.profile}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{profile.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className={styles.details}>
          <div className={styles.field}>
            <label>Email</label>
            <div className={styles.valueWithCopy}>
              <div className={styles.value}>{member.email}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(member.email);
                  onSuccess('Email copied to clipboard');
                }}
                className={styles.copyButton}
                title="Copy email"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
          
          {member.phoneNumber && (
            <div className={styles.field}>
              <label>Phone Number</label>
              <div className={styles.valueWithCopy}>
                <div className={styles.value}>{member.phoneNumber}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(member.phoneNumber);
                    onSuccess('Phone number copied to clipboard');
                  }}
                  className={styles.copyButton}
                  title="Copy phone number"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {member.govtIdNumber && (
            <div className={styles.field}>
              <label>Government ID</label>
              <div className={styles.value}>{member.govtIdNumber}</div>
            </div>
          )}

          <div className={styles.field}>
            <label>Type</label>
            <div className={styles.value}>
              <span className={`${styles.badge} ${member.isFreelancer ? styles.freelancer : styles.inhouse}`}>
                {member.isFreelancer ? 'Freelancer' : 'In-house'}
              </span>
            </div>
          </div>

          {role && !member.isFreelancer && (
            <div className={styles.field}>
              <label>Role</label>
              <div className={styles.value}>{role.title}</div>
              {role.description && (
                <div className={styles.roleDescription}>{role.description}</div>
              )}
            </div>
          )}

          {member.salary && (
            <div className={styles.field}>
              <label>Salary</label>
              <div className={styles.value}>
                ₹{formatIndianNumber(member.salary)}
                {member.paymentType && (
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                    ({member.paymentType === 'per-month' ? 'Per Month' : 'Per Event'})
                  </span>
                )}
              </div>
            </div>
          )}

          {member.address && (
            <div className={styles.field}>
              <label>Address</label>
              <div className={styles.value}>{member.address}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {onEdit && (
            <button onClick={onEdit} className={styles.editButton}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
