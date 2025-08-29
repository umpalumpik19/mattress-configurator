import { supabase } from '../supabaseClient';

// MailerSend через Supabase Edge Function
const SUPABASE_FUNCTION_URL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-email`;

// Инициализация (больше не нужна для MailerSend)
export const initEmailJS = () => {
  // Заглушка для совместимости - MailerSend инициализации не требует
};

// Отправка подтверждения заказа клиенту
export const sendOrderConfirmation = async (orderData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'customer',
        orderData: orderData
      }
    });

    if (error) {
      console.error('Customer email error:', error);
      return { success: false, error };
    }

    console.log('Customer email sent successfully:', data);
    return { success: true, response: data };

  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// Отправка уведомления админу о новом заказе
export const sendAdminNotification = async (orderData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'admin',
        orderData: orderData
      }
    });

    if (error) {
      console.error('Admin email error:', error);
      return { success: false, error };
    }

    console.log('Admin notification sent successfully:', data);
    return { success: true, response: data };

  } catch (error) {
    console.error('Admin notification failed:', error);
    return { success: false, error };
  }
};