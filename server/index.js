// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuration de Socket.io
// Permet à votre application React de se connecter (CORS)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Port de votre application React
    methods: ['GET', 'POST'],
  },
});

// --- État Global du Jeu (La "Source de Vérité") ---
// Cet objet stocke toutes les parties en cours
const games = {};

// Fonction utilitaire pour générer des couleurs HSL aléatoires
const getRandomHsl = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 100;
    const l = Math.floor(Math.random() * 40) + 30; // Luminosité entre 30% et 70%
    return `hsl(${h}, ${s}%, ${l}%)`;
}

// Fonction pour générer 4 couleurs uniques pour le choix
const generateRandomColors = () => {
    const colors = new Set();
    while (colors.size < 4) {
        colors.add(getRandomHsl());
    }
    return Array.from(colors);
}

// Fonction pour envoyer la mise à jour à tous les joueurs d'une partie
const sendGameUpdate = (gameId) => {
    if (games[gameId]) {
        io.to(gameId).emit('game_update', games[gameId]);
    }
};

// Logique de Socket.io (gestion des événements des clients)
io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.id}`);

  // ----------------------------------------------------
  // Événement 1 : Création de partie (Envoyé par le Joueur 1)
  // ----------------------------------------------------
  socket.on('create_game', (gameId) => {
    if (games[gameId]) {
        socket.emit('error_message', `La partie ID ${gameId} existe déjà.`);
        return;
    }

    games[gameId] = {
      id: gameId,
      status: 'waiting',           // Statut: waiting | color_choice | pion1_placement | clue2_submission | pion2_placement | reveal
      creatorId: socket.id,
      players: [socket.id],
      playersReady: 1,
      playersNeeded: 2,
      selectedColor: null,
      chosenColors: generateRandomColors(),
      clue1: '',
      clue2: '',
      pion1: null, // Position du 1er pion (0 à 1)
      pion2: null, // Position du 2ème pion (0 à 1)
    };

    socket.join(gameId);
    console.log(`Partie ${gameId} créée par ${socket.id}`);

    sendGameUpdate(gameId);
  });

  // ----------------------------------------------------
  // Événement 2 : Rejoindre une partie (Envoyé par le Joueur 2)
  // ----------------------------------------------------
  socket.on('join_game', (gameId) => {
    const game = games[gameId];

    if (!game) {
      socket.emit('error_message', 'Partie non trouvée.');
      return;
    }

    if (game.players.includes(socket.id)) {
        socket.join(gameId);
        sendGameUpdate(gameId);
        return;
    }

    if (game.players.length >= game.playersNeeded) {
      socket.emit('error_message', 'La partie est déjà pleine.');
      return;
    }

    // Ajout du joueur
    game.players.push(socket.id);
    game.playersReady = game.players.length;

    socket.join(gameId);
    console.log(`Joueur ${socket.id} a rejoint la partie ${gameId}.`);

    sendGameUpdate(gameId); // Synchronise J1 (J1 voit 2/2)
  });
  
  // ----------------------------------------------------
  // Événement 3 : Reconnexion/Rafraîchissement du client
  // ----------------------------------------------------
  socket.on('rejoin_game', (gameId) => {
      const game = games[gameId];
      if (game && game.players.includes(socket.id)) {
          socket.join(gameId);
          sendGameUpdate(gameId);
      }
  });


  // ----------------------------------------------------
  // Événement 4 : Lancement de la partie par le Créateur (depuis Lobby.jsx)
  // ----------------------------------------------------
  socket.on('start_game_action', (gameId) => {
      const game = games[gameId];

      if (!game || game.creatorId !== socket.id || game.playersReady < game.playersNeeded) {
          socket.emit('error_message', 'Action de démarrage non autorisée ou joueurs manquants.');
          return;
      }

      game.status = 'color_choice'; // J1 passe au choix de couleur
      console.log(`Partie ${gameId} lancée par le créateur. Nouveau statut: ${game.status}`);
      sendGameUpdate(gameId);
  });

  // ----------------------------------------------------
  // Événement 5 : Soumission du premier indice et de la couleur cible (par J1)
  // ----------------------------------------------------
  socket.on('submit_clue_1', ({ gameId, selectedColor, clue }) => {
      const game = games[gameId];

      if (!game || game.creatorId !== socket.id || game.status !== 'color_choice') {
          socket.emit('error_message', 'Action non autorisée ou mauvais statut de jeu.');
          return;
      }

      game.selectedColor = selectedColor;
      game.clue1 = clue;
      game.status = 'pion1_placement'; // J2 doit placer son pion 1
      console.log(`Clue 1 soumise pour ${gameId}. Nouveau statut: ${game.status}`);
      sendGameUpdate(gameId);
  });

  // ----------------------------------------------------
  // Événement 6 : Soumission du PION 1 par le Joueur 2 (depuis Player2Guess.jsx)
  // ----------------------------------------------------
  socket.on('submit_pion_1', ({ gameId, position }) => {
      const game = games[gameId];
      // Le Joueur 2 est toujours le second joueur dans le tableau 'players'
      if (!game || game.players[1] !== socket.id || game.status !== 'pion1_placement') {
          socket.emit('error_message', 'Action non autorisée ou mauvais statut de jeu.');
          return;
      }
      
      game.pion1 = position;
      game.status = 'clue2_submission'; // J1 doit soumettre le deuxième indice
      console.log(`Pion 1 placé pour ${gameId}. Nouveau statut: ${game.status}`);
      sendGameUpdate(gameId);
  });

  // ----------------------------------------------------
  // Événement 7 : Soumission du deuxièmme indice par le Joueur 1 (depuis SecondClue.jsx)
  // ----------------------------------------------------
  socket.on('submit_clue_2', ({ gameId, clue }) => {
      const game = games[gameId];

      if (!game || game.creatorId !== socket.id || game.status !== 'clue2_submission') {
          socket.emit('error_message', 'Action non autorisée ou mauvais statut de jeu.');
          return;
      }

      game.clue2 = clue;
      game.status = 'pion2_placement'; // J2 doit placer son pion 2
      console.log(`Clue 2 soumise pour ${gameId}. Nouveau statut: ${game.status}`);
      sendGameUpdate(gameId);
  });

  // ----------------------------------------------------
  // Événement 8 : Soumission du PION 2 par le Joueur 2 (depuis Player2Guess.jsx)
  // ----------------------------------------------------
  socket.on('submit_pion_2', ({ gameId, position }) => {
      const game = games[gameId];

      if (!game || game.players[1] !== socket.id || game.status !== 'pion2_placement') {
          socket.emit('error_message', 'Action non autorisée ou mauvais statut de jeu.');
          return;
      }
      
      game.pion2 = position;
      game.status = 'reveal'; // Le jeu est terminé
      console.log(`Pion 2 placé pour ${gameId}. Nouveau statut: ${game.status}`);
      sendGameUpdate(gameId);
  });


  // ----------------------------------------------------
  // Événement : Déconnexion
  // ----------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.id}`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Le serveur de jeu est lancé sur le port ${PORT}`);
});