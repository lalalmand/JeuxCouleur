// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuration de Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // CORRECTION 1: Autorise toutes les origines (Codespaces)
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- État Global du Jeu et Fonctions Utilitaires ---
const games = {};

const getRandomHsl = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 100;
    const l = Math.floor(Math.random() * 40) + 30;
    return `hsl(${h}, ${s}%, ${l}%)`;
}
const generateRandomColors = () => {
    const colors = new Set();
    while (colors.size < 4) {
        colors.add(getRandomHsl());
    }
    return Array.from(colors);
}
const sendGameUpdate = (gameId) => {
    if (games[gameId]) {
        io.to(gameId).emit('game_update', games[gameId]);
    }
};

// Logique de Socket.io (gestion des événements des clients)
io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.id}`);

  // ... (Toute la logique d'événements de jeu) ...

  socket.on('create_game', (gameId) => {
    if (games[gameId]) { socket.emit('error_message', `La partie ID ${gameId} existe déjà.`); return; }
    games[gameId] = {
      id: gameId, status: 'waiting', creatorId: socket.id, players: [socket.id],
      playersReady: 1, playersNeeded: 2, selectedColor: null, chosenColors: generateRandomColors(),
      clue1: '', clue2: '', pion1: null, pion2: null,
    };
    socket.join(gameId);
    console.log(`Partie ${gameId} créée par ${socket.id}`);
    sendGameUpdate(gameId);
  });
  
  // ( ... tous les autres gestionnaires socket.on ... )
  
  socket.on('join_game', (gameId) => { /* ... */ });
  socket.on('rejoin_game', (gameId) => { /* ... */ });
  socket.on('start_game_action', (gameId) => { /* ... */ });
  socket.on('submit_clue_1', ({ gameId, selectedColor, clue }) => { /* ... */ });
  socket.on('submit_pion_1', ({ gameId, position }) => { /* ... */ });
  socket.on('submit_clue_2', ({ gameId, clue }) => { /* ... */ });
  socket.on('submit_pion_2', ({ gameId, position }) => { /* ... */ });
  
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.id}`);
  });
});

// EXPORTATION pour les tests JEST
module.exports = {
  generateRandomColors,
};

// Démarrage du serveur uniquement si nous ne sommes PAS en mode test
if (process.env.NODE_ENV !== 'test') {
    const PORT = 3001;
    const HOST = '0.0.0.0'; // CORRECTION 2: Écoute sur toutes les interfaces
    server.listen(PORT, HOST, () => {
        console.log(`Le serveur de jeu est lancé sur l'adresse ${HOST} et le port ${PORT}`);
    });
}