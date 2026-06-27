import React from 'react';
import { createRoot } from 'react-dom/client'; // Importa createRoot
import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement); // Crea el root
root.render(<App />); // Usa el método render del root
