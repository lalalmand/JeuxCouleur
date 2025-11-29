// components/Spectrum.jsx

import React, { useState, useCallback, useRef } from 'react';

/**
 * Composant de la barre de spectre couleur avec gestion interactive d'un pion.
 * @param {number} pionPosition - Position du pion actuel (entre 0 et 1).
 * @param {function} onPionChange - Callback appelé quand la position du pion change (mode interactif).
 * @param {boolean} isInteractive - Si TRUE, le pion peut être déplacé.
 * @param {string} targetColor - La couleur cible (affichée uniquement en mode statique).
 * @param {number} targetPosition - La position numérique de la couleur cible pour le calcul visuel (entre 0 et 1).
 * @param {number} pion1 - Position du pion 1 (mode statique).
 * @param {number} pion2 - Position du pion 2 (mode statique).
 */
export default function Spectrum({ 
    pionPosition, 
    onPionChange, 
    isInteractive = false, 
    targetColor = null,
    targetPosition = null,
    pion1 = null, 
    pion2 = null 
}) {
    const spectrumRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Détermine la position à afficher dans ce composant (pour le mode interactif)
    const currentPionPos = isInteractive ? pionPosition : (pion1 !== null ? pion1 : pion2);


    // --- Logique de gestion du drag et du clic (mode interactif) ---

    const calculatePionPosition = useCallback((clientX) => {
        if (!spectrumRef.current) return 0.5;

        const rect = spectrumRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        let newPosition = offsetX / rect.width;

        // Clamper la position entre 0 et 1
        newPosition = Math.max(0, Math.min(1, newPosition));
        
        if (onPionChange) {
            onPionChange(newPosition);
        }
        return newPosition;
    }, [onPionChange]);

    const handleMouseDown = useCallback((e) => {
        if (!isInteractive) return;
        setIsDragging(true);
        calculatePionPosition(e.clientX);
    }, [isInteractive, calculatePionPosition]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !isInteractive) return;
        calculatePionPosition(e.clientX);
    }, [isDragging, isInteractive, calculatePionPosition]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
        }
    }, [isDragging]);

    // Attache les événements globaux au document
    useEffect(() => {
        if (isInteractive) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isInteractive, handleMouseMove, handleMouseUp]);
    
    // Gère le clic simple (positionnement direct)
    const handleClick = (e) => {
        if (!isInteractive) return;
        calculatePionPosition(e.clientX);
    };
    
    // --- Rendu des Pions (pour les deux modes) ---
    
    const renderPion = (position, label, color, isDraggable = false) => {
        if (position === null) return null;
        
        const style = {
            left: `${position * 100}%`,
            backgroundColor: color,
            cursor: isDraggable ? 'grab' : 'default',
        };
        
        return (
            <div 
                className="pion" 
                style={{...pionStyle, ...style}}
                onMouseDown={isDraggable ? handleMouseDown : undefined}
            >
                {label}
            </div>
        );
    };
    
    // Rendu de la Cible (uniquement en mode statique/révélation)
    const renderTarget = () => {
        if (!targetPosition || !targetColor) return null;
        
        const style = {
            left: `${targetPosition * 100}%`,
            backgroundColor: targetColor,
            color: 'white',
        };
        
        return (
            <div 
                className="target-marker" 
                style={{...targetStyle, ...style}}
            >
                🎯 Cible
            </div>
        );
    };

    return (
        <div className="spectrum-container" style={spectrumContainerStyle}>
            {/* Barre de spectre (gradient HSL) */}
            <div 
                ref={spectrumRef} 
                className="spectrum-bar" 
                style={spectrumBarStyle} 
                onClick={isInteractive ? handleClick : undefined}
            >
                {/* Rendu des pions selon le mode */}
                {isInteractive && renderPion(currentPionPos, '', '#000', true)}
                
                {!isInteractive && renderTarget()}
                {!isInteractive && renderPion(pion1, 'Pion 1', '#4CAF50')}
                {!isInteractive && renderPion(pion2, 'Pion 2', '#008CBA')}
            </div>
            
            <div style={labelContainerStyle}>
                <span style={labelStyle}>0%</span>
                <span style={labelStyle}>50%</span>
                <span style={labelStyle}>100%</span>
            </div>
        </div>
    );
}

// --- Styles CSS pour le composant ---

const spectrumContainerStyle = {
    padding: '20px 0',
};

const spectrumBarStyle = {
    position: 'relative',
    height: '40px',
    borderRadius: '20px',
    overflow: 'visible',
    // Gradient HSL classique du rouge au magenta
    background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const pionStyle = {
    position: 'absolute',
    top: '-15px',
    transform: 'translateX(-50%)',
    width: '30px',
    height: '70px',
    borderRadius: '5px',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
    border: '2px solid #fff',
    zIndex: 10,
    fontSize: '0.8em',
    color: 'white',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '5px',
    fontWeight: 'bold',
};

const targetStyle = {
    position: 'absolute',
    top: '-35px',
    transform: 'translateX(-50%)',
    padding: '5px 10px',
    borderRadius: '5px',
    backgroundColor: '#333',
    fontWeight: 'bold',
    zIndex: 5,
};

const labelContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '5px',
    color: '#666',
    fontSize: '0.9em'
};

const labelStyle = {
    fontWeight: 'bold',
};