import { Navigate, Outlet } from 'react-router-dom';
import { getUser, isLoggedIn } from '../services/api';

export default function GuestRoute() {
  const user = getUser();

  if (user && isLoggedIn()) {
    const dashboardPath = user.role === 'admin' ? '/admin' : '/teacher';
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}
