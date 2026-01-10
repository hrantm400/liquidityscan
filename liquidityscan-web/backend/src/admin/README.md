# Admin Module

## Структура

```
admin/
├── guards/
│   └── admin.guard.ts          # Guard для проверки админ доступа
├── decorators/
│   └── admin.decorator.ts      # Декоратор @Admin() для защиты роутов
├── dto/
│   ├── create-course.dto.ts    # DTO для создания курса
│   ├── update-course.dto.ts    # DTO для обновления курса
│   ├── create-lesson.dto.ts    # DTO для создания урока
│   ├── update-lesson.dto.ts    # DTO для обновления урока
│   ├── update-user.dto.ts      # DTO для обновления пользователя
│   ├── create-content.dto.ts   # DTO для создания контента
│   ├── update-content.dto.ts   # DTO для обновления контента
│   └── index.ts                # Экспорт всех DTOs
├── admin.service.ts            # Сервис с бизнес-логикой
├── admin.controller.ts         # Контроллер с API endpoints
├── admin.module.ts             # NestJS модуль
└── README.md                   # Эта документация
```

## Использование

### Защита роутов

Используйте декоратор `@Admin()` для защиты любого роута:

```typescript
import { Admin } from './decorators/admin.decorator';

@Controller('admin')
export class MyController {
  @Admin()
  @Get('data')
  async getData() {
    // Только админы могут вызвать этот endpoint
    return { message: 'Protected data' };
  }
}
```

Декоратор автоматически применяет:
- `JwtAuthGuard` - проверка JWT токена
- `AdminGuard` - проверка админ email

### Admin Guard

Guard проверяет:
1. Наличие JWT токена и валидного user в request
2. Email пользователя против списка `ADMIN_EMAILS` из env

Если проверка не пройдена - выбрасывается `ForbiddenException`.

### Admin Service

Основной сервис для админ операций:

```typescript
// Пример использования
constructor(private adminService: AdminService) {}

async getAllUsers() {
  return this.adminService.getAllUsers(1, 50, 'john');
}

async createCourse(data) {
  return this.adminService.createCourse(data);
}
```

## API Routes

Все роуты начинаются с `/api/admin` и требуют админ доступа.

### Users
- `GET /users` - Список пользователей
- `GET /users/:id` - Детали пользователя
- `PUT /users/:id` - Обновить пользователя
- `DELETE /users/:id` - Удалить пользователя

### Courses
- `GET /courses` - Список курсов
- `POST /courses` - Создать курс
- `GET /courses/:id` - Детали курса
- `PUT /courses/:id` - Обновить курс
- `DELETE /courses/:id` - Удалить курс
- `POST /courses/:id/publish` - Опубликовать/скрыть

### Lessons
- `GET /courses/:courseId/lessons` - Список уроков курса
- `POST /courses/:courseId/lessons` - Создать урок
- `PUT /lessons/:id` - Обновить урок
- `DELETE /lessons/:id` - Удалить урок
- `PUT /lessons/reorder` - Изменить порядок

### Signals
- `GET /signals` - Список сигналов
- `DELETE /signals/:id` - Удалить сигнал
- `PUT /signals/:id/status` - Обновить статус

### Analytics
- `GET /analytics/dashboard` - Общая статистика
- `GET /analytics/users` - Статистика пользователей
- `GET /analytics/courses` - Статистика курсов
- `GET /analytics/signals` - Статистика сигналов

### Content
- `GET /content` - Список контента
- `POST /content` - Создать контент
- `PUT /content/:id` - Обновить контент
- `DELETE /content/:id` - Удалить контент
- `POST /content/:id/publish` - Опубликовать/скрыть

### Settings
- `GET /settings` - Настройки системы

## Добавление нового функционала

### 1. Добавить метод в Service

```typescript
// admin.service.ts
async myNewFeature() {
  // Ваша логика
  return result;
}
```

### 2. Добавить роут в Controller

```typescript
// admin.controller.ts
@Admin()
@Get('my-feature')
async myFeature() {
  return this.adminService.myNewFeature();
}
```

### 3. Использовать в frontend

```typescript
// frontend/src/services/adminApi.ts
export const myFeatureApi = {
  get: () => adminApi.get('/my-feature').then(res => res.data),
};
```

## Логирование

Все важные действия логируются через `Logger`:

```typescript
this.logger.log('User updated: user@example.com');
this.logger.warn('Admin access denied for user: user@example.com');
```

Логи помогают отслеживать:
- Кто и когда выполнил действие
- Какие изменения были сделаны
- Попытки несанкционированного доступа

## Валидация

Все DTOs используют class-validator для валидации:

```typescript
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}
```

Валидация применяется автоматически через ValidationPipe в NestJS.
