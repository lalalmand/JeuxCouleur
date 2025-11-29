// pages/SecondClue.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Composant pour la soumission du deuxième indice par le Joueur 1, 
 * ou la page d'attente pour le Joueur 2.
 */
export default function SecondClue({ game, localPlayerRole, socket }) {
  const navigate = useNavigate();
  const isCreator = localPlayerRole === 'creator';
  
  // NOUVEAU: Le statut du jeu détermine qui doit agir
  const isJ1Turn = game.status === 'clue2_submission';
  const isJ2Waiting = game.status === 'pion1_placement' || game.status === 'color_choice';

  const [clue, setClue] = useState(game.clue2 || "");
  const [error, setError] = useState("");

  // --- LOGIQUE DE REDIRECTION ET ATTENTE ---

  // 1. Si le jeu est terminé ou si le pion 2 est déjà placé, on va à la révélation.
  if (game.status === 'pion2_placement' || game.status === 'reveal') {
      navigate('/reveal');
      return null;
  }
  
  // 2. LOGIQUE D'ATTENTE DU JOUEUR 2 (Joiner)
  if (!isCreator && (isJ2Waiting || isJ1Turn)) {
      let message;
      let targetPath = `/player2-guess`;

      if (isJ2Waiting && game.status === 'color_choice') {
          // Attente de l'indice 1 (J2 arrive ici en premier)
          message = "Le Joueur 1 est en train de choisir la couleur cible et d'entrer le premier mot (Indice 1).";
          targetPath = `/choose-color`; // Redirige vers la page d'action de J1 pour l'attente
      } else if (isJ2Waiting && game.status === 'pion1_placement') {
          // J2 vient de cliquer sur Démarrer depuis le Lobby
          // Il est dans l'attente de l'indice 1
          message = "Le Joueur 1 a lancé la partie, mais il doit encore soumettre l'Indice 1.";
          targetPath = `/choose-color`; 
      } else if (game.status === 'clue2_submission') {
          // J1 est en train de soumettre l'indice 2
          message = "Le Joueur 1 est en train de donner le deuxième indice. Vous serez redirigé pour placer votre Pion 2.";
      } else if (game.status === 'pion1_placement') {
          // L'action du J2 est requise sur /player2-guess
          navigate(targetPath);
          return null;
      }

      return (
          <div style={waitingContainerStyle}>
              <h1>⏳ Attente de l'indice du Joueur 1...</h1>
              <p>{message}</p>
              <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                  Veuillez attendre que l'indice s'affiche.
              </p>
              <button 
                onClick={() => navigate(targetPath)} 
                style={quitButtonStyle}
              >
                Vérifier le statut
              </button>
          </div>
      );
  }
  
  // 3. LOGIQUE D'ACTION DU JOUEUR 1 (Creator)

  // Si le J1 est ici, il doit soit soumettre l'indice 2, soit attendre que J2 place le pion 1
  if (isCreator && !isJ1Turn) {
      if (game.status === 'pion1_placement') {
          return (
              <div style={waitingContainerStyle}>
                  <h1>⏳ Attente du Pion 1 du Joueur 2...</h1>
                  <p>Le Joueur 2 est en train de placer son premier pion suite à votre Indice 1 (**{game.clue1}**).</p>
                  <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                      Vous serez automatiquement redirigé pour donner l'Indice 2 lorsque le placement sera validé.
                  </p>
              </div>
          );
      }
      
      // Si le statut est en dehors de la boucle (ex: color_choice), on redirige J1 vers sa page d'action précédente.
      if (game.status === 'color_choice') {
          navigate('/choose-color');
          return null;
      }
      // Si le statut est 'waiting' ou 'reveal', on renvoie au début ou à la fin.
      if (game.status === 'waiting' || game.status === 'reveal') {
          navigate(game.status === 'waiting' ? `/lobby/${game.id}` : '/reveal');
          return null;
      }
  }


  // --- Soumission de l'Indice 2 par le Joueur 1 ---

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clue.trim().length === 0) {
      setError("Veuillez donner le deuxième indice.");
      return;
    }
    setError("");

    // --- NOUVEAU : Envoie l'événement de soumission au serveur ---
    socket.emit('submit_clue_2', {
      gameId: game.id,
      clue: clue.trim(),
    });

    // J1 navigue vers la page d'attente du Pion 2
    navigate("/player2-guess");
  };

  // --- RENDU (Action J1) ---
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1>✨ Étape 2 : Indice 2 (Ajustement)</h1>

      <div style={clueBoxStyle}>
          <h3>Indice 1 (Rappel) :</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>
              {game.clue1}
          </p>
          <p style={{ marginTop: '10px' }}>
             Votre couleur cible secrète est : 
             <span style={{ backgroundColor: game.selectedColor, color: 'white', padding: '3px 8px', borderRadius: '4px', marginLeft: '10px' }}>
                {game.selectedColor}
             </span>
          </p>
      </div>

      <p style={{ marginBottom: '30px' }}>
          **Joueur 1** : Donnez un **deuxième indice** pour que le Joueur 2 puisse ajuster son placement initial et placer son Pion 2.
      </p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <h2>Indice 2 (Mot/Expression)</h2>
        <input
          type="text"
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="Ex: 'Plus chaud' ou 'Beaucoup plus près de la mer'"
          maxLength={30}
          style={inputStyle}
        />

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <button type="submit" style={submitButtonStyle}>
          Soumettre l'indice 2 et attendre le Pion 2
        </button>
      </form>
    </div>
  );
}

// Styles locaux
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
  backgroundColor: '#008CBA',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '20px',
};

const waitingContainerStyle = {
    padding: '40px', 
    maxWidth: '500px', 
    margin: '100px auto', 
    textAlign: 'center', 
    border: '2px solid #ffcc00', 
    borderRadius: '10px',
    backgroundColor: '#fffbe6'
};

const clueBoxStyle = {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196F3',
    borderRadius: '5px',
    margin: '20px 0'
}

const quitButtonStyle = {
    marginTop: '30px',
    padding: '10px 20px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};