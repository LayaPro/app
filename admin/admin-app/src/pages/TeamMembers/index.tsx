import { useState, useEffect } from 'react';
import styles from './TeamMembers.module.css';
import { Breadcrumb } from '../../components/ui/index.js';
import { TeamMembersCard } from './TeamMembersCard';
import { WorkProfilesCard } from './WorkProfilesCard';
import { teamApi, profileApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeamMembers = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>('teamMembers');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [teamResponse, profilesResponse] = await Promise.all([
        teamApi.getAll(),
        profileApi.getAll()
      ]);
      
      setTeamMembers(teamResponse.teamMembers || []);
      setProfiles(profilesResponse.profiles || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
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
    <div className={styles.pageContainer}>
      <Breadcrumb />

      <div className={styles.cardsContainer}>
        <TeamMembersCard
          teamMembers={teamMembers}
          profiles={profiles}
          loading={loading}
          isExpanded={expandedCard === 'teamMembers'}
          onToggle={() => toggleCard('teamMembers')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />

        <WorkProfilesCard
          profiles={profiles}
          loading={loading}
          isExpanded={expandedCard === 'workProfiles'}
          onToggle={() => toggleCard('workProfiles')}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default TeamMembers;
