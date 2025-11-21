module.exports = {
  apps: [
    {
      name: 'ai-translate-backend',
      script: 'uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      cwd: './backend',
      interpreter: 'python3',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        PYTHONDONTWRITEBYTECODE: '1'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'ai-translate-frontend',
      script: 'npm',
      args: 'run start',
      cwd: './frontend/telegram-miniapp',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'http://localhost:8000'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      time: true,
      merge_logs: true
    }
  ]
}

