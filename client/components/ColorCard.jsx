// components/ColorCard.jsx

import React from 'react';

export default function ColorCard({ color, isSelected, onClick }) {
  // Style pour la carte de couleur
  const cardStyle = {
    backgroundColor: color,
    width: '100%',
    height: '100px',
    borderRadius: '10px',
    border: isSelected ? '5px solid gold' : '3px solid #ccc', // Mettre en évidence si elle est sélectionnée
    cursor: 'pointer',
    transition: 'border 0.2s, transform 0.2s',
    boxShadow: isSelected ? '0 0 15px rgba(255, 215, 0, 0.8)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div 
      style={cardStyle} 
      onClick={onClick}
      aria-label={`Choisir la couleur ${color}`}
    >
      {/* On peut ajouter une coche si la carte est sélectionnée */}
      {isSelected && (
        <span style={{ fontSize: '30px', color: 'white', textShadow: '2px 2px 4px #000' }}>
          ✅
        </span>
      )}
    </div>
  );
}