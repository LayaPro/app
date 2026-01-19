import { useEffect, useState } from 'react';
import { PinEntry } from '../proposal/components/PinEntry';
import { LoadingCurtain } from '../proposal/components/LoadingCurtain';
import { Proposal } from '../proposal/components/Proposal';
import { Timeline } from './Timeline';
import { AcceptedView } from './AcceptedView';
import Gallery from './Gallery';
import { customerPortalApi } from '../services/api';

type PortalStage = 'proposal' | 'accepted' | 'project' | 'gallery';

interface PortalData {
  portalStage: PortalStage;
  proposal: any;
  project: any;
  events: any[];
  gallery: any;
  organization: any;
}

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const CustomerPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  // Get access code from URL path - anything after the domain
  const getAccessCodeFromUrl = () => {
    const path = window.location.pathname;
    // Remove leading slash and get the first segment
    const segments = path.split('/').filter(Boolean);
    return segments[0] || '';
  };

  const accessCode = getAccessCodeFromUrl();

  // Check for existing auth cookie on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!accessCode) {
        setError('Invalid portal link');
        setIsLoading(false);
        return;
      }

      const cookieName = `portal_auth_${accessCode}`;
      const savedPin = getCookie(cookieName);

      if (savedPin) {
        try {
          // Store PIN in sessionStorage for API authentication
          customerPortalApi.setPin(savedPin);
          
          const response = await customerPortalApi.getPortalData(accessCode, savedPin);
          setPortalData(response);
          setIsAuthenticated(true);
        } catch (err) {
          // Invalid or expired PIN in cookie, clear it
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          customerPortalApi.clearPin();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [accessCode]);

  const handlePinSubmit = async (pin: string) => {
    if (!accessCode) {
      setError('Invalid portal link');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Store PIN in sessionStorage for API authentication
      customerPortalApi.setPin(pin);
      
      const response = await customerPortalApi.getPortalData(accessCode, pin);
      setPortalData(response);
      
      // Save PIN in cookie for 7 days
      const cookieName = `portal_auth_${accessCode}`;
      setCookie(cookieName, pin, 7);
      
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Invalid PIN. Please try again.');
      customerPortalApi.clearPin();
      setIsLoading(false);
    }
  };

  // Show loading on initial check
  if (isLoading && !error) {
    return <LoadingCurtain />;
  }

  if (!isAuthenticated) {
    return (
      <PinEntry 
        onSubmit={handlePinSubmit}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (!portalData) {
    return <LoadingCurtain />;
  }

  // Render based on portal stage
  switch (portalData.portalStage) {
    case 'gallery':
      // Show gallery with published images
      return (
        <Gallery 
          projectName={portalData.gallery?.projectName || portalData.project?.projectName}
          coverPhoto={portalData.gallery?.coverPhoto}
          clientName={portalData.gallery?.clientName}
          albumImages={portalData.gallery?.albumImages || []}
          events={portalData.events || []}
        />
      );

    case 'project':
      // Show timeline with events
      return (
        <Timeline 
          events={portalData.events || []}
          projectName={portalData.project?.projectName || portalData.proposal?.projectName}
          acceptedAt={portalData.proposal?.acceptedAt}
        />
      );

    case 'accepted':
      // Show "Quotation Accepted" view
      return (
        <AcceptedView 
          projectName={portalData.proposal?.projectName}
          organizationName={portalData.organization?.companyName}
        />
      );

    case 'proposal':
    default:
      // Show proposal for review/acceptance
      return (
        <Proposal 
          proposalData={portalData.proposal}
          organizationData={portalData.organization}
          accessCode={accessCode}
        />
      );
  }
};
