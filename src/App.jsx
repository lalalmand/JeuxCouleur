// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import io from 'socket.io-client'; // Import de Socket.io client

// Connexion au serveur de jeu (Assurez-vous que le serveur Node.js tourne sur le port 3001)
const socket = io('http://localhost:3001'); 

// Chemins d'importation vers les pages
import Home from "../pages/Home.jsx";
import Lobby from "../pages/Lobby.jsx";
import ChooseColor from "../pages/ChooseColor.jsx";
import Player2Guess from "../pages/Player2Guess.jsx";
import SecondClue from "../pages/SecondClue.jsx";
import Reveal from "../pages/Reveal.jsx";

// Fonction utilitaire pour générer un ID de partie aléatoire
const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};


export default function App() {
  // L'état du jeu est maintenant géré par le serveur
  const [game, setGame] = useState({
    id: null,             
    playersReady: 0,       
    playersNeeded: 2,      
    selectedColor: null,   
    chosenColors: [],      
    pion1: null,           
    pion2: null,           
    clue1: '',             
    clue2: '',             
    creatorId: null,       // L'ID du créateur (pour dériver le rôle)
    players: [],           // Liste des IDs de socket des joueurs
  });
  
  // L'ID unique du joueur local (assigné par Socket.io)
  const [localPlayerId, setLocalPlayerId] = useState(null); 
  
  const navigate = useNavigate();

  // --- LOGIQUE DE CONNEXION ET SYNCHRONISATION ---
  useEffect(() => {
    // 1. Stocke l'ID unique du socket du joueur
    socket.on('connect', () => {
      setLocalPlayerId(socket.id);
      console.log("Connecté au serveur de jeu avec l'ID:", socket.id);
      
      // Tentative de rejoindre la partie si l'ID est dans l'URL (utile après refresh)
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'lobby' && pathParts[2]) {
          const gameIdFromUrl = pathParts[2];
          if (!game.id) { // Si le jeu n'est pas encore chargé, on tente de rejoindre
            socket.emit('rejoin_game', gameIdFromUrl);
          }
      }
    });

    // 2. Reçoit les mises à jour de l'état du jeu depuis le serveur
    socket.on('game_update', (updatedGame) => {
      setGame(updatedGame);
      console.log("Mise à jour reçue:", updatedGame);
      
      // Assure la navigation vers le lobby si une partie est chargée
      if (updatedGame.id && !window.location.pathname.startsWith('/lobby')) {
          navigate(`/lobby/${updatedGame.id}`);
      }
      
      // TODO: Ajouter ici la logique de navigation automatique vers /choose-color ou /player2-guess 
      // quand game.playersReady atteint 2 et selon le rôle.
    });
    
    // 3. Gère les erreurs du serveur (partie pleine, partie inexistante, etc.)
    socket.on('error_message', (message) => {
        alert("Erreur du serveur: " + message);
    });

    return () => {
      socket.off('connect');
      socket.off('game_update');
      socket.off('error_message');
    };
  }, [navigate, game.id]);


  // --- LOGIQUE DE CRÉATION ET REJOINT (ENVOIE AU SERVEUR) ---
  const createGame = (numPlayers = 2) => {
    const newGameId = generateGameId();
    // Envoie l'événement au serveur. Le serveur gère la création et la synchronisation.
    socket.emit('create_game', newGameId);
  };

  const joinGame = (gameId) => {
    // Envoie l'événement au serveur. Le serveur met à jour l'état et synchronise tout le monde.
    socket.emit('join_game', gameId);
  };
  
  // --- DÉRIVATION DU RÔLE LOCAL ---
  // Le rôle n'est plus un état, mais est calculé à partir de l'état du jeu et de l'ID du joueur.
  let localPlayerRole = null;
  if (localPlayerId) {
      if (game.creatorId === localPlayerId) {
          localPlayerRole = 'creator'; // Joueur 1
      } else if (game.players.includes(localPlayerId)) {
          localPlayerRole = 'joiner'; // Joueur 2 (ou autre)
      }
  }

  // Si le rôle change, on le stocke pour la persistance (facultatif avec socket, mais utile)
  useEffect(() => {
    if (localPlayerRole) {
      localStorage.setItem('localPlayerRole', localPlayerRole);
    } else {
      localStorage.removeItem('localPlayerRole');
    }
  }, [localPlayerRole]);


  return (
    <Routes>
      <Route path="/" element={<Home createGame={createGame} joinGame={joinGame} />} />
      
      {/* Toutes les routes reçoivent maintenant le socket, l'ID local et le rôle dérivé */}
      <Route 
          path="/lobby/:gameId" 
          element={
            <Lobby 
                game={game} 
                setGame={setGame} 
                localPlayerRole={localPlayerRole} 
                localPlayerId={localPlayerId} 
                socket={socket} 
            />
          } 
      /> 
      {/* TODO: Toutes ces pages devront maintenant envoyer des événements au 'socket' au lieu d'appeler 'setGame' */}
      <Route path="/choose-color" element={<ChooseColor game={game} setGame={setGame} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/player2-guess" element={<Player2Guess game={game} setGame={setGame} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/second-clue" element={<SecondClue game={game} setGame={setGame} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/reveal" element={<Reveal game={game} setGame={setGame} localPlayerRole={localPlayerRole} socket={socket} />} />
    </Routes>
  );
}