import React, { useState } from 'react';
import { STATUS_LABELS, DELIVERY_METHODS, getAvailableStatusTransitions, ORDER_STATUSES } from '../api/adminApi';
import './OrderStatusModal.css';

const OrderStatusModal = ({ order, onClose, onStatusUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);

  const availableTransitions = getAvailableStatusTransitions(order.status, order.delivery_method);
  const isDelivery = order.delivery_method === 'courier';
  const isPickup = order.delivery_method === 'pickup';


  const getStatusAction = (status) => {
    switch (status) {
      case ORDER_STATUSES.APPROVED:
        return 'Schválit objednávku';
      case ORDER_STATUSES.HANDED_OVER:
        return 'Předat k doručení';
      case ORDER_STATUSES.DELIVERED:
        return 'Označit jako doručeno';
      case ORDER_STATUSES.READY_FOR_PICKUP:
        return 'Připravit k vyzvednutí';
      case ORDER_STATUSES.PICKED_UP:
        return 'Označit jako vyzvednuto';
      case ORDER_STATUSES.CANCELED:
        return 'Zrušit objednávku';
      default:
        return 'Změnit stav';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case ORDER_STATUSES.APPROVED:
        return isDelivery 
          ? 'Objednávka bude schválena a zákazník dostane email s potvrzením o zpracování.'
          : 'Objednávka bude schválena a zákazník dostane email s potvrzením o zpracování.';
      case ORDER_STATUSES.HANDED_OVER:
        return 'Objednávka bude předána k doručení. Zákazník dostane email s informací o předání a časovém okně doručení.';
      case ORDER_STATUSES.DELIVERED:
        return 'Objednávka bude označena jako doručena. Zákazník dostane potvrzovací email.';
      case ORDER_STATUSES.READY_FOR_PICKUP:
        return 'Objednávka bude připravena k vyzvednutí. Zákazník dostane email s informací o možnosti vyzvednutí.';
      case ORDER_STATUSES.PICKED_UP:
        return 'Objednávka bude označena jako úspěšně vyzvednuta. Zákazník dostane potvrzovací email.';
      case ORDER_STATUSES.CANCELED:
        return 'Objednávka bude zrušena. Zákazník dostane email s informací o zrušení.';
      default:
        return '';
    }
  };

  const getEmailPreview = (status) => {
    switch (status) {
      case ORDER_STATUSES.APPROVED:
        return isDelivery
          ? 'Vaše objednávka byla úspěšně zpracována a bude doručena včas.'
          : 'Vaše objednávka bude připravena k vyzvednutí včas.';
      case ORDER_STATUSES.HANDED_OVER:
        return `Vaše objednávka byla předána k doručení${deliveryDate ? ` na ${new Date(deliveryDate).toLocaleDateString('cs-CZ')}` : ''}${deliveryTimeSlot ? ` v časovém okně ${deliveryTimeSlot}` : ''}.`;
      case ORDER_STATUSES.DELIVERED:
        return 'Vaše objednávka byla úspěšně doručena.';
      case ORDER_STATUSES.READY_FOR_PICKUP:
        return 'Vaše objednávka je připravena k vyzvednutí.';
      case ORDER_STATUSES.PICKED_UP:
        return 'Vaše objednávka byla úspěšně vyzvednuta. Děkujeme za nákup!';
      case ORDER_STATUSES.CANCELED:
        return 'Vaše objednávka byla zrušena.';
      default:
        return '';
    }
  };

  const timeSlots = [
    '8:00 - 12:00',
    '12:00 - 16:00',
    '16:00 - 20:00',
    '8:00 - 16:00',
    '12:00 - 20:00'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setLoading(true);
    try {
      const options = {
        adminNotes: adminNotes.trim() || undefined,
        deliveryDate: deliveryDate || undefined,
        deliveryTimeSlot: deliveryTimeSlot || undefined
      };

      await onStatusUpdate(order.id, selectedStatus, options);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUSES.PENDING]: '#ffc107',        // Добавлено
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Změna stavu objednávky</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Current Order Info */}
          <div className="order-summary">
            <div className="summary-item">
              <strong>Objednávka:</strong> #{order.id}
            </div>
            <div className="summary-item">
              <strong>Zákazník:</strong> {order.customer_name}
            </div>
            <div className="summary-item">
              <strong>Částka:</strong> {formatCurrency(order.total_price)}
            </div>
            <div className="summary-item">
              <strong>Současný stav:</strong>
              <span 
                className="current-status"
                style={{ color: getStatusColor(order.status) }}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="summary-item">
              <strong>Doručení:</strong>
              {order.delivery_method === 'courier' ? (
                <>🚚 Doručení na adresu ({order.delivery_address}, {order.delivery_city})</>
              ) : (
                <>🏪 Osobní odběr</>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Status Selection */}
            <div className="form-group">
              <label htmlFor="status">Nový stav:</label>
              <div className="status-options">
                {availableTransitions.map((status) => (
                  <label key={status} className="status-option">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={selectedStatus === status}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    />
                    <span className="status-option-content">
                      <div className="status-title">{getStatusAction(status)}</div>
                      <div className="status-description">{getStatusDescription(status)}</div>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Date and Time (for HANDED_OVER status) */}
            {selectedStatus === ORDER_STATUSES.HANDED_OVER && (
              <div className="delivery-details">
                <h4>Detaily doručení</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="deliveryDate">Datum doručení:</label>
                    <input
                      type="date"
                      id="deliveryDate"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="deliveryTimeSlot">Časové okno:</label>
                    <select
                      id="deliveryTimeSlot"
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      required
                    >
                      <option value="">Vyberte časové okno</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="form-group">
              <label htmlFor="adminNotes">Poznámky administrátora (volitelné):</label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Interní poznámky k této změně stavu..."
                rows="3"
              />
            </div>

            {/* Email Preview */}
            {selectedStatus && (
              <div className="email-preview">
                <h4>📧 Náhled emailu zákazníkovi</h4>
                <div className="email-content">
                  <p><strong>Předmět:</strong> Aktualizace stavu objednávky #{order.id}</p>
                  <p><strong>Zpráva:</strong> {getEmailPreview(selectedStatus)}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="cancel-btn">
            Zrušit
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedStatus || loading}
            className="confirm-btn"
            style={{
              backgroundColor: selectedStatus ? getStatusColor(selectedStatus) : '#6c757d'
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Aktualizuji...
              </>
            ) : (
              <>
                ✉️ Odeslat email a změnit stav
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusModal;