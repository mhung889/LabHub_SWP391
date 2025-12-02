import { useState } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

           <Route path="/admin/lab-management" element={<Dashboard />} />
        
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
