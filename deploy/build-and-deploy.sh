#!/bin/bash

# Скрипт для сборки и подготовки статики к развертыванию
# Использование: ./build-and-deploy.sh [domain] [server-user] [server-ip]

set -e  # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Параметры
DOMAIN="${1:-yourdomain.com}"
SERVER_USER="${2:-root}"
SERVER_IP="${3}"
FRONTEND_DIR="liquidityscan-web/frontend"
BUILD_DIR="$FRONTEND_DIR/dist"
DEPLOY_DIR="deploy"
ARCHIVE_NAME="homepage-$(date +%Y%m%d-%H%M%S).tar.gz"

echo -e "${GREEN}=== Скрипт сборки и подготовки к развертыванию ===${NC}\n"

# Проверка наличия директории frontend
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Ошибка: Директория $FRONTEND_DIR не найдена!${NC}"
    exit 1
fi

# Переход в директорию frontend
echo -e "${YELLOW}Шаг 1: Переход в директорию frontend...${NC}"
cd "$FRONTEND_DIR"

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Шаг 2: Установка зависимостей...${NC}"
    npm install
else
    echo -e "${GREEN}Зависимости уже установлены.${NC}"
fi

# Очистка предыдущей сборки
if [ -d "dist" ]; then
    echo -e "${YELLOW}Шаг 3: Очистка предыдущей сборки...${NC}"
    rm -rf dist
fi

# Сборка проекта
echo -e "${YELLOW}Шаг 4: Сборка production версии...${NC}"
npm run build

# Проверка успешности сборки
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo -e "${RED}Ошибка: Сборка не удалась или директория dist пуста!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Сборка завершена успешно!${NC}"

# Возврат в корневую директорию проекта
cd - > /dev/null

# Создание архива
echo -e "${YELLOW}Шаг 5: Создание архива для развертывания...${NC}"
tar -czf "$ARCHIVE_NAME" -C "$BUILD_DIR" .

echo -e "${GREEN}✓ Архив создан: $ARCHIVE_NAME${NC}"

# Вывод информации о размере
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
echo -e "${GREEN}Размер архива: $ARCHIVE_SIZE${NC}\n"

# Опциональная загрузка на сервер
if [ -n "$SERVER_IP" ]; then
    echo -e "${YELLOW}Шаг 6: Загрузка на сервер...${NC}"
    echo -e "Домен: ${GREEN}$DOMAIN${NC}"
    echo -e "Сервер: ${GREEN}$SERVER_USER@$SERVER_IP${NC}"
    echo -e "Директория на сервере: ${GREEN}/var/www/$DOMAIN${NC}\n"
    
    read -p "Продолжить загрузку? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Создание директории на сервере (если не существует)
        ssh "$SERVER_USER@$SERVER_IP" "sudo mkdir -p /var/www/$DOMAIN"
        
        # Загрузка архива
        echo -e "${YELLOW}Загрузка архива...${NC}"
        scp "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_IP:/tmp/"
        
        # Распаковка на сервере
        echo -e "${YELLOW}Распаковка на сервере...${NC}"
        ssh "$SERVER_USER@$SERVER_IP" << EOF
            sudo tar -xzf /tmp/$ARCHIVE_NAME -C /var/www/$DOMAIN/
            sudo chown -R www-data:www-data /var/www/$DOMAIN
            sudo chmod -R 755 /var/www/$DOMAIN
            rm /tmp/$ARCHIVE_NAME
EOF
        
        echo -e "${GREEN}✓ Файлы успешно загружены на сервер!${NC}"
        echo -e "${YELLOW}Не забудьте настроить веб-сервер (Nginx/Apache) и DNS!${NC}"
    else
        echo -e "${YELLOW}Загрузка отменена. Архив готов для ручной загрузки.${NC}"
    fi
else
    echo -e "${YELLOW}Шаг 6: Пропущен (не указан IP сервера)${NC}"
    echo -e "${GREEN}Архив готов для ручной загрузки: $ARCHIVE_NAME${NC}"
fi

echo -e "\n${GREEN}=== Готово! ===${NC}"
echo -e "\nСледующие шаги:"
echo -e "1. Загрузите архив $ARCHIVE_NAME на сервер (если еще не загружен)"
echo -e "2. Распакуйте в /var/www/$DOMAIN/"
echo -e "3. Настройте веб-сервер (см. DEPLOYMENT_GUIDE.md)"
echo -e "4. Настройте DNS в Namecheap"
echo -e "5. Проверьте работу сайта"
