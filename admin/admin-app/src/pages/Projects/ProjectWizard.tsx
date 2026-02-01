import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/index.js';
import { BasicDetailsStep } from './components/BasicDetailsStep';
import { EventsStep } from './components/EventsStep';
import { PaymentStep } from './components/PaymentStep';
import { formatDateLocal, formatTimeLocal } from '../../utils/dateUtils';
import { ReviewStep } from './components/ReviewStep';
import { projectApi, eventApi, teamApi } from '../../services/api';
import { useAppSelector } from '../../store/index.js';
import type { ClientEvent } from '@/types/shared';
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
  deliveryDueDate?: string;
  displayPic?: string;
  coverPhoto?: string;
  
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
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { editingProject, isEditing } = useAppSelector((state) => state.project);
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
    displayPic: undefined,
    coverPhoto: undefined,
    events: [],
    totalBudget: 0,
    receivedAmount: 0,
    receivedDate: undefined,
    nextDueDate: undefined,
    paymentTerms: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEditing && editingProject) {
      console.log('Editing project data:', editingProject);
      
      // Extract contact person - use contactPerson field if exists, otherwise derive from bride/groom names
      let contactPerson = editingProject.contactPerson || '';
      if (!contactPerson) {
        // Try to create a contact person from bride and groom first names
        if (editingProject.brideFirstName && editingProject.groomFirstName) {
          contactPerson = `${editingProject.brideFirstName} & ${editingProject.groomFirstName}`;
        } else if (editingProject.brideFirstName) {
          contactPerson = editingProject.brideFirstName;
        } else if (editingProject.groomFirstName) {
          contactPerson = editingProject.groomFirstName;
        }
      }
      
      // Email might not exist in old projects, leave empty for user to fill
      const email = editingProject.email || '';
      
      // Map events with proper field handling
      console.log('Raw events from editingProject:', editingProject.events);
      const mappedEvents = (editingProject.events || []).map((e: any) => {
        // Handle datetime fields - check multiple possible field names
        const fromDatetime = e.fromDatetime || e.startDate || e.date;
        const toDatetime = e.toDatetime || e.endDate;
        
        // Calculate duration if not present
        let duration = e.duration;
        if (!duration && fromDatetime && toDatetime) {
          const from = new Date(fromDatetime);
          const to = new Date(toDatetime);
          duration = Math.round((to.getTime() - from.getTime()) / (60 * 60 * 1000));
          console.log(`Calculated duration for event ${e.clientEventId}: ${duration} hours`);
        } else if (!duration) {
          duration = 4; // Default fallback
          console.log(`Using default duration for event ${e.clientEventId}`);
        }
        
        console.log(`Event ${e.clientEventId} - duration: ${e.duration} (from DB), calculated/used: ${duration}`);
        
        return {
          clientEventId: e.clientEventId,
          eventId: e.eventId,
          eventName: e.eventTitle || e.eventName || e.eventCode || '',
          fromDate: fromDatetime ? formatDateLocal(new Date(fromDatetime)) : '',
          toDate: toDatetime ? formatDateLocal(new Date(toDatetime)) : '',
          fromTime: fromDatetime ? formatTimeLocal(new Date(fromDatetime)) : '',
          toTime: toDatetime ? formatTimeLocal(new Date(toDatetime)) : '',
          duration: duration,
          venue: e.venue || '',
          venueLocation: e.venueLocation || e.venue || '',
          venueMapUrl: e.venueMapUrl || '',
          city: e.city || '',
          teamMembers: e.teamMembersAssigned || e.teamMembers || [],
          notes: e.notes || '',
        };
      });
      
      // Handle finance data - check nested finance object and top-level fields
      const finance = editingProject.finance || {};
      const totalBudget = editingProject.totalBudget || finance.totalBudget || editingProject.budget || 0;
      const receivedAmount = editingProject.receivedAmount || finance.receivedAmount || 0;
      const receivedDate = editingProject.receivedDate || finance.receivedDate;
      const nextDueDate = editingProject.nextDueDate || finance.nextDueDate;
      const paymentTerms = editingProject.paymentTerms || finance.paymentTerms || '';
      
      const newFormData = {
        projectName: editingProject.projectName || '',
        brideFirstName: editingProject.brideFirstName || '',
        brideLastName: editingProject.brideLastName || '',
        groomFirstName: editingProject.groomFirstName || '',
        groomLastName: editingProject.groomLastName || '',
        contactPerson: contactPerson,
        email: email,
        phoneNumber: editingProject.phoneNumber || '',
        address: editingProject.address || '',
        city: editingProject.city || '',
        referredBy: editingProject.referredBy || '',
        displayPic: editingProject.displayPic || undefined,
        coverPhoto: editingProject.coverPhoto || undefined,
        events: mappedEvents,
        totalBudget: totalBudget,
        receivedAmount: receivedAmount,
        receivedDate: receivedDate ? new Date(receivedDate).toISOString().split('T')[0] : undefined,
        nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString().split('T')[0] : undefined,
        paymentTerms: paymentTerms,
      };
      
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
    }
  }, [isEditing, editingProject]);

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
      if (!formData.phoneNumber?.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (formData.phoneNumber.length < 12) {
        newErrors.phoneNumber = 'Invalid phone number';
      }
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 2) {
      if (formData.events.length === 0) {
        newErrors.events = 'Please add at least one event';
      } else {
        // Check if all events have required date/time and duration information
        const eventsWithoutDates = formData.events.filter((event: any) => 
          !event.fromDate || !event.fromTime || !event.toDate || !event.toTime || !event.duration
        );
        if (eventsWithoutDates.length > 0) {
          newErrors.events = 'All events must have complete date, time, and duration information.';
        }
      }
    }

    if (step === 3) {
      if (!formData.totalBudget) newErrors.totalBudget = 'Total budget is required';
      
      // Validate advance received doesn't exceed total budget
      const totalBudget = parseFloat(formData.totalBudget?.toString() || '0') || 0;
      const receivedAmount = parseFloat(formData.receivedAmount?.toString() || '0') || 0;
      
      if (receivedAmount > totalBudget) {
        newErrors.receivedAmount = 'Advance received cannot exceed total budget';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setDirection('forward');
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setDirection('backward');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setDirection('backward');
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
        contactPerson: formData.contactPerson,
        email: formData.email,
        brideFirstName: formData.brideFirstName,
        brideLastName: formData.brideLastName,
        groomFirstName: formData.groomFirstName,
        groomLastName: formData.groomLastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        referredBy: formData.referredBy,
        deliveryDueDate: formData.deliveryDueDate ? new Date(formData.deliveryDueDate) : undefined,
        displayPic: formData.displayPic,
        coverPhoto: formData.coverPhoto,
        proposalId: editingProject?.proposalId, // Include proposalId if project was created from proposal
      };

      // Transform events data
      const eventsData = formData.events.map((event) => {
        const fromDatetime = event.fromDate && event.fromTime 
          ? new Date(`${event.fromDate}T${event.fromTime}`)
          : event.fromDate 
            ? new Date(event.fromDate) 
            : undefined;
        
        const toDatetime = event.toDate && event.toTime 
          ? new Date(`${event.toDate}T${event.toTime}`)
          : event.toDate 
            ? new Date(event.toDate) 
            : undefined;
        
        // Calculate duration if not present but dates are
        let duration = event.duration || 4;
        if (!event.duration && fromDatetime && toDatetime) {
          duration = Math.round((toDatetime.getTime() - fromDatetime.getTime()) / (60 * 60 * 1000));
        }
        
        return {
          clientEventId: event.clientEventId, // Include clientEventId for existing events
          eventId: event.eventId,
          fromDatetime,
          toDatetime,
          duration,
          venue: event.venue,
          venueMapUrl: event.venueLocation,
          city: formData.city,
          teamMembersAssigned: event.teamMembers || [],
        };
      });
      
      console.log('Events data being sent to API:', eventsData);

      // Transform finance data
      const financeData = formData.totalBudget ? {
        totalBudget: formData.totalBudget,
        receivedAmount: formData.receivedAmount,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : undefined,
        nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined,
      } : undefined;

      let response;
      
      // Check if we're editing an existing project
      if (isEditing && editingProject?.projectId) {
        console.log('Calling updateWithDetails API for project:', editingProject.projectId);
        
        // Call comprehensive update endpoint that handles project, events, and finance
        response = await projectApi.updateWithDetails(editingProject.projectId, {
          project: projectData,
          events: eventsData,
          finance: financeData,
        });
      } else {
        console.log('Calling create API for new project');
        // Call create API with full details
        response = await projectApi.create({
          project: projectData,
          events: eventsData,
          finance: financeData,
        });
      }

      // Call parent callback with response
      onSubmit(response);
    } catch (error) {
      console.error('Failed to save project:', error);
      setErrors({ submit: (error as Error).message || 'Failed to save project' });
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

    const stepContent = (() => {
      switch (currentStep) {
        case 1:
          return <BasicDetailsStep formData={formData} onChange={handleChange} errors={errors} isFromProposal={!!editingProject?.proposalId} />;
        case 2:
          return <EventsStep formData={formData} onChange={handleChange} errors={errors} events={events} teamMembers={teamMembers} />;
        case 3:
          return <PaymentStep formData={formData} onChange={handleChange} errors={errors} />;
        case 4:
          return <ReviewStep formData={formData} onEdit={setCurrentStep} />;
        default:
          return null;
      }
    })();

    return (
      <div 
        key={currentStep}
        className={direction === 'forward' ? styles.slideInFromRight : styles.slideInFromLeft}
      >
        {stepContent}
      </div>
    );
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
                ← Previous
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
                {isSubmitting 
                  ? (editingProject?.projectId ? 'Updating...' : 'Creating...') 
                  : (editingProject?.projectId ? 'Update Project' : 'Create Project')
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
