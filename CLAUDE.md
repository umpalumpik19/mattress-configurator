# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mattress configurator React application that allows users to build custom mattresses by selecting different foam layers, covers, sizes, and heights. The application features real-time visual preview, price calculations, URL-based configuration sharing, and a complete shopping cart system with secure checkout.

## Commands

### Development
- `npm start` - Start development server (opens on localhost:3000)
- `npm run build` - Build production bundle
- `npm test` - Run tests in watch mode
- `npm run eject` - Eject from Create React App (one-way operation)

### Testing
- `npm test` - Run all tests in interactive watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- --watchAll=false` - Run tests once without watch mode

## Architecture

### Core Data Structure

The application is driven by three main JSON configuration files in `/public/data/`:

1. **layers-config.json** - Defines available mattress layers and covers with pricing
   - `mattressLayers[]` - Array of foam/spring layers with id, name, price, icon, slug
   - `covers[]` - Array of fabric covers with id, name, price, slug, icon

2. **url-mapping.json** - Maps internal IDs to URL-friendly slugs for shareable configurations
   - `layers{}` - Maps layer IDs to URL segments  
   - `covers{}` - Maps cover IDs to URL segments

3. **layer-descriptions.json** - Rich content for each layer type
   - Layer descriptions with images and additional info blocks
   - `staticBlocks[]` - Always-visible content (warranty, etc.)
   - `coverDescriptions{}` - Detailed cover information

### Visual System

Layered mattress visualization using WebP images organized by:
- Height (10cm, 20cm, 30cm)
- Size category (single: <160cm width, double: ≥160cm width)
- Layer position (sloj-odin, sloj-dva, sloj-tri)
- Material slug (matches slug from layers-config.json)

Path structure: `/public/layers/{height}/{size_category}/{layer_key}/{material_slug}.webp`

### Key React Components

**App.js (main component)**
- State management for all selections (size, height, layers, cover)
- URL parsing/generation for shareable configurations
- Price calculation and responsive layout management
- Global card height calculation for consistent UI

**OptionGroup**
- Reusable component for layer/cover selection
- Responsive grid layout with dynamic column calculation
- Image loading with fallback handling

**ShoppingCart (src/components/ShoppingCart.js)**
- Complete shopping cart modal with item management
- Secure checkout form with validation
- Address fields for courier delivery
- Animated transitions and modern UI
- Mobile-responsive design

### State Management

The app uses React hooks for state:
- `selectedOptions` - Object containing selected layer/cover IDs
- `selectedSize` - Mattress dimensions (e.g., "160x200")
- `selectedHeight` - Mattress height (10, 20, or 30cm)
- `globalCardHeight` - Calculated min-height for consistent card sizing
- `cartItems` - Array of items in shopping cart with quantities
- `isCartOpen` - Boolean controlling cart modal visibility

### URL System

Configurations are encoded in URLs as: `/{size}-{height}cm-{layer1}-{layer2}-{layer3}-{cover}`
- Uses friendly slugs from url-mapping.json
- Automatically updates URL on changes
- Parses URL on page load to restore configurations

### Responsive Design

- Mobile-first approach with breakpoint at 1024px (useIsMobile hook)
- Dynamic column calculation based on container width
- Global card height synchronization across all option grids
- ResizeObserver integration for layout recalculation

### Layer Visibility Logic

Layer visibility depends on mattress height:
- 10cm: Only sloj-odin (layer 1)
- 20cm: sloj-odin + sloj-dva (layers 1-2)  
- 30cm: sloj-odin + sloj-dva + sloj-tri (layers 1-3)

## Development Notes

### Adding New Materials
1. Add entry to `layers-config.json` with unique ID, name, price, icon path, slug
2. Add slug mapping to `url-mapping.json` 
3. Add description to `layer-descriptions.json`
4. Add WebP images for all height/size combinations in `/public/layers/`
5. Add icon to `/public/icons/`

### Image Management
- All images are WebP format for optimal loading
- Icons in `/public/icons/` for option cards
- Layer visualizations in `/public/layers/` with specific directory structure
- Error handling included for missing images

### Price Calculation
- Prices from layers-config.json are summed for visible layers + cover
- Real-time updates when selections change
- Formatted in Czech Koruna (Kč) with locale formatting

### Performance Considerations
- ResizeObserver used for efficient layout recalculation
- RequestAnimationFrame for smooth card height updates
- Image lazy loading and error handling
- Memoized calculations for price and descriptions

## Backend System (Supabase + MailerSend)

### Database Structure
**Supabase PostgreSQL с тремя основными таблицами:**

1. **mattress_layers** (150+ записей)
   - Все слои матрасов с ценами по размерам
   - Прямая миграция из layers-config.json

2. **mattress_covers** (3 записи) 
   - Все чехлы (бесплатные, price = 0)
   - Прямая миграция из covers секции

3. **orders** 
   - Заказы клиентов с полной конфигурацией
   - Статусы оплаты, контактная информация

### Email System (MailerSend)
- **Supabase Edge Function** `/functions/send-email/` для отправки
- **Двойные уведомления**: клиенту подтверждение + админу уведомление
- **HTML + текстовые** шаблоны на чешском языке  
- **3,000 писем/месяц** бесплатно

### Payment System
- **Чешские методы оплаты**: Comgate, dobírka, карта, Google Pay
- **Заглушки платежных систем** с реалистичной симуляцией
- **Сохранение транзакций** в базе данных

### Shopping Cart System

#### Features
- **Cart Management** - Add, remove, and update item quantities
- **Czech Payment Methods** - Comgate, dobírka, карта, Google Pay
- **Order Success Modal** - Красивое окно подтверждения в стиле сайта
- **Cart Auto-clear** - Автоматическая очистка после заказа
- **Email Notifications** - Автоматические уведомления через MailerSend
- **Delivery Options** - Pickup or courier delivery with address fields
- **Responsive Design** - Mobile-optimized modals and forms

#### Components Structure
```
src/components/
├── ShoppingCart.js          # Main cart component
├── ShoppingCart.css         # Cart styling with animations  
├── OrderSuccessModal.js     # Success confirmation modal
└── OrderSuccessModal.css    # Success modal styling
```

#### Services Structure  
```
src/services/
├── paymentStubs.js          # Czech payment method simulators
└── emailService.js          # MailerSend integration via Supabase
```

#### API Structure
```
src/api/
└── mattressApi.js          # Supabase database operations
```

#### Security Features
- **Input Sanitization** - XSS prevention through HTML tag removal
- **Form Validation** - Real-time validation for all fields  
- **Czech Localization** - Phone and postal code format validation
- **Controlled Inputs** - All form data is controlled and sanitized
- **Backend Processing** - Payment simulation with transaction IDs

#### Cart Functionality
- **Duplicate Detection** - Prevents duplicate configurations in cart
- **Quantity Management** - Increment/decrement with bounds checking
- **Price Calculation** - Real-time total updates
- **Persistent State** - Cart persists during session  
- **Order Processing** - Complete flow: payment → database → email → success

#### Styling
- **Dark Theme** - Matches application design system (#2c2c54 background)
- **Consistent Design** - Success modal matches cart styling
- **Smooth Animations** - fadeIn/slideUp effects (0.3-0.4s)
- **Modern Buttons** - Gradient backgrounds with hover effects
- **Custom Radio Buttons** - Styled with accent colors
- **Mobile Responsive** - Adaptive layouts for all screen sizes

## Fixed Bottom Bar with Layer Breakdown

### Enhanced Bottom Bar Functionality

**Fixed bottom bar** теперь имеет расширенную функциональность с детализацией слоев:

#### Core Features
- **Always Visible** - Фиксированный блок внизу экрана постоянно виден на всех устройствах
- **Smart Layer Breakdown** - Детализация слоев появляется когда калькулятор цены скрыт из видимости
- **IntersectionObserver Integration** - Автоматическое отслеживание видимости прайс-калькулятора
- **Smooth Animations** - Плавные анимации появления/исчезновения детализации (0.4s transitions)
- **Dynamic Height** - Адаптивная высота блока в зависимости от количества видимых слоев

#### Layer Breakdown Structure
- **3-Column Layout**: "Слой X" | "Название наполнителя" | "Цена слоя"
- **Dynamic Rows** - Количество строк зависит от выбранной высоты матраса (10см=1 слой, 20см=2 слоя, 30см=3 слоя)
- **Word Wrapping** - Автоматические переносы для длинных названий материалов
- **Responsive Grid** - Адаптивные пропорции колонок для разных экранов

#### Responsive Design
- **Desktop (>1101px)**: 80px | 1fr | 90px grid columns
- **Mobile (<600px)**: 65px | 1fr | 75px grid columns  
- **Small Mobile (<420px)**: 55px | 1fr | 65px grid columns
- **Adaptive Typography** - Размеры шрифтов масштабируются для каждого брейкпоинта

#### Implementation Details
```javascript
// IntersectionObserver configuration
threshold: 0.3,        // 30% калькулятора должно быть видимо
rootMargin: '-20px'    // Отступ для плавного срабатывания
```

#### CSS Classes
- `.bb-breakdown` - Контейнер детализации с анимациями
- `.bb-breakdown.visible` - Активное состояние (показано)
- `.bb-breakdown-row` - Строка с информацией о слое
- `.bb-layer-title` - Название слоя ("Слой 1", "Слой 2", etc.)
- `.bb-layer-name` - Название материала/наполнителя
- `.bb-layer-price` - Цена слоя в формате "X XXX Kč"

#### Visibility Logic
- **Calculator Visible** → Показывается только цена и кнопка
- **Calculator Hidden** → Дополнительно показывается детализация слоев сверху
- **Adaptive Padding** → Автоматическая корректировка отступов страницы (64px → 150px)