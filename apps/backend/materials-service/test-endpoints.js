/**
 * Script de test des endpoints
 * Utilisation: node test-endpoints.js
 */

const testEndpoints = async () => {
  console.log('🧪 Test des endpoints - Fournisseurs et Géocodage\n');
  console.log('='.repeat(60));

  // Test 1: Fournisseurs - Tous
  console.log('\n📋 Test 1: Récupération de tous les fournisseurs');
  try {
    const response = await fetch('http://localhost:3002/materials/suppliers');
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Succès: ${data.count} fournisseurs trouvés`);
      console.log(`📊 Source: ${data.source}`);
      if (data.data.length > 0) {
        console.log(`📝 Premier fournisseur: ${data.data[0].nom} - ${data.data[0].ville}`);
      }
    } else {
      console.log(`❌ Erreur: ${data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
    console.log('💡 Assurez-vous que le service materials est démarré sur le port 3002');
  }

  // Test 2: Géocodage - Simple
  console.log('\n🗺️ Test 2: Géocodage simple');
  try {
    const response = await fetch('http://localhost:3001/gestion-sites/geocode/search?address=Tunis');
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Succès: ${data.results.length} résultat(s) trouvé(s)`);
      if (data.results.length > 0) {
        const first = data.results[0];
        console.log(`📍 Premier résultat: ${first.displayName}`);
        console.log(`🎯 Coordonnées: ${first.lat}, ${first.lng}`);
      }
    } else {
      console.log(`❌ Erreur: ${data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
    console.log('💡 Assurez-vous que le service gestion-site est démarré sur le port 3001');
  }

  // Test 3: Géocodage - Avancé
  console.log('\n🎯 Test 3: Géocodage avancé');
  try {
    const response = await fetch('http://localhost:3001/gestion-sites/geocode/search-advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'Avenue Habib Bourguiba',
        city: 'Tunis',
        country: 'Tunisia'
      })
    });
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Succès: ${data.results.length} résultat(s) trouvé(s)`);
      if (data.bestMatch) {
        console.log(`🏆 Meilleur résultat: ${data.bestMatch.displayName}`);
        console.log(`📍 Coordonnées: ${data.bestMatch.lat}, ${data.bestMatch.lng}`);
      }
      if (data.mapCenter) {
        console.log(`🗺️ Centre carte: ${data.mapCenter.lat}, ${data.mapCenter.lng} (zoom: ${data.mapCenter.zoom})`);
      }
    } else {
      console.log(`❌ Erreur: ${data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés!\n');
  
  console.log('📋 Pour démarrer les services:');
  console.log('   cd apps/backend/materials-service && npm run start:dev');
  console.log('   cd apps/backend/gestion-site && npm run start:dev');
  
  console.log('\n📁 Composants frontend disponibles dans:');
  console.log('   apps/frontend/src/components/suppliers/SupplierSelector.tsx');
  console.log('   apps/frontend/src/components/geocoding/AddressSearch.tsx');
};

// Polyfill fetch pour Node.js si nécessaire
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testEndpoints().catch(console.error);