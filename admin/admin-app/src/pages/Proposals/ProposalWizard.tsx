import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { BasicDetailsStep } from './components/BasicDetailsStep.js';
import { EventsStep } from './components/EventsStep.js';
import { TermsStep } from './components/TermsStep.js';
import { DeliverablesStep } from './components/DeliverablesStep.js';
import { ReviewStep } from './components/ReviewStep.js';
import styles from './ProposalWizard.module.css';
import pageStyles from '../Page.module.css';

interface ProposalWizardProps {
  onBack: () => void;
  onSubmit: (data: ProposalFormData) => void;
  initialData?: any;
}

export interface ProposalFormData {
  // Basic Details
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  projectName: string;
  weddingDate?: string;
  venue?: string;
  
  // Events
  events: Array<{
    eventId: string;
    eventName: string;
    eventType?: string;
    date?: string;
    venue?: string;
    photographyServices?: Array<{
      type: string;
      label: string;
      count: number;
    }>;
    videographyServices?: Array<{
      type: string;
      label: string;
      count: number;
    }>;
  }>;
  
  // Terms
  termsOfService?: string;
  paymentTerms?: string;
  deliverables?: string;
  
  // Add-ons
  addOns: Array<{
    name: string;
    description?: string;
    price: number;
  }>;
  
  // Calculated
  totalAmount?: number;
  validUntil?: string;
}

const STEPS = [
  { id: 1, label: 'Basic Details' },
  { id: 2, label: 'Events' },
  { id: 3, label: 'Terms' },
  { id: 4, label: 'Deliverables' },
  { id: 5, label: 'Review' },
];

export const ProposalWizard: React.FC<ProposalWizardProps> = ({ onBack, onSubmit, initialData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalFormData>({
    clientName: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    projectName: initialData?.projectName || '',
    weddingDate: initialData?.weddingDate || '',
    venue: initialData?.venue || '',
    events: initialData?.events || [],
    termsOfService: initialData?.termsOfService || '',
    paymentTerms: initialData?.paymentTerms || '',
    deliverables: typeof initialData?.deliverables === 'string' ? initialData.deliverables : '',
    addOns: Array.isArray(initialData?.deliverables) 
      ? initialData.deliverables.map((d: any) => ({
          name: d?.name || '',
          description: d?.description || '',
          price: Number(d?.price) || 0
        }))
      : [],
    totalAmount: initialData?.totalAmount || null,
    validUntil: initialData?.validUntil || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      // Enter key - advance to next step
      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't trigger on textareas or when buttons are focused
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
          e.preventDefault();
          if (currentStep < STEPS.length) {
            handleNext();
          } else if (!isSubmitting) {
            handleSubmit();
          }
        }
      }
      
      // Backspace - go to previous step (only when not in input field)
      if (e.key === 'Backspace' && !isInputField) {
        e.preventDefault();
        if (currentStep > 1) {
          handlePrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isSubmitting]);

  // Auto-focus first input when step changes
  useEffect(() => {
    if (currentStep === 1) {
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `.${styles.wizardContent} input:not([type="checkbox"]):not([type="radio"]), .${styles.wizardContent} textarea, .${styles.wizardContent} select`
        );
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [currentStep]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Details
        if (!formData.clientName.trim()) {
          newErrors.clientName = 'Client name is required';
        }
        if (!formData.clientEmail.trim()) {
          newErrors.clientEmail = 'Client email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
          newErrors.clientEmail = 'Invalid email format';
        }
        if (!formData.clientPhone?.trim()) {
          newErrors.clientPhone = 'Client phone is required';
        }
        if (!formData.projectName.trim()) {
          newErrors.projectName = 'Project name is required';
        }
        break;
      case 2: // Events
        if (formData.events.length === 0) {
          newErrors.events = 'At least one event is required';
        }
        break;
      // Steps 3, 4, 5 are optional or will be validated on submit
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <EventsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <TermsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <DeliverablesStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 5:
        return (
          <ReviewStep
            formData={formData}
            updateFormData={updateFormData}
            onEdit={(step: number) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={pageStyles.pageContainer}>
      <Breadcrumb />
      
      <div className={styles.wizardContainer}>
        {/* Progress Steps */}
        <div className={styles.progressContainer}>
          <div className={styles.stepIndicator}>
            {STEPS.map((step, index) => (
              <>
                <div
                  key={step.id}
                  className={`${styles.step} ${
                    currentStep > step.id
                      ? styles.completed
                      : currentStep === step.id
                      ? styles.active
                      : ''
                  }`}
                >
                  <div className={styles.stepCircle}>
                    {currentStep > step.id ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    key={`connector-${step.id}`}
                    className={`${styles.stepConnector} ${
                      currentStep > step.id ? styles.completed : ''
                    }`}
                  />
                )}
              </>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className={styles.wizardContent}>
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.wizardActions}>
          <button
            onClick={onBack}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            Cancel
          </button>
          
          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className={`${styles.button} ${styles.backButton}`}
              >
                Previous
              </button>
            )}
            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className={`${styles.button} ${styles.nextButton}`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${styles.button} ${styles.submitButton}`}
              >
                {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Proposal' : 'Create Proposal')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
