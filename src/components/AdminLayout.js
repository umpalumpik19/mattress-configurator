import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../services/adminAuth';
import { getOrderStatistics } from '../api/adminApi';
import './AdminLayout.css';

const AdminLayout = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAdminAuth();
  const [statistics, setStatistics] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await getOrderStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navigation = [
    {
      id: 'dashboard',
      label: 'Přehled',
      icon: '📊',
      count: statistics.reduce((sum, stat) => sum + stat.count, 0)
    },
    {
      id: 'orders',
      label: 'Objednávky',
      icon: '📦',
      count: statistics.find(s => s.status === 'processing')?.count || 0
    },
    {
      id: 'processing',
      label: 'Zpracovává se',
      icon: '⏳',
      count: statistics.find(s => s.status === 'processing')?.count || 0
    },
    {
      id: 'approved',
      label: 'Schválené',
      icon: '✅',
      count: statistics.find(s => s.status === 'approved')?.count || 0
    },
    {
      id: 'delivery',
      label: 'K doručení',
      icon: '🚚',
      count: statistics.find(s => s.status === 'handed_over')?.count || 0
    },
    {
      id: 'pickup',
      label: 'K vyzvednutí',
      icon: '🏪',
      count: statistics.find(s => s.status === 'ready_for_pickup')?.count || 0
    },
    {
      id: 'completed',
      label: 'Dokončené',
      icon: '🎉',
      count: (statistics.find(s => s.status === 'delivered')?.count || 0) + 
             (statistics.find(s => s.status === 'picked_up')?.count || 0)
    },
    {
      id: 'canceled',
      label: 'Zrušené',
      icon: '❌',
      count: statistics.find(s => s.status === 'canceled')?.count || 0
    }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">⚙️</span>
            <span className="brand-text">Admin Panel</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => onPageChange(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.count > 0 && (
                    <span className="nav-count">{item.count}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <div className="user-details">
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role">Administrátor</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Odhlásit se
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="page-title">
              {navigation.find(n => n.id === currentPage)?.label || 'Administrace'}
            </h1>
          </div>
          <div className="header-right">
            <span className="current-time">
              {new Date().toLocaleString('cs-CZ')}
            </span>
            <button className="header-user" onClick={handleLogout}>
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.fullName}</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;