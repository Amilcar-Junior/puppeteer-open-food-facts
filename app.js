const { spawn } = require('child_process');

// Executa o script index.js com o Puppeteer
const puppeteerProcess = spawn('node', ['index.js']);

puppeteerProcess.stdout.on('data', (data) => {
  console.log(`Puppeteer: ${data}`);
});

puppeteerProcess.stderr.on('data', (data) => {
  console.error(`Puppeteer error: ${data}`);
});

// Executa o servidor Express
const serverProcess = spawn('node', ['server.js']);

serverProcess.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`);
});
