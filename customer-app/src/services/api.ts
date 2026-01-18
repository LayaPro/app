const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const organizationApi = {
  getOrganization: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/get-organization`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching organization:', error);
      return { organization: null };
    }
  },
};
