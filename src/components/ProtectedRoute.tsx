import { Navigate, Outlet } from 'react-router-dom';
import { getUser } from '../services/api';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = getUser();

  if (!user) {
    // Tidak login, lempar ke login
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Jika rolenya tidak diizinkan, kembalikan ke dashboard miliknya masing-masing
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/teacher" replace />;
    }
  }

  // Jika aman, render child routes (Outlet)
  return <Outlet />;
}
