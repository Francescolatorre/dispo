// @ts-check
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envFile = join(rootDir, '..', '.env.test');

// Load test environment variables
dotenv.config({ path: envFile });

const serverPath = join(rootDir, '..', 'src', 'server.js');
const testPort = process.env.TEST_PORT || '3001';

// Start test server
const startServer = () => {
  console.log('Starting test server...');
  console.log(`Server path: ${serverPath}`);
  console.log(`Test port: ${testPort}`);

  const server = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: testPort,
      NODE_ENV: 'test'
    },
    stdio: 'inherit'
  });

  // Handle server process events
  server.on('error', (error) => {
    console.error('Failed to start test server:', error);
    process.exit(1);
  });

  // Handle cleanup on process termination
  const cleanup = () => {
    if (server && !server.killed) {
      console.log('Shutting down test server...');
      server.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  // Wait for server to be ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
      cleanup();
    }, 10000);

    server.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes(`Server is running on port ${testPort}`)) {
        clearTimeout(timeout);
        console.log('Test server started successfully');
        resolve(server);
      }
    });

    server.stderr?.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
  });
};

// Start server and handle errors
startServer().catch((error) => {
  console.error('Failed to start test server:', error);
  process.exit(1);
});