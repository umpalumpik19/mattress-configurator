# 🚀 Полная инструкция по запуску Mattress Configurator

Этот гайд поможет вам запустить полнофункциональный конфигуратор матрасов с backend, email уведомлениями и платежными системами.

## 📋 Что вы получите

✅ **React конфигуратор** с визуальным превью матрасов  
✅ **Supabase база данных** с 150+ продуктами  
✅ **MailerSend email уведомления** (3000 писем/месяц бесплатно)  
✅ **Чешские платежные системы** (Comgate, dobírka, карта, Google Pay)  
✅ **Красивую корзину и оформление заказа**  
✅ **Админ панель** для просмотра заказов в Supabase  

---

## 🛠️ Шаг 1: Настройка Supabase

### 1.1 Создание проекта

1. **Регистрируйтесь на https://supabase.com**
2. **Создайте новый проект:**
   - Name: `mattress-configurator`
   - Password: придумайте надежный пароль
   - Region: выберите ближайший
3. **Дождитесь создания** (1-2 минуты)

### 1.2 Создание таблиц

1. **Откройте SQL Editor** в Supabase Dashboard
2. **Нажмите "New query"**
3. **Скопируйте содержимое файла `supabase-schema.sql`**
4. **Вставьте в SQL Editor и нажмите "Run"**

✅ **Проверьте:** В Table Editor должны появиться 3 таблицы

### 1.3 Импорт данных

1. **В терминале проекта выполните:**
   ```bash
   node import-data-to-supabase.js
   ```

✅ **Проверьте:** 150 записей в `mattress_layers`, 3 записи в `mattress_covers`

---

## 📧 Шаг 2: Настройка MailerSend 

### 2.1 Создание аккаунта

1. **Регистрируйтесь на https://www.mailersend.com/**
2. **Подтвердите email**

### 2.2 Получение trial домена

1. **Domains** → найдите автоматически созданный `trial-xxx.mlsend.com`
2. **Запомните этот домен** - будете использовать для email

### 2.3 Создание API Token

1. **API Tokens** → **Create token**
2. **Token name:** `mattress-configurator`
3. **Scopes:** Email send (или Full access)
4. **Скопируйте токен** (показывается один раз!)

### 2.4 Деплой Email функции

1. **Установите Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Авторизуйтесь:**
   ```bash
   supabase login
   ```

3. **Инициализируйте проект:**
   ```bash
   supabase init
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Деплойте функцию:**
   ```bash
   supabase functions deploy send-email
   ```

### 2.5 Настройка переменных

**В Supabase Dashboard → Edge Functions → Settings добавьте:**

```
MAILERSEND_API_KEY=mlsn.ваш_токен_здесь
MAILERSEND_FROM_EMAIL=noreply@trial-xxx.mlsend.com
MAILERSEND_FROM_NAME=Matrace Konfigurátor
ADMIN_EMAIL=ваш_email@example.com
```

**Замените:**
- `ваш_токен_здесь` на токен из п.2.3
- `trial-xxx.mlsend.com` на ваш trial домен
- `ваш_email@example.com` на email для получения уведомлений

---

## ⚙️ Шаг 3: Настройка Frontend

### 3.1 Установка зависимостей

```bash
npm install
```

### 3.2 Настройка .env

**В корне проекта откройте `.env` и замените:**

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Где взять ключи:**
- Supabase Dashboard → Settings → API
- URL и anon public key

### 3.3 Запуск приложения

```bash
npm start
```

**Откроется http://localhost:3000** ✅

---

## 🧪 Шаг 4: Тестирование

### 4.1 Тестирование конфигуратора

1. **Откройте приложение**
2. **Создайте конфигурацию матраса**
3. **Добавьте в корзину**
4. **Нажмите "Objednat"**

### 4.2 Тестирование заказа

1. **Заполните форму заказа**
2. **Выберите способ оплаты** (все работают как заглушки)
3. **Нажмите "Dokončit objednávku"**
4. **Дождитесь обработки** (2-3 секунды)

### 4.3 Проверьте результат

✅ **Красивое окно успеха** с номером заказа  
✅ **Заказ в Supabase** (Table Editor → orders)  
✅ **Email клиенту** (проверьте почту)  
✅ **Email админу** (на ваш admin email)  
✅ **Корзина очистилась**  

---

## 🚀 Шаг 5: Деплой на Vercel (опционально)

### 5.1 Создание GitHub репозитория

**Если у вас еще нет аккаунта GitHub:**
1. **Регистрируйтесь на https://github.com**
2. **Подтвердите email**

**Создание репозитория:**
1. **На GitHub нажмите зеленую кнопку "New"**
2. **Repository name**: `mattress-configurator` 
3. **Поставьте галочку "Add a README file"**
4. **Нажмите "Create repository"**

### 5.2 Подготовка локального проекта

**В терминале в папке проекта выполните по очереди:**

```bash
# 1. Инициализируем Git (если еще не сделано)
git init

# 2. Добавляем все файлы
git add .

# 3. Создаем первый коммит
git commit -m "Initial commit with full backend"

# 4. Указываем адрес вашего GitHub репозитория
git remote add origin https://github.com/umpalumpik19/mattress-configurator.git

# 5. Отправляем код на GitHub
git push -u origin main
```

**Замените в команде 4:**
- `YOUR_USERNAME` на ваш никнейм GitHub

**Если попросит авторизацию:**
- Username: ваш никнейм GitHub  
- Password: используйте **Personal Access Token** (не обычный пароль)

**Как создать Personal Access Token:**
1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** → **repo** права → **Generate token**
3. **Скопируйте токен** и используйте как пароль

### 5.3 Деплой на Vercel

1. **Регистрируйтесь на https://vercel.com через GitHub**
2. **После входа нажмите "Add New" → "Project"** 
3. **Найдите ваш репозиторий `mattress-configurator`**
4. **Нажмите "Import"**
5. **В разделе Environment Variables добавьте:**
   - Name: `REACT_APP_SUPABASE_URL`, Value: ваш Supabase URL
   - Name: `REACT_APP_SUPABASE_ANON_KEY`, Value: ваш Supabase ключ
6. **Нажмите "Deploy"**
7. **Дождитесь деплоя** (2-3 минуты)

✅ **Ваш сайт будет доступен по ссылке вида: `https://mattress-configurator-xxx.vercel.app`**

### 5.4 Обновление сайта в будущем

**Когда захотите внести изменения:**

```bash
# 1. Добавляем изменения
git add .

# 2. Создаем коммит с описанием изменений  
git commit -m "Описание что изменили"

# 3. Отправляем на GitHub
git push

# 4. Vercel автоматически обновит сайт!
```

**Vercel подключен к GitHub** - любые изменения в репозитории автоматически деплоятся на сайт!

---

## 📊 Мониторинг и управление

### Заказы
**Supabase Dashboard → Table Editor → orders**
- Просматривайте все заказы
- Меняйте статусы
- Экспортируйте в CSV

### Email статистика  
**MailerSend Dashboard → Analytics**
- Количество отправленных писем
- Статус доставки
- Открытия и клики

### База данных
**Supabase Dashboard → Table Editor**
- Управляйте продуктами
- Меняйте цены
- Добавляйте новые материалы

---

## 🆘 Troubleshooting

### Проблема: Заказ не создается
**Решение:**
- Проверьте Supabase ключи в `.env`
- Проверьте консоль браузера на ошибки

### Проблема: Email не приходят
**Решение:**
- Проверьте переменные MailerSend в Supabase
- Проверьте Spam папку
- Проверьте логи: Edge Functions → Logs

### Проблема: Платежи не работают
**Решение:**
- Это нормально - используются заглушки
- Реальные платежи настраиваются отдельно

### Проблема: Git команды не работают
**Решение:**
- Убедитесь что Git установлен: https://git-scm.com/downloads
- Используйте Git Bash на Windows
- Проверьте правильность никнейма GitHub в команде

### Проблема: GitHub не принимает пароль
**Решение:**
- GitHub убрал поддержку паролей в 2021
- Используйте Personal Access Token вместо пароля
- Или настройте SSH ключи

---

## 💰 Что дальше

### Для продакшена:
1. **Настройте свой домен** в MailerSend
2. **Интегрируйте реальные платежи** (Comgate, Stripe)
3. **Создайте админ панель** для управления заказами
4. **Добавьте аналитику** (Google Analytics)

### Лимиты бесплатных планов:
- **Supabase:** 500MB база, 2GB трафик
- **MailerSend:** 3,000 писем/месяц  
- **Vercel:** 100GB трафик

### План деплоя изменений дизайна email

  🔍 Процесс деплоя Edge Function в Supabase:

  1. Локальные изменения:
    - Редактируете файл
  supabase/functions/send-email/index.ts
    - Изменения сохраняются только локально
  2. Деплой в продакшн:
  supabase functions deploy send-email
    - Команда загружает обновленную функцию в Supabase      
  Cloud
    - Изменения применяются немедленно для всех новых       
  писем

  📝 Альтернативные способы деплоя:

  Деплой всех функций сразу:
  supabase functions deploy

  Деплой с отладкой:
  supabase functions deploy send-email --debug

  Проверка статуса:
  supabase functions list

  ⚠️ Важные моменты:

  - Docker не требуется для деплоя (только для
  локальной разработки)
  - Изменения применяются мгновенно - новые заказы
  сразу получат обновленный дизайн
  - Старые письма не изменятся - только новые
  используют новый шаблон
  - Можно просматривать функции в Dashboard: https://su     
  pabase.com/dashboard/project/[PROJECT_ID]/functions       

  🧪 Рекомендуемый workflow:

  1. Изменить дизайн в index.ts
  2. Выполнить supabase functions deploy send-email
  3. Создать тестовый заказ через SQL Editor
  4. Проверить письмо
  5. При необходимости повторить цикл
---

## 📞 Поддержка

Если что-то не работает:

1. **Проверьте все переменные окружения**
2. **Посмотрите консоль браузера**
3. **Проверьте логи Supabase Edge Functions**
4. **Убедитесь что все сервисы работают**

**Готово! Ваш магазин матрасов запущен! 🎉**