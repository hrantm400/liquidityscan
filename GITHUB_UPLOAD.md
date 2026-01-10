# Инструкция по загрузке проекта в GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com)
2. Нажмите кнопку **"New"** или **"+"** → **"New repository"**
3. Введите название репозитория (например: `liquidityscan`)
4. Выберите **Public** или **Private**
5. **НЕ** ставьте галочки на "Initialize with README", "Add .gitignore", "Choose a license"
6. Нажмите **"Create repository"**

## Шаг 2: Добавьте файлы в git

Выполните следующие команды в PowerShell (в папке проекта):

```powershell
# Добавить все файлы
git add .

# Создать первый коммит
git commit -m "Initial commit"

# Переименовать ветку в main (если нужно)
git branch -M main
```

## Шаг 3: Подключите удаленный репозиторий

После создания репозитория на GitHub, вы увидите URL. Выполните:

```powershell
# Замените YOUR_USERNAME и YOUR_REPO_NAME на ваши данные
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

## Шаг 4: Загрузите код в GitHub

```powershell
git push -u origin main
```

Если GitHub попросит авторизацию:
- Используйте **Personal Access Token** вместо пароля
- Или настройте SSH ключи

## Полезные команды

```powershell
# Проверить статус
git status

# Посмотреть какие файлы будут добавлены
git status --short

# Отменить добавление файла (если нужно)
git reset HEAD <файл>

# Посмотреть историю коммитов
git log

# Обновить код с GitHub
git pull origin main
```

## Если возникли проблемы

### Ошибка авторизации
- Создайте Personal Access Token: Settings → Developer settings → Personal access tokens → Tokens (classic)
- Используйте токен вместо пароля при push

### Большой размер файлов
- GitHub имеет лимит 100MB на файл
- Если есть большие файлы, используйте Git LFS или удалите их из .gitignore

### Изменить URL удаленного репозитория
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```
