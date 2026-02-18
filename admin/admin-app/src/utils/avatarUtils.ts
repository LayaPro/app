export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

export const getAvatarGradient = (name: string) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // indigo to purple
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // pink to rose
    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // blue to cyan
    'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', // emerald to teal
    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', // amber to orange
    'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', // purple to fuchsia
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // cyan to blue
    'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', // red to orange
  ];
  return gradients[(name?.charCodeAt(0) || 0) % gradients.length];
};
