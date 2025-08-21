# Настройка Stripe для платежей

## Шаг 1: Создание аккаунта Stripe

1. Перейдите на https://stripe.com
2. Нажмите "Start now" 
3. Зарегистрируйтесь (нужен email и базовая информация о бизнесе)
4. Подтвердите email

## Шаг 2: Получение тестовых ключей

1. В Stripe Dashboard переключитесь в **Test mode** (переключатель справа сверху)
2. Перейдите в **Developers** → **API keys**
3. Скопируйте **Publishable key** (начинается с `pk_test_`)
4. В файле `.env` замените `pk_test_YOUR_TEST_KEY_HERE` на ваш ключ

## Шаг 3: Настройка Webhook для обработки платежей

1. В Stripe Dashboard: **Developers** → **Webhooks**
2. Нажмите **Add endpoint**
3. URL endpoint: `https://ваш-домен.vercel.app/api/webhooks/stripe`
4. События для отслеживания:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## Шаг 4: Тестовые карты

Для тестирования используйте эти данные карт:

**Успешная оплата:**
- Номер: `4242 4242 4242 4242`
- Срок: любая будущая дата
- CVC: любые 3 цифры

**Отклоненная карта:**
- Номер: `4000 0000 0000 0002`

## Следующие шаги

После настройки Stripe нужно будет создать backend API для:
1. Создания Stripe Checkout Sessions
2. Обработки Webhook событий
3. Обновления статуса заказов в Supabase

Это можно сделать через:
- Supabase Edge Functions
- Vercel API Routes
- Отдельный Node.js сервер