import { useState, useEffect } from 'react';
import { PageHeader, HelpPanel } from '../../components/help/index.js';
import { getHelpContent } from '../../data/helpContent.js';
import { organizationApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { DeliverablesCard } from './DeliverablesCard.js';
import type { Organization } from '../../types/index.js';
import pageStyles from '../Page.module.css';

const OrganizationDeliverables = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const { showToast } = useToast();
  const helpContent = getHelpContent('organization');

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationApi.get();
      setOrganization(response.organization || null);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      if (!error.message?.includes('404')) {
        showToast('error', 'Unable to load organization data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
    fetchOrganization();
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  return (
    <div className={pageStyles.pageContainer}>
      <PageHeader onHelpClick={() => setShowHelp(true)} />
      <div style={{ marginBottom: '24px' }}>
        <h1 className={pageStyles.pageTitle}>Deliverables</h1>
        <p className={pageStyles.pageDescription}>Define deliverables that will be included in your proposals. These items will be shown to clients in proposals.</p>
      </div>
      <DeliverablesCard
        organization={organization}
        loading={loading}
        onSuccess={handleSuccess}
        onError={handleError}
      />
      {showHelp && helpContent && (
        <HelpPanel help={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default OrganizationDeliverables;
