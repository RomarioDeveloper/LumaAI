#!/bin/bash

set -e

echo "🚀 Начало деплоя AI-Translate через PM2..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка наличия PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 не установлен!${NC}"
    echo "Установите PM2: npm install -g pm2"
    exit 1
fi

echo -e "${GREEN}✅ PM2 найден${NC}"

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 не найден!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python3 найден${NC}"

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не найден!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js найден${NC}"

# Создание директорий
echo -e "${YELLOW}📁 Создание необходимых директорий...${NC}"
mkdir -p backend/uploads backend/models logs
echo -e "${GREEN}✅ Директории созданы${NC}"

# Установка зависимостей бэкенда
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}🐍 Создание виртуального окружения Python...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Зависимости бэкенда установлены${NC}"
else
    echo -e "${YELLOW}🐍 Обновление зависимостей бэкенда...${NC}"
    cd backend
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Зависимости бэкенда обновлены${NC}"
fi

# Установка зависимостей фронтенда
if [ ! -d "frontend/telegram-miniapp/node_modules" ]; then
    echo -e "${YELLOW}📦 Установка зависимостей фронтенда...${NC}"
    cd frontend/telegram-miniapp
    npm install
    cd ../..
    echo -e "${GREEN}✅ Зависимости фронтенда установлены${NC}"
else
    echo -e "${YELLOW}📦 Обновление зависимостей фронтенда...${NC}"
    cd frontend/telegram-miniapp
    npm install
    cd ../..
    echo -e "${GREEN}✅ Зависимости фронтенда обновлены${NC}"
fi

# Сборка фронтенда
echo -e "${YELLOW}🔨 Сборка фронтенда...${NC}"
cd frontend/telegram-miniapp
npm run build
cd ../..
echo -e "${GREEN}✅ Фронтенд собран${NC}"

# Остановка существующих процессов PM2 (если есть)
echo -e "${YELLOW}🛑 Остановка существующих процессов...${NC}"
pm2 delete ai-translate-backend 2>/dev/null || true
pm2 delete ai-translate-frontend 2>/dev/null || true

# Запуск через PM2
echo -e "${YELLOW}🚀 Запуск приложений через PM2...${NC}"
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
echo "📊 Статус приложений:"
pm2 status
echo ""
echo "📝 Полезные команды:"
echo "  pm2 logs              - просмотр логов"
echo "  pm2 restart all        - перезапуск всех"
echo "  pm2 stop all           - остановка всех"
echo "  pm2 monit              - мониторинг в реальном времени"
echo ""
echo "🌐 Проверьте:"
echo "  Backend:  http://localhost:8000/api/health"
echo "  Frontend: http://localhost:3000"

