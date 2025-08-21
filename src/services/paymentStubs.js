// Заглушки для чешских платежных систем

export const paymentStubs = {
  // Comgate - популярная чешская платежная система
  comgate: {
    name: 'Comgate',
    description: 'Karta, internetové bankovnictví',
    process: async (orderData) => {
      // Симуляция процесса оплаты
      return new Promise((resolve) => {
        setTimeout(() => {
          // Симуляция успешной оплаты в 90% случаев
          const success = Math.random() > 0.1;
          resolve({
            success,
            transactionId: `CG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'comgate',
            message: success ? 'Platba úspěšně dokončena' : 'Platba se nezdařila'
          });
        }, 2000); // 2 секунды "обработки"
      });
    }
  },

  // Dobírka - наложенный платеж
  dobirka: {
    name: 'Dobírka',
    description: 'Platba při převzetí',
    process: async (orderData) => {
      // Добирка всегда "успешна" так как оплата при получении
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            transactionId: `DB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'dobirka',
            message: 'Objednávka připravena k odběru s platbou dobírkou'
          });
        }, 1000);
      });
    }
  },

  // Платежная карта
  card: {
    name: 'Platební karta',
    description: 'Visa, Mastercard',
    process: async (orderData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.15; // 85% успеха
          resolve({
            success,
            transactionId: `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'card',
            message: success ? 'Platba kartou úspěšně dokončena' : 'Platba kartou byla odmítnuta'
          });
        }, 3000); // 3 секунды для карты
      });
    }
  },

  // Google Pay
  googlepay: {
    name: 'Google Pay',
    description: 'Rychlá mobilní platba',
    process: async (orderData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.05; // 95% успеха для Google Pay
          resolve({
            success,
            transactionId: `GP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'googlepay',
            message: success ? 'Google Pay platba úspěšná' : 'Google Pay platba se nezdařila'
          });
        }, 1500); // Быстрее чем карта
      });
    }
  }
};

// Функция для обработки платежа
export const processPayment = async (paymentMethod, orderData) => {
  const stub = paymentStubs[paymentMethod];
  
  if (!stub) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  try {
    const result = await stub.process(orderData);
    
    // Логируем результат для разработки
    console.log(`Payment processed via ${paymentMethod}:`, result);
    
    return result;
  } catch (error) {
    console.error(`Payment processing error for ${paymentMethod}:`, error);
    throw error;
  }
};

// Получить информацию о способе оплаты
export const getPaymentMethodInfo = (paymentMethod) => {
  const stub = paymentStubs[paymentMethod];
  return stub ? { name: stub.name, description: stub.description } : null;
};