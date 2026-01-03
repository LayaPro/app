import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ActionMenu.module.css';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: MenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4 + window.scrollY,
        left: window.innerWidth - rect.right + window.scrollX,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: MenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={styles.actionMenu}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={handleToggle}
        title="Actions"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className={styles.dropdown}
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            right: `${position.left}px`,
          }}
        >
          {items.map((item, index) => {
            const showDivider = item.variant === 'danger' && index > 0;
            return (
              <div key={index}>
                {showDivider && <div className={styles.divider} />}
                <button
                  className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};
