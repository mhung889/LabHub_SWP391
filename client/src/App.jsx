import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/student/Login';
import ForgotPassword from './pages/student/ForgotPassword';
import ResetPassword from './pages/student/ResetPassword';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentTasksPage from './pages/student/StudentTasksPage';
import StudentTaskDetailPage from './pages/student/StudentTaskDetailPage';
import LeaveRequestStudent from './pages/student/leave-request/LeaveRequestStudent';
import FaceRegisterPage from './pages/student/FaceRegisterPage';
import FaceAttendancePage from './pages/student/FaceAttendancePage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminLabsPage from './pages/admin/AdminLab/AdminLabsPage';
import AdminMentorsPage from './pages/admin/AdminMentorsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminMajorsPage from './pages/admin/AdminMajorsPage';

import MentorLayout from './pages/mentor/MentorLayout';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorTasksPage from './pages/mentor/MentorTasksPage';
import MentorStudentsPage from './pages/mentor/MentorStudentsPage';
import MentorLeaveRequestsPage from './pages/mentor/MentorLeaveRequestsPage';
import MentorNotificationsPage from './pages/mentor/MentorNotificationsPage';
import MentorProfile from './pages/mentor/MentorProfile';

import Forbidden from './pages/Forbidden';
import { RequireAuth, RequireRole } from '@/routes/guards';

function App() {
  return (
    <>
      <Toaster duration={1500} />
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path='/login' element={<Login />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route path='/403' element={<Forbidden />} />

          {/* protected */}
          <Route element={<RequireAuth />}>
            {/* student */}
            <Route element={<RequireRole allowedRoles={['student']} />}>
              <Route path='/student' element={<StudentDashboard />} />
              <Route path='/student/profile' element={<StudentProfile />} />
              <Route
                path='/student/notifications'
                element={<StudentNotifications />}
              />
              <Route path='/student/tasks' element={<StudentTasksPage />} />
              <Route
                path='/student/tasks/:id'
                element={<StudentTaskDetailPage />}
              />
              <Route path='/student/leave' element={<LeaveRequestStudent />} />
              <Route
                path='/student/register-face'
                element={<FaceRegisterPage />}
              />
              <Route
                path='/student/attendance'
                element={<FaceAttendancePage />}
              />
            </Route>

            {/* mentor */}
            <Route element={<RequireRole allowedRoles={['mentor']} />}>
              <Route path='/mentor' element={<MentorLayout />}>
                <Route index element={<MentorDashboard />} />
                <Route path='dashboard' element={<MentorDashboard />} />
                <Route path='tasks' element={<MentorTasksPage />} />
                <Route path='students' element={<MentorStudentsPage />} />
                <Route
                  path='leave-requests'
                  element={<MentorLeaveRequestsPage />}
                />
                <Route
                  path='notifications'
                  element={<MentorNotificationsPage />}
                />
                <Route path='profile' element={<MentorProfile />} />
              </Route>
            </Route>

            {/* admin */}
            <Route element={<RequireRole allowedRoles={['admin']} />}>
              <Route path='/admin' element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path='overview' element={<AdminOverviewPage />} />
                <Route path='labs' element={<AdminLabsPage />} />
                <Route path='mentors' element={<AdminMentorsPage />} />
                <Route path='students' element={<AdminStudentsPage />} />
                <Route path='majors' element={<AdminMajorsPage />} />
              </Route>
            </Route>
          </Route>

          {/* default */}
          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
