import { useState, useEffect } from 'react';
import { Modal, SearchableSelect, Input, Button } from '../../../components/ui/index.js';
import { eventApi } from '../../../services/api.js';
import styles from './AddEventModal.module.css';

interface Service {
  type: string;
  label: string;
  count: number;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (eventData: any) => void;
  existingEventTypes?: string[];
}

const PHOTOGRAPHY_OPTIONS = [
  { value: 'candid', label: 'Candid Photographer' },
  { value: 'traditional', label: 'Traditional Photographer' },
];

const VIDEOGRAPHY_OPTIONS = [
  { value: 'cinematographer', label: 'Cinematographer' },
  { value: 'traditional', label: 'Traditional Videographer' },
  { value: 'drone', label: 'Drone Operator' },
];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingEventTypes = [],
}) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [photographyServices, setPhotographyServices] = useState<Service[]>([]);
  const [videographyServices, setVideographyServices] = useState<Service[]>([]);
  const [selectedPhotographyType, setSelectedPhotographyType] = useState('');
  const [photographyCount, setPhotographyCount] = useState<number | ''>(1);
  const [selectedVideographyType, setSelectedVideographyType] = useState('');
  const [videographyCount, setVideographyCount] = useState<number | ''>(1);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        console.log('Fetching events...');
        const response = await eventApi.getAll();
        console.log('Events response:', response);
        
        if (response && response.events && Array.isArray(response.events)) {
          const eventOptions = response.events.map((event: any) => ({
            value: event.eventId,
            label: event.eventDesc || event.eventCode,
          }));
          console.log('Mapped event options:', eventOptions);
          setEvents(eventOptions);
        } else {
          console.error('Invalid events response format:', response);
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const getAvailableEventOptions = () => {
    return events.filter(event => !existingEventTypes.includes(event.value));
  };

  const getAvailablePhotographyOptions = () => {
    const usedTypes = photographyServices.map(s => s.type);
    return PHOTOGRAPHY_OPTIONS.filter(opt => !usedTypes.includes(opt.value));
  };

  const getAvailableVideographyOptions = () => {
    const usedTypes = videographyServices.map(s => s.type);
    return VIDEOGRAPHY_OPTIONS.filter(opt => !usedTypes.includes(opt.value));
  };

  const addPhotographyService = () => {
    const count = typeof photographyCount === 'number' ? photographyCount : parseInt(String(photographyCount)) || 1;
    if (!selectedPhotographyType || count < 1) return;
    
    const label = PHOTOGRAPHY_OPTIONS.find(o => o.value === selectedPhotographyType)?.label || '';
    setPhotographyServices([...photographyServices, {
      type: selectedPhotographyType,
      label,
      count,
    }]);
    setSelectedPhotographyType('');
    setPhotographyCount(1);
  };

  const addVideographyService = () => {
    const count = typeof videographyCount === 'number' ? videographyCount : parseInt(String(videographyCount)) || 1;
    if (!selectedVideographyType || count < 1) return;
    
    const label = VIDEOGRAPHY_OPTIONS.find(o => o.value === selectedVideographyType)?.label || '';
    setVideographyServices([...videographyServices, {
      type: selectedVideographyType,
      label,
      count,
    }]);
    setSelectedVideographyType('');
    setVideographyCount(1);
  };

  const removePhotographyService = (index: number) => {
    setPhotographyServices(photographyServices.filter((_, i) => i !== index));
  };

  const removeVideographyService = (index: number) => {
    setVideographyServices(videographyServices.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!selectedEvent) {
      return;
    }

    const eventLabel = events.find(e => e.value === selectedEvent)?.label || '';
    
    onAdd({
      eventId: `evt-${Date.now()}`,
      eventName: eventLabel,
      eventType: selectedEvent,
      photographyServices: [...photographyServices],
      videographyServices: [...videographyServices],
      date: '',
      venue: '',
    });

    // Reset form
    setSelectedEvent('');
    setPhotographyServices([]);
    setVideographyServices([]);
    setSelectedPhotographyType('');
    setPhotographyCount(1);
    setSelectedVideographyType('');
    setVideographyCount(1);
    onClose();
  };

  const handleCancel = () => {
    setSelectedEvent('');
    setPhotographyServices([]);
    setVideographyServices([]);
    setSelectedPhotographyType('');
    setPhotographyCount(1);
    setSelectedVideographyType('');
    setVideographyCount(1);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add Event"
      size="medium"
    >
      <div className={styles.modalContent}>
        <div className={styles.formSection}>
          <SearchableSelect
            label="Event Type"
            value={selectedEvent}
            onChange={setSelectedEvent}
            options={getAvailableEventOptions()}
            placeholder={isLoadingEvents ? "Loading events..." : "Select event type"}
            required
            info="Choose the type of event from your configured events"
            disabled={isLoadingEvents}
          />
          {!isLoadingEvents && events.length === 0 && (
            <div style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '4px' }}>
              No events found. Please configure events in Event Setup first.
            </div>
          )}
        </div>

        <div className={styles.servicesSection}>
          <h3 className={styles.sectionTitle}>Photography Services</h3>
          
          {photographyServices.length > 0 && (
            <div className={styles.serviceList}>
              {photographyServices.map((service, index) => (
                <div key={index} className={styles.serviceItem}>
                  <span className={styles.serviceLabel}>
                    {service.label}: {service.count}
                  </span>
                  <button
                    type="button"
                    className={styles.removeServiceButton}
                    onClick={() => removePhotographyService(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.serviceInputGroup}>
            <div className={styles.serviceDropdown}>
              <SearchableSelect
                label="Service Type"
                value={selectedPhotographyType}
                onChange={setSelectedPhotographyType}
                options={getAvailablePhotographyOptions()}
                placeholder="Select service"
              />
            </div>
            <div className={styles.serviceCount}>
              <Input
                label="Count"
                type="number"
                value={photographyCount}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhotographyCount(val === '' ? '' : parseInt(val) || 1);
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  setPhotographyCount(Math.max(1, val || 1));
                }}
                min={1}
              />
            </div>
            <Button
              variant="secondary"
              onClick={addPhotographyService}
              disabled={!selectedPhotographyType}
              className={styles.addServiceButton}
            >
              Add
            </Button>
          </div>
        </div>

        <div className={styles.servicesSection}>
          <h3 className={styles.sectionTitle}>Videography Services</h3>
          
          {videographyServices.length > 0 && (
            <div className={styles.serviceList}>
              {videographyServices.map((service, index) => (
                <div key={index} className={styles.serviceItem}>
                  <span className={styles.serviceLabel}>
                    {service.label}: {service.count}
                  </span>
                  <button
                    type="button"
                    className={styles.removeServiceButton}
                    onClick={() => removeVideographyService(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.serviceInputGroup}>
            <div className={styles.serviceDropdown}>
              <SearchableSelect
                label="Service Type"
                value={selectedVideographyType}
                onChange={setSelectedVideographyType}
                options={getAvailableVideographyOptions()}
                placeholder="Select service"
              />
            </div>
            <div className={styles.serviceCount}>
              <Input
                label="Count"
                type="number"
                value={videographyCount}
                onChange={(e) => {
                  const val = e.target.value;
                  setVideographyCount(val === '' ? '' : parseInt(val) || 1);
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  setVideographyCount(Math.max(1, val || 1));
                }}
                min={1}
              />
            </div>
            <Button
              variant="secondary"
              onClick={addVideographyService}
              disabled={!selectedVideographyType}
              className={styles.addServiceButton}
            >
              Add
            </Button>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            variant="primary"
            disabled={!selectedEvent}
          >
            Add Event
          </Button>
        </div>
      </div>
    </Modal>
  );
};
