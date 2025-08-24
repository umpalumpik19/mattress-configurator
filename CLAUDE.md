# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mattress configurator React application that allows users to build custom mattresses by selecting different foam layers, covers, sizes, and heights. The application features real-time visual preview, price calculations, URL-based configuration sharing, and a complete shopping cart system with secure checkout.

## Commands

### Development
- `npm start` - Start main configurator app (opens on localhost:3000)
- `npm run start:admin` - Start admin panel app (opens on localhost:3001)
- `npm run build` - Build both applications for production
- `npm run build:main` - Build only main configurator app
- `npm run build:admin` - Build only admin panel app
- `npm test` - Run tests in watch mode
- `npm run eject` - Eject from Create React App (one-way operation)

### Testing
- `npm test` - Run all tests in interactive watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- --watchAll=false` - Run tests once without watch mode

### Application Structure
This project now consists of **two separate React applications**:

1. **Main Configurator App** (`src/App.js`)
   - Mattress configuration interface
   - Shopping cart and checkout
   - Customer-facing features
   - Entry point: `src/index.js` with `REACT_APP_ENTRY=main`

2. **Admin Panel App** (`src/components/AdminPanel.js`)
   - Order management system
   - Authentication and admin features
   - Status tracking and email notifications
   - Entry point: `src/index.js` with `REACT_APP_ENTRY=admin`

Both applications share the same codebase but load different components based on the `REACT_APP_ENTRY` environment variable.

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

## Admin Panel System

### Overview
Complete admin dashboard for order management with authentication, status tracking, and email notifications. Built with React Router and modern UI components.

### Access
- **Development**: `npm run start:admin` (runs on localhost:3001)
- **Production**: Separate Vercel deployment for admin panel
- **Login**: 123 / 123 (configurable in database)
- **Features**: Order management, status updates, email notifications, responsive design

### Database Tables
**Enhanced PostgreSQL schema with admin functionality:**

1. **orders** (enhanced)
   - Full order tracking with status history
   - Delivery method support (courier/pickup)
   - Admin notes and status timestamps
   - Payment information and customer details

2. **admin_users** 
   - Simple authentication system
   - Username/password storage
   - Session management

3. **order_status_history**
   - Complete audit trail for all status changes
   - Admin user tracking
   - Timestamp and notes for each transition

### Status Workflow

#### Pickup Orders
```
pending → approved → ready_for_pickup → picked_up
processing → approved → ready_for_pickup → picked_up
```

#### Delivery Orders  
```
pending → approved → handed_over → delivered
processing → approved → handed_over → delivered
```

**Status Definitions:**
- `pending` - Новые заказы (совместимость с существующими данными)
- `processing` - Заказы в обработке
- `approved` - Одобренные заказы
- `handed_over` - Переданы для доставки
- `delivered` - Доставлены
- `ready_for_pickup` - Готовы к самовывозу
- `picked_up` - Выданы при самовывозе
- `canceled` - Отмененные заказы

Each transition triggers automatic email notifications to customers.

### Admin Components

#### Core Components
```
src/components/
├── AdminPanel.js           # Main admin router and layout  
├── AdminLogin.js           # Authentication form
├── AdminLayout.js          # Sidebar navigation layout
├── Dashboard.js            # Overview statistics and metrics
├── OrdersTable.js          # Order listing with filters and pagination
├── OrderStatusModal.js     # Status update interface with email preview
├── OrderDetailsModal.js    # Detailed order view with full configuration
└── *.css files            # Component-specific styling with dark theme
```

#### Services & API
```
src/services/
└── adminAuth.js           # Authentication service with localStorage

src/api/
└── adminApi.js            # Order management API functions
```

### Admin Features

#### Authentication
- **Simple Login** - Username/password authentication (123/123)
- **Session Persistence** - localStorage-based session management  
- **Protected Routes** - Automatic redirect to login if not authenticated
- **Auto Logout** - Session timeout for security

#### Order Management
- **Complete Order Listing** - Paginated table with sorting and filtering
- **Status Filtering** - Filter by pending, processing, completed, delivery method
- **Search Functionality** - Search by customer name, email, or order ID
- **Date Range Filtering** - Filter orders by creation date
- **Real-time Updates** - Order list refreshes after status changes
- **Mobile Responsive** - Optimized for all screen sizes

#### Status Updates
- **Guided Workflow** - Only show valid next status options based on current status
- **Delivery Scheduling** - Date and time slot selection for courier deliveries
- **Admin Notes** - Internal notes for each status change (optional)
- **Email Preview** - Preview customer notifications before sending
- **Batch Operations** - Multiple status transitions support
- **Error Handling** - User-friendly error messages and retry options

#### Advanced Features
- **Delivery Method Detection** - Automatic workflow routing (courier vs pickup)
- **Status History** - Complete audit trail with timestamps and admin tracking
- **Email Integration** - Automatic notifications via MailerSend
- **Order Configuration** - Full mattress configuration display
- **Customer Details** - Complete customer and delivery information
- **Visual Status Indicators** - Color-coded status badges

#### Email System (Enhanced)
```
supabase/functions/send-email/
└── index.ts              # Enhanced Edge Function with all status templates
```

**Email Templates (Czech Language):**
- **pending/processing → approved**: Order confirmation with processing status
- **approved → handed_over**: Delivery scheduling with date and time slot
- **handed_over → delivered**: Delivery confirmation
- **approved → ready_for_pickup**: Pickup ready notification
- **ready_for_pickup → picked_up**: Pickup confirmation
- **any → canceled**: Order cancellation notification

**Email Features:**
- HTML and text formats for better compatibility
- Customer and admin notifications
- Order details and configuration included
- Delivery information and tracking
- Czech localization with proper formatting

#### UI/UX Features
- **Professional White Theme** - Clean design with excellent readability
- **Responsive Design** - Mobile-optimized admin interface
- **Real-time Updates** - Order list refreshes after status changes
- **Loading States** - Smooth loading indicators and transitions
- **Error Handling** - User-friendly error messages and retry options
- **Status Color Coding** - Visual status indicators with consistent colors
- **Modal System** - Overlay modals for status updates and details
- **Improved Typography** - Enhanced text contrast and readability
- **Accessible Design** - High contrast colors and keyboard navigation

### Admin Styling
- **Modern UI** - Clean white background with professional styling
- **Sidebar Navigation** - Collapsible sidebar with active state indicators  
- **Data Tables** - Sortable, filterable, and paginated order listings
- **Status Badges** - Color-coded status indicators:
  - `pending` - Yellow (#ffc107)
  - `processing` - Yellow (#ffc107)  
  - `approved` - Green (#28a745)
  - `handed_over` - Blue (#007bff)
  - `delivered` - Green (#28a745)
  - `ready_for_pickup` - Cyan (#17a2b8)
  - `picked_up` - Green (#28a745)
  - `canceled` - Red (#dc3545)
- **Improved Contrast** - Fixed text readability issues with proper color variables

### Development Notes

#### Adding New Status
1. Add status constant to `ORDER_STATUSES` in `src/api/adminApi.js`
2. Add Czech label to `STATUS_LABELS` object
3. Update status transition logic in `getAvailableStatusTransitions()`
4. Add email template to `supabase/functions/send-email/index.ts`
5. Update status colors in `getStatusColor()` functions
6. Test all transition workflows

#### Extending Admin Features  
- Admin components use consistent styling patterns with CSS variables
- All API calls include comprehensive error handling and loading states
- Email templates support full Czech localization
- Status workflow is configurable via transition rules
- Modal forms use proper contrast colors for readability
- All components are mobile-responsive

#### Recent Bug Fixes
- ✅ Fixed delivery method constant mismatch ('delivery' vs 'courier')
- ✅ Added support for 'pending' status from existing orders
- ✅ Fixed text readability in modals by overriding CSS variables
- ✅ Improved status transition logic for both delivery types
- ✅ Enhanced UI with better contrast and typography

#### Deployment Checklist
1. Deploy updated Edge Function: `supabase functions deploy send-email`
2. Verify database schema includes all status constants
3. Test admin authentication and status workflows
4. Confirm email notifications work for all transitions
5. Validate responsive design on mobile devices

## Deployment Guide

### Main Site Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Set build command: `npm run build:main`
3. Set output directory: `build`
4. Add environment variables:
   - `REACT_APP_ENTRY=main`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### Admin Panel Deployment (Separate Vercel Project)
1. **Create New Vercel Project**:
   - Import the same GitHub repository
   - Use a different project name (e.g., `mattress-admin`)

2. **Build Settings**:
   - Build Command: `npm run build:admin`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Environment Variables**:
   ```
   REACT_APP_ENTRY=admin
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Domain Configuration**:
   - Main site: `your-domain.com`
   - Admin panel: `admin.your-domain.com` or separate domain

### Changing Admin Password

#### Method 1: Using Password Generator Script (Recommended)
1. Edit `generate-password-hash.js` and change the password on line 4:
   ```javascript
   const newPassword = 'your_new_password_here';
   ```
2. Run the script:
   ```bash
   node generate-password-hash.js
   ```
3. Copy the generated SQL command and execute it in Supabase Dashboard → SQL Editor
4. Clear localStorage in browser (DevTools → Application → Local Storage → delete `mattress_admin_auth`)
5. Login with new password

#### Method 2: Interactive Password Change
1. Run the interactive utility:
   ```bash
   node change-admin-password.js
   ```
2. Enter your new password when prompted
3. Copy the generated SQL command to Supabase Dashboard
4. Clear browser localStorage
5. Login with new password

#### Method 3: Direct SQL Update
1. Generate bcrypt hash using any online bcrypt generator (use cost factor 10)
2. Execute in Supabase Dashboard → SQL Editor:
   ```sql
   UPDATE admin_users 
   SET password_hash = '$2b$10$your_new_bcrypt_hash_here'
   WHERE username = '123';
   ```
3. Clear browser localStorage
4. Login with new password

**Important Notes:**
- Always use bcrypt hash format `$2b$10$...` (not `$2a$`)
- Clear localStorage after password change
- The password field in database is called `password_hash` (not `password`)
- Current login is `123` / `123` - change both username and password as needed

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml` for automated deployments:

```yaml
name: Deploy Applications
on:
  push:
    branches: [main]

jobs:
  deploy-main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Main to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_MAIN }}
          
  deploy-admin:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Admin to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_ADMIN }}
```

### Security Considerations
- **Admin Panel**: Deploy on separate subdomain with restricted access
- **Environment Variables**: Never commit sensitive data to repository
- **Authentication**: Consider implementing JWT tokens for production
- **HTTPS**: Ensure both applications use SSL certificates
- **Database Access**: Use row-level security in Supabase for admin operations