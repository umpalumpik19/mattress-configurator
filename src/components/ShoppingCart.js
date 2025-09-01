import React, { useState, useEffect } from 'react';
import './ShoppingCart.css';
import { createOrder } from '../api/mattressApi';
import OrderSuccessModal from './OrderSuccessModal';
import { processPayment } from '../services/paymentStubs';
import { sendOrderConfirmation, sendAdminNotification, initEmailJS } from '../services/emailService';

const ShoppingCart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, totalPrice }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'comgate',
    address: '',
    city: '',
    postalCode: '',
    deliveryNotes: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize EmailJS
  useEffect(() => {
    initEmailJS();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen || isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isCheckoutOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    
    if (isOpen || isCheckoutOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isCheckoutOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Jméno musí mít minimálně 2 znaky';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    
    // Phone validation (Czech format)
    const phoneRegex = /^(\+420\s?)?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon je povinný';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    // Delivery address validation (only if courier delivery is selected)
    if (formData.deliveryMethod === 'courier') {
      if (!formData.address.trim()) {
        newErrors.address = 'Adresa je povinná pro doručení';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'Město je povinné pro doručení';
      }
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'PSČ je povinné';
      } else if (!/^[0-9]{3}\s?[0-9]{2}$/.test(formData.postalCode.trim())) {
        newErrors.postalCode = 'Неверный формат почтового индекса (например: 110 00)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneInput = (value) => {
    // Format phone number as user types
    let formattedPhone = value.replace(/\D/g, '');
    
    if (formattedPhone.startsWith('420')) {
      formattedPhone = '+420 ' + formattedPhone.slice(3);
    } else if (formattedPhone.length > 0 && !formattedPhone.startsWith('420')) {
      if (formattedPhone.length <= 9) {
        formattedPhone = formattedPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim();
      }
    }
    
    handleInputChange('phone', formattedPhone);
  };

  const handleCheckout = async () => {
    if (validateForm()) {
      setIsProcessingPayment(true);
      
      try {
        // Připravujeme data objednávky
        const orderData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          deliveryNotes: formData.deliveryNotes,
          configuration: cartItems,
          totalPrice: totalPrice
        };

        // Обработка оплаты через заглушку
        const paymentResult = await processPayment(formData.paymentMethod, orderData);
        
        if (!paymentResult.success) {
          alert(`Chyba při platbě: ${paymentResult.message}`);
          return;
        }

        // Přidáváme data o platbě k objednávce
        const orderWithPayment = {
          ...orderData,
          paymentStatus: 'paid',
          transactionId: paymentResult.transactionId
        };

        // Ukládáme objednávku do Supabase
        const savedOrder = await createOrder(orderWithPayment);
        
        console.log('Order saved to database:', savedOrder);
        console.log('Payment result:', paymentResult);
        
        // Отправляем email уведомления
        try {
          // Отправляем подтверждение клиенту
          const clientEmailResult = await sendOrderConfirmation(savedOrder);
          if (clientEmailResult.success) {
            console.log('Customer email sent successfully');
          }
          
          // Отправляем уведомление админу
          const adminEmailResult = await sendAdminNotification(savedOrder);
          if (adminEmailResult.success) {
            console.log('Admin notification sent successfully');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Не прерываем процесс если email не отправился
        }
        
        // Показываем модал успеха
        setSuccessOrderData(savedOrder);
        setOrderSuccess(true);
        setIsCheckoutOpen(false);
        
        // Vyčistíme košík
        if (onClearCart) {
          onClearCart();
        }
        
        // Очищаем форму
        setFormData({
          name: '',
          email: '',
          phone: '',
          deliveryMethod: 'pickup',
          paymentMethod: 'comgate',
          address: '',
          city: '',
          postalCode: '',
          deliveryNotes: ''
        });
        
      } catch (error) {
        console.error('Chyba při vytvoření objednávky:', error);
        alert('Došlo k chybě při odesílání objednávky. Zkuste to prosím znovu.');
      } finally {
        setIsProcessingPayment(false);
      }
    }
  };

  const handleSuccessClose = () => {
    setOrderSuccess(false);
    setSuccessOrderData(null);
    onClose();
  };

  const formatItemName = (item) => {
    const parts = item.name.split(' — ');
    if (parts.length > 1) {
      return {
        title: parts[0],
        details: parts[1]
      };
    }
    return { title: item.name, details: '' };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Cart Modal */}
      <div className="cart-overlay" onClick={onClose}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h2 className="cart-title">Košík</h2>
            <button className="cart-close" onClick={onClose} aria-label="Zavřít košík">
              ×
            </button>
          </div>
          
          <div className="cart-content">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <p>Košík je prázdný</p>
              </div>
            ) : (
              <div className="cart-items">
                {cartItems.map((item, index) => {
                  const itemInfo = formatItemName(item);
                  return (
                    <div key={`${item.id}-${index}`} className="cart-item">
                      <div className="cart-item-content">
                        <div className="cart-item-info">
                          <h4 className="cart-item-title">{itemInfo.title}</h4>
                          {itemInfo.details && (
                            <p className="cart-item-details">{itemInfo.details}</p>
                          )}
                        </div>
                        <div className="cart-item-actions">
                          <div className="quantity-controls">
                            <button 
                              className="quantity-btn"
                              onClick={() => {
                                if (item.quantity === 1) {
                                  setConfirmDelete(index);
                                } else {
                                  onUpdateQuantity(index, item.quantity - 1);
                                }
                              }}
                              aria-label="Уменьшить количество"
                            >
                              −
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button 
                              className="quantity-btn"
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              aria-label="Zvýšit množství"
                            >
                              +
                            </button>
                          </div>
                          <div className="cart-item-price">
                            {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span className="total-label">Celkem:</span>
                <span className="total-price">{totalPrice.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <button 
                className="checkout-btn btn-primary"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Objednat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete !== null && (
        <div className="delete-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-content">
              <h3>Potvrzení odstranění</h3>
              <p>Jste si jisti, že chcete odstranit položku z košíku?</p>
              <div className="delete-actions">
                <button 
                  className="delete-cancel"
                  onClick={() => setConfirmDelete(null)}
                >
                  Zrušit
                </button>
                <button 
                  className="delete-confirm"
                  onClick={() => {
                    onRemoveItem(confirmDelete);
                    setConfirmDelete(null);
                  }}
                >
                  Odstranit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="checkout-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <button 
                className="checkout-back"
                onClick={() => setIsCheckoutOpen(false)}
                aria-label="Назад к корзине"
              >
                ←
              </button>
              <h2 className="checkout-title">Dokončení objednávky</h2>
              <button 
                className="checkout-close"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  onClose();
                }}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            
            <div className="checkout-content">
              {/* Order Summary */}
              <div className="order-summary">
                {cartItems.map((item, index) => {
                  const itemInfo = formatItemName(item);
                  return (
                    <div key={`checkout-${item.id}-${index}`} className="summary-item">
                      <div className="summary-info">
                        <span className="summary-title">{itemInfo.title}</span>
                        <span className="summary-details">{itemInfo.details}</span>
                      </div>
                      <div className="summary-quantity">
                        <span>{item.quantity}</span>
                      </div>
                      <div className="summary-price">
                        {(item.price * item.quantity).toLocaleString('cs-CZ')} Kč
                      </div>
                    </div>
                  );
                })}
                <div className="summary-total">
                  <span>Celková suma: {totalPrice.toLocaleString('cs-CZ')} Kč</span>
                </div>
              </div>

              {/* Customer Form */}
              <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="customer-name">Vaše jméno</label>
                  <input
                    id="customer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Vaše jméno"
                    className={errors.name ? 'error' : ''}
                    maxLength="50"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="customer-email">Email</label>
                  <input
                    id="customer-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className={errors.email ? 'error' : ''}
                    maxLength="100"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="customer-phone">Telefon</label>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneInput(e.target.value)}
                    placeholder="+420 (000) 000-000"
                    className={errors.phone ? 'error' : ''}
                    maxLength="20"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-section">
                  <h3>Doručení</h3>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={formData.deliveryMethod === 'pickup'}
                        onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      />
                      <span>Osobní odběr</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="delivery"
                        value="courier"
                        checked={formData.deliveryMethod === 'courier'}
                        onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      />
                      <span>Kuriérní doručení</span>
                    </label>
                  </div>
                  
                  {/* Delivery Address Fields - Show only when courier delivery is selected */}
                  {formData.deliveryMethod === 'courier' && (
                    <div className="delivery-address" style={{ animation: 'slideDown 0.3s ease-out' }}>
                      <div className="form-group">
                        <label htmlFor="delivery-address">Adresa doručení</label>
                        <input
                          id="delivery-address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Ulice, dům, byt"
                          className={errors.address ? 'error' : ''}
                          maxLength="200"
                        />
                        {errors.address && <span className="error-text">{errors.address}</span>}
                      </div>
                      
                      <div className="address-row">
                        <div className="form-group">
                          <label htmlFor="delivery-city">Město</label>
                          <input
                            id="delivery-city"
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Praha"
                            className={errors.city ? 'error' : ''}
                            maxLength="50"
                          />
                          {errors.city && <span className="error-text">{errors.city}</span>}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="delivery-postal">PSČ</label>
                          <input
                            id="delivery-postal"
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            placeholder="110 00"
                            className={errors.postalCode ? 'error' : ''}
                            maxLength="6"
                          />
                          {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="delivery-notes">Poznámky k doručení (volitelné)</label>
                        <textarea
                          id="delivery-notes"
                          value={formData.deliveryNotes}
                          onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                          placeholder="Patro, domofon, čas doručení apod."
                          className="delivery-notes"
                          maxLength="300"
                          rows="3"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>Způsob platby</h3>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="payment"
                        value="comgate"
                        checked={formData.paymentMethod === 'comgate'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      />
                      <span>Comgate (karta, internetové bankovnictví)</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="payment"
                        value="dobirka"
                        checked={formData.paymentMethod === 'dobirka'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      />
                      <span>Dobírka (platba při převzetí)</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      />
                      <span>Platební karta (Visa, Mastercard)</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="payment"
                        value="googlepay"
                        checked={formData.paymentMethod === 'googlepay'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      />
                      <span>Google Pay</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="checkout-footer">
              <button 
                className="checkout-submit btn-primary"
                onClick={handleCheckout}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Zpracování platby...' : 'Dokončit objednávku'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <OrderSuccessModal 
        isOpen={orderSuccess}
        onClose={handleSuccessClose}
        orderData={successOrderData}
      />
    </>
  );
};

export default ShoppingCart;