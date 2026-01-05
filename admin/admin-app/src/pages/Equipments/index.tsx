import { useState, useEffect } from 'react';
import styles from './Equipments.module.css';
import { Breadcrumb, Tabs } from '../../components/ui/index.js';
import type { Tab } from '../../components/ui/Tabs';
import { EquipmentsCard } from './EquipmentsCard';
import { equipmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Equipments = () => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await equipmentApi.getAll();
      setEquipments(response.equipment || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load equipments');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  const tabs: Tab[] = [
    {
      id: 'all',
      label: 'All Equipment',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      badge: equipments.length,
      content: (
        <EquipmentsCard
          equipments={equipments}
          loading={loading}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', path: '/' },
          { label: 'Equipments' }
        ]} 
      />
      
      <div className={styles.content}>
        <Tabs tabs={tabs} defaultActiveTab="all" />
      </div>
    </div>
  );
};

export default Equipments;

