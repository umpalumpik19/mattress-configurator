import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles.css';
import App from './App';
import AdminPanel from './components/AdminPanel';

const entry = process.env.REACT_APP_ENTRY || 'main';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (entry === 'admin') {
  root.render(
    <React.StrictMode>
      <AdminPanel />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
