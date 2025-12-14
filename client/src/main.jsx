import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Bootstrap JS + Popper
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import bootstrap as namespace
import * as bootstrap from 'bootstrap';

//  Gán bootstrap vào window để toàn bộ app dùng được Modal, Toast, Collapse...
window.bootstrap = bootstrap;

createRoot(document.getElementById('root')).render(
    <App />
)
