import { useState } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';
import { Login } from './component/Login';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

           <Route path="/admin/lab-management" element={<Dashboard />} />
           <Route path="/login" element={<Login />} />
        
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
