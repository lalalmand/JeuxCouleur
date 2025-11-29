#!/usr/bin/env bash

# Démarre un serveur de développement capable de servir des fichiers JSX/JS (Vite via npx).

set -e

PORT=${PORT:-5173}
HOST=${HOST:-127.0.0.1}
PID_FILE=".dev_server.pid"

echo "🔧 Démarrage du serveur JS/JSX (Vite) sur http://$HOST:$PORT"

# Vérifie la présence de node
if ! command -v node >/dev/null 2>&1; then
	echo "❌ Node.js n'est pas installé. Installez Node.js pour continuer."
	exit 1
fi

# Vérifie la présence de npx
if ! command -v npx >/dev/null 2>&1; then
	echo "❌ npx (npm) n'est pas disponible. Installez npm pour continuer."
	exit 1
fi

# Si un serveur est déjà lancé, refuse de démarrer un second
if [ -f "$PID_FILE" ]; then
	PID_EXIST=$(cat "$PID_FILE" 2>/dev/null || echo "")
	if [ -n "$PID_EXIST" ] && kill -0 "$PID_EXIST" >/dev/null 2>&1; then
		echo "⚠️  Un serveur est déjà en cours (PID $PID_EXIST). Arrêtez-le d'abord ou supprimez $PID_FILE." 
		exit 1
	else
		rm -f "$PID_FILE"
	fi
fi

# Lance Vite via npx (téléchargera et exécutera si nécessaire). Le serveur tourne en tâche de fond.
# Utilise --host pour être accessible depuis l'hôte si besoin.
nohup npx vite --port "$PORT" --host "$HOST" >/dev/null 2>&1 &
DEV_PID=$!

# Sauvegarde le PID pour le stop
echo $DEV_PID > "$PID_FILE"

echo "✅ Serveur lancé (PID $DEV_PID). Accède à: http://$HOST:$PORT"
echo "ℹ️  Pour arrêter: ./stop.sh"

exit 0

