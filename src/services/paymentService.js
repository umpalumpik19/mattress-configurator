import { loadStripe } from '@stripe/stripe-js';

// Инициализация Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const createPaymentSession = async (orderData) => {
  try {
    // В будущем здесь будет вызов к вашему backend API
    // который создаст Stripe Checkout Session
    
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: orderData.configuration,
        customer: {
          name: orderData.name,
          email: orderData.email,
          phone: orderData.phone,
        },
        totalAmount: orderData.totalPrice,
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
      }),
    });

    const session = await response.json();
    
    if (session.error) {
      throw new Error(session.error);
    }

    // Перенаправление на Stripe Checkout
    const stripe = await stripePromise;
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

// Функция для обработки успешной оплаты
export const handlePaymentSuccess = (sessionId) => {
  // Здесь можно добавить логику после успешной оплаты
  console.log('Payment successful for session:', sessionId);
};

// Функция для обработки отмененной оплаты
export const handlePaymentCancel = () => {
  console.log('Payment cancelled');
};