import { supabase } from '../supabaseClient';
import { sendStatusUpdateNotification } from '../services/emailService';

// Order status constants
export const ORDER_STATUSES = {
  PENDING: 'pending',           // Добавлено для совместимости с существующими заказами
  PROCESSING: 'processing',
  APPROVED: 'approved',
  HANDED_OVER: 'handed_over',
  DELIVERED: 'delivered',
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  CANCELED: 'canceled'
};

export const STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Čeká na zpracování',      // Добавлено
  [ORDER_STATUSES.PROCESSING]: 'Zpracovává se',
  [ORDER_STATUSES.APPROVED]: 'Schváleno',
  [ORDER_STATUSES.HANDED_OVER]: 'Předáno k doručení',
  [ORDER_STATUSES.DELIVERED]: 'Doručeno',
  [ORDER_STATUSES.READY_FOR_PICKUP]: 'Připraveno k vyzvednutí',
  [ORDER_STATUSES.PICKED_UP]: 'Vyzvednuto',
  [ORDER_STATUSES.CANCELED]: 'Zrušeno'
};

export const DELIVERY_METHODS = {
  PICKUP: 'pickup',
  DELIVERY: 'courier'  // Изменено с 'delivery' на 'courier' чтобы соответствовать реальным данным
};

// Get available status transitions based on current status and delivery method
export const getAvailableStatusTransitions = (currentStatus, deliveryMethod) => {
  const transitions = [];
  
  switch (currentStatus) {
    case ORDER_STATUSES.PENDING:
    case ORDER_STATUSES.PROCESSING:
      transitions.push(ORDER_STATUSES.APPROVED, ORDER_STATUSES.CANCELED);
      break;
      
    case ORDER_STATUSES.APPROVED:
      if (deliveryMethod === 'courier') {
        transitions.push(ORDER_STATUSES.HANDED_OVER, ORDER_STATUSES.CANCELED);
      } else {
        transitions.push(ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.CANCELED);
      }
      break;
      
    case ORDER_STATUSES.HANDED_OVER:
      if (deliveryMethod === 'courier') {
        transitions.push(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELED);
      }
      break;
      
    case ORDER_STATUSES.READY_FOR_PICKUP:
      if (deliveryMethod === 'pickup') {
        transitions.push(ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.CANCELED);
      }
      break;
      
    default:
      // Delivered and Canceled are final states
      break;
  }
  
  return transitions;
};

// Get all orders with pagination and filtering
export const getOrders = async (filters = {}, pagination = { page: 1, limit: 50 }) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_status_history (
          id,
          old_status,
          new_status,
          changed_by,
          changed_at,
          admin_notes
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.deliveryMethod && filters.deliveryMethod !== 'all') {
      query = query.eq('delivery_method', filters.deliveryMethod);
    }

    if (filters.searchTerm) {
      query = query.or(`customer_name.ilike.%${filters.searchTerm}%,customer_email.ilike.%${filters.searchTerm}%,id.eq.${filters.searchTerm}`);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });

    return {
      orders: data || [],
      totalCount: totalCount || 0,
      currentPage: pagination.page,
      totalPages: Math.ceil((totalCount || 0) / pagination.limit)
    };
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
};

// Get single order by ID
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_status_history (
          id,
          old_status,
          new_status,
          changed_by,
          changed_at,
          admin_notes
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrderById:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus, adminUsername, options = {}) => {
  try {
    console.log('updateOrderStatus called with:', { orderId, newStatus, adminUsername, options });
    
    const { adminNotes, deliveryDate, deliveryTimeSlot } = options;

    // First get the order data for email
    console.log('Getting order data for ID:', orderId);
    const orderData = await getOrderById(orderId);
    console.log('Order data retrieved:', orderData);
    
    // Update order directly (bypassing database function for now)
    console.log('Updating order directly in database...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString(),
        status_updated_by: adminUsername,
        admin_notes: adminNotes || null,
        delivery_date: deliveryDate || null,
        delivery_time_slot: deliveryTimeSlot || null
      })
      .eq('id', orderId)
      .select();

    console.log('Direct update result:', { data: updateData, error: updateError });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Add to history manually
    try {
      console.log('Adding status change to history...');
      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          old_status: orderData?.status || null,
          new_status: newStatus,
          changed_by: adminUsername,
          admin_notes: adminNotes || null,
          changed_at: new Date().toISOString()
        });

      console.log('History insert result:', { data: historyData, error: historyError });
      
      if (historyError) {
        console.warn('Failed to add to history:', historyError);
        // Don't fail the whole operation if history fails
      }
    } catch (historyError) {
      console.warn('History logging failed:', historyError);
    }

    // Send status update email to customer
    try {
      console.log('Sending status update email...');
      await sendStatusUpdateNotification(
        orderData,
        newStatus,
        deliveryDate,
        deliveryTimeSlot
      );
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    console.log('updateOrderStatus completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
};

// Get order statistics
export const getOrderStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('order_statistics')
      .select('*');

    if (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOrderStatistics:', error);
    throw error;
  }
};

// Get orders grouped by status
export const getOrdersByStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status, id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }

    // Group by status
    const grouped = {};
    Object.values(ORDER_STATUSES).forEach(status => {
      grouped[status] = [];
    });

    (data || []).forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error in getOrdersByStatus:', error);
    throw error;
  }
};

// Search orders
export const searchOrders = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, total_price, status, created_at')
      .or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,id.eq.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching orders:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchOrders:', error);
    throw error;
  }
};