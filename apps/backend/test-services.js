/**
 * Script de test des services
 * Utilisation: node test-services.js
 */

const SERVICES = [
  { name: 'user-authentication', port: 3000, healthPath: '/health' },
  { name: 'gestion-site', port: 3001, healthPath: '/health' },
  { name: 'materials-service', port: 3002, healthPath: '/materials/health' },
  { name: 'gestion-planing', port: 3003, healthPath: '/health' },
  { name: 'notification', port: 3005, healthPath: '/health' },
  { name: 'gestion-projects', port: 3007, healthPath: '/health' },
  { name: 'paiement', port: 3008, healthPath: '/api/payments' },
  { name: 'resource-optimization', port: 3010, healthPath: '/api/health' },
];

async function testService(service) {
  try {
    const response = await fetch(`http://localhost:${service.port}${service.healthPath}`);
    
    if (response.ok) {
      return { ...service, status: 'OK', statusCode: response.status };
    } else {
      return { ...service, status: 'ERROR', statusCode: response.status };
    }
  } catch (error) {
    return { ...service, status: 'OFFLINE', error: error.message };
  }
}

async function testAllServices() {
  console.log('🏥 Test de santé des services SmartSite Platform\n');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const service of SERVICES) {
    const result = await testService(service);
    
    let statusIcon = '❌';
    if (result.status === 'OK') statusIcon = '✅';
    else if (result.status === 'ERROR') statusIcon = '⚠️';
    
    const statusText = result.status === 'OK' 
      ? `${result.status} (${result.statusCode})`
      : result.status === 'ERROR'
      ? `${result.status} (${result.statusCode})`
      : `${result.status}`;
    
    console.log(`${statusIcon} ${service.name.padEnd(25)} | Port ${service.port} | ${statusText}`);
    
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(70));
  
  const online = results.filter(r => r.status === 'OK');
  const errors = results.filter(r => r.status === 'ERROR');
  const offline = results.filter(r => r.status === 'OFFLINE');
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Services OK: ${online.length}`);
  console.log(`   ⚠️ Services avec erreurs: ${errors.length}`);
  console.log(`   ❌ Services hors ligne: ${offline.length}`);
  
  if (online.length > 0) {
    console.log(`\n✅ Services fonctionnels:`);
    online.forEach(service => {
      console.log(`   - ${service.name} (port ${service.port})`);
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n⚠️ Services avec erreurs:`);
    errors.forEach(service => {
      console.log(`   - ${service.name} (port ${service.port}) - Status ${service.statusCode}`);
    });
  }
  
  if (offline.length > 0) {
    console.log(`\n❌ Services hors ligne:`);
    offline.forEach(service => {
      console.log(`   - ${service.name} (port ${service.port})`);
    });
  }
  
  console.log(`\n💡 Le service paiement est maintenant sur le port 3008`);
  console.log(`💡 Vérifiez PORTS_CONFIGURATION.md pour la configuration complète`);
}

// Polyfill fetch pour Node.js si nécessaire
if (typeof fetch === 'undefined') {
  try {
    global.fetch = (await import('node-fetch')).default;
  } catch (e) {
    console.log('❌ node-fetch non installé. Installez avec: npm install node-fetch');
    process.exit(1);
  }
}

testAllServices().catch(console.error);