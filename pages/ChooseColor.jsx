// pages/ChooseColor.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Le composant reçoit le 'socket' pour envoyer des événements au serveur
export default function ChooseColor({ game, localPlayerRole, socket }) {
  const navigate = useNavigate();
  const isCreator = localPlayerRole === 'creator';

  // Le Joueur 1 (Créateur) choisit la couleur cible et donne le premier indice.
  const [selectedColor, setSelectedColor] = useState(game.selectedColor || game.chosenColors[0]);
  const [clue, setClue] = useState(game.clue1 || "");
  const [error, setError] = useState("");
  
  // --- VÉRIFICATIONS D'ACCÈS / ATTENTE ---
  
  // Si le Joueur 2 essaie d'accéder à cette page, il doit être renvoyé à l'attente
  if (!isCreator) {
      return (
          <div style={waitingContainerStyle}>
              <h1>🚫 Accès refusé</h1>
              <p>Seul le **Joueur 1 (Créateur)** peut choisir la couleur cible et donner le premier indice.</p>
              <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                  Veuillez naviguer vers votre page d'attente.
              </p>
              <button 
                onClick={() => navigate("/second-clue")} 
                style={quitButtonStyle}
              >
                Aller à ma page d'action
              </button>
          </div>
      );
  }

  // Si la partie n'est pas encore lancée ou pleine (protection supplémentaire)
  if (game.playersReady < game.playersNeeded) {
      return (
          <div style={waitingContainerStyle}>
              <h1>⏳ Attente de l'autre joueur...</h1>
              <p>Tous les joueurs ne sont pas encore prêts. Retournez au lobby.</p>
              <button 
                onClick={() => navigate(`/lobby/${game.id}`)} 
                style={quitButtonStyle}
              >
                Retour au Lobby
              </button>
          </div>
      );
  }


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedColor) {
      setError("Veuillez choisir une couleur cible.");
      return;
    }
    if (clue.trim().length === 0) {
      setError("Veuillez donner le premier indice (un mot ou une courte expression).");
      return;
    }
    setError("");

    // --- NOUVEAU : Envoie l'événement de soumission au serveur ---
    socket.emit('submit_clue_1', {
      gameId: game.id,
      selectedColor: selectedColor,
      clue: clue.trim(),
    });

    // Navigation vers la page d'attente/action pour le Joueur 1
    // (Il doit attendre que le Joueur 2 place son pion)
    navigate("/second-clue");
  };

  // --- RENDU ---
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1>🎯 Étape 1 : Choix de la couleur cible & Indice 1</h1>

      <p style={{ marginBottom: '30px' }}>
          **Joueur 1** : Choisissez secrètement une des couleurs pour qu'elle soit la cible. Donnez ensuite le **premier indice** qui devra aider le Joueur 2 à se rapprocher de cette couleur sur le spectre.
      </p>

      <div style={colorGridStyle}>
        {game.chosenColors.map((color, index) => (
          <div
            key={index}
            style={{
              ...colorBlockStyle,
              backgroundColor: color,
              border: color === selectedColor ? '4px solid #333' : '1px solid #ccc',
              transform: color === selectedColor ? 'scale(1.05)' : 'scale(1)',
            }}
            onClick={() => setSelectedColor(color)}
          >
            {color === selectedColor && (
              <span style={checkMarkStyle}>✔ Cible</span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '40px' }}>
        <h2>Indice 1 (Mot/Expression)</h2>
        <input
          type="text"
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="Ex: 'Coucher de soleil' ou 'Forêt'"
          maxLength={30}
          style={inputStyle}
        />

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <button type="submit" style={submitButtonStyle}>
          Soumettre l'indice et attendre le Joueur 2
        </button>
      </form>

      {/* Bouton Quitter (avec confirmation) */}
      <button 
        onClick={() => { if(window.confirm("Êtes-vous sûr de vouloir quitter la partie ?")) navigate("/"); }}
        style={quitButtonStyle}
      >
        Quitter la partie
      </button>
    </div>
  );
}

// Styles locaux
const colorGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '15px',
};

const colorBlockStyle = {
  height: '100px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  textShadow: '0 0 5px rgba(0,0,0,0.8)',
};

const checkMarkStyle = {
    padding: '5px',
    borderRadius: '3px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    fontSize: '0.9em'
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '1.2em',
  borderRadius: '6px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  marginTop: '10px',
  textAlign: 'center',
};

const submitButtonStyle = {
  padding: '15px 30px',
  fontSize: '18px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#4CAF50',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '20px',
};

const quitButtonStyle = {
    marginTop: '30px',
    padding: '10px 20px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};

const waitingContainerStyle = {
    padding: '40px', 
    maxWidth: '500px', 
    margin: '100px auto', 
    textAlign: 'center', 
    border: '2px solid #ffcc00', 
    borderRadius: '10px'
};