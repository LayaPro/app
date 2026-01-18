import { useState, useEffect } from 'react';
import styles from './Organization.module.css';
import { organizationApi } from '../../services/api.js';
import { Breadcrumb, Tabs } from '../../components/ui/index.js';
import type { Tab } from '../../components/ui/Tabs.js';
import { BasicDetailsCard } from './BasicDetailsCard';
import { TermsCard } from './TermsCard';
import { useToast } from '../../context/ToastContext';
import type { Organization } from '../../types/index.js';

const OrganizationPage = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
      if (!error.message.includes('404')) {
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

  const tabs: Tab[] = [
    {
      id: 'basicDetails',
      label: 'Basic Details',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      content: (
        <BasicDetailsCard
          organization={organization}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ),
    },
    {
      id: 'terms',
      label: 'Terms & Policies',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <TermsCard
          organization={organization}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />
      <Tabs tabs={tabs} />
    </div>
  );
};

export default OrganizationPage;
