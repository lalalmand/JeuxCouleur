// pages/Lobby.jsx

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Composant de la salle d'attente (Lobby).
 * Gère l'affichage de l'état en temps réel et le lancement de la partie.
 */
export default function Lobby({ game, localPlayerRole, socket }) { 
  const { gameId } = useParams(); 
  const navigate = useNavigate();
  
  const isCreator = localPlayerRole === 'creator';
  
  // --- LOGIQUE DE NAVIGATION AUTOMATIQUE DU JOUEUR 2 ---
  useEffect(() => {
      // 1. Le Joueur 2 ne fait rien si ce n'est pas son rôle.
      if (localPlayerRole !== 'joiner') {
          return;
      }
      
      // 2. Le Joueur 2 attend que la partie soit lancée par le Joueur 1.
      // Le statut initial est 'waiting'. Dès que J1 clique sur Démarrer, le statut passe à 'color_choice'.
      if (game.status === 'color_choice') {
          // J1 est en train de choisir la couleur. J2 va vers sa page d'attente.
          navigate("/second-clue"); 
      }
      
      // 3. Cas de reconnexion/refresh: Si le jeu est déjà avancé, on redirige J2 au bon endroit.
      if (game.status === 'pion1_placement') {
          // J1 a soumis l'indice 1. J2 doit placer son Pion 1.
          navigate("/player2-guess");
      }
      
      if (game.status === 'clue2_submission') {
          // J2 doit attendre l'indice 2.
          navigate("/second-clue");
      }
      
      if (game.status === 'pion2_placement') {
          // J1 a soumis l'indice 2. J2 doit placer son Pion 2.
          navigate("/player2-guess");
      }
      
      if (game.status === 'reveal') {
          navigate("/reveal");
      }
      
  }, [game.status, localPlayerRole, navigate]); // Déclencheur principal : le changement de statut


  const handleStartGame = () => {
    // Vérification de l'autorité et du nombre de joueurs
    if (isCreator && game.playersReady === game.playersNeeded) {
        
        // Envoie l'action de DÉMARRAGE au serveur.
        // Le serveur mettra à jour game.status à 'color_choice'.
        socket.emit('start_game_action', game.id); 
        
        // J1 navigue immédiatement, car il est le lanceur
        navigate("/choose-color");
    }
  }

  // --- RENDU ---
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>⏳ Salle d'attente</h1>

      {/* Affichage de l'ID de partie */}
      <div style={idBoxStyle}>
        <p>Partagez cet ID pour que d'autres joueurs vous rejoignent :</p>
        <strong>{gameId}</strong>
        <button 
            onClick={() => navigator.clipboard.writeText(gameId)}
            style={copyButtonStyle}
        >
            📋 Copier l'ID
        </button>
      </div>
      
      {/* Message de rôle */}
      <p style={{ fontStyle: 'italic', marginBottom: '15px' }}>
          Votre rôle dans cette partie : 
          <strong style={{ color: isCreator ? '#4CAF50' : '#008CBA', fontWeight: 'bold' }}>
            {localPlayerRole ? (isCreator ? " Joueur 1 (Créateur)" : " Joueur 2") : " Connexion..."}
          </strong>
      </p>

      <h2>
        {game.playersReady}/{game.playersNeeded} joueurs présents
      </h2>
      
      {/* Logique de démarrage */}
      {game.playersReady < game.playersNeeded ? (
        <p style={{ fontSize: '1.2em', color: '#f90' }}>
            On attend {game.playersNeeded - game.playersReady} autre(s) joueur(s)...
        </p>
      ) : (
        <>
            <p style={{ fontSize: '1.2em', color: '#4CAF50', fontWeight: 'bold' }}>
                Tous les joueurs sont prêts !
            </p>
            
            {/* VÉRIFICATION D'AUTORITÉ : Seul le Créateur peut lancer */}
            {isCreator ? (
                <button 
                    onClick={handleStartGame}
                    style={startButton}
                >
                    Démarrer la partie (Joueur 1) !
                </button>
            ) : (
                <p style={{ fontSize: '1.1em', color: '#008CBA', fontWeight: 'bold' }}>
                    En attente du lancement par le Joueur 1...
                </p>
            )}
        </>
      )}
    </div>
  );
}

// Styles locaux
const idBoxStyle = {
    padding: '15px',
    border: '2px dashed #008CBA',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    backgroundColor: '#e0f7fa'
};

const copyButtonStyle = {
    marginLeft: '10px',
    padding: '5px 10px',
    backgroundColor: '#008CBA',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

const startButton = {
    padding: '15px 30px',
    fontSize: '20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    marginTop: '20px'
}