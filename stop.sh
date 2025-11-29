#!/usr/bin/env bash

# Arrête les deux serveurs démarrés par `start.sh`.

FRONT_PID_FILE=".dev_server_front.pid"
BACK_PID_FILE=".dev_server_back.pid"

stop_process() {
    local PID_FILE=$1
    local PROCESS_NAME=$2

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$PID" ]; then
            echo "⏹️  Arrêt du $PROCESS_NAME (PID $PID)..."
            kill "$PID" 2>/dev/null || true
            sleep 0.5
            if kill -0 "$PID" >/dev/null 2>&1; then
                echo "⚠️  Le processus n'a pas pu être arrêté, tentative de kill -9"
                kill -9 "$PID" 2>/dev/null || true
            fi
            rm -f "$PID_FILE"
            echo "✅ $PROCESS_NAME arrêté."
            return
        fi
        rm -f "$PID_FILE"
    fi
}

stop_process "$BACK_PID_FILE" "Serveur Back (Node.js)"
stop_process "$FRONT_PID_FILE" "Serveur Front (Vite)"

# Fallback
echo "⚠️  Recherche de processus résiduels..."
pkill -f "npx vite" || pkill -f "vite" || true
pkill -f "node server/index.js" || true
echo "✅ Tentative d'arrêt terminée."

exit 0