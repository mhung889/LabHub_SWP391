import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';
import Login from './component/Login';
import StudentDashboard from './component/StudentDashboard';
import StudentProfile from './component/StudentProfile';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

           <Route path="/admin/lab-management" element={<Dashboard />} />
           <Route path="/login" element={<Login />} />
           <Route path="/student" element={<StudentDashboard />} />
           <Route path="/student/profile" element={<StudentProfile />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
