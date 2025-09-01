# CLAUDE.md

React mattress configurator with real-time preview, Supabase backend, and Czech localization.

## Commands
- `npm start` - Development server (localhost:3000)
- `npm run build` - Production build
- `npm test` - Run tests

## Architecture

### Core Components
- **App.js** - Main state management, URL handling, price calculation
- **OptionGroup** - Reusable layer/cover selection with responsive grid
- **ShoppingCart** - Modal cart with Czech payment methods and validation
- **FloatingMattress** - Animated preview overlay

### Data Sources
- **Supabase Tables**: `mattress_layers` (150+ with size-based pricing), `mattress_covers`, `orders`
- **Static Config**: `/public/data/url-mapping.json`, `layer-descriptions.json`
- **Images**: `/public/layers/{height}/{single|double}/{layer}/{slug}.webp`

### Key State (React hooks)
- `selectedOptions` - Layer/cover IDs object
- `selectedSize` - Mattress dimensions string
- `selectedHeight` - 10|20|30 cm
- `cartItems` - Shopping cart array
- `totalPrice` - Calculated via useMemo

### URL System
Pattern: `/{size}-{height}cm-{layer1}-{layer2}-{layer3}-{cover}`
Auto-updates on changes, parses on page load

## Design System

### Unified Button Styles
All buttons use `.btn-primary` base class with CSS variables:
```css
--btn-bg: linear-gradient(180deg, color-mix(...))
--btn-shadow: 0 4px 12px rgba(0,0,0,.25)
--btn-ripple-color: rgba(255, 255, 255, 0.3)
```

**Button Locations:**
- Calculator: "Přidat do košíku" 
- Cart: "Objednat", "Dokončit objednávku"
- Bottom bar: "Перейти к корзине" (with pulse animation)

### UX Animations
- **Cart icon**: Pulse on item add, badge bounce on quantity change
- **Price updates**: Micro-scale animation (`.price-update` class)
- **Buttons**: Ripple wave on click, hover lift transform
- **Gentle pulse**: Bottom bar button (4s cycle, pauses on hover)

### Responsive Breakpoints
- Desktop: >1024px (floating calculator)
- Mobile: ≤1024px (inline calculator + bottom bar)
- Key breakpoints: 1366px, 1100px, 600px, 420px

## Development Guidelines

### Layer Visibility
Heights determine visible layers: 10cm=1, 20cm=2, 30cm=3 layers
Layer keys: `sloj-odin`, `sloj-dva`, `sloj-tri`, `potah`

### Price Calculation
Supabase layers have size-based pricing object. Always use `getLayerPrice(layer, size)` helper.

### Performance
- `useMemo` for price calculations and descriptions
- `ResizeObserver` + `requestAnimationFrame` for layout updates
- Global card height synchronization via CSS variables

### Code Style
- Prefer editing existing files over creating new ones
- Use existing CSS variables and design tokens
- Follow established animation timing: `--anim-fast` (150ms), `--anim-medium` (300ms)
- Maintain Czech language for UI text

## Key Files
- `src/api/mattressApi.js` - Supabase operations
- `src/services/paymentStubs.js` - Czech payment simulators  
- `src/services/emailService.js` - MailerSend integration
- `src/App.css` - Design system and animations