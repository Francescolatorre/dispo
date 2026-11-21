import React from 'react';
import { createRoot } from 'react-dom/client';
import { ColorModeScript } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find root element');

createRoot(container).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </React.StrictMode>,
);
