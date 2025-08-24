# Mattress Configurator

Полнофункциональный конфигуратор матрасов с визуальным превью, корзиной, платежными системами и админ панелью.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Основной сайт (localhost:3000)
npm start

# Админ панель (localhost:3001) 
npm run start:admin
```

### Переменные окружения (.env)

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Структура проекта

```
src/
├── App.js                 # Основной конфигуратор матрасов
├── components/
│   ├── AdminPanel.js      # Админ панель (отдельное приложение)
│   ├── ShoppingCart.js    # Корзина и оформление заказа
│   └── ...
├── api/
│   ├── mattressApi.js     # Supabase интеграция
│   └── adminApi.js        # Админ API
└── services/
    ├── adminAuth.js       # Аутентификация админа
    ├── emailService.js    # MailerSend интеграция
    └── paymentStubs.js    # Заглушки платежных систем
```

## 🛠️ Команды

### Разработка
- `npm start` - Основной сайт (порт 3000)
- `npm run start:admin` - Админ панель (порт 3001)

### Сборка
- `npm run build` - Сборка обеих приложений
- `npm run build:main` - Только основной сайт
- `npm run build:admin` - Только админ панель

## 🔑 Доступ к админке

- **URL**: http://localhost:3001 (разработка)
- **Логин**: `123`
- **Пароль**: `123`

## 🚀 Деплой на Vercel

### Основной сайт
```bash
Build Command: npm run build:main
Environment Variables:
  REACT_APP_ENTRY=main
  REACT_APP_SUPABASE_URL=...
  REACT_APP_SUPABASE_ANON_KEY=...
```

### Админ панель (отдельный проект)
```bash
Build Command: npm run build:admin  
Environment Variables:
  REACT_APP_ENTRY=admin
  REACT_APP_SUPABASE_URL=...
  REACT_APP_SUPABASE_ANON_KEY=...
```

## 📋 Возможности

✅ **Визуальный конфигуратор** - интерактивный превью матраса  
✅ **Умная корзина** - управление количеством, дубликатами  
✅ **Чешские платежи** - Comgate, dobírka, карта, Google Pay  
✅ **Email уведомления** - через MailerSend (3K писем/месяц)  
✅ **Админ панель** - управление заказами, статусами  
✅ **База данных** - Supabase PostgreSQL  
✅ **Адаптивный дизайн** - мобильные устройства  

## 📖 Документация

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Полная инструкция по настройке
- **[CLAUDE.md](./CLAUDE.md)** - Техническая документация для разработчиков

## 🔧 Технологии

- **Frontend**: React 19, CSS Grid/Flexbox
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Email**: MailerSend API
- **Деплой**: Vercel
- **Аутентификация**: localStorage + bcrypt

---

**Для полной настройки смотрите [SETUP_GUIDE.md](./SETUP_GUIDE.md)**
