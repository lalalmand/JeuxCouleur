#!/usr/bin/env bash

# Démarre le serveur Node.js (back-end) sur 3001 et le serveur Vite (front-end) sur 3000.

set -e

# --- Configuration des ports et fichiers PID ---

FRONT_PORT=${FRONT_PORT:-3000} 
FRONT_HOST=${FRONT_HOST:-0.0.0.0} # Utilisation de 0.0.0.0 pour Codespaces
FRONT_PID_FILE=".dev_server_front.pid"

BACK_PORT=3001
BACK_PID_FILE=".dev_server_back.pid"

# --- Fonction de nettoyage et vérification ---
cleanup_pid() {
    local PID_FILE=$1
	    local PROCESS_NAME=$2
		    if [ -f "$PID_FILE" ]; then
			        PID_EXIST=$(cat "$PID_FILE" 2>/dev/null || echo "")
					        if [ -n "$PID_EXIST" ] && kill -0 "$PID_EXIST" >/dev/null 2>&1; then
							            echo "!!  $PROCESS_NAME (PID $PID_EXIST) déjà en cours. Veuillez utiliser './stop.sh' d'abord." 
										            exit 1
													        else
															            rm -f "$PID_FILE"
																		        fi
																				    fi
																					}

																					cleanup_pid "$FRONT_PID_FILE" "Serveur Front (Vite)"
																					cleanup_pid "$BACK_PID_FILE" "Serveur Back (Node.js)"


																					# --- Lancement du Serveur Node.js (Back-end) sur 3001 ---

																					echo "🚀 Démarrage du Serveur Node.js (Back-end) sur 0.0.0.0:$BACK_PORT"
																					# Lance le serveur Node.js et stocke son PID
																					nohup node server/index.js > backend_output.log 2>&1 &
																					BACK_PID=$!
																					echo $BACK_PID > "$BACK_PID_FILE"
																					sleep 2 

																					echo " Serveur Back lancé (PID $BACK_PID). Vérifiez backend_output.log."


																					# --- Lancement du Serveur Vite (Front-end) sur 3000 ---

																					echo "🚀 Démarrage du Serveur JS/JSX (Vite) sur $FRONT_HOST:$FRONT_PORT"
																					# Lance Vite sur le port 3000
																					nohup npx vite --port "$FRONT_PORT" --host "$FRONT_HOST" >/dev/null 2>&1 &
																					FRONT_PID=$!

																					echo $FRONT_PID > "$FRONT_PID_FILE"

																					echo " Serveur Front lancé (PID $FRONT_PID). Accès à: http://$HOST:$FRONT_PORT"
																					echo "ℹ  Pour arrêter les deux serveurs: ./stop.sh"

																					exit 0