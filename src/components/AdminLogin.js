import React, { useState } from 'react';
import { useAdminAuth } from '../services/adminAuth';
import './AdminLogin.css';

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, loading } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Vyplňte všechna pole');
      return;
    }

    try {
      const result = await login(credentials.username, credentials.password);
      if (result.success) {
        onLogin();
      } else {
        setError(result.error || 'Nesprávné přihlašovací údaje');
      }
    } catch (err) {
      setError('Chyba při přihlašování');
      console.error('Login error:', err);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Administrace</h1>
          <p>Matrace Konfigurátor</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Uživatelské jméno</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Zadejte uživatelské jméno"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Heslo</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Zadejte heslo"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Přihlašuji...
              </>
            ) : (
              'Přihlásit se'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Pro testování: uživatel <strong>123</strong>, heslo <strong>123</strong></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;