import { useState, useEffect } from 'react';
import styles from './TeamMembers.module.css';
import { Breadcrumb } from '../../components/ui/index.js';
import { Tabs } from '../../components/ui/Tabs';
import { TeamMembersCard } from './TeamMembersCard';
import { WorkProfilesCard } from './WorkProfilesCard';
import { teamApi, profileApi, roleApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [teamResponse, profilesResponse, rolesData] = await Promise.all([
        teamApi.getAll(),
        profileApi.getAll(),
        roleApi.getAll()
      ]);
      
      setTeamMembers(teamResponse.teamMembers || []);
      setProfiles(profilesResponse.profiles || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
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

  const tabs = [
    {
      id: 'members',
      label: 'Team Members',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: teamMembers.length,
      content: (
        <TeamMembersCard
          teamMembers={teamMembers}
          profiles={profiles}
          roles={roles}
          loading={loading}
          isExpanded={true}
          onToggle={() => {}}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
    {
      id: 'profiles',
      label: 'Work Profiles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      badge: profiles.length,
      content: (
        <WorkProfilesCard
          profiles={profiles}
          loading={loading}
          isExpanded={true}
          onToggle={() => {}}
          onSuccess={handleSuccess}
          onError={handleError}
          onRefresh={fetchData}
        />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb />
      <Tabs tabs={tabs} defaultActiveTab="members" />
    </div>
  );
};

export default TeamMembers;
