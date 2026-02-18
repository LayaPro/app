import { useState, useCallback } from 'react';
import type { ClientEvent } from '@/types/shared';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import CalendarPageBase from './components/CalendarPageBase';

const TeamCalendar = () => {
  const [teamMembersList, setTeamMembersList] = useState<Array<{ memberId: string; firstName: string; lastName: string; profilePic?: string }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const handleDataLoaded = useCallback((membersMap: Map<string, any>) => {
    setTeamMembersList(Array.from(membersMap.values()));
  }, []);

  const filterEvents = useCallback(
    (events: ClientEvent[]) => {
      const withTeam = events.filter(
        (e) => e.teamMembersAssigned && e.teamMembersAssigned.length > 0
      );
      if (!selectedMemberId) return withTeam;
      return withTeam.filter((e) => e.teamMembersAssigned!.includes(selectedMemberId));
    },
    [selectedMemberId]
  );

  const memberOptions = [
    { value: '', label: 'All Members' },
    ...teamMembersList.map((m) => ({
      value: m.memberId,
      label: `${m.firstName} ${m.lastName}`,
    })),
  ];

  const extraHeader =
    teamMembersList.length > 0 ? (
      <div style={{ marginBottom: '1.25rem', maxWidth: '280px' }}>
        <SearchableSelect
          value={selectedMemberId}
          onChange={setSelectedMemberId}
          options={memberOptions}
          placeholder="Filter by team member..."
        />
      </div>
    ) : null;

  return (
    <CalendarPageBase
      filterEvents={filterEvents}
      extraHeader={extraHeader}
      onDataLoaded={handleDataLoaded}
    />
  );
};

export default TeamCalendar;
