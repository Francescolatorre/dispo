import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];
const pattern = args[1] || '';

const vitest = spawn('vitest', [
  command,
  pattern,
  '--config',
  resolve(__dirname, '../vitest.config.ts'),
  '--threads',
  'false'
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    TS_NODE_PROJECT: resolve(__dirname, '../tsconfig.json'),
  },
});

vitest.on('error', (error) => {
  console.error('Failed to start test process:', error);
  process.exit(1);
});

vitest.on('close', (code) => {
  process.exit(code);
});