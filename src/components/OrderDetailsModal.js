import React from 'react';
import { STATUS_LABELS, DELIVERY_METHODS } from '../api/adminApi';
import './OrderDetailsModal.css';

const OrderDetailsModal = ({ order, onClose }) => {
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

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'comgate': 'Comgate (karta, internetové bankovnictví)',
      'dobirka': 'Dobírka (platba při převzetí)',
      'card': 'Platební karta (Visa, Mastercard)',
      'googlepay': 'Google Pay'
    };
    return methods[method] || method;
  };

  const getDeliveryMethodLabel = (method) => {
    return method === 'courier' ? 'Doručení na adresu' : 'Osobní odběr';
  };

  const calculateTotalItems = () => {
    if (!order.mattress_configuration || !Array.isArray(order.mattress_configuration)) return 0;
    return order.mattress_configuration.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const calculateTotalProducts = () => {
    if (!order.mattress_configuration || !Array.isArray(order.mattress_configuration)) return 0;
    return order.mattress_configuration.length;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detail objednávky #{order.id}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Order Status and Basic Info */}
          <div className="order-status-section">
            <div className="status-card">
              <div className="status-info">
                <h3>Stav objednávky</h3>
                <div className="current-status">
                  {STATUS_LABELS[order.status] || order.status}
                </div>
                {order.status_updated_at && (
                  <div className="status-updated">
                    Naposledy aktualizováno: {formatDate(order.status_updated_at)}
                  </div>
                )}
              </div>
              <div className="order-summary-stats">
                <div className="stat-item">
                  <div className="stat-value">{formatCurrency(order.total_price)}</div>
                  <div className="stat-label">Celková částka</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{calculateTotalProducts()}</div>
                  <div className="stat-label">Produktů</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{calculateTotalItems()}</div>
                  <div className="stat-label">Kusů celkem</div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="details-section">
            <h3>👤 Zákazník</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Jméno:</strong>
                <span>{order.customer_name}</span>
              </div>
              <div className="detail-item">
                <strong>E-mail:</strong>
                <span>{order.customer_email}</span>
              </div>
              <div className="detail-item">
                <strong>Telefon:</strong>
                <span>{order.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="details-section">
            <h3>📦 Informace o objednávce</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Datum vytvoření:</strong>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="detail-item">
                <strong>Způsob platby:</strong>
                <span>{getPaymentMethodLabel(order.payment_method)}</span>
              </div>
              <div className="detail-item">
                <strong>Způsob doručení:</strong>
                <span>
                  {order.delivery_method === 'courier' ? '🚚' : '🏪'}
                  {getDeliveryMethodLabel(order.delivery_method)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {order.delivery_method === 'courier' && (
            <div className="details-section">
              <h3>🚚 Doručení</h3>
              <div className="delivery-address">
                <div className="address-line">
                  <strong>Adresa:</strong>
                  <span>{order.delivery_address}</span>
                </div>
                <div className="address-line">
                  <strong>Město:</strong>
                  <span>{order.delivery_city}</span>
                </div>
                <div className="address-line">
                  <strong>PSČ:</strong>
                  <span>{order.delivery_postal_code}</span>
                </div>
                {order.delivery_date && (
                  <div className="address-line">
                    <strong>Plánované doručení:</strong>
                    <span>
                      {new Date(order.delivery_date).toLocaleDateString('cs-CZ')}
                      {order.delivery_time_slot && ` (${order.delivery_time_slot})`}
                    </span>
                  </div>
                )}
                {order.delivery_notes && (
                  <div className="address-line">
                    <strong>Poznámky k doručení:</strong>
                    <span>{order.delivery_notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products */}
          <div className="details-section">
            <h3>🛏️ Objednané produkty</h3>
            {order.mattress_configuration && Array.isArray(order.mattress_configuration) ? (
              <div className="products-list">
                {order.mattress_configuration.map((item, index) => (
                  <div key={index} className="product-item">
                    <div className="product-main">
                      <div className="product-name">{item.name}</div>
                      <div className="product-price">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                    <div className="product-details">
                      <span className="product-quantity">Počet kusů: {item.quantity}</span>
                      <span className="product-unit-price">Cena za kus: {formatCurrency(item.price)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="products-total">
                  <div className="total-line">
                    <strong>Celkem produktů: {calculateTotalProducts()}</strong>
                  </div>
                  <div className="total-line">
                    <strong>Celkem kusů: {calculateTotalItems()}</strong>
                  </div>
                  <div className="total-line final-total">
                    <strong>Celková částka: {formatCurrency(order.total_price)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-products">
                <span className="no-products-icon">📦</span>
                <p>Konfigurace produktů není dostupná</p>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {order.admin_notes && (
            <div className="details-section">
              <h3>📝 Poznámky administrátora</h3>
              <div className="admin-notes">
                {order.admin_notes}
              </div>
            </div>
          )}

          {/* Status History */}
          {order.order_status_history && order.order_status_history.length > 0 && (
            <div className="details-section">
              <h3>📋 Historie změn stavu</h3>
              <div className="status-history">
                {order.order_status_history.map((history, index) => (
                  <div key={history.id || index} className="history-item">
                    <div className="history-timeline">
                      <div className="timeline-dot"></div>
                      {index < order.order_status_history.length - 1 && (
                        <div className="timeline-line"></div>
                      )}
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-status">
                          {history.old_status && `${STATUS_LABELS[history.old_status] || history.old_status} → `}
                          <strong>{STATUS_LABELS[history.new_status] || history.new_status}</strong>
                        </span>
                        <span className="history-date">
                          {formatDate(history.changed_at)}
                        </span>
                      </div>
                      <div className="history-details">
                        <span className="history-admin">Změněno uživatelem: {history.changed_by}</span>
                        {history.admin_notes && (
                          <div className="history-notes">{history.admin_notes}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;