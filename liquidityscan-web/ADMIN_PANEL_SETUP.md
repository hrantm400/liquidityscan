# Admin Panel Setup Guide

## Реализованная админ-панель

Полнофункциональная админ-панель с управлением всеми аспектами платформы.

## Быстрый старт

### 1. Настройка админ доступа

Добавьте админ emails в файл `.env` (backend):

```env
ADMIN_EMAILS=admin@example.com,admin2@example.com,admin3@example.com
```

### 2. Миграция базы данных

Модели уже добавлены в `prisma/schema.prisma`. Если база данных запущена, выполните:

```bash
cd liquidityscan-web/backend
npx prisma migrate deploy
npx prisma generate
```

Если база данных не запущена, просто запустите приложение - миграция выполнится автоматически при следующем старте с базой данных.

### 3. Запустите приложение

Backend:
```bash
cd liquidityscan-web/backend
npm run dev
```

Frontend:
```bash
cd liquidityscan-web/frontend
npm run dev
```

### 4. Доступ к админке

1. Войдите в систему с email, который указан в `ADMIN_EMAILS`
2. В боковом меню появится кнопка "Admin Panel" (красная)
3. Или перейдите напрямую на `/admin`

## Реализованные функции

### Backend

#### Admin Guard
- **Файл**: `backend/src/admin/guards/admin.guard.ts`
- Проверяет JWT токен
- Проверяет email против списка `ADMIN_EMAILS`
- Автоматическая защита всех админ роутов

#### Admin Service
- **Файл**: `backend/src/admin/admin.service.ts`
- Управление пользователями (CRUD)
- Управление курсами (CRUD + публикация)
- Управление уроками (CRUD + переупорядочивание)
- Управление сигналами (просмотр, удаление, изменение статуса)
- Аналитика (пользователи, курсы, сигналы)
- Управление контентом (статьи, новости, уведомления)
- Настройки системы

#### Admin Controller
- **Файл**: `backend/src/admin/admin.controller.ts`
- RESTful API для всех операций
- Защита через декоратор `@Admin()`
- Пагинация и фильтрация

#### Database Models
- **Файл**: `backend/prisma/schema.prisma`
- `Course` - курсы с полной информацией
- `Lesson` - уроки с контентом и порядком
- `CourseProgress` - прогресс пользователей
- `Content` - статьи, новости, уведомления

### Frontend

#### Admin Layout
- **Файл**: `frontend/src/pages/admin/AdminLayout.tsx`
- Боковая навигация с иконками
- Верхняя панель с информацией об админе
- Кнопка возврата к основному приложению
- Красный цвет для выделения админ режима

#### Admin Dashboard
- **Файл**: `frontend/src/pages/admin/AdminDashboard.tsx`
- Статистические карточки:
  - Всего пользователей
  - Всего курсов
  - Всего сигналов
  - Всего уроков
- Быстрые действия
- Последняя активность

#### Users Management
- **Файл**: `frontend/src/pages/admin/UsersManagement.tsx`
- Таблица всех пользователей
- Поиск по имени и email
- Редактирование пользователя
- Удаление пользователя
- Просмотр статистики (курсы, стратегии, алерты)
- Пагинация

#### Courses Management
- **Файл**: `frontend/src/pages/admin/CoursesManagement.tsx`
- Карточки всех курсов
- Создание нового курса
- Редактирование курса
- Удаление курса
- Публикация/скрытие курса
- Фильтры по категории и статусу
- Поиск

#### Course Editor
- **Файл**: `frontend/src/pages/admin/CourseEditor.tsx`
- Редактирование деталей курса
- Управление уроками
- Создание уроков
- Удаление уроков
- Переупорядочивание уроков (drag & drop готов к реализации)

#### Signals Management
- **Файл**: `frontend/src/pages/admin/SignalsManagement.tsx`
- Таблица всех сигналов
- Фильтры:
  - По стратегии
  - По символу
  - По статусу
- Изменение статуса
- Удаление сигналов
- Пагинация

#### Analytics
- **Файл**: `frontend/src/pages/admin/Analytics.tsx`
- Статистика пользователей
- Статистика курсов по категориям
- Статистика сигналов по стратегиям
- Топ курсов по рейтингу
- Период анализа (день/неделя/месяц)

#### Content Management
- **Файл**: `frontend/src/pages/admin/ContentManagement.tsx`
- Управление статьями
- Управление новостями
- Управление уведомлениями
- Создание контента
- Редактирование контента
- Публикация/скрытие
- Удаление

#### Settings
- **Файл**: `frontend/src/pages/admin/AdminSettings.tsx`
- Просмотр админ emails
- Статус Java Bot интеграции
- Статус бирж (Binance, MEXC)
- Системные действия:
  - Backup базы данных
  - Export данных
  - Restart сервисов
  - Clear cache

#### Admin API Service
- **Файл**: `frontend/src/services/adminApi.ts`
- Централизованные API вызовы
- Автоматическое добавление JWT токена
- Типизация запросов/ответов

## API Endpoints

### Users
- `GET /api/admin/users?page=1&limit=20&search=john`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

### Courses
- `GET /api/admin/courses?page=1&category=beginner&published=true`
- `POST /api/admin/courses`
- `PUT /api/admin/courses/:id`
- `DELETE /api/admin/courses/:id`
- `POST /api/admin/courses/:id/publish`

### Lessons
- `GET /api/admin/courses/:courseId/lessons`
- `POST /api/admin/courses/:courseId/lessons`
- `PUT /api/admin/lessons/:id`
- `DELETE /api/admin/lessons/:id`
- `PUT /api/admin/lessons/reorder`

### Signals
- `GET /api/admin/signals?strategyType=SUPER_ENGULFING&status=ACTIVE`
- `DELETE /api/admin/signals/:id`
- `PUT /api/admin/signals/:id/status`

### Analytics
- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/users?period=week`
- `GET /api/admin/analytics/courses`
- `GET /api/admin/analytics/signals?period=month`

### Content
- `GET /api/admin/content?type=article&published=true`
- `POST /api/admin/content`
- `PUT /api/admin/content/:id`
- `DELETE /api/admin/content/:id`
- `POST /api/admin/content/:id/publish`

### Settings
- `GET /api/admin/settings`

## Безопасность

### Backend Protection
1. JWT аутентификация (JwtAuthGuard)
2. Проверка админ email (AdminGuard)
3. Оба guard'а комбинируются через декоратор `@Admin()`
4. Все роуты защищены

### Frontend Protection
1. Проверка `isAdmin` в `useAuthStore`
2. `AdminRoute` компонент для защиты роутов
3. Автоматический редирект на `/dashboard` если не админ
4. Визуальное отличие (красный цвет) админ режима

## Дизайн

### Цветовая схема
- Основной цвет: Красный/Оранжевый градиент (отличается от зеленого в обычном приложении)
- Визуальные индикаторы админ режима
- Согласованность с общим дизайном приложения

### Особенности UI
- Glass-panel эффекты
- Framer Motion анимации
- Адаптивный дизайн
- Темная/светлая тема
- Модальные окна для подтверждения действий
- Пагинация для больших списков
- Поиск и фильтрация везде

## Возможности для расширения

1. **Rich Text Editor** для редактирования контента уроков
2. **Drag & Drop** для переупорядочивания уроков
3. **Загрузка файлов** для видео и изображений
4. **Графики и диаграммы** (Chart.js или Recharts) для аналитики
5. **Email уведомления** при важных событиях
6. **Логи действий** админов
7. **Экспорт данных** в CSV/Excel
8. **Резервное копирование** базы данных

## Следующие шаги

1. Добавьте свой email в `ADMIN_EMAILS`
2. Запустите приложение
3. Войдите с админ email
4. Перейдите в `/admin`
5. Начните управлять платформой!

## Troubleshooting

### Нет доступа к админке
- Проверьте, что ваш email есть в `ADMIN_EMAILS`
- Проверьте, что вы вошли с этим email
- Перезапустите backend после изменения `.env`

### Ошибки миграции
- Убедитесь, что база данных запущена
- Выполните `npx prisma migrate deploy`
- При необходимости сбросьте базу: `npx prisma migrate reset`

### 403 Forbidden
- Проверьте JWT токен
- Проверьте email в `ADMIN_EMAILS`
- Проверьте логи backend
