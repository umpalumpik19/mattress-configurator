import { supabase } from '../supabaseClient'

// Получение всех слоев матрасов
export const getMattressLayers = async () => {
  const { data, error } = await supabase
    .from('mattress_layers')
    .select('*')
    .order('layer_id', { ascending: true })

  if (error) {
    console.error('Ошибка загрузки слоев:', error)
    throw error
  }
  
  return data
}

// Получение всех чехлов
export const getMattressCovers = async () => {
  const { data, error } = await supabase
    .from('mattress_covers')
    .select('*')
    .order('cover_id', { ascending: true })

  if (error) {
    console.error('Ошибка загрузки чехлов:', error)
    throw error
  }
  
  return data
}

// Преобразование данных слоев из формата БД в формат, используемый приложением
export const transformLayersData = (layersFromDB) => {
  const layersMap = new Map()
  
  layersFromDB.forEach(layer => {
    if (!layersMap.has(layer.layer_id)) {
      layersMap.set(layer.layer_id, {
        id: layer.layer_id,
        name: layer.layer_name,
        prices: {},
        availableHeights: layer.available_heights,
        icon: layer.icon_path,
        slug: layer.slug
      })
    }
    
    layersMap.get(layer.layer_id).prices[layer.size] = layer.price
  })
  
  return Array.from(layersMap.values())
}

// Преобразование данных чехлов из формата БД в формат, используемый приложением  
export const transformCoversData = (coversFromDB) => {
  return coversFromDB.map(cover => ({
    id: cover.cover_id,
    name: cover.cover_name,
    price: cover.price,
    slug: cover.slug,
    icon: cover.icon_path
  }))
}

// Создание заказа
export const createOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_name: orderData.name,
      customer_email: orderData.email,
      customer_phone: orderData.phone,
      delivery_method: orderData.deliveryMethod,
      payment_method: orderData.paymentMethod,
      delivery_address: orderData.address,
      delivery_city: orderData.city,
      delivery_postal_code: orderData.postalCode,
      delivery_notes: orderData.deliveryNotes,
      mattress_configuration: orderData.configuration,
      total_price: orderData.totalPrice,
      status: 'pending'
    }])
    .select()

  if (error) {
    console.error('Ошибка создания заказа:', error)
    throw error
  }
  
  return data[0]
}