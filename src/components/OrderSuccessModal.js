import React, { useEffect } from 'react';
import './OrderSuccessModal.css';

const OrderSuccessModal = ({ isOpen, onClose, orderData }) => {
  // Предотвращаем прокрутку страницы когда модал открыт
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="order-success-overlay" onClick={onClose}>
      <div className="order-success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="success-header">
          <div className="success-icon">
            <svg viewBox="0 0 52 52" className="checkmark">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <h2>Objednávka úspěšně vytvořena!</h2>
        </div>

        <div className="order-details">
          <p className="order-number">Číslo objednávky: <strong>#{orderData?.id}</strong></p>
          <p className="confirmation-text">
            Děkujeme za vaši objednávku! Na váš e-mail <strong>{orderData?.customer_email}</strong> jsme 
            odeslali potvrzení s podrobnostmi objednávky.
          </p>
          
          <div className="next-steps">
            <h3>Co bude dál:</h3>
            <ul>
              <li>📧 Na e-mail vám přijde potvrzení objednávky</li>
              <li>📞 Naše týmu vás kontaktuje do 24 hodin</li>
              <li>📦 Domluvíme si způsob dodání a platby</li>
              <li>🛏️ Vaše matrace bude vyrobena na míru</li>
            </ul>
          </div>

          <div className="payment-info">
            <p><strong>Způsob platby:</strong> {getPaymentMethodText(orderData?.payment_method)}</p>
            <p><strong>Celková částka:</strong> {orderData?.total_price?.toLocaleString('cs-CZ')} Kč</p>
          </div>
        </div>

        <div className="success-footer">
          <button className="continue-shopping" onClick={onClose}>
            Pokračovat v nákupu
          </button>
        </div>
      </div>
    </div>
  );
};

// Pomocná funkce pro převod kódu způsobu platby na text
const getPaymentMethodText = (method) => {
  const methods = {
    'comgate': 'Comgate (karta, internetové bankovnictví)',
    'dobirka': 'Dobírka (platba při převzetí)',
    'card': 'Platební karta (Visa, Mastercard)',
    'googlepay': 'Google Pay'
  };
  return methods[method] || method;
};

export default OrderSuccessModal;