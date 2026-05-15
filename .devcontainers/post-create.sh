#!/bin/bash
set -e

echo "🚀 Setting up EventFlow dev environment..."

# Если в frontend/ есть package.json — ставим зависимости
if [ -f "/workspace/frontend/package.json" ]; then
    echo "📦 Installing frontend dependencies..."
    cd /workspace/frontend && npm install
fi

# Если в backend/ есть package.json — ставим зависимости
if [ -f "/workspace/backend/package.json" ]; then
    echo "📦 Installing backend dependencies..."
    cd /workspace/backend && npm install
fi

# Если в backend/ есть requirements.txt (Python вариант) — ставим
if [ -f "/workspace/backend/requirements.txt" ]; then
    echo "🐍 Installing Python dependencies..."
    cd /workspace/backend && pip install --user -r requirements.txt
fi

# Ждём готовности БД и применяем миграции, если они есть
echo "⏳ Waiting for database..."
until PGPASSWORD=dev psql -h db -U dev -d app -c '\q' 2>/dev/null; do
  sleep 1
done
echo "✅ Database is ready"

echo "✨ Setup complete! Run 'cd frontend && npm run dev' to start the frontend."