// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import io from 'socket.io-client'; 

// Connexion au serveur de jeu avec options robustes
const socket = io('http://localhost:3001', {
    transports: ['polling', 'websocket'], // Robustesse pour les environnements de conteneurs
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
}); 

// Chemins d'importation vers les pages
import Home from "../pages/Home.jsx";
import Lobby from "../pages/Lobby.jsx";
import ChooseColor from "../pages/ChooseColor.jsx";
import Player2Guess from "../pages/Player2Guess.jsx";
import SecondClue from "../pages/SecondClue.jsx";
import Reveal from "../pages/Reveal.jsx";

const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const INITIAL_GAME_STATE = {
    id: null, status: 'waiting', playersReady: 0, playersNeeded: 2, 
    selectedColor: null, chosenColors: [], pion1: null, pion2: null, 
    clue1: '', clue2: '', creatorId: null, players: [],
};

export default function App() {
  const [game, setGame] = useState(INITIAL_GAME_STATE);
  const [localPlayerId, setLocalPlayerId] = useState(null); 
  const navigate = useNavigate();
  
  const localPlayerRole = localPlayerId === game.creatorId 
    ? 'creator' 
    : (game.players.includes(localPlayerId) && game.creatorId !== localPlayerId ? 'joiner' : null);


  // --- LOGIQUE DE CONNEXION ET SYNCHRONISATION ---
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connecté au serveur de jeu avec l\'ID:', socket.id);
      setLocalPlayerId(socket.id);
      
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'lobby' && pathParts[2]) {
          socket.emit('rejoin_game', pathParts[2]);
      }
    });

    socket.on('game_update', (updatedGame) => {
      setGame(updatedGame);
    });
    
    socket.on('error_message', (message) => {
        console.error("Erreur du serveur:", message);
    });
    
    socket.on('connect_error', (err) => {
        console.error('Erreur de connexion Socket.io:', err.message);
    });
    
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur.');
    });

    return () => {
      socket.off('connect');
      socket.off('game_update');
      socket.off('error_message');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [navigate]); 


  // --- LOGIQUE DE CRÉATION ET REJOINT ---
  const createGame = () => {
    const newGameId = generateGameId();
    socket.emit('create_game', newGameId);
    navigate(`/lobby/${newGameId}`);
  };

  const joinGame = (gameId) => {
    socket.emit('join_game', gameId);
  };

  return (
    <Routes>
      <Route path="/" element={<Home createGame={createGame} joinGame={joinGame} />} />
      
      <Route 
          path="/lobby/:gameId" 
          element={
            <Lobby 
                game={game} 
                localPlayerRole={localPlayerRole} 
                socket={socket} 
            />
          } 
      /> 
      <Route path="/choose-color" element={<ChooseColor game={game} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/player2-guess" element={<Player2Guess game={game} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/second-clue" element={<SecondClue game={game} localPlayerRole={localPlayerRole} socket={socket} />} />
      <Route path="/reveal" element={<Reveal game={game} localPlayerRole={localPlayerRole} socket={socket} />} />
    </Routes>
  );
}