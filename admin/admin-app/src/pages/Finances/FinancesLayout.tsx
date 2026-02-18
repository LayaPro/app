import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from '../../utils/constants.js';

const FinancesLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to overview page if on base /finances route
  useEffect(() => {
    if (location.pathname === ROUTES.FINANCES || location.pathname === ROUTES.FINANCES + '/') {
      navigate(ROUTES.FINANCES_OVERVIEW, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <Outlet />;
};

export default FinancesLayout;
