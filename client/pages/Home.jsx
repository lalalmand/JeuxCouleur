// pages/Home.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Fonction utilitaire pour générer un ID de partie aléatoire
const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Le composant reçoit le 'socket' pour envoyer des événements au serveur
export default function Home({ socket }) {
  const navigate = useNavigate();
  
  const [newGameId, setNewGameId] = useState("");
  const [joinGameId, setJoinGameId] = useState("");
  const [error, setError] = useState("");

  
  // --- Fonction pour Créer une nouvelle partie ---
  const handleCreateGame = () => {
    // 1. Générer un ID si non fourni (ou si le champ est vide)
    const gameId = newGameId.trim() || generateGameId();
    
    setError("");

    // 2. Vérifier si le socket est prêt
    if (!socket || !socket.connected) {
        setError("Erreur : Connexion au serveur de jeu impossible.");
        console.error("Socket non connecté ou indisponible.");
        return;
    }

    // 3. Envoyer l'événement de création au serveur
    socket.emit('create_game', gameId);
    
    // 4. Naviguer vers le Lobby
    navigate(`/lobby/${gameId}`);
  };

  
  // --- Fonction pour Rejoindre une partie existante ---
  const handleJoinGame = () => {
    const gameId = joinGameId.trim().toUpperCase();
    
    if (gameId.length < 6) {
      setError("Veuillez entrer un ID de partie valide (6 caractères).");
      return;
    }
    
    setError("");

    // 1. Vérifier si le socket est prêt
    if (!socket || !socket.connected) {
        setError("Erreur : Connexion au serveur de jeu impossible.");
        console.error("Socket non connecté ou indisponible.");
        return;
    }
    
    // 2. Envoyer l'événement de connexion au serveur
    socket.emit('join_game', gameId);

    // 3. Naviguer vers le Lobby (le serveur confirmera ou enverra une erreur)
    navigate(`/lobby/${gameId}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
      <h1>🌈 Color Spectrum Game 🎲</h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Le jeu de déduction basé sur la perception des couleurs.
      </p>

      {error && <div style={errorStyle}>{error}</div>}

      {/* --- Bloc Créer une partie --- */}
      <div style={sectionStyle}>
        <h2>Créer une nouvelle partie</h2>
        <input
          type="text"
          value={newGameId}
          onChange={(e) => setNewGameId(e.target.value.toUpperCase())}
          placeholder="Entrez un ID ou laissez vide pour aléatoire"
          maxLength={6}
          style={inputStyle}
        />
        <button onClick={handleCreateGame} style={buttonStyle}>
          🚀 Créer & Lancer
        </button>
      </div>

      <div style={separatorStyle}>OU</div>

      {/* --- Bloc Rejoindre une partie --- */}
      <div style={sectionStyle}>
        <h2>Rejoindre une partie</h2>
        <input
          type="text"
          value={joinGameId}
          onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
          placeholder="Entrez l'ID de la partie"
          maxLength={6}
          style={inputStyle}
        />
        <button onClick={handleJoinGame} style={joinButtonStyle}>
          🔗 Rejoindre
        </button>
      </div>
    </div>
  );
}

// Styles locaux
const sectionStyle = {
  border: '1px solid #ccc',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
  backgroundColor: '#f9f9f9',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  margin: '10px 0',
  borderRadius: '5px',
  border: '1px solid #ddd',
  boxSizing: 'border-box',
  textAlign: 'center',
};

const buttonStyle = {
  padding: '12px 25px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 'bold',
};

const joinButtonStyle = {
    ...buttonStyle, // Réutilise les styles de base
    backgroundColor: '#008CBA',
};

const separatorStyle = {
  margin: '20px 0',
  fontWeight: 'bold',
  color: '#888',
};

const errorStyle = {
    padding: '10px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '5px',
    marginBottom: '20px'
}