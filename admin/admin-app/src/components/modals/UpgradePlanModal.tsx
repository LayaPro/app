import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { storageApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

interface Plan {
  _id: string;
  planCode: string;
  planName: string;
  storageLimit: number;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
}

interface UpgradePlanModalProps {
  show: boolean;
  currentPlanCode?: string;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  show,
  currentPlanCode,
  onClose,
  onSelectPlan,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      fetchPlans();
    }
  }, [show]);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storageApi.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!user?.tenantId) {
      showToast('error', 'Unable to identify tenant');
      return;
    }

    setUpgrading(plan._id);
    try {
      await storageApi.updateSubscription(user.tenantId, plan._id);
      showToast('success', `Successfully upgraded to ${plan.planName} plan!`);
      
      // Trigger storage update event
      window.dispatchEvent(new Event('storageUpdated'));
      
      onSelectPlan(plan);
      onClose();
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      showToast('error', error.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(null);
    }
  };

  const formatStorage = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(0)} TB`;
    }
    return `${gb} GB`;
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return `₹${price.toLocaleString()}/year`;
  };

  const isCurrentPlan = (planCode: string) => {
    return planCode === currentPlanCode;
  };

  const getAvailablePlans = () => {
    if (!currentPlanCode) return plans;
    
    // Normalize comparison - handle both planCode and planName
    const normalizedCurrentPlan = currentPlanCode.toUpperCase();
    
    const currentPlanIndex = plans.findIndex(p => 
      p.planCode.toUpperCase() === normalizedCurrentPlan || 
      p.planName.toUpperCase() === normalizedCurrentPlan
    );
    
    console.log('Finding plans higher than:', currentPlanCode, 'Index:', currentPlanIndex);
    
    if (currentPlanIndex === -1) {
      console.log('Current plan not found, showing all plans');
      return plans;
    }
    
    // Show only higher tier plans
    const filtered = plans.filter((_, index) => index > currentPlanIndex);
    console.log('Filtered plans:', filtered.map(p => p.planName));
    return filtered;
  };

  const availablePlans = getAvailablePlans();

  const getPlanColors = (planCode: string) => {
    const colors: Record<string, { gradient: string; accent: string; light: string }> = {
      'FREE': {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        accent: '#667eea',
        light: 'rgba(102, 126, 234, 0.1)'
      },
      'BASIC': {
        gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        accent: '#2563eb',
        light: 'rgba(37, 99, 235, 0.1)'
      },
      'PROFESSIONAL': {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        accent: '#7c3aed',
        light: 'rgba(124, 58, 237, 0.1)'
      },
      'BUSINESS': {
        gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        accent: '#dc2626',
        light: 'rgba(220, 38, 38, 0.1)'
      },
      'ENTERPRISE': {
        gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
        accent: '#ea580c',
        light: 'rgba(234, 88, 12, 0.1)'
      }
    };
    return colors[planCode] || colors['BASIC'];
  };

  return (
    <Modal isOpen={show} onClose={onClose} title="Upgrade Your Plan" size="large">
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading plans...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '1rem',
          color: 'var(--text-primary)'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && availablePlans.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>You're already on the highest plan available.</p>
          <p style={{ marginTop: '0.5rem' }}>Contact support for custom enterprise solutions.</p>
        </div>
      )}

      {!loading && !error && availablePlans.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          padding: '1rem 0'
        }}>
          {availablePlans.map((plan) => {
            const colors = getPlanColors(plan.planCode);
            return (
              <div
                key={plan._id}
                style={{
                  border: '1px solid transparent',
                  borderRadius: '1rem',
                  padding: '0',
                  backgroundColor: 'white',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: isCurrentPlan(plan.planCode) ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentPlan(plan.planCode)) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentPlan(plan.planCode)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }
                }}
              >
                {/* Gradient Header */}
                <div style={{
                  background: colors.gradient,
                  padding: '2rem 1.5rem 1.5rem',
                  position: 'relative'
                }}>
                  {isCurrentPlan(plan.planCode) && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.375rem 0.875rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: colors.accent,
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      Current Plan
                    </div>
                  )}

                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.025em'
                  }}>
                    {plan.planName}
                  </h3>
                  
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.025em'
                  }}>
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg 
                      style={{ width: '18px', height: '18px' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" 
                      />
                    </svg>
                    {formatStorage(plan.storageLimit)} Storage
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {plan.features && plan.features.length > 0 && (
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 1.5rem 0',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      flex: 1
                    }}>
                      {plan.features.map((feature, index) => (
                        <li key={index} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          marginBottom: '0.875rem'
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            marginRight: '0.75rem',
                            flexShrink: 0,
                            borderRadius: '50%',
                            background: colors.light,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg
                              style={{
                                width: '12px',
                                height: '12px',
                                color: colors.accent
                              }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span style={{ lineHeight: '1.5' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isCurrentPlan(plan.planCode) && (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={upgrading !== null}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        background: upgrading === plan._id ? '#9ca3af' : colors.gradient,
                        color: 'white',
                        cursor: upgrading !== null ? 'not-allowed' : 'pointer',
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        marginTop: 'auto',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        opacity: upgrading !== null && upgrading !== plan._id ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (upgrading === null) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (upgrading === null) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                    >
                      {upgrading === plan._id ? 'Upgrading...' : `Select ${plan.planName}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        border: '1px solid rgba(99, 102, 241, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <svg 
            style={{ width: '18px', height: '18px', color: '#6366f1' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Need help choosing?</strong>
        </div>
        <p style={{ margin: 0 }}>
          Contact your administrator or support team for personalized assistance.
        </p>
      </div>
    </Modal>
  );
};
