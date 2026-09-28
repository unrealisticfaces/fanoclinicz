const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Fano Clinic Backend',
  script: path.join(__dirname, 'index.js')
});

svc.on('uninstall', () => console.log('Uninstall complete.'));
svc.uninstall();