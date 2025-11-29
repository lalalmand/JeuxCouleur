#!/usr/bin/env bash

# Arrête le serveur de développement démarré par `start.sh`.

PID_FILE=".dev_server.pid"

if [ -f "$PID_FILE" ]; then
	PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
	if [ -n "$PID" ]; then
		echo "⏹️  Arrêt du serveur (PID $PID)..."
		kill "$PID" 2>/dev/null || true
		sleep 0.5
		if kill -0 "$PID" >/dev/null 2>&1; then
			echo "⚠️  Le processus n'a pas pu être arrêté, tentative de kill -9"
			kill -9 "$PID" 2>/dev/null || true
		fi
		rm -f "$PID_FILE"
		echo "✅ Serveur arrêté."
		exit 0
	fi
fi

# Fallback: cherche un processus `vite` et le termine
echo "⚠️  PID non trouvé, recherche d'un processus 'vite'..."
pkill -f "npx vite" || pkill -f "vite" || true
echo "✅ Tentative d'arrêt terminée."
exit 0

