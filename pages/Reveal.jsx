// pages/Reveal.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spectrum from "../components/Spectrum.jsx"; 

/**
 * Composant de révélation des résultats et calcul du score.
 */
export default function Reveal({ game, localPlayerRole, socket }) {
    const navigate = useNavigate();
    const isCreator = localPlayerRole === 'creator';
    
    // Assurez-vous que toutes les données nécessaires sont présentes
    const isReady = game.selectedColor !== null && game.pion1 !== null && game.pion2 !== null;
    
    // NOTE TRÈS IMPORTANTE : Calcul de la position de la couleur cible
    // Pour que le score et l'affichage soient justes, vous devez déterminer la position numérique (0 à 1)
    // de la couleur secrète (game.selectedColor) sur l'axe HSL.
    
    // SIMULATION : Nous allons extraire la teinte HSL (Hue) de la chaîne 'hsl(H, S%, L%)'
    const getTargetPosition = (hsl) => {
        if (!hsl) return 0.5;
        // Simple regex pour extraire la Teinte (H)
        const match = hsl.match(/hsl\((\d+)/);
        if (match) {
            const hue = parseInt(match[1]);
            // Le spectre s'étend de 0 (Rouge) à 360 (Rouge). On normalise à [0, 1].
            return hue / 360; 
        }
        return 0.5; // Valeur par défaut si l'extraction échoue
    };

    const targetPosition = getTargetPosition(game.selectedColor);
    
    const [score, setScore] = useState(null);

    useEffect(() => {
        if (isReady && targetPosition !== null) {
            // Distance 1 : entre le Pion 1 et la cible
            const dist1 = Math.abs(game.pion1 - targetPosition);
            // Distance 2 : entre le Pion 2 et la cible
            const dist2 = Math.abs(game.pion2 - targetPosition);
            
            // Calcul de la proximité (1 - distance)
            const proximity1 = 1 - dist1;
            const proximity2 = 1 - dist2;

            // Score final est la moyenne de la proximité des deux pions (entre 0 et 100)
            const finalScore = Math.floor(((proximity1 + proximity2) / 2) * 100);
            
            setScore(finalScore);
        }
    }, [isReady, game.pion1, game.pion2, game.selectedColor, targetPosition]);
    
    // --- Logique d'attente/Redirection ---
    if (game.status !== 'reveal' || !isReady) {
        let message;
        if (game.status === 'pion2_placement') {
            message = isCreator 
                ? "Le Joueur 2 est en train de placer son Pion 2. La révélation est imminente !"
                : "Vous êtes sur le point de valider votre Pion 2. Votre partenaire attend la révélation.";
        } else {
            message = "La partie est en cours. Veuillez attendre la fin des placements.";
        }
        
        return (
            <div style={waitingContainerStyle}>
                <h1>⏳ Préparation des Résultats...</h1>
                <p>{message}</p>
                <button 
                    onClick={() => navigate(`/player2-guess`)}
                    style={quitButtonStyle}
                >
                    Retour à l'étape en cours
                </button>
            </div>
        );
    }

    // --- RENDU FINAL ---

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>🎉 Résultat de la partie ! 🎉</h1>
            
            <div style={resultBoxStyle}>
                <h2>Score Final : <span style={{ color: score > 75 ? '#4CAF50' : '#ff9800' }}>{score}%</span></h2>
                <p>
                    {score >= 90 ? "Excellent travail ! Vous étiez incroyablement précis !" :
                     score >= 70 ? "Très bon score ! Bonne communication !" :
                     score >= 50 ? "Pas mal ! Il y a eu quelques confusions." :
                     "Dommage ! Il faudra affiner les indices."}
                </p>
            </div>

            <div style={revealSectionStyle}>
                
                <h3 style={{marginBottom: '30px'}}>Visualisation du Spectre</h3>

                {/* --- INTÉGRATION DU COMPOSANT SPECTRUM --- */}
                <Spectrum 
                    pion1={game.pion1} 
                    pion2={game.pion2} 
                    targetColor={game.selectedColor} 
                    targetPosition={targetPosition}
                    isInteractive={false} 
                />
                
                <h3 style={{marginTop: '40px'}}>Détails des Actions</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '20px' }}>
                    
                    <div style={detailBoxStyle}>
                        <h4>Indice 1 (Pion 1)</h4>
                        <p style={clueStyle}>**"{game.clue1}"**</p>
                        <p style={pionStyle}>Position placée : **{(game.pion1 * 100).toFixed(1)}%**</p>
                    </div>

                    <div style={detailBoxStyle}>
                        <h4>Indice 2 (Pion 2)</h4>
                        <p style={clueStyle}>**"{game.clue2}"**</p>
                        <p style={pionStyle}>Position placée : **{(game.pion2 * 100).toFixed(1)}%**</p>
                    </div>
                </div>
                
                <p style={{ marginTop: '30px', fontWeight: 'bold' }}>
                    Couleur cible secrète : 
                    <span style={{ backgroundColor: game.selectedColor, color: 'white', padding: '5px 10px', borderRadius: '4px', marginLeft: '10px', textShadow: '0 0 3px #000' }}>
                        {game.selectedColor}
                    </span>
                </p>
            </div>

            <button 
                onClick={() => navigate("/")}
                style={newGameButtonStyle}
            >
                Commencer une nouvelle partie
            </button>
        </div>
    );
}

// Styles locaux
const waitingContainerStyle = {
    padding: '40px', 
    maxWidth: '500px', 
    margin: '100px auto', 
    textAlign: 'center', 
    border: '2px solid #ffcc00', 
    borderRadius: '10px',
    backgroundColor: '#fffbe6'
};

const quitButtonStyle = {
    marginTop: '30px',
    padding: '10px 20px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};

const resultBoxStyle = {
    padding: '20px',
    backgroundColor: '#f0f4c3',
    border: '3px solid #cddc39',
    borderRadius: '10px',
    marginBottom: '30px'
};

const revealSectionStyle = {
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    backgroundColor: '#f9f9f9'
};

const newGameButtonStyle = {
    padding: '15px 30px',
    fontSize: '18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3F51B5',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '40px',
};

const pionStyle = {
    fontSize: '1.1em', 
    color: '#666'
}

const clueStyle = {
    fontSize: '1.2em',
    color: '#333',
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: '10px',
};

const detailBoxStyle = {
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '5px',
    minWidth: '200px',
}