FROM node:18-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Экспорт порта
EXPOSE 3000

# Запуск dev сервера (для разработки)
CMD ["npm", "run", "dev", "--", "--host"]

