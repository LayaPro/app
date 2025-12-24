import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { BasicDetailsStep } from './components/BasicDetailsStep';
import { EventsStep } from './components/EventsStep';
import { PaymentStep } from './components/PaymentStep';
import { ReviewStep } from './components/ReviewStep';
import type { ClientEvent } from 'laya-shared';
import styles from './ProjectWizard.module.css';
import pageStyles from '../Page.module.css';

interface ProjectWizardProps {
  onBack: () => void;
  onSubmit: (data: ProjectFormData) => void;
}

// Form data interface that combines Project, ClientEvent, and ProjectFinance models
// Using string dates for form inputs, will convert to Date objects when submitting
export interface ProjectFormData {
  // From Project model
  projectName: string;
  brideFirstName?: string;
  brideLastName?: string;
  groomFirstName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  referredBy?: string;
  
  // Additional contact fields
  contactPerson: string;
  email: string;
  
  // Events (ClientEvent[] with additional form fields)
  events: Array<Partial<ClientEvent> & {
    eventName?: string;
    fromDate?: string;
    toDate?: string;
    fromTime?: string;
    toTime?: string;
    venueLocation?: string;
    teamMembers?: string[];
  }>;
  
  // From ProjectFinance model (using strings for date inputs)
  totalBudget?: number;
  receivedAmount?: number;
  receivedDate?: string;
  nextDueDate?: string;
  paymentTerms?: string;
}

const STEPS = [
  { id: 1, label: 'Basic Details' },
  { id: 2, label: 'Events' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Review' },
];

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ onBack, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    brideFirstName: '',
    brideLastName: '',
    groomFirstName: '',
    groomLastName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    referredBy: '',
    events: [],
    totalBudget: 0,
    receivedAmount: 0,
    receivedDate: undefined,
    nextDueDate: undefined,
    paymentTerms: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.projectName?.trim()) newErrors.projectName = 'Project name is required';
      if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Contact person is required';
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 2) {
      if (formData.events.length === 0) {
        newErrors.events = 'Please add at least one event';
      }
    }

    if (step === 3) {
      if (!formData.totalBudget) newErrors.totalBudget = 'Total budget is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicDetailsStep formData={formData} onChange={handleChange} errors={errors} />;
      case 2:
        return <EventsStep formData={formData} onChange={handleChange} errors={errors} />;
      case 3:
        return <PaymentStep formData={formData} onChange={handleChange} errors={errors} />;
      case 4:
        return <ReviewStep formData={formData} onEdit={setCurrentStep} />;
      default:
        return null;
    }
  };

  return (
    <div className={pageStyles.pageContainer}>
      <Breadcrumb />

      <div className={styles.wizardContainer}>
        {/* Progress Indicator */}
        <div className={styles.progressContainer}>
          <div className={styles.stepIndicator}>
            {STEPS.map((step, index) => (
              <>
                <div
                  key={step.id}
                  className={`${styles.step} ${
                    step.id === currentStep ? styles.active : ''
                  } ${step.id < currentStep ? styles.completed : ''}`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div className={styles.stepCircle}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    key={`connector-${step.id}`}
                    className={`${styles.stepConnector} ${step.id < currentStep ? styles.completed : ''}`}
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
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onBack}
          >
            Cancel
          </button>
          
          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button
                type="button"
                className={`${styles.button} ${styles.backButton}`}
                onClick={handleBack}
              >
                ← Back
              </button>
            )}
            
            {currentStep < STEPS.length ? (
              <button
                type="button"
                className={`${styles.button} ${styles.nextButton}`}
                onClick={handleNext}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.button} ${styles.submitButton}`}
                onClick={handleSubmit}
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
