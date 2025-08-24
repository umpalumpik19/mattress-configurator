import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../services/adminAuth';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import OrdersTable from './OrdersTable';
import Dashboard from './Dashboard';
import './AdminPanel.css';

const AdminPanel = () => {
  const { isAuthenticated, user } = useAdminAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      setAuthChecked(true);
      setLoading(false);
    };
    
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Force re-render when authentication changes
  useEffect(() => {
    if (authChecked) {
      setLoading(false);
    }
  }, [isAuthenticated, authChecked]);

  const handleLogin = () => {
    console.log('handleLogin called, setting dashboard page');
    setCurrentPage('dashboard');
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'orders':
        return <OrdersTable statusFilter="all" user={user} />;
      case 'processing':
        return <OrdersTable statusFilter="processing" user={user} />;
      case 'approved':
        return <OrdersTable statusFilter="approved" user={user} />;
      case 'delivery':
        return <OrdersTable statusFilter="handed_over" user={user} />;
      case 'pickup':
        return <OrdersTable statusFilter="ready_for_pickup" user={user} />;
      case 'completed':
        return <OrdersTable statusFilter="completed" user={user} />;
      case 'canceled':
        return <OrdersTable statusFilter="canceled" user={user} />;
      default:
        return <Dashboard />;
    }
  };

  console.log('AdminPanel render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'authChecked:', authChecked, 'user:', user);
  
  // Force clear any corrupted auth state on first load
  useEffect(() => {
    const authData = localStorage.getItem('mattress_admin_auth');
    if (authData && !authChecked) {
      try {
        const parsed = JSON.parse(authData);
        // If auth data is corrupted or missing required fields, clear it
        if (!parsed.loginTime || !parsed.username) {
          console.log('Clearing corrupted auth data');
          localStorage.removeItem('mattress_admin_auth');
        }
      } catch (error) {
        console.log('Clearing invalid auth data');
        localStorage.removeItem('mattress_admin_auth');
      }
    }
  }, [authChecked]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Načítám administraci...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, showing login');
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminLayout 
      currentPage={currentPage} 
      onPageChange={handlePageChange}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;