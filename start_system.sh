#!/bin/bash
# ==============================================================================
# TUK Mapping System - Automated Launch & Health Monitoring Script
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGO_PORT=27017
BACKEND_PORT=5000
FRONTEND_PORT=5173
APPIMAGE_PATH="$PROJECT_DIR/cd_scripts/TUK-Mapping-System.AppImage"

echo "=========================================="
echo " Starting TUK Mapping System Suite"
echo "=========================================="

# 1. Check MongoDB Health
echo "🔍 Checking MongoDB connectivity..."
if command -v mongosh &> /dev/null; then
  MONGO_OK=$(mongosh --host localhost --port $MONGO_PORT --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null)
else
  MONGO_OK=$(nc -z -w 3 localhost $MONGO_PORT && echo "1" || echo "0")
fi

if [ "$MONGO_OK" != "1" ]; then
  echo "⚠️ MongoDB is unreachable on port $MONGO_PORT. Attempting database startup..."
  sudo systemctl start mongod 2>/dev/null || sudo service mongodb start 2>/dev/null
  sleep 3
fi

if nc -z -w 3 localhost $MONGO_PORT 2>/dev/null; then
  echo "✅ MongoDB is healthy and accepting connections."
else
  echo "❌ CRITICAL: MongoDB failed to respond. Ensure Mongo daemon is installed and running."
  exit 1
fi

# 2. Launch Backend API Server
echo "🚀 Starting Backend Server on port $BACKEND_PORT..."
if nc -z -w 2 localhost $BACKEND_PORT 2>/dev/null; then
  echo "ℹ️ Backend process already running on port $BACKEND_PORT."
else
  cd "$PROJECT_DIR" || exit 1
  npm start > "$PROJECT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  
  echo -n "Waiting for backend initialization"
  until nc -z -w 1 localhost $BACKEND_PORT 2>/dev/null; do
    echo -n "."
    sleep 1
  done
  echo " Ready! (PID: $BACKEND_PID)"
fi

# 3. Launch Frontend Development Server
echo "🎨 Starting Frontend Web Server..."
cd "$PROJECT_DIR/frontend" || exit 1
if nc -z -w 2 localhost $FRONTEND_PORT 2>/dev/null; then
  echo "ℹ️ Frontend process already running on port $FRONTEND_PORT."
else
  npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  sleep 2
  echo "✅ Frontend server active."
fi

# 4. Launch Desktop Client via AppImage
echo "💻 Opening Desktop Client Application..."
if [ -f "$APPIMAGE_PATH" ]; then
  chmod +x "$APPIMAGE_PATH"
  "$APPIMAGE_PATH" &
  echo "✅ Desktop Electron app launched."
else
  echo "⚠️ AppImage not found at $APPIMAGE_PATH. Falling back to default browser..."
  xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || open "http://localhost:$FRONTEND_PORT" 2>/dev/null
fi

echo "=========================================="
echo " System fully initialized and operational."
echo "=========================================="
