import React from 'react';
import { createRoot } from 'react-dom/client';
import { ColorModeScript } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import './index.css';

async function prepare() {
  if (process.env.NODE_ENV === 'development') {
    // Initialize MSW
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });

    // Initialize test utilities
    const { testEndpoints } = await import('./mocks/test-utils');
    (window as any).testApi = testEndpoints;
    console.log('[Dev] Test utilities available. Run testApi.testAll() to verify endpoints.');
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find root element');

const root = createRoot(container);

// Initialize app with MSW in development
prepare().then(() => {
  root.render(
    <React.StrictMode>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </React.StrictMode>
  );
});
