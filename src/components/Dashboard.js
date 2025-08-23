import React, { useState, useEffect } from 'react';
import { getOrderStatistics, getOrders } from '../api/adminApi';
import { STATUS_LABELS, ORDER_STATUSES } from '../api/adminApi';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [statistics, setStatistics] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, ordersData] = await Promise.all([
        getOrderStatistics(),
        getOrders({}, { page: 1, limit: 10 })
      ]);
      
      setStatistics(stats);
      setRecentOrders(ordersData.orders);
    } catch (err) {
      setError('Chyba při načítání dat');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalOrders = () => {
    return statistics.reduce((sum, stat) => sum + stat.count, 0);
  };

  const getTotalRevenue = () => {
    return statistics.reduce((sum, stat) => sum + (stat.total_value || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUSES.PROCESSING]: '#ffc107',
      [ORDER_STATUSES.APPROVED]: '#28a745',
      [ORDER_STATUSES.HANDED_OVER]: '#007bff',
      [ORDER_STATUSES.DELIVERED]: '#28a745',
      [ORDER_STATUSES.READY_FOR_PICKUP]: '#17a2b8',
      [ORDER_STATUSES.PICKED_UP]: '#28a745',
      [ORDER_STATUSES.CANCELED]: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Načítám přehled...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-btn">
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Přehled objednávek</h1>
        <p>Celkový pohled na stav všech objednávek</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Celkem objednávek</h3>
            <div className="card-value">{getTotalOrders()}</div>
          </div>
        </div>

        <div className="summary-card revenue">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Celkový obrat</h3>
            <div className="card-value">{formatCurrency(getTotalRevenue())}</div>
          </div>
        </div>

        <div className="summary-card processing">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>Ke zpracování</h3>
            <div className="card-value">
              {statistics.find(s => s.status === ORDER_STATUSES.PROCESSING)?.count || 0}
            </div>
          </div>
        </div>

        <div className="summary-card avg-order">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Průměrná objednávka</h3>
            <div className="card-value">
              {formatCurrency(getTotalOrders() > 0 ? getTotalRevenue() / getTotalOrders() : 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="dashboard-grid">
        <div className="status-breakdown">
          <h2>Rozdělení podle stavů</h2>
          <div className="status-list">
            {statistics.map((stat) => (
              <div key={stat.status} className="status-item">
                <div className="status-info">
                  <div 
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(stat.status) }}
                  ></div>
                  <span className="status-label">
                    {STATUS_LABELS[stat.status] || stat.status}
                  </span>
                </div>
                <div className="status-stats">
                  <span className="status-count">{stat.count}</span>
                  <span className="status-value">{formatCurrency(stat.total_value || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="recent-orders">
          <h2>Nejnovější objednávky</h2>
          <div className="orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-header">
                    <span className="order-id">#{order.id}</span>
                    <span 
                      className="order-status"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="order-details">
                    <div className="order-customer">{order.customer_name}</div>
                    <div className="order-price">{formatCurrency(order.total_price)}</div>
                  </div>
                  <div className="order-date">
                    {new Date(order.created_at).toLocaleDateString('cs-CZ')}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders">
                <span className="no-orders-icon">📦</span>
                <p>Žádné objednávky</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;