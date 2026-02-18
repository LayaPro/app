import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from '../../utils/constants.js';

const OrganizationLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === ROUTES.ORGANIZATION || location.pathname === ROUTES.ORGANIZATION + '/') {
      navigate(ROUTES.ORGANIZATION_BASIC_DETAILS, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <Outlet />;
};

export default OrganizationLayout;
