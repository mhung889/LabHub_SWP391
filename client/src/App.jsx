import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import Login from './pages/student/Login';
import ForgotPassword from './pages/student/ForgotPassword';
import ResetPassword from './pages/student/ResetPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentNotifications from './pages/student/StudentNotifications';
import MentorNotificationsPage from './pages/mentor/MentorNotificationsPage'
import AdminLayout from "./pages/admin/AdminLayout"
import AdminOverviewPage from "./pages/admin/AdminOverviewPage"
import AdminLabsPage from "./pages/admin/AdminLab/AdminLabsPage"
import AdminMentorsPage from "./pages/admin/AdminMentorsPage"
import AdminStudentsPage from "./pages/admin/AdminStudentsPage"
import MentorLayout from "./pages/mentor/MentorLayout"
import MentorDashboard from "./pages/mentor/MentorDashboard"
import MentorTasksPage from "./pages/mentor/MentorTasksPage"
import MentorStudentsPage from "./pages/mentor/MentorStudentsPage"


import LeaveRequestStudent from "./pages/student/LeaveRequestStudent";
import FaceRegisterPage from './pages/student/FaceRegisterPage';
import FaceAttendancePage from './pages/student/FaceAttendancePage';


function App() {
  return (
    <>
      <Toaster duration={1500} />

      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />

          {/* student */}
          <Route path='/login' element={<Login />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route path='/student' element={<StudentDashboard />} />
          <Route path='/student/profile' element={<StudentProfile />} />
          <Route path='/student/notifications' element={<StudentNotifications />} />
          <Route path='/student/leave' element={<LeaveRequestStudent />} />
          <Route path="/student/register-face" element={<FaceRegisterPage />} />
          <Route path="/student/attendance" element={<FaceAttendancePage />} />


          {/* mentor */}
          <Route path='/mentor' element={<MentorLayout />}>
            <Route index element={<MentorDashboard />} />
            <Route path='dashboard' element={<MentorDashboard />} />
            <Route path='tasks' element={<MentorTasksPage />} />
            <Route path='students' element={<MentorStudentsPage />} />
                      <Route path='notifications' element={<MentorNotificationsPage />} />
          </Route>


          {/* admin */}
          <Route path='/admin' element={<AdminLayout />}>
            {/* /admin => mặc định là overview */}
            <Route index element={<AdminOverviewPage />} />
            <Route path='overview' element={<AdminOverviewPage />} />
            <Route path='labs' element={<AdminLabsPage />} />
            <Route path='mentors' element={<AdminMentorsPage />} />
            <Route path='students' element={<AdminStudentsPage />} />
          </Route>

          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
