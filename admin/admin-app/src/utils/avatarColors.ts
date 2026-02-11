/**
 * Get consistent avatar colors based on name hash
 */
export const getAvatarColors = (name: string) => {
  const colors = [
    { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', border: 'rgba(99, 102, 241, 0.2)' },    // indigo
    { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' },    // blue
    { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },      // green
    { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },    // amber
    { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' },      // red
    { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: 'rgba(236, 72, 153, 0.2)' },    // pink
    { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },      // cyan
    { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },    // teal
    { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.2)' },    // orange
    { bg: 'rgba(168, 85, 247, 0.1)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.2)' },    // violet
    { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },      // yellow
    { bg: 'rgba(14, 165, 233, 0.1)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.2)' },    // sky
    { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },    // emerald
    { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },      // rose
  ];
  
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get initials from a name (filters out '&' and 'and', takes first letter of first two words)
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(word => word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};
