# Настройка MailerSend для email уведомлений

MailerSend - это современный email сервис с отличным бесплатным планом (3,000 писем/месяц).

## Шаг 1: Создание аккаунта MailerSend

1. Перейдите на https://www.mailersend.com/
2. Нажмите "Start for free"
3. Зарегистрируйтесь:
   - **Email**: ваш email
   - **Password**: надежный пароль
   - **First name / Last name**: ваши данные
   - **Company**: название вашей компании

4. Подтвердите email адрес

## Шаг 2: Добавление и верификация домена

1. В MailerSend Dashboard перейдите в **Domains**
2. Нажмите **Add domain**
3. Введите ваш домен (например: `yourdomain.com`)
4. Следуйте инструкциям для добавления DNS записей:
   - **TXT запись** для верификации домена
   - **CNAME записи** для DKIM
   - **MX запись** (опционально)

5. Дождитесь верификации домена (обычно несколько минут)

**Для тестирования можно использовать поддомен MailerSend:**
- Если не хотите настраивать свой домен, можете использовать `trial-xxx.mlsend.com`

## Шаг 3: Создание API Token

1. В MailerSend Dashboard: **API Tokens**
2. Нажмите **Create token**
3. **Token name**: `mattress-configurator-token`
4. **Domain**: выберите ваш верифицированный домен
5. **Scopes**: выберите **Email send** (минимум, или **Full access**)
6. Нажмите **Create token**
7. **ВАЖНО**: Скопируйте токен (показывается только один раз!)
   - Токен выглядит так: `mlsn.xxxxxxxxxxxxxxxxxx`

## Шаг 4: Деплой Supabase Edge Function

1. Установите Supabase CLI (если еще не установлен):
```bash
npm install -g supabase
```

2. Авторизуйтесь в Supabase:
```bash
supabase login
```

3. Инициализируйте проект (в корне папки проекта):
```bash
supabase init
```

4. Свяжите с вашим проектом:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

5. Деплойте Edge Function:
```bash
supabase functions deploy send-email
```

## Шаг 5: Настройка переменных окружения в Supabase

1. Откройте Supabase Dashboard → ваш проект
2. Перейдите в **Edge Functions** → **Settings** 
3. Добавьте переменные окружения:

**Переменные:**
- `MAILERSEND_API_KEY` = ваш MailerSend API токен (из шага 3)
- `MAILERSEND_FROM_EMAIL` = email отправителя (`noreply@yourdomain.com`)
- `MAILERSEND_FROM_NAME` = имя отправителя (`Matrace Konfigurátor`)
- `ADMIN_EMAIL` = ваш email для получения уведомлений о заказах

**Пример:**
```
MAILERSEND_API_KEY=mlsn.abcdefghij1234567890
MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
MAILERSEND_FROM_NAME=Matrace Konfigurátor
ADMIN_EMAIL=admin@yourdomain.com
```

4. Нажмите **Save**

## Шаг 6: Тестирование

1. Перезапустите React приложение
2. Создайте тестовый заказ
3. Проверьте:
   - Консоль браузера на наличие ошибок
   - Email клиента (письмо подтверждения)
   - Email админа (уведомление о заказе)

## Шаг 7: Мониторинг

В MailerSend Dashboard можете отслеживать:
- **Analytics** → статистика отправленных писем  
- **Activity** → детали каждого письма с временными метками
- **Suppressions** → заблокированные адреса и отписки
- **Logs** → детальные логи доставки

## Преимущества MailerSend

✅ **3,000 писем в месяц бесплатно** (vs 100/день у SendGrid)  
✅ **Современный интерфейс** и отличная документация  
✅ **Высокая доставляемость** - специализация на transactional emails  
✅ **Детальная аналитика** с real-time отслеживанием  
✅ **Template engine** - можно создавать шаблоны в интерфейсе  
✅ **Webhooks** - для отслеживания статуса доставки  
✅ **Быстрая поддержка** и активное сообщество  

## Troubleshooting

### Ошибка "Unauthorized" 
- Проверьте правильность API токена в Supabase переменных
- Убедитесь что токен имеет права на отправку (`Email send` scope)

### Письма не приходят
- Проверьте Spam папку
- Убедитесь что домен верифицирован в MailerSend
- Проверьте Activity в MailerSend - там видно статус доставки

### Ошибка домена
- Убедитесь что используете email с верифицированного домена
- Для тестирования можете использовать trial домен MailerSend

### Ошибка Edge Function  
- Проверьте логи: Supabase Dashboard → Edge Functions → Logs
- Убедитесь что все переменные окружения настроены правильно

## Платные планы

Если понадобится больше писем:
- **Starter**: $25/мес - 50,000 писем
- **Professional**: $80/мес - 150,000 писем + расширенная аналитика
- **Enterprise**: Custom - неограниченно + белый список IP