import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/admin/DashboardPage';
import InventoryPage from './pages/admin/InventoryPage';
// import LoansPage from './pages/admin/LoansPage'; // Hidden based on request
import ReportsPage from './pages/admin/ReportsPage';
import AdminRequestsPage from './pages/admin/RequestsPage';

import TeacherLayout from './components/TeacherLayout';
import TeacherDashboardPage from './pages/teacher/DashboardPage';
import TeacherInventoryPage from './pages/teacher/InventoryPage';
// import TeacherRequestsPage from './pages/teacher/RequestsPage'; // Hidden based on request
import TeacherLoansPage from './pages/teacher/LoansPage';
import TeacherReportsPage from './pages/teacher/ReportsPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            {/* <Route path="loans" element={<LoansPage />} /> */}
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="inventory" element={<TeacherInventoryPage />} />
            {/* <Route path="requests" element={<TeacherRequestsPage />} /> */}
            <Route path="loans" element={<TeacherLoansPage />} />
            <Route path="reports" element={<TeacherReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
