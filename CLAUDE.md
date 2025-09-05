# Конфигуратор матрасов

## Команды
- `npm start` - dev сервер
- `npm run build` - продакшн сборка  
- `npm test` - тесты

## Ключевые файлы
- `App.js` - главная логика, состояние конфигурации
- `api/mattressApi.js` - Supabase API
- `/data/url-mapping.json` - соответствие ID к URL

## Структура данных
- Размеры: 80x190 до 200x200 (160+ = double)
- Высоты: 10cm (1 слой), 20cm (2 слоя), 30cm (3 слоя)
- Слои: `sloj-odin`, `sloj-dva`, `sloj-tri`
- Цены: `layer.prices[size]` или `layer.price`

## URL система
Формат: `/configurator/размер-высота-слои-чехол`
Пример: `/configurator/80x190-20cm-l1-l2-c1`

## Важные функции
- `sizeKind(size)` - определяет single/double
- `getLayerPrice(layer, size)` - цена с учетом размера
- `isLayerAvailableAtHeight(layer, height)` - доступность слоя
- `generateUrlPath()` / `parseUrlPath()` - работа с URL

## Стиль кода
- Функциональные компоненты с хуками
- useMemo для расчетов, useCallback для функций
- Всегда cleanup в useEffect
- Обработка ошибок изображений: `onError={() => e.target.style.display='none'}`

## Тестирование
Приоритет: утилитарные функции, URL система, расчет цены