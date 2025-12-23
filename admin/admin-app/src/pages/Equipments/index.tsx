import { useState, useEffect } from 'react';
import styles from './Equipments.module.css';
import { Breadcrumb } from '../../components/ui/index.js';
import { EquipmentsCard } from './EquipmentsCard';
import { equipmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Equipments = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('equipments');
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

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleSuccess = (message: string) => {
    showToast('success', message);
  };

  const handleError = (message: string) => {
    showToast('error', message);
  };

  return (
    <div className={styles.container}>
      <Breadcrumb 
        items={[
          { label: 'Dashboard', path: '/' },
          { label: 'Equipments' }
        ]} 
      />
      
      <div className={styles.content}>
        <EquipmentsCard
          equipments={equipments}
          loading={loading}
          isExpanded={expandedCard === 'equipments'}
          onToggle={() => toggleCard('equipments')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default Equipments;

