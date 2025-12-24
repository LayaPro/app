import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { DatePicker } from '../../components/ui/DatePicker';
import { Breadcrumb } from '../../components/ui/index.js';
import styles from './ProjectWizard.module.css';
import pageStyles from '../Page.module.css';

interface ProjectWizardProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
}

interface ProjectData {
  // Step 1: Basic Details
  brideFirstName: string;
  brideLastName: string;
  groomFirstName: string;
  groomLastName: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  referralSource: string;
  
  // Step 2: Events
  events: Array<{
    eventId: string;
    eventName: string;
    date: string;
    time: string;
    venue: string;
    teamMembers: string[];
  }>;
  
  // Step 3: Payment Details
  totalBudget: string;
  advanceReceived: string;
  advanceReceivedDate: string;
  nextPaymentDate: string;
  paymentTerms: string;
}

const STEPS = [
  { id: 1, label: 'Basic Details' },
  { id: 2, label: 'Events' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Review' },
];

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ onBack, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectData>({
    brideFirstName: '',
    brideLastName: '',
    groomFirstName: '',
    groomLastName: '',
    clientName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    referralSource: '',
    events: [],
    totalBudget: '',
    advanceReceived: '',
    advanceReceivedDate: '',
    nextPaymentDate: '',
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
      if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
      if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 2) {
      if (formData.events.length === 0) {
        newErrors.events = 'At least one event is required';
      }
    }

    if (step === 3) {
      if (!formData.totalBudget.trim()) newErrors.totalBudget = 'Total budget is required';
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

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicDetails formData={formData} onChange={handleChange} errors={errors} />;
      case 2:
        return <Step2Events formData={formData} onChange={handleChange} errors={errors} />;
      case 3:
        return <Step3Payment formData={formData} onChange={handleChange} errors={errors} />;
      case 4:
        return <Step5Review formData={formData} onEdit={setCurrentStep} />;
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
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className={styles.wizardActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onBack}
          >
            ← Cancel
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

// Step 1: Basic Details
const Step1BasicDetails: React.FC<any> = ({ formData, onChange, errors }) => {
  const referralOptions = [
    { value: '', label: 'Select referral source' },
    { value: 'google', label: 'Google Search' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'friend_family', label: 'Friend/Family' },
    { value: 'previous_client', label: 'Previous Client' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Project Name"
              value={formData.clientName}
              onChange={(e) => onChange('clientName', e.target.value)}
              error={errors.clientName}
              placeholder="e.g., John & Jane Wedding"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => onChange('contactPerson', e.target.value)}
              error={errors.contactPerson}
              placeholder="Primary contact name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="+91 9876543210"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Bride First Name"
              value={formData.brideFirstName}
              onChange={(e) => onChange('brideFirstName', e.target.value)}
              error={errors.brideFirstName}
              placeholder="e.g., Jane"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="Bride Last Name"
              value={formData.brideLastName}
              onChange={(e) => onChange('brideLastName', e.target.value)}
              error={errors.brideLastName}
              placeholder="e.g., Smith"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Groom First Name"
              value={formData.groomFirstName}
              onChange={(e) => onChange('groomFirstName', e.target.value)}
              error={errors.groomFirstName}
              placeholder="e.g., John"
              required
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Groom Last Name"
              value={formData.groomLastName}
              onChange={(e) => onChange('groomLastName', e.target.value)}
              error={errors.groomLastName}
              placeholder="e.g., Doe"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              error={errors.email}
              placeholder="client@example.com"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => onChange('city', e.target.value)}
              error={errors.city}
              placeholder="e.g., Mumbai"
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <SearchableSelect
              label="Referral Source"
              value={formData.referralSource}
              onChange={(value) => onChange('referralSource', value)}
              options={referralOptions}
              placeholder="Search referral source..."
            />
          </div>

          <div className={styles.formGroup}>
            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => onChange('address', e.target.value)}
              error={errors.address}
              placeholder="Full address"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Events
const Step2Events: React.FC<any> = ({ formData, onChange, errors }) => {
  const [newEvent, setNewEvent] = useState({
    eventType: '',
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: '',
    venue: '',
    venueLocation: '',
    teamMembers: [] as string[],
  });

  // Mock team members - in production, fetch from API
  const teamMemberOptions = [
    { value: 'tm1', label: 'John Doe - Photographer' },
    { value: 'tm2', label: 'Jane Smith - Videographer' },
    { value: 'tm3', label: 'Mike Johnson - Drone Operator' },
    { value: 'tm4', label: 'Sarah Williams - Editor' },
    { value: 'tm5', label: 'David Brown - Assistant' },
    { value: 'tm6', label: 'Emily Davis - Coordinator' },
  ];

  const eventTypeOptions = [
    { value: '', label: 'Select Event Type' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'pre_wedding', label: 'Pre-Wedding Shoot' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'conference', label: 'Conference' },
    { value: 'reception', label: 'Reception' },
    { value: 'party', label: 'Party' },
    { value: 'other', label: 'Other' },
  ];

  const handleAddEvent = () => {
    if (!newEvent.eventType || !newEvent.fromDate || !newEvent.venue) {
      return;
    }

    const event = {
      eventId: Date.now().toString(),
      eventName: eventTypeOptions.find(opt => opt.value === newEvent.eventType)?.label || '',
      fromDate: newEvent.fromDate,
      toDate: newEvent.toDate || newEvent.fromDate,
      fromTime: newEvent.fromTime,
      toTime: newEvent.toTime,
      venue: newEvent.venue,
      venueLocation: newEvent.venueLocation,
      teamMembers: newEvent.teamMembers,
    };

    const updatedEvents = [...formData.events, event].sort((a, b) => 
      new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
    );

    onChange('events', updatedEvents);
    
    setNewEvent({
      eventType: '',
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatEventTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = formData.events.filter((_: any, i: number) => i !== index);
    onChange('events', newEvents);
  };

  return (
    <div className={styles.form}>
      {/* Add Event Section */}
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <SearchableSelect
              label="Event Type"
              value={newEvent.eventType}
              onChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
              options={eventTypeOptions}
              placeholder="Search event type..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <DatePicker
              label="From Date & Time"
              value={newEvent.fromDate}
              onChange={(value) => setNewEvent({ ...newEvent, fromDate: value })}
              includeTime={true}
              timeValue={newEvent.fromTime}
              onTimeChange={(value) => setNewEvent({ ...newEvent, fromTime: value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <DatePicker
              label="To Date & Time"
              value={newEvent.toDate}
              onChange={(value) => setNewEvent({ ...newEvent, toDate: value })}
              minDate={newEvent.fromDate}
              includeTime={true}
              timeValue={newEvent.toTime}
              onTimeChange={(value) => setNewEvent({ ...newEvent, toTime: value })}
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Textarea
              label="Venue"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              placeholder="Enter venue name and address"
              required
              rows={2}
            />
          </div>
          <div className={styles.formGroup}>
            <Input
              label="Location (Map Link)"
              value={newEvent.venueLocation}
              onChange={(e) => setNewEvent({ ...newEvent, venueLocation: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className={styles.formGroup}>
            <MultiSelect
              label="Team Members"
              value={newEvent.teamMembers}
              onChange={(value) => setNewEvent({ ...newEvent, teamMembers: value })}
              options={teamMemberOptions}
              placeholder="Select team members..."
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.addEventButton}
          onClick={handleAddEvent}
          disabled={!newEvent.eventType || !newEvent.fromDate || !newEvent.venue}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>
      </div>

      {/* Events List Section */}
      <div className={styles.formSection} style={{ marginTop: '16px' }}>
        {errors.events && (
          <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {errors.events}
          </div>
        )}
        
        {formData.events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No events added yet. Add your first event above.</p>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {formData.events.map((event: any, index: number) => (
              <div key={index} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <div className={styles.eventName}>{event.eventName}</div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveEvent(index)}
                    title="Remove event"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className={styles.eventMeta}>
                  <div className={styles.eventMetaItem}>
                    <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={styles.metaText}>
                      <strong>From:</strong> {formatEventDate(event.fromDate)}{event.fromTime && `, ${formatEventTime(event.fromTime)}`}
                    </span>
                  </div>

                  {(event.toDate || event.toTime) && (
                    <div className={styles.eventMetaItem}>
                      <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={styles.metaText}>
                        <strong>To:</strong> {event.toDate ? formatEventDate(event.toDate) : formatEventDate(event.fromDate)}{event.toTime && `, ${formatEventTime(event.toTime)}`}
                      </span>
                    </div>
                  )}

                  <div className={styles.eventMetaItem}>
                    <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={styles.metaText}>{event.venue}</span>
                  </div>

                  {event.venueLocation && (
                    <a 
                      href={event.venueLocation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Map
                    </a>
                  )}
                </div>

                {event.teamMembers && event.teamMembers.length > 0 && (
                  <div className={styles.eventTeamMembers}>
                    <span className={styles.teamMembersLabel}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Team:
                    </span>
                    {event.teamMembers.map((memberId: string) => {
                      const member = teamMemberOptions.find(m => m.value === memberId);
                      return member ? (
                        <span key={memberId} className={styles.teamMemberChip}>
                          {member.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Step 3: Payment
const Step3Payment: React.FC<any> = ({ formData, onChange, errors }) => {
  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Total Budget"
              type="number"
              value={formData.totalBudget}
              onChange={(e) => onChange('totalBudget', e.target.value)}
              error={errors.totalBudget}
              placeholder="e.g., 150000"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="Advance Received"
              type="number"
              value={formData.advanceReceived}
              onChange={(e) => onChange('advanceReceived', e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Advance Received Date"
              type="date"
              value={formData.advanceReceivedDate}
              onChange={(e) => onChange('advanceReceivedDate', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Input
              label="Next Payment Date"
              type="date"
              value={formData.nextPaymentDate}
              onChange={(e) => onChange('nextPaymentDate', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => onChange('paymentTerms', e.target.value)}
              placeholder="e.g., 50% advance, 50% on delivery"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Team Assignment (Optional)
const Step4TeamAssignment: React.FC<any> = ({ formData, onChange }) => {
  const [selectedMember, setSelectedMember] = useState<Record<string, string>>({});
  
  // Mock team members - in production, fetch from API
  const teamMembers = [
    { value: 'tm1', label: 'John Doe - Photographer' },
    { value: 'tm2', label: 'Jane Smith - Videographer' },
    { value: 'tm3', label: 'Mike Johnson - Drone Operator' },
    { value: 'tm4', label: 'Sarah Williams - Editor' },
    { value: 'tm5', label: 'David Brown - Assistant' },
    { value: 'tm6', label: 'Emily Davis - Coordinator' },
  ];

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatEventTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAddMember = (eventId: string) => {
    const memberId = selectedMember[eventId];
    if (!memberId) return;
    
    const currentAssignments = formData.teamAssignments[eventId] || [];
    if (currentAssignments.includes(memberId)) {
      // Already added
      setSelectedMember({ ...selectedMember, [eventId]: '' });
      return;
    }
    
    const newAssignments = { ...formData.teamAssignments };
    newAssignments[eventId] = [...currentAssignments, memberId];
    onChange('teamAssignments', newAssignments);
    setSelectedMember({ ...selectedMember, [eventId]: '' });
  };

  const handleRemoveMember = (eventId: string, memberId: string) => {
    const currentAssignments = formData.teamAssignments[eventId] || [];
    const newAssignments = { ...formData.teamAssignments };
    newAssignments[eventId] = currentAssignments.filter((id: string) => id !== memberId);
    onChange('teamAssignments', newAssignments);
  };

  const getAvailableMembers = (eventId: string) => {
    const assignedMembers = formData.teamAssignments[eventId] || [];
    return [
      { value: '', label: 'Select team member...' },
      ...teamMembers.filter(m => !assignedMembers.includes(m.value))
    ];
  };

  if (formData.events.length === 0) {
    return (
      <div className={styles.form}>
        <div className={styles.formSection}>
          <div className={styles.emptyState}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              No events added yet. Add events in Step 2 to assign team members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.teamAssignmentList}>
          {formData.events.map((event: any) => {
            const assignedMembers = formData.teamAssignments[event.eventId] || [];
            
            return (
              <div key={event.eventId} className={styles.teamEventCard}>
                <div className={styles.teamEventHeader}>
                  <h4 className={styles.teamEventName}>{event.eventName}</h4>
                  <div className={styles.teamEventMeta}>
                    <div className={styles.teamEventMetaItem}>
                      <svg className={styles.teamEventIcon} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatEventDate(event.fromDate)}</span>
                    </div>
                    {event.fromTime && (
                      <div className={styles.teamEventMetaItem}>
                        <svg className={styles.teamEventIcon} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatEventTime(event.fromTime)}</span>
                      </div>
                    )}
                    {event.venue && (
                      <div className={styles.teamEventMetaItem}>
                        <svg className={styles.teamEventIcon} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.venue}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.teamEventBadge}>
                    {assignedMembers.length}
                  </div>
                </div>
                
                <div className={styles.teamSelectContainer}>
                  <div className={styles.selectWrapper}>
                    <SearchableSelect
                      value={selectedMember[event.eventId] || ''}
                      onChange={(value) => setSelectedMember({ ...selectedMember, [event.eventId]: value })}
                      options={getAvailableMembers(event.eventId)}
                      placeholder="Search team members..."
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => handleAddMember(event.eventId)}
                    disabled={!selectedMember[event.eventId]}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                  
                  {assignedMembers.map((memberId: string) => {
                    const member = teamMembers.find(m => m.value === memberId);
                    if (!member) return null;
                    
                    return (
                      <div key={memberId} className={styles.assignedMemberItem}>
                        <span className={styles.memberLabel}>{member.label}</span>
                        <button
                          type="button"
                          className={styles.removeMemberButton}
                          onClick={() => handleRemoveMember(event.eventId, memberId)}
                          title="Remove member"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Step 5: Review
const Step5Review: React.FC<any> = ({ formData, onEdit }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={styles.reviewContainer}>
      {/* Basic Details */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Basic Details</h3>
            <p className={styles.reviewSectionSubtitle}>Project and contact information</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Project Name</div>
            <div className={styles.reviewValue}>{formData.clientName || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Contact Person</div>
            <div className={styles.reviewValue}>{formData.contactPerson || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Bride</div>
            <div className={styles.reviewValue}>{formData.brideFirstName && formData.brideLastName ? `${formData.brideFirstName} ${formData.brideLastName}` : 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Groom</div>
            <div className={styles.reviewValue}>{formData.groomFirstName && formData.groomLastName ? `${formData.groomFirstName} ${formData.groomLastName}` : 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Email</div>
            <div className={styles.reviewValue}>{formData.email || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Phone</div>
            <div className={styles.reviewValue}>{formData.phone || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>City</div>
            <div className={styles.reviewValue}>{formData.city || 'N/A'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Referral Source</div>
            <div className={styles.reviewValue}>{formData.referralSource || 'N/A'}</div>
          </div>
        </div>
        {formData.address && (
          <div className={styles.reviewFullItem}>
            <div className={styles.reviewLabel}>Address</div>
            <div className={styles.reviewValue}>{formData.address}</div>
          </div>
        )}
      </div>

      {/* Events */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Events</h3>
            <p className={styles.reviewSectionSubtitle}>{formData.events.length} event{formData.events.length !== 1 ? 's' : ''} scheduled</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(2)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewEventsList}>
          {formData.events.length > 0 ? (
            formData.events.map((event: any, index: number) => (
              <div key={index} className={styles.reviewEventCard}>
                <div className={styles.reviewEventHeader}>
                  <div className={styles.reviewEventName}>{event.eventName}</div>
                </div>
                <div className={styles.reviewEventDetails}>
                  <div className={styles.reviewEventMeta}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <strong>From:</strong> {formatDate(event.fromDate)}{event.fromTime && `, ${formatTime(event.fromTime)}`}
                  </div>
                  {(event.toDate || event.toTime) && (
                    <div className={styles.reviewEventMeta}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <strong>To:</strong> {event.toDate ? formatDate(event.toDate) : formatDate(event.fromDate)}{event.toTime && `, ${formatTime(event.toTime)}`}
                    </div>
                  )}
                  <div className={styles.reviewEventMeta}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {event.venue}
                  </div>
                </div>
                {event.teamMembers && event.teamMembers.length > 0 && (
                  <div className={styles.reviewEventTeam}>
                    <div className={styles.reviewEventTeamLabel}>Team:</div>
                    <div className={styles.reviewEventTeamMembers}>
                      {event.teamMembers.length} member{event.teamMembers.length !== 1 ? 's' : ''} assigned
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.reviewEmptyState}>No events added</div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h3 className={styles.reviewSectionTitle}>Payment Details</h3>
            <p className={styles.reviewSectionSubtitle}>Budget and payment information</p>
          </div>
          <button className={styles.editButton} onClick={() => onEdit(3)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Total Budget</div>
            <div className={styles.reviewValue}>₹{formData.totalBudget || '0'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Advance Received</div>
            <div className={styles.reviewValue}>₹{formData.advanceReceived || '0'}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Advance Date</div>
            <div className={styles.reviewValue}>{formatDate(formData.advanceReceivedDate)}</div>
          </div>
          <div className={styles.reviewItem}>
            <div className={styles.reviewLabel}>Next Payment Date</div>
            <div className={styles.reviewValue}>{formatDate(formData.nextPaymentDate)}</div>
          </div>
        </div>
        {formData.paymentTerms && (
          <div className={styles.reviewFullItem}>
            <div className={styles.reviewLabel}>Payment Terms</div>
            <div className={styles.reviewValue}>{formData.paymentTerms}</div>
          </div>
        )}
      </div>
    </div>
  );
};
