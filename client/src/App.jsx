import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/student/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import LeaveRequestStudent from './pages/student/leave-request/LeaveRequestStudent';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminLabsPage from './pages/admin/AdminLab/AdminLabsPage';
import AdminMentorsPage from './pages/admin/AdminMentorsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import MentorLayout from './pages/mentor/MentorLayout';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorTasksPage from './pages/mentor/MentorTasksPage';
import MentorStudentsPage from './pages/mentor/MentorStudentsPage';
import MentorLeaveRequestsPage from './pages/mentor/MentorLeaveRequestsPage';

function App() {
  return (
    <>
      <Toaster duration={1500} />

      <BrowserRouter>
        <Routes>
          {/* student */}
          <Route path='/login' element={<Login />} />
          <Route path='/student' element={<StudentDashboard />} />
          <Route path='/student/profile' element={<StudentProfile />} />
          <Route path='/student/leave' element={<LeaveRequestStudent />} />

          {/* mentor */}
          <Route path='/mentor' element={<MentorLayout />}>
            <Route index element={<MentorDashboard />} />
            <Route path='dashboard' element={<MentorDashboard />} />
            <Route path='tasks' element={<MentorTasksPage />} />
            <Route path='students' element={<MentorStudentsPage />} />
            <Route
              path='leave-requests'
              element={<MentorLeaveRequestsPage />}
            />
          </Route>

          {/* admin */}
          <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path='overview' element={<AdminOverviewPage />} />
            <Route path='labs' element={<AdminLabsPage />} />
            <Route path='mentors' element={<AdminMentorsPage />} />
            <Route path='students' element={<AdminStudentsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
