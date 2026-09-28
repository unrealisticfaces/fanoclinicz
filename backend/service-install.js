const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Fano Clinic Backend',
  description: 'Runs the Node.js API and React Frontend for the clinic system.',
  script: path.join(__dirname, 'index.js'),
  env: [{
    name: "NODE_ENV",
    value: "production"
  }],
  wait: 2,
  grow: .5,
  maxRestarts: 10
});

svc.on('install', function() {
  console.log('Installation complete. Starting service...');
  svc.start();
});

svc.install();