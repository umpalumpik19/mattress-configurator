import React, { useState, useEffect, useCallback } from 'react';
import { getOrders, updateOrderStatus, STATUS_LABELS, ORDER_STATUSES, DELIVERY_METHODS, getAvailableStatusTransitions } from '../api/adminApi';
import OrderStatusModal from './OrderStatusModal';
import OrderDetailsModal from './OrderDetailsModal';
import './OrdersTable.css';

const OrdersTable = ({ statusFilter = 'all', user }) => {
  console.log('OrdersTable received user:', user);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 20
  });
  
  const [filters, setFilters] = useState({
    status: statusFilter,
    deliveryMethod: 'all',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const loadOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle "completed" filter to show both delivered and picked_up
      let statusForFilter = statusFilter !== 'all' ? statusFilter : filters.status;
      if (statusFilter === 'completed') {
        statusForFilter = 'all'; // We'll filter on the client side for completed
      }
      
      const result = await getOrders(
        {
          ...filters,
          status: statusForFilter
        },
        { page, limit: pagination.limit }
      );
      
      // Client-side filtering for "completed" status
      if (statusFilter === 'completed') {
        result.orders = result.orders.filter(order => 
          order.status === ORDER_STATUSES.DELIVERED || 
          order.status === ORDER_STATUSES.PICKED_UP
        );
      }
      
      setOrders(result.orders);
      setPagination(prev => ({
        ...prev,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount
      }));
    } catch (err) {
      setError('Chyba při načítání objednávek');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, statusFilter, pagination.limit]);

  useEffect(() => {
    loadOrders(1);
  }, [filters, statusFilter]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, options = {}) => {
    try {
      console.log('handleStatusUpdate called with:', { orderId, newStatus, options, user });
      
      if (!user?.username) {
        throw new Error('User not authenticated');
      }
      
      await updateOrderStatus(orderId, newStatus, user.username, options);
      await loadOrders(pagination.currentPage);
      setStatusModalOpen(false);
      setSelectedOrder(null);
      
      // Show success message
      showNotification('Stav objednávky byl úspěšně aktualizován', 'success');
    } catch (err) {
      console.error('Error updating order status:', err);
      console.error('Full error object:', err);
      showNotification(`Chyba při aktualizaci stavu objednávky: ${err.message}`, 'error');
    }
  };

  const showNotification = (message, type) => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUSES.PENDING]: '#ffc107',        // Добавлено - желтый как и processing
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

  const getDeliveryMethodIcon = (method) => {
    return method === 'courier' ? '🚚' : '🏪';
  };

  if (error) {
    return (
      <div className="orders-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={() => loadOrders(1)} className="retry-btn">
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div className="orders-table-container">
      {/* Header */}
      <div className="orders-header">
        <div className="header-info">
          <h1>
            {statusFilter === 'all' ? 'Všechny objednávky' : 
             statusFilter === 'completed' ? 'Dokončené objednávky' :
             STATUS_LABELS[statusFilter]}
          </h1>
          <p>Celkem: {pagination.totalCount} objednávek</p>
        </div>
        <button onClick={() => loadOrders(pagination.currentPage)} className="refresh-btn">
          🔄 Obnovit
        </button>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Hledat podle jména, emailu nebo ID objednávky..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-row">
          {statusFilter === 'all' && (
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">Všechny stavy</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          )}

          <select
            value={filters.deliveryMethod}
            onChange={(e) => handleFilterChange('deliveryMethod', e.target.value)}
            className="filter-select"
          >
            <option value="all">Všechny doručení</option>
            <option value="courier">Doručení na adresu</option>
            <option value="pickup">Osobní odběr</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="filter-date"
            placeholder="Od"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="filter-date"
            placeholder="Do"
          />

          <button
            onClick={() => setFilters({
              status: statusFilter,
              deliveryMethod: 'all',
              searchTerm: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="clear-filters-btn"
          >
            Vymazat filtry
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
            <p>Načítám objednávky...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <span className="no-orders-icon">📦</span>
            <h3>Žádné objednávky</h3>
            <p>Pro aktuální filtry nebyly nalezeny žádné objednávky.</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">
                  ID objednávky
                  {sortField === 'id' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('customer_name')} className="sortable">
                  Zákazník
                  {sortField === 'customer_name' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('total_price')} className="sortable">
                  Částka
                  {sortField === 'total_price' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Doručení</th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Stav
                  {sortField === 'status' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Datum vytvoření
                  {sortField === 'created_at' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isDisabled = order.status === ORDER_STATUSES.DELIVERED || order.status === ORDER_STATUSES.PICKED_UP || order.status === ORDER_STATUSES.CANCELED;
                
                return (
                  <tr key={order.id} className="order-row">
                    <td className="order-id">#{order.id}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="customer-email">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="order-price">{formatCurrency(order.total_price)}</td>
                    <td>
                      <span className="delivery-method">
                        {getDeliveryMethodIcon(order.delivery_method)}
                        {order.delivery_method === 'courier' ? 'Doručení' : 'Odběr'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(order.status),
                          color: 'white'
                        }}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="order-date">{formatDate(order.created_at)}</td>
                    <td>
                      <div className="order-actions">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailsModalOpen(true);
                          }}
                          className="action-btn view-btn"
                          title="Zobrazit detail"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusModalOpen(true);
                          }}
                          className="action-btn status-btn"
                          title="Změnit stav"
                          disabled={isDisabled}
                        >
                          ⚡
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => loadOrders(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || loading}
            className="pagination-btn"
          >
            ← Předchozí
          </button>
          
          <div className="pagination-info">
            Stránka {pagination.currentPage} z {pagination.totalPages}
          </div>
          
          <button
            onClick={() => loadOrders(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || loading}
            className="pagination-btn"
          >
            Další →
          </button>
        </div>
      )}

      {/* Modals */}
      {statusModalOpen && selectedOrder && (
        <OrderStatusModal
          order={selectedOrder}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {detailsModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrdersTable;