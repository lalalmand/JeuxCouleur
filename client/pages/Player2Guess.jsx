// pages/Player2Guess.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Spectrum from "../components/Spectrum.jsx"; 

/**
 * Composant pour la devinette du Joueur 2 (placement des pions).
 */
export default function Player2Guess({ game, localPlayerRole, socket }) {
  const navigate = useNavigate();

  const isCreator = localPlayerRole === 'creator';
  
  // Détermination de l'étape actuelle basée sur le statut du serveur
  const isPion1Placement = game.status === 'pion1_placement';
  const isPion2Placement = game.status === 'pion2_placement';
  const isPlacing = isPion1Placement || isPion2Placement;

  // Utilise la position actuelle du pion s'il existe (pour le refresh), sinon 0.5 (milieu)
  const initialPosition = isPion2Placement ? game.pion2 : game.pion1;
  const [pionPosition, setPionPosition] = useState(initialPosition !== null ? initialPosition : 0.5);

  // Met à jour la position locale du pion si l'état global change (utile après un refresh)
  useEffect(() => {
    // Si la position est déjà enregistrée dans le jeu (game.pionX) et que le joueur n'est pas en train d'interagir, on la charge
    if (isPion2Placement && game.pion2 !== null && pionPosition === 0.5) {
      setPionPosition(game.pion2);
    } else if (isPion1Placement && game.pion1 !== null && pionPosition === 0.5) {
      setPionPosition(game.pion1);
    }
  }, [game.pion1, game.pion2, isPion1Placement, isPion2Placement, pionPosition]);


  // --- LOGIQUE DE REDIRECTION ET ATTENTE ---
  
  // 1. Si c'est le Joueur 1 (Créateur), il doit attendre l'action du Joueur 2
  if (isCreator) {
      const isWaitingForPion1 = game.status === 'pion1_placement';
      const isWaitingForPion2 = game.status === 'pion2_placement';
      
      let message;
      let targetPath;

      if (isWaitingForPion1) {
          message = "Le Joueur 2 est en train d'utiliser votre Indice 1 (**\"" + game.clue1 + "\"**) pour placer son premier pion.";
          targetPath = "/second-clue"; // J1 attend de pouvoir donner l'indice 2
      } else if (isWaitingForPion2) {
          message = "Le Joueur 2 est en train d'utiliser votre Indice 2 (**\"" + game.clue2 + "\"**) pour ajuster son deuxième pion.";
          targetPath = "/reveal"; // J1 attend la révélation
      } else {
          // Si J1 arrive ici dans un mauvais statut, on le renvoie à sa page d'action/attente
          navigate(game.status === 'color_choice' ? '/choose-color' : '/reveal'); 
          return null;
      }
      
      return (
          <div style={waitingContainerStyle}>
              <h1>⏳ Attente du placement du pion par le Joueur 2...</h1>
              <p>{message}</p>
              <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                  Vous serez redirigé automatiquement.
              </p>
              <button 
                  onClick={() => navigate(targetPath)} 
                  style={quitButtonStyle}
              >
                  Vérifier la prochaine étape
              </button>
          </div>
      );
  }
  
  // 2. Si ce n'est pas le tour du Joueur 2 (Joiner), il doit attendre sur une autre page
  if (!isPlacing) {
      let targetPath;
      
      // J2 doit agir uniquement sur 'pion1_placement' ou 'pion2_placement'.
      // Sinon, on le redirige vers l'étape appropriée où il doit attendre ou agir.
      if (game.status === 'color_choice' || game.status === 'clue2_submission') {
          targetPath = '/second-clue'; 
      } else if (game.status === 'reveal') {
          targetPath = '/reveal';
      } else {
          targetPath = `/lobby/${game.id}`;
      }

      // Redirige immédiatement si le statut n'est pas bon
      navigate(targetPath);
      return null;
  }


  // --- Logique de Soumission du Joueur 2 ---

  const currentClue = isPion2Placement ? game.clue2 : game.clue1;
  const clueLabel = isPion2Placement ? "Indice 2 (Ajustement)" : "Indice 1 (Initial)";

  const handlePionChange = (position) => {
    setPionPosition(position);
  };

  const handleValidateGuess = () => {
    if (pionPosition === null) return;
    
    // Détermine l'événement à envoyer
    const eventName = isPion1Placement ? 'submit_pion_1' : 'submit_pion_2';
    
    // Envoie l'événement au serveur
    socket.emit(eventName, {
      gameId: game.id,
      position: pionPosition,
    });

    // Navigation vers l'étape suivante (J1 reçoit la main)
    if (isPion1Placement) {
        navigate("/second-clue"); // J1 va soumettre l'indice 2
    } else if (isPion2Placement) {
        navigate("/reveal"); // Fin du jeu
    }
  };

  // --- RENDU (pour Joueur 2) ---
  const title = isPion2Placement ? "2. Ajustez votre position (Pion 2)" : "1. Placez votre première devinette (Pion 1)";
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1>{title}</h1>
      
      <p style={{marginBottom: '20px', fontWeight: 'bold'}}>
        Vous ciblez la couleur secrète en fonction de l'indice donné.
      </p>

      <div style={clueBoxStyle}>
          <h3>{clueLabel} :</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>
              {currentClue}
          </p>
          {isPion2Placement && game.clue1 && (
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                (Rappel : Indice 1 était **"{game.clue1}"**)
              </p>
          )}
      </div>

      <div style={{ margin: '40px 0' }}>
        {/* --- INTÉGRATION DU COMPOSANT SPECTRUM INTERACTIF --- */}
        <Spectrum 
            pionPosition={pionPosition} 
            onPionChange={handlePionChange} 
            isInteractive={true} 
        />
        <p style={{ marginTop: '10px' }}>
            Position choisie : **{(pionPosition * 100).toFixed(1)}%**
        </p>
      </div>

      <button 
        onClick={handleValidateGuess}
        style={validateButtonStyle}
        disabled={pionPosition === null}
      >
        Valider le placement du {isPion2Placement ? "Pion 2 (Révélation)" : "Pion 1 (Indice 2)"}
      </button>

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
const validateButtonStyle = {
  padding: '15px 30px',
  fontSize: '18px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#008CBA', 
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.3s',
  marginTop: '20px',
};

const quitButtonStyle = {
    marginTop: '10px',
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
    borderRadius: '10px',
    backgroundColor: '#fffbe6'
};

const clueBoxStyle = {
    padding: '15px',
    backgroundColor: '#fffbe6',
    border: '1px solid #ffcc00',
    borderRadius: '5px',
    margin: '20px 0'
}