# Admin Panel Documentation

## Overview

Полнофункциональная админ-панель для управления всеми аспектами платформы Liquidity Scan.

## Доступ

### Настройка админов

Добавьте админ emails в `.env` файл:

```env
ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
```

### Проверка доступа

Система автоматически проверяет email пользователя при каждом запросе к админ роутам:
- JWT токен проверяется через `JwtAuthGuard`
- Email проверяется через `AdminGuard` против списка `ADMIN_EMAILS`
- Если email не в списке - доступ запрещен (403 Forbidden)

## Backend API

### Base URL: `/api/admin`

Все роуты требуют JWT аутентификацию и админ права.

### Users Management

- `GET /admin/users` - Получить всех пользователей (с пагинацией и поиском)
- `GET /admin/users/:id` - Получить пользователя по ID
- `PUT /admin/users/:id` - Обновить пользователя
- `DELETE /admin/users/:id` - Удалить пользователя

### Courses Management

- `GET /admin/courses` - Получить все курсы
- `GET /admin/courses/:id` - Получить курс по ID
- `POST /admin/courses` - Создать новый курс
- `PUT /admin/courses/:id` - Обновить курс
- `DELETE /admin/courses/:id` - Удалить курс
- `POST /admin/courses/:id/publish` - Опубликовать/скрыть курс

### Lessons Management

- `GET /admin/courses/:courseId/lessons` - Получить все уроки курса
- `POST /admin/courses/:courseId/lessons` - Создать новый урок
- `PUT /admin/lessons/:id` - Обновить урок
- `DELETE /admin/lessons/:id` - Удалить урок
- `PUT /admin/lessons/reorder` - Изменить порядок уроков

### Signals Management

- `GET /admin/signals` - Получить все сигналы (с фильтрами)
- `DELETE /admin/signals/:id` - Удалить сигнал
- `PUT /admin/signals/:id/status` - Обновить статус сигнала

### Analytics

- `GET /admin/analytics/dashboard` - Общая статистика
- `GET /admin/analytics/users` - Статистика пользователей
- `GET /admin/analytics/courses` - Статистика курсов
- `GET /admin/analytics/signals` - Статистика сигналов

### Content Management

- `GET /admin/content` - Получить весь контент
- `POST /admin/content` - Создать контент
- `PUT /admin/content/:id` - Обновить контент
- `DELETE /admin/content/:id` - Удалить контент
- `POST /admin/content/:id/publish` - Опубликовать/скрыть контент

### Settings

- `GET /admin/settings` - Получить настройки системы

## Frontend Routes

### Base URL: `/admin`

Все роуты защищены через `AdminRoute` компонент.

- `/admin` - Админ дашборд
- `/admin/users` - Управление пользователями
- `/admin/courses` - Управление курсами
- `/admin/courses/:courseId` - Редактор курса
- `/admin/signals` - Управление сигналами
- `/admin/analytics` - Аналитика
- `/admin/content` - Управление контентом
- `/admin/settings` - Настройки системы

## Features

### Users Management
- Просмотр всех пользователей с пагинацией
- Поиск по имени и email
- Редактирование профилей
- Удаление пользователей
- Просмотр статистики по каждому пользователю

### Courses Management
- CRUD операции для курсов
- Публикация/скрытие курсов
- Управление уроками
- Drag & drop переупорядочивание
- Фильтры по категории и статусу

### Lessons Management
- Создание видео/текстовых/тестовых уроков
- Управление порядком уроков
- Блокировка/разблокировка уроков
- Загрузка контента

### Signals Management
- Просмотр всех сигналов
- Фильтры по стратегии, символу, статусу
- Изменение статуса сигналов
- Удаление сигналов
- Модерация

### Analytics
- Статистика пользователей
- Статистика курсов
- Статистика сигналов
- Графики и диаграммы
- Топ курсов по рейтингу

### Content Management
- Управление статьями
- Управление новостями
- Управление уведомлениями
- Публикация контента

### Settings
- Просмотр админ emails
- Статус интеграций (Java Bot, Binance, MEXC)
- Системные действия (Backup, Export, Clear Cache)

## Security

### Backend
- JWT аутентификация на всех роутах
- Проверка админ email на каждом запросе
- Валидация входных данных через DTOs
- Rate limiting
- Логирование всех админ действий

### Frontend
- Проверка админ доступа при рендере
- Автоматический редирект если не админ
- Защита всех роутов через `AdminRoute`

## Database Models

### Course
- Полная информация о курсе
- Связь с уроками
- Статистика студентов

### Lesson
- Связь с курсом
- Поддержка разных типов контента
- Порядок и блокировка

### CourseProgress
- Прогресс пользователя по курсам
- Прогресс по урокам
- Отметки о завершении

### Content
- Статьи, новости, уведомления
- Публикация/черновики
- Timestamps

## Usage

### 1. Добавить админа

Добавьте email в `.env`:
```env
ADMIN_EMAILS=your-email@example.com
```

### 2. Войти в систему

Войдите через обычный логин с вашим админ email.

### 3. Доступ к админке

Перейдите на `/admin` - вы увидите админ дашборд.

### 4. Управление

Используйте боковое меню для навигации между разделами.

## Development

### Добавление новых функций

1. Backend: Добавить метод в `AdminService`
2. Backend: Добавить роут в `AdminController` с декоратором `@Admin()`
3. Frontend: Добавить API метод в `adminApi.ts`
4. Frontend: Создать UI компонент

### Добавление новых админов

Просто добавьте email в `ADMIN_EMAILS` в `.env` файле через запятую.

## Notes

- Миграция базы данных создается автоматически при изменении schema
- Все админ действия логируются
- UI адаптивный и работает на всех устройствах
- Поддержка темной/светлой темы
