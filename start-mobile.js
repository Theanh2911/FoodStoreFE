const { spawn } = require('child_process');

const child = spawn('npx', ['next', 'dev', '--hostname', '0.0.0.0', '--port', '3000'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  // Error handler removed for production
});

child.on('exit', (code) => {
  // Exit handler removed for production
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  child.kill('SIGTERM');
  process.exit(0);
});

