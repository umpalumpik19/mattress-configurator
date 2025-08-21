// Скрипт для импорта данных из JSON файлов в Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Загружаем переменные окружения
require('dotenv').config();

// Создаем клиент Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: Не найдены SUPABASE_URL или SUPABASE_ANON_KEY в .env файле');
  console.log('Убедитесь что в .env файле указаны правильные ключи');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Подготовка к импорту данных в Supabase...');

// Чтение JSON файлов
const layersConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/data/layers-config.json'), 'utf8')
);

console.log(`📊 Найдено ${layersConfig.mattressLayers.length} типов слоев`);
console.log(`🧵 Найдено ${layersConfig.covers.length} типов чехлов`);

// Подготовка данных для импорта в формате таблиц
function prepareLayers() {
  const layersForDB = [];
  
  layersConfig.mattressLayers.forEach(layer => {
    // Для каждого размера создаем отдельную запись
    Object.entries(layer.prices).forEach(([size, price]) => {
      layersForDB.push({
        layer_id: layer.id,
        layer_name: layer.name,
        size: size,
        price: price,
        available_heights: layer.availableHeights,
        icon_path: layer.icon,
        slug: layer.slug
      });
    });
  });
  
  return layersForDB;
}

function prepareCovers() {
  return layersConfig.covers.map(cover => ({
    cover_id: cover.id,
    cover_name: cover.name,
    price: cover.price,
    slug: cover.slug,
    icon_path: cover.icon
  }));
}

const layersData = prepareLayers();
const coversData = prepareCovers();

console.log(`✅ Подготовлено ${layersData.length} записей слоев для импорта`);
console.log(`✅ Подготовлено ${coversData.length} записей чехлов для импорта`);

// Экспорт для использования в других скриптах
module.exports = {
  layersData,
  coversData
};

// Функция импорта данных в Supabase
async function importData() {
  try {
    console.log('🚀 Начинаем импорт данных...');
    
    // Импорт чехлов
    console.log('📤 Импортируем чехлы...');
    const { data: coversResult, error: coversError } = await supabase
      .from('mattress_covers')
      .insert(coversData);
    
    if (coversError) {
      console.error('❌ Ошибка при импорте чехлов:', coversError);
      return;
    }
    console.log(`✅ Импортировано ${coversData.length} чехлов`);
    
    // Импорт слоев (по частям, так как их много)
    console.log('📤 Импортируем слои матрасов...');
    const batchSize = 50; // Импортируем по 50 записей за раз
    
    for (let i = 0; i < layersData.length; i += batchSize) {
      const batch = layersData.slice(i, i + batchSize);
      console.log(`   Импорт записей ${i + 1}-${Math.min(i + batchSize, layersData.length)}...`);
      
      const { data: layersResult, error: layersError } = await supabase
        .from('mattress_layers')
        .insert(batch);
      
      if (layersError) {
        console.error('❌ Ошибка при импорте слоев:', layersError);
        return;
      }
    }
    
    console.log(`✅ Импортировано ${layersData.length} записей слоев`);
    console.log('🎉 Импорт завершен успешно!');
    
  } catch (error) {
    console.error('❌ Общая ошибка импорта:', error);
  }
}

// Если запущен напрямую, выполнить импорт
if (require.main === module) {
  importData();
}