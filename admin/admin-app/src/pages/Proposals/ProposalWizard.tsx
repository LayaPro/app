import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { BasicDetailsStep } from './components/BasicDetailsStep.js';
import { EventsStep } from './components/EventsStep.js';
import { TermsStep } from './components/TermsStep.js';
import { AddOnsStep } from './components/AddOnsStep.js';
import { ReviewStep } from './components/ReviewStep.js';
import styles from './ProposalWizard.module.css';
import pageStyles from '../Page.module.css';

interface ProposalWizardProps {
  onBack: () => void;
  onSubmit: (data: ProposalFormData) => void;
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
    date?: string;
    venue?: string;
    photographer?: number;
    videographer?: number;
    hours?: number;
  }>;
  
  // Terms
  paymentTerms?: string;
  cancellationPolicy?: string;
  deliveryTimeline?: string;
  
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
  { id: 4, label: 'Add-ons' },
  { id: 5, label: 'Review' },
];

export const ProposalWizard: React.FC<ProposalWizardProps> = ({ onBack, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalFormData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectName: '',
    weddingDate: '',
    venue: '',
    events: [],
    paymentTerms: '',
    cancellationPolicy: '',
    deliveryTimeline: '',
    addOns: [],
    totalAmount: 0,
    validUntil: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
          <AddOnsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 5:
        return (
          <ReviewStep
            formData={formData}
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
            onClick={currentStep === 1 ? onBack : handlePrevious}
            className={`${styles.button} ${currentStep === 1 ? styles.cancelButton : styles.backButton}`}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          <div className={styles.buttonGroup}>
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
                {isSubmitting ? 'Creating...' : 'Create Proposal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
