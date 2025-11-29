// src/index.jsx

import React from 'react';
import { createRoot } from 'react-dom/client'; // Importation de la méthode React 18
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

const rootElement = document.getElementById('root');

// Utilisation de la méthode de rendu React 18
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);