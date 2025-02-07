import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Initialize MSW
if (process.env.NODE_ENV === 'development') {
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  }).then(() => {
    console.log('[MSW] Mock service worker initialized');
    console.log('[MSW] Available mock endpoints:');
    console.log('- GET /api/projects');
    console.log('- GET /api/projects/:id');
    console.log('- GET /api/employees');
    console.log('- GET /api/assignments');
    console.log('- POST /api/assignments');
    console.log('- PATCH /api/assignments/:id');
    console.log('- DELETE /api/assignments/:id');
  });
}