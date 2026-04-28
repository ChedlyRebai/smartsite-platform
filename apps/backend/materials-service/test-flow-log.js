/**
 * Script de test pour vérifier le flow-log
 * 
 * Usage: node test-flow-log.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';
const TOKEN = 'votre-token-ici'; // Remplacer par un vrai token

// Configuration
axios.defaults.headers.common['Authorization'] = `Bearer ${TOKEN}`;

async function testFlowLog() {
  console.log('🧪 === TEST FLOW-LOG ===\n');

  try {
    // 1. Créer un matériau de test
    console.log('1️⃣ Création d'un matériau de test...');
    const materialResponse = await axios.post(`${API_URL}/materials`, {
      name: 'Test Flow Log Material',
      code: `TEST-FLOW-${Date.now()}`,
      category: 'Test',
      unit: 'unité',
      quantity: 100,
      minimumStock: 20,
      maximumStock: 200,
      stockMinimum: 30,
      siteId: '6756e0e5e5e5e5e5e5e5e5e5' // Remplacer par un vrai siteId
    });

    const material = materialResponse.data;
    console.log(`✅ Matériau créé: ${material._id} - ${material.name}\n`);

    // 2. Enregistrer une entrée de stock
    console.log('2️⃣ Test entrée de stock (50 unités)...');
    await axios.put(`${API_URL}/materials/${material._id}`, {
      stockEntree: 50,
      reason: 'Test entrée via script'
    });
    console.log('✅ Entrée enregistrée\n');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Enregistrer une sortie normale
    console.log('3️⃣ Test sortie normale (10 unités)...');
    await axios.put(`${API_URL}/materials/${material._id}`, {
      stockSortie: 10,
      reason: 'Test sortie normale'
    });
    console.log('✅ Sortie normale enregistrée\n');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Enregistrer une sortie EXCESSIVE (devrait déclencher une alerte)
    console.log('4️⃣ Test sortie EXCESSIVE (200 unités) - Devrait déclencher une alerte...');
    await axios.put(`${API_URL}/materials/${material._id}`, {
      stockSortie: 200,
      reason: 'Test sortie excessive - Risque de vol'
    });
    console.log('🚨 Sortie excessive enregistrée - Alerte devrait être déclenchée!\n');

    // Attendre 3 secondes pour laisser le temps à l'email de partir
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Vérifier les flow-logs
    console.log('5️⃣ Vérification des flow-logs...');
    const flowLogsResponse = await axios.get(`${API_URL}/material-flow`, {
      params: {
        materialId: material._id
      }
    });

    const flowLogs = flowLogsResponse.data;
    console.log(`✅ ${flowLogs.length} mouvements enregistrés:\n`);

    flowLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.type} - ${log.quantity} unités`);
      console.log(`      Stock: ${log.previousStock} → ${log.newStock}`);
      console.log(`      Anomalie: ${log.anomalyDetected || 'NONE'}`);
      if (log.anomalyMessage) {
        console.log(`      Message: ${log.anomalyMessage}`);
      }
      if (log.emailSent) {
        console.log(`      📧 Email envoyé: OUI`);
      }
      console.log('');
    });

    // 6. Vérifier les anomalies
    const anomalies = flowLogs.filter(log => log.anomalyDetected && log.anomalyDetected !== 'NONE');
    console.log(`\n🚨 Anomalies détectées: ${anomalies.length}`);
    
    if (anomalies.length > 0) {
      console.log('✅ TEST RÉUSSI - Les anomalies sont bien détectées!');
      anomalies.forEach(anomaly => {
        console.log(`   - ${anomaly.anomalyDetected}: ${anomaly.anomalyMessage}`);
        console.log(`     Email envoyé: ${anomaly.emailSent ? 'OUI ✅' : 'NON ❌'}`);
      });
    } else {
      console.log('❌ TEST ÉCHOUÉ - Aucune anomalie détectée alors qu\'une sortie excessive a été enregistrée');
    }

    // 7. Nettoyer (optionnel)
    console.log('\n7️⃣ Nettoyage...');
    await axios.delete(`${API_URL}/materials/${material._id}`);
    console.log('✅ Matériau de test supprimé\n');

    console.log('🎉 === TEST TERMINÉ ===');

  } catch (error) {
    console.error('❌ ERREUR:', error.response?.data || error.message);
    console.error('\nDétails:', error.response?.data);
  }
}

// Exécuter le test
testFlowLog();
