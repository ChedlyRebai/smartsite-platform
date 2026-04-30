/**
 * Script de vérification des ports
 * Utilisation: node check-ports.js
 */

import net from 'net';

const SERVICES = [
  { name: 'user-authentication', port: 3000 },
  { name: 'gestion-site', port: 3001 },
  { name: 'materials-service', port: 3002 },
  { name: 'gestion-planing', port: 3003 },
  { name: 'incident-management', port: 3004 },
  { name: 'notification', port: 3005 },
  { name: 'api-gateway', port: 3006 },
  { name: 'gestion-projects', port: 3007 },
  { name: 'paiement', port: 3008 },
  { name: 'resource-optimization', port: 3010 },
  { name: 'frontend', port: 5173 },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port libre
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port occupé
    });
  });
}

async function checkAllPorts() {
  console.log('🔍 Vérification des ports SmartSite Platform\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const service of SERVICES) {
    const isUsed = await checkPort(service.port);
    const status = isUsed ? '🔴 OCCUPÉ' : '🟢 LIBRE';
    
    console.log(`${service.name.padEnd(25)} | Port ${service.port} | ${status}`);
    
    results.push({
      ...service,
      isUsed,
      status: isUsed ? 'OCCUPÉ' : 'LIBRE'
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  const occupiedPorts = results.filter(r => r.isUsed);
  const freePorts = results.filter(r => !r.isUsed);
  
  console.log(`\n📊 Résumé:`);
  console.log(`   🔴 Ports occupés: ${occupiedPorts.length}`);
  console.log(`   🟢 Ports libres: ${freePorts.length}`);
  
  if (occupiedPorts.length > 0) {
    console.log(`\n🔴 Services potentiellement actifs:`);
    occupiedPorts.forEach(service => {
      console.log(`   - ${service.name} (port ${service.port})`);
    });
  }
  
  if (freePorts.length > 0) {
    console.log(`\n🟢 Ports disponibles pour démarrage:`);
    freePorts.forEach(service => {
      console.log(`   - ${service.name} (port ${service.port})`);
    });
  }
  
  console.log(`\n💡 Pour démarrer un service:`);
  console.log(`   cd apps/backend/[service-name]`);
  console.log(`   npm run start:dev`);
  
  console.log(`\n💡 Pour tuer un processus sur un port (Windows):`);
  console.log(`   netstat -ano | findstr :PORT`);
  console.log(`   taskkill /PID <PID> /F`);
  
  console.log(`\n📋 Configuration complète dans: PORTS_CONFIGURATION.md`);
}

checkAllPorts().catch(console.error);