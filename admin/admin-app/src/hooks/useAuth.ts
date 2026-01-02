import { useAppSelector } from '../store/index.js';

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    isAdmin: auth.user?.roleName === 'Admin',
  };
};
