import React, { useState } from 'react';
import { UpgradePlanModal } from './UpgradePlanModal';

interface StorageLimitModalProps {
  show: boolean;
  currentPlan?: string;
  isEnterprise: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onPlanUpgraded?: () => void;
}

export const StorageLimitModal: React.FC<StorageLimitModalProps> = ({
  show,
  currentPlan,
  isEnterprise,
  onClose,
  onUpgrade,
  onPlanUpgraded,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  console.log('StorageLimitModal render:', { show, currentPlan, isEnterprise });
  
  if (!show) return null;

  const handleUpgradeClick = () => {
    if (isEnterprise) {
      onUpgrade();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handlePlanSelect = (plan: any) => {
    setShowUpgradeModal(false);
    if (onPlanUpgraded) {
      onPlanUpgraded();
    }
  };
  
  return (
    <>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 1.5rem',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          style={{ width: '32px', height: '32px', color: '#ef4444' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      
      <h3 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 700, 
        marginBottom: '0.75rem',
        color: 'var(--text-primary)'
      }}>
        Storage Limit Reached
      </h3>
      
      <div style={{
        padding: '1rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        marginBottom: '1.5rem',
        maxWidth: '500px',
        margin: '0 auto 1.5rem'
      }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-primary)',
          marginBottom: '0.75rem',
          lineHeight: 1.6
        }}>
          You've reached your storage limit on the <strong>{currentPlan || 'current'}</strong> plan.
        </p>
        {!isEnterprise && (
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Please upgrade to a higher plan to continue uploading images.
          </p>
        )}
        {isEnterprise && (
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            You're on the Enterprise plan. Please contact support to increase your storage limit.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        {!isEnterprise && (
          <button
            style={{ 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '0.5rem', 
              background: '#6366f1', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
            onClick={handleUpgradeClick}
          >
            Upgrade Plan
          </button>
        )}
        {isEnterprise && (
          <button
            style={{ 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '0.5rem', 
              background: '#6366f1', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
            onClick={handleUpgradeClick}
          >
            Contact Support
          </button>
        )}
      </div>
    </div>

    <UpgradePlanModal
      show={showUpgradeModal}
      currentPlanCode={currentPlan}
      onClose={() => setShowUpgradeModal(false)}
      onSelectPlan={handlePlanSelect}
    />
  </>
  );
};
