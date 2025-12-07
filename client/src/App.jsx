import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import Login from './pages/student/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import AdminLayout from "./pages/admin/AdminLayout"
import AdminOverviewPage from "./pages/admin/AdminOverviewPage"
import AdminLabsPage from "./pages/admin/AdminLab/AdminLabsPage"
import AdminMentorsPage from "./pages/admin/AdminMentorsPage"
import AdminStudentsPage from "./pages/admin/AdminStudentsPage"

function App() {
  return (
    <>
      <Toaster />

      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />

          {/* student */}
            <Route path='/login' element={<Login />} />
            <Route path='/student' element={<StudentDashboard />} />
            <Route path='/student/profile' element={<StudentProfile />} />
          

          {/* mentor */}


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
