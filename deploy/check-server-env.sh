#!/bin/bash

# Скрипт для проверки окружения сервера перед развертыванием
# Использование: ./check-server-env.sh [server-user] [server-ip]
# Или выполнить на сервере напрямую: bash check-server-env.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Параметры
SERVER_USER="${1:-root}"
SERVER_IP="${2}"

echo -e "${BLUE}=== Проверка окружения сервера ===${NC}\n"

# Функция для выполнения команды на сервере или локально
run_cmd() {
    if [ -n "$SERVER_IP" ]; then
        ssh "${SERVER_USER}@${SERVER_IP}" "$1"
    else
        eval "$1"
    fi
}

# 1. Проверка операционной системы
echo -e "${YELLOW}1. Информация об операционной системе:${NC}"
run_cmd "cat /etc/os-release | grep -E '^NAME=|^VERSION=' || echo 'Не удалось определить ОС'"
echo ""

# 2. Проверка установленного веб-сервера
echo -e "${YELLOW}2. Проверка веб-серверов:${NC}"

# Проверка Nginx
if run_cmd "command -v nginx >/dev/null 2>&1"; then
    echo -e "${GREEN}✓ Nginx установлен${NC}"
    NGINX_VERSION=$(run_cmd "nginx -v 2>&1 | cut -d'/' -f2")
    echo -e "  Версия: ${GREEN}$NGINX_VERSION${NC}"
    echo -e "  Статус: $(run_cmd "systemctl is-active nginx 2>/dev/null || echo 'неактивен')"
    echo -e "  Конфигурационные файлы:"
    run_cmd "ls -la /etc/nginx/sites-enabled/ 2>/dev/null | tail -n +2 || echo '  (нет активных сайтов)'"
    echo ""
    NGINX_INSTALLED=true
else
    echo -e "${RED}✗ Nginx не установлен${NC}"
    NGINX_INSTALLED=false
    echo ""
fi

# Проверка Apache
if run_cmd "command -v apache2 >/dev/null 2>&1 || command -v httpd >/dev/null 2>&1"; then
    echo -e "${GREEN}✓ Apache установлен${NC}"
    APACHE_CMD=$(run_cmd "command -v apache2 || command -v httpd")
    APACHE_VERSION=$(run_cmd "$APACHE_CMD -v 2>&1 | head -n 1 | cut -d'/' -f2 | cut -d' ' -f1")
    echo -e "  Версия: ${GREEN}$APACHE_VERSION${NC}"
    echo -e "  Статус: $(run_cmd "systemctl is-active apache2 2>/dev/null || systemctl is-active httpd 2>/dev/null || echo 'неактивен')"
    
    # Определение пути к конфигурации Apache
    if [ -n "$(run_cmd "ls /etc/apache2/sites-enabled/ 2>/dev/null")" ]; then
        APACHE_CONFIG_DIR="/etc/apache2"
    elif [ -n "$(run_cmd "ls /etc/httpd/conf.d/ 2>/dev/null")" ]; then
        APACHE_CONFIG_DIR="/etc/httpd"
    else
        APACHE_CONFIG_DIR="неизвестно"
    fi
    
    echo -e "  Конфигурационные файлы:"
    if [ "$APACHE_CONFIG_DIR" != "неизвестно" ]; then
        if [ "$APACHE_CONFIG_DIR" = "/etc/apache2" ]; then
            run_cmd "ls -la /etc/apache2/sites-enabled/ 2>/dev/null | tail -n +2 || echo '  (нет активных сайтов)'"
        else
            run_cmd "ls -la /etc/httpd/conf.d/*.conf 2>/dev/null | tail -n +2 || echo '  (нет конфигураций)'"
        fi
    else
        echo "  (не удалось определить)"
    fi
    echo ""
    APACHE_INSTALLED=true
else
    echo -e "${RED}✗ Apache не установлен${NC}"
    APACHE_INSTALLED=false
    echo ""
fi

# 3. Проверка портов
echo -e "${YELLOW}3. Проверка используемых портов:${NC}"
echo -e "  Порт 80 (HTTP):"
if run_cmd "netstat -tuln 2>/dev/null | grep ':80 ' || ss -tuln 2>/dev/null | grep ':80 '"; then
    echo -e "    ${YELLOW}⚠ Порт 80 занят${NC}"
    run_cmd "netstat -tulpn 2>/dev/null | grep ':80 ' || ss -tulpn 2>/dev/null | grep ':80 ' || echo '    (не удалось определить процесс)'"
else
    echo -e "    ${GREEN}✓ Порт 80 свободен${NC}"
fi

echo -e "  Порт 443 (HTTPS):"
if run_cmd "netstat -tuln 2>/dev/null | grep ':443 ' || ss -tuln 2>/dev/null | grep ':443 '"; then
    echo -e "    ${YELLOW}⚠ Порт 443 занят${NC}"
    run_cmd "netstat -tulpn 2>/dev/null | grep ':443 ' || ss -tulpn 2>/dev/null | grep ':443 ' || echo '    (не удалось определить процесс)'"
else
    echo -e "    ${GREEN}✓ Порт 443 свободен${NC}"
fi
echo ""

# 4. Проверка существующих виртуальных хостов
echo -e "${YELLOW}4. Существующие виртуальные хосты:${NC}"

if [ "$NGINX_INSTALLED" = true ]; then
    echo -e "  ${BLUE}Nginx:${NC}"
    run_cmd "grep -h 'server_name' /etc/nginx/sites-enabled/* 2>/dev/null | grep -v '^#' | sed 's/server_name//' | tr -d ';' | xargs -n1 | sort -u || echo '    (нет настроенных доменов)'"
    echo ""
fi

if [ "$APACHE_INSTALLED" = true ]; then
    echo -e "  ${BLUE}Apache:${NC}"
    if [ "$APACHE_CONFIG_DIR" = "/etc/apache2" ]; then
        run_cmd "grep -h 'ServerName\\|ServerAlias' /etc/apache2/sites-enabled/* 2>/dev/null | grep -v '^#' | sed 's/ServerName//' | sed 's/ServerAlias//' | tr -d ' ' | sort -u || echo '    (нет настроенных доменов)'"
    elif [ "$APACHE_CONFIG_DIR" = "/etc/httpd" ]; then
        run_cmd "grep -h 'ServerName\\|ServerAlias' /etc/httpd/conf.d/*.conf 2>/dev/null | grep -v '^#' | sed 's/ServerName//' | sed 's/ServerAlias//' | tr -d ' ' | sort -u || echo '    (нет настроенных доменов)'"
    fi
    echo ""
fi

# 5. Проверка директорий веб-серверов
echo -e "${YELLOW}5. Существующие директории веб-серверов:${NC}"
run_cmd "ls -ld /var/www/* 2>/dev/null | awk '{print \$9}' || echo '  (нет директорий в /var/www/)'"
echo ""

# 6. Проверка запущенных процессов (боты и другие сервисы)
echo -e "${YELLOW}6. Запущенные процессы (Python, Node.js, Java и т.д.):${NC}"
run_cmd "ps aux | grep -E 'python|node|java|telegram|bot' | grep -v grep | head -10 || echo '  (нет подходящих процессов)'"
echo ""

# 7. Рекомендации
echo -e "${BLUE}=== Рекомендации ===${NC}\n"

if [ "$NGINX_INSTALLED" = true ] && [ "$APACHE_INSTALLED" = true ]; then
    echo -e "${YELLOW}⚠ ВНИМАНИЕ: Установлены оба веб-сервера!${NC}"
    echo -e "  Рекомендуется использовать только один веб-сервер."
    echo -e "  Проверьте, какой из них активен и обрабатывает запросы."
    echo ""
fi

if [ "$NGINX_INSTALLED" = true ]; then
    echo -e "${GREEN}✓ Для развертывания используйте: deploy/nginx-homepage.conf${NC}"
    echo -e "  Путь на сервере: /etc/nginx/sites-available/yourdomain.com"
    echo ""
fi

if [ "$APACHE_INSTALLED" = true ]; then
    echo -e "${GREEN}✓ Для развертывания используйте: deploy/apache-homepage.conf${NC}"
    if [ "$APACHE_CONFIG_DIR" = "/etc/apache2" ]; then
        echo -e "  Путь на сервере: /etc/apache2/sites-available/yourdomain.com.conf"
    else
        echo -e "  Путь на сервере: /etc/httpd/conf.d/yourdomain.com.conf"
    fi
    echo ""
fi

echo -e "${YELLOW}Важно перед развертыванием:${NC}"
echo -e "  1. Убедитесь, что новый домен не конфликтует с существующими"
echo -e "  2. Используйте отдельную директорию: /var/www/yourdomain.com"
echo -e "  3. Проверьте конфигурацию перед применением:"
if [ "$NGINX_INSTALLED" = true ]; then
    echo -e "     sudo nginx -t"
fi
if [ "$APACHE_INSTALLED" = true ]; then
    echo -e "     sudo apache2ctl configtest  (или sudo httpd -t)"
fi
echo -e "  4. После применения перезагрузите веб-сервер:"
if [ "$NGINX_INSTALLED" = true ]; then
    echo -e "     sudo systemctl reload nginx"
fi
if [ "$APACHE_INSTALLED" = true ]; then
    echo -e "     sudo systemctl reload apache2  (или sudo systemctl reload httpd)"
fi
echo ""

echo -e "${GREEN}=== Проверка завершена ===${NC}"
