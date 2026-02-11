import styles from './CardPlaceholder.module.css';
import { getAvatarColors, getInitials } from '../../../utils/avatarColors';

interface CardPlaceholderProps {
  type: 'project' | 'event';
  name: string;
}

export const CardPlaceholder: React.FC<CardPlaceholderProps> = ({ type, name }) => {
  const colors = getAvatarColors(name);
  const initials = getInitials(name);

  return (
    <div 
      className={styles.placeholder}
      style={{ backgroundColor: colors.bg }}
    >
      <div 
        className={styles.initialsCircle}
        style={{
          backgroundColor: colors.bg,
          border: `1.5px solid ${colors.border}`,
          color: colors.text
        }}
      >
        {initials}
      </div>
    </div>
  );
};
