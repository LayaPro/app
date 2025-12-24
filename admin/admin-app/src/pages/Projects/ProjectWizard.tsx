import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { BasicDetailsStep } from './components/BasicDetailsStep';
import { EventsStep } from './components/EventsStep';
import { PaymentStep } from './components/PaymentStep';
import { ReviewStep } from './components/ReviewStep';
import { projectApi, eventApi, teamApi } from '../../services/api';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch events and team members on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsData, teamData] = await Promise.all([
          eventApi.getAll(),
          teamApi.getAll()
        ]);
        setEvents(eventsData?.events || []);
        setTeamMembers(teamData?.teamMembers || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors(prev => ({ ...prev, fetch: 'Failed to load events and team members' }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform form data to API format
      const projectData = {
        projectName: formData.projectName,
        brideFirstName: formData.brideFirstName,
        brideLastName: formData.brideLastName,
        groomFirstName: formData.groomFirstName,
        groomLastName: formData.groomLastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        referredBy: formData.referredBy,
      };

      // Transform events data
      const eventsData = formData.events.map((event) => ({
        eventId: event.eventId,
        fromDatetime: event.fromDate && event.fromTime 
          ? new Date(`${event.fromDate}T${event.fromTime}`)
          : event.fromDate 
            ? new Date(event.fromDate) 
            : undefined,
        toDatetime: event.toDate && event.toTime 
          ? new Date(`${event.toDate}T${event.toTime}`)
          : event.toDate 
            ? new Date(event.toDate) 
            : undefined,
        venue: event.venue,
        venueMapUrl: event.venueLocation,
        city: formData.city,
        teamMembersAssigned: event.teamMembers || [],
      }));

      // Transform finance data
      const financeData = formData.totalBudget ? {
        totalBudget: formData.totalBudget,
        receivedAmount: formData.receivedAmount,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : undefined,
        nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined,
      } : undefined;

      // Call API
      const response = await projectApi.create({
        project: projectData,
        events: eventsData,
        finance: financeData,
      });

      // Call parent callback with response
      onSubmit(response);
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ submit: (error as Error).message || 'Failed to create project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading...
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <BasicDetailsStep formData={formData} onChange={handleChange} errors={errors} />;
      case 2:
        return <EventsStep formData={formData} onChange={handleChange} errors={errors} events={events} teamMembers={teamMembers} />;
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
          {errors.submit && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}>
              {errors.submit}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.wizardActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onBack}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button
                type="button"
                className={`${styles.button} ${styles.backButton}`}
                onClick={handleBack}
                disabled={isSubmitting}
              >
                ← Back
              </button>
            )}
            
            {currentStep < STEPS.length ? (
              <button
                type="button"
                className={`${styles.button} ${styles.nextButton}`}
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.button} ${styles.submitButton}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
