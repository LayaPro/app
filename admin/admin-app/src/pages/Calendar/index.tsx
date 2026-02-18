import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants.js';

const Calendar = () => {
  return <Navigate to={ROUTES.CALENDAR_EVENTS_CALENDAR} replace />;
};

export default Calendar;
