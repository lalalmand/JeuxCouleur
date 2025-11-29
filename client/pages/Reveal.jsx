// pages/Reveal.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Styles CSS intégrés (Alternative si vous n'avez pas de dossier styles) ---
const INLINE_STYLES = (
<style>
{`
.reveal-container {
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
    text-align: center;
}

.reveal-container h1 {
    color: #333;
    margin-bottom: 20px;
}

.result-box {
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    color: white;
}

.result-box h2 {
    margin-top: 0;
    font-size: 2.5em;
}

.result-box.win {
    background-color: #4CAF50; /* Vert */
}

.result-box.loss {
    background-color: #F44336; /* Rouge */
}

.summary-section {
    display: flex;
    justify-content: space-around;
    margin: 30px 0;
    padding: 15px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
}

.clues-summary, .player-summary {
    flex: 1;
    padding: 0 15px;
    text-align: left;
}

.clues-summary h3, .player-summary h3 {
    color: #555;
    border-bottom: 2px solid #ccc;
    padding-bottom: 5px;
}

/* --- Spectrum Board --- */
.spectrum-board {
    margin: 20px auto;
    padding: 15px;
    border: 2px solid #333;
    border-radius: 10px;
    background: #eee;
}

.spectrum-colors {
    display: flex;
    justify-content: space-around;
    gap: 10px;
}

.color-slot {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: black;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
    border: 3px solid transparent;
    position: relative;
}

.target-color {
    border: 3px dashed gold;
}

.target-label {
    background: rgba(255, 255, 255, 0.9);
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 0.9em;
    position: absolute;
    top: 5px;
    color: #333;
}

.pin-label {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 15px;
    margin-top: 5px;
    font-size: 0.8em;
    position: absolute;
    bottom: 5px;
}

.restart-button {
    background-color: #007bff;
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 6px;
    font-size: 1.1em;
    cursor: pointer;
    margin-top: 20px;
    transition: background-color 0.3s;
}

.restart-button:hover {
    background-color: #0056b3;
}

@media (max-width: 600px) {
    .summary-section {
        flex-direction: column;
    }
}
`}
</style>
);


// --- 1. Composant Utilitiaire: Spectrum (Affiche le plateau final) ---
const Spectrum = ({ chosenColors, targetColor, pion1, pion2 }) => {
    
    const isPion = (index, pion) => pion !== null && pion.index === index;

    return (
        <div className="spectrum-board">
            <div className="spectrum-colors">
                {chosenColors.map((color, index) => {
                    
                    const isTarget = color === targetColor;
                    const isPion1 = isPion(index, pion1);
                    const isPion2 = isPion(index, pion2);
                    
                    let pinText = '';
                    if (isPion1 && isPion2) {
                        pinText = 'Pions 1 & 2';
                    } else if (isPion1) {
                        pinText = 'Pion 1';
                    } else if (isPion2) {
                        pinText = 'Pion 2';
                    }

                    return (
                        <div 
                            key={index} 
                            className={`color-slot ${isTarget ? 'target-color' : ''}`}
                            style={{ backgroundColor: color }}
                        >
                            {isTarget && <span className="target-label">Couleur Cible !</span>}
                            {pinText && <span className="pin-label">{pinText}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- 2. Composant Principal: Reveal ---
export default function Reveal({ game, localPlayerRole, socket }) {
    const navigate = useNavigate();

    // Redirection si le jeu n'est pas prêt ou si le statut n'est pas correct
    useEffect(() => {
        if (!game.id) {
            navigate('/');
        } else if (game.status !== 'reveal') {
            // Logique de redirection vers la page en cours si le statut change
            if (game.status === 'color_choice' && localPlayerRole === 'creator') navigate('/choose-color');
            if (game.status === 'pion1_placement' && localPlayerRole === 'joiner') navigate('/player2-guess');
            if (game.status === 'clue2_submission' && localPlayerRole === 'creator') navigate('/second-clue');
            if (game.status === 'pion2_placement' && localPlayerRole === 'joiner') navigate('/player2-guess');
        }
    }, [game, navigate, localPlayerRole]);

    if (!game.id || game.status !== 'reveal') {
        return (
            <>
                {INLINE_STYLES}
                <div>Chargement...</div>
            </>
        );
    }

    const targetColorIndex = game.chosenColors.indexOf(game.selectedColor);
    // Vérifie si la position du pion 2 correspond à la position de la couleur cible
    const win = game.pion2 && game.pion2.index === targetColorIndex;
    
    const isCreator = localPlayerRole === 'creator';
    
    // --- Message de résultat final ---
    const getResultMessage = () => {
        if (win) {
            return {
                title: 'VICTOIRE ! 🎉',
                subtitle: isCreator ? 'Le Joueur 2 a trouvé la bonne couleur !' : 'Vous avez trouvé la couleur cachée !',
                class: 'win',
            };
        } else {
            return {
                title: 'DÉFAITE 😢',
                subtitle: isCreator ? 'Le Joueur 2 n\'a pas trouvé la bonne couleur.' : 'Vous n\'avez pas trouvé la couleur cachée.',
                class: 'loss',
            };
        }
    };
    
    const result = getResultMessage();

    const handleRestart = () => {
        // Redirige vers l'accueil après déconnexion/reconnexion
        socket.disconnect();
        socket.connect();
        navigate('/');
    };

    return (
        <>
            {INLINE_STYLES}
            <div className="reveal-container">
                <h1>Résultat de la Partie</h1>
                
                <div className={`result-box ${result.class}`}>
                    <h2>{result.title}</h2>
                    <p>{result.subtitle}</p>
                </div>

                <section className="summary-section">
                    
                    <div className="clues-summary">
                        <h3>Indices Donnés</h3>
                        <p><strong>Indice 1 :</strong> {game.clue1 || 'Aucun'}</p>
                        <p><strong>Indice 2 :</strong> {game.clue2 || 'Aucun'}</p>
                    </div>

                    <div className="player-summary">
                        <h3>Tentatives du Joueur 2</h3>
                        <p><strong>Position 1 :</strong> {game.pion1 ? `Couleur ${game.pion1.index + 1}` : 'N/A'}</p>
                        <p><strong>Position 2 :</strong> {game.pion2 ? `Couleur ${game.pion2.index + 1}` : 'N/A'}</p>
                    </div>
                </section>
                
                <div className="spectrum-display">
                    <Spectrum 
                        chosenColors={game.chosenColors}
                        targetColor={game.selectedColor}
                        pion1={game.pion1} 
                        pion2={game.pion2} 
                    />
                </div>
                
                <button 
                    onClick={handleRestart} 
                    className="restart-button"
                >
                    Rejouer
                </button>
            </div>
        </>
    );
}