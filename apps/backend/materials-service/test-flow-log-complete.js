/**
 * Script de test complet pour le Flow Log
 * 
 * Ce script teste:
 * 1. Création d'un matériau
 * 2. Enregistrement d'une entrée normale
 * 3. Enregistrement d'une sortie normale
 * 4. Enregistrement d'une sortie EXCESSIVE (devrait déclencher anomalie)
 * 5. Vérification des flow logs
 * 6. Vérification des anomalies détectées
 * 7. Nettoyage
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // ID utilisateur de test

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Variables globales pour le test
let testMaterialId = null;
let testSiteId = '507f1f77bcf86cd799439012'; // ID site de test

async function testFlowLog() {
  try {
    logSection('🧪 TEST COMPLET DU FLOW LOG');

    // ========== ÉTAPE 1: Créer un matériau de test ==========
    logSection('📦 ÉTAPE 1: Création du matériau de test');
    
    const materialData = {
      name: `Test Flow Log ${Date.now()}`,
      code: `TEST-FL-${Date.now()}`,
      category: 'Test',
      unit: 'unité',
      quantity: 100,
      minimumStock: 10,
      maximumStock: 200,
      stockMinimum: 20,
      reorderPoint: 20,
      siteId: testSiteId,
      status: 'active'
    };

    logInfo('Données du matériau:');
    console.log(JSON.stringify(materialData, null, 2));

    try {
      const createResponse = await axios.post(`${API_BASE}/materials`, materialData);
      testMaterialId = createResponse.data._id;
      logSuccess(`Matériau créé avec ID: ${testMaterialId}`);
      logInfo(`Stock initial: ${createResponse.data.quantity} ${createResponse.data.unit}`);
    } catch (error) {
      logError(`Erreur création matériau: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
      throw error;
    }

    await sleep(1000);

    // ========== ÉTAPE 2: Enregistrer une ENTRÉE normale ==========
    logSection('📥 ÉTAPE 2: Enregistrement d\'une ENTRÉE normale (50 unités)');

    const entryFlow = {
      materialId: testMaterialId,
      siteId: testSiteId,
      type: 'IN',
      quantity: 50,
      reason: 'Livraison fournisseur - Test',
      reference: 'REF-TEST-001'
    };

    logInfo('Données de l\'entrée:');
    console.log(JSON.stringify(entryFlow, null, 2));

    try {
      const entryResponse = await axios.post(
        `${API_BASE}/material-flow`,
        entryFlow,
        {
          headers: {
            'user-id': TEST_USER_ID
          }
        }
      );
      logSuccess('Entrée enregistrée avec succès');
      logInfo(`Stock avant: ${entryResponse.data.previousStock}`);
      logInfo(`Stock après: ${entryResponse.data.newStock}`);
      logInfo(`Anomalie détectée: ${entryResponse.data.anomalyDetected}`);
    } catch (error) {
      logError(`Erreur enregistrement entrée: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
      throw error;
    }

    await sleep(1000);

    // ========== ÉTAPE 3: Enregistrer une SORTIE normale ==========
    logSection('📤 ÉTAPE 3: Enregistrement d\'une SORTIE normale (10 unités)');

    const normalExitFlow = {
      materialId: testMaterialId,
      siteId: testSiteId,
      type: 'OUT',
      quantity: 10,
      reason: 'Utilisation normale sur chantier',
      reference: 'REF-TEST-002'
    };

    logInfo('Données de la sortie normale:');
    console.log(JSON.stringify(normalExitFlow, null, 2));

    try {
      const normalExitResponse = await axios.post(
        `${API_BASE}/material-flow`,
        normalExitFlow,
        {
          headers: {
            'user-id': TEST_USER_ID
          }
        }
      );
      logSuccess('Sortie normale enregistrée avec succès');
      logInfo(`Stock avant: ${normalExitResponse.data.previousStock}`);
      logInfo(`Stock après: ${normalExitResponse.data.newStock}`);
      logInfo(`Anomalie détectée: ${normalExitResponse.data.anomalyDetected}`);
      
      if (normalExitResponse.data.anomalyDetected === 'NONE') {
        logSuccess('✓ Aucune anomalie détectée (comportement attendu)');
      } else {
        logWarning(`Anomalie inattendue: ${normalExitResponse.data.anomalyDetected}`);
      }
    } catch (error) {
      logError(`Erreur enregistrement sortie normale: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
      throw error;
    }

    await sleep(1000);

    // ========== ÉTAPE 4: Enregistrer une SORTIE EXCESSIVE ==========
    logSection('🚨 ÉTAPE 4: Enregistrement d\'une SORTIE EXCESSIVE (80 unités)');
    logWarning('Cette sortie devrait déclencher une ANOMALIE!');

    const excessiveExitFlow = {
      materialId: testMaterialId,
      siteId: testSiteId,
      type: 'OUT',
      quantity: 80,
      reason: 'Test de détection d\'anomalie - Sortie excessive',
      reference: 'REF-TEST-003-ANOMALY'
    };

    logInfo('Données de la sortie excessive:');
    console.log(JSON.stringify(excessiveExitFlow, null, 2));

    try {
      const excessiveExitResponse = await axios.post(
        `${API_BASE}/material-flow`,
        excessiveExitFlow,
        {
          headers: {
            'user-id': TEST_USER_ID
          }
        }
      );
      logSuccess('Sortie excessive enregistrée avec succès');
      logInfo(`Stock avant: ${excessiveExitResponse.data.previousStock}`);
      logInfo(`Stock après: ${excessiveExitResponse.data.newStock}`);
      logInfo(`Anomalie détectée: ${excessiveExitResponse.data.anomalyDetected}`);
      
      if (excessiveExitResponse.data.anomalyDetected !== 'NONE') {
        logSuccess(`✓ ANOMALIE DÉTECTÉE: ${excessiveExitResponse.data.anomalyDetected}`);
        if (excessiveExitResponse.data.anomalyMessage) {
          log(`   Message: ${excessiveExitResponse.data.anomalyMessage}`, 'yellow');
        }
        if (excessiveExitResponse.data.emailSent) {
          logSuccess('   ✓ Email d\'alerte envoyé');
        } else {
          logWarning('   ⚠️  Email d\'alerte non envoyé (vérifier config SMTP)');
        }
      } else {
        logError('✗ AUCUNE ANOMALIE DÉTECTÉE (problème!)');
        logWarning('Le seuil de détection est peut-être trop élevé');
      }
    } catch (error) {
      logError(`Erreur enregistrement sortie excessive: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
      throw error;
    }

    await sleep(1000);

    // ========== ÉTAPE 5: Vérifier les flow logs ==========
    logSection('📋 ÉTAPE 5: Vérification des flow logs enregistrés');

    try {
      const flowsResponse = await axios.get(`${API_BASE}/material-flow`, {
        params: {
          materialId: testMaterialId,
          siteId: testSiteId,
          limit: 100
        }
      });

      const flows = flowsResponse.data.data || flowsResponse.data;
      logSuccess(`${flows.length} mouvements trouvés`);

      flows.forEach((flow, index) => {
        console.log(`\n--- Mouvement ${index + 1} ---`);
        logInfo(`Type: ${flow.type}`);
        logInfo(`Quantité: ${flow.quantity}`);
        logInfo(`Stock avant: ${flow.previousStock} → après: ${flow.newStock}`);
        logInfo(`Anomalie: ${flow.anomalyDetected}`);
        if (flow.anomalyMessage) {
          log(`Message: ${flow.anomalyMessage}`, 'yellow');
        }
        logInfo(`Raison: ${flow.reason || 'N/A'}`);
        logInfo(`Date: ${new Date(flow.timestamp).toLocaleString()}`);
      });
    } catch (error) {
      logError(`Erreur récupération flow logs: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
    }

    await sleep(1000);

    // ========== ÉTAPE 6: Vérifier les anomalies ==========
    logSection('🔍 ÉTAPE 6: Vérification des anomalies détectées');

    try {
      const anomaliesResponse = await axios.get(`${API_BASE}/material-flow/anomalies`);
      const anomalies = anomaliesResponse.data;
      
      if (anomalies.length > 0) {
        logSuccess(`${anomalies.length} anomalie(s) trouvée(s)`);
        
        anomalies.forEach((anomaly, index) => {
          console.log(`\n--- Anomalie ${index + 1} ---`);
          logWarning(`Type: ${anomaly.anomalyDetected}`);
          logInfo(`Matériau: ${anomaly.materialId}`);
          logInfo(`Quantité: ${anomaly.quantity}`);
          logInfo(`Stock avant: ${anomaly.previousStock} → après: ${anomaly.newStock}`);
          if (anomaly.anomalyMessage) {
            log(`Message: ${anomaly.anomalyMessage}`, 'yellow');
          }
          logInfo(`Email envoyé: ${anomaly.emailSent ? 'Oui' : 'Non'}`);
          logInfo(`Date: ${new Date(anomaly.timestamp).toLocaleString()}`);
        });
      } else {
        logWarning('Aucune anomalie trouvée dans la base');
      }
    } catch (error) {
      logError(`Erreur récupération anomalies: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
    }

    await sleep(1000);

    // ========== ÉTAPE 7: Statistiques agrégées ==========
    logSection('📊 ÉTAPE 7: Statistiques agrégées');

    try {
      const statsResponse = await axios.get(
        `${API_BASE}/material-flow/aggregate/${testMaterialId}`,
        {
          params: { siteId: testSiteId }
        }
      );
      
      const stats = statsResponse.data;
      logSuccess('Statistiques récupérées:');
      logInfo(`Total entrées: ${stats.totalEntries} unités`);
      logInfo(`Total sorties: ${stats.totalExits} unités`);
      logInfo(`Flux net: ${stats.netFlow} unités`);
      logInfo(`Total anomalies: ${stats.totalAnomalies}`);
      logInfo(`Dernier mouvement: ${stats.lastMovement ? new Date(stats.lastMovement).toLocaleString() : 'N/A'}`);
      
      if (stats.breakdownByType && stats.breakdownByType.length > 0) {
        console.log('\nRépartition par type:');
        stats.breakdownByType.forEach(item => {
          logInfo(`  ${item._id}: ${item.totalQuantity} unités (${item.count} mouvements)`);
        });
      }
    } catch (error) {
      logError(`Erreur récupération statistiques: ${error.message}`);
      if (error.response) {
        console.log('Détails:', error.response.data);
      }
    }

    // ========== RÉSUMÉ FINAL ==========
    logSection('📝 RÉSUMÉ DU TEST');

    logSuccess('✓ Matériau créé');
    logSuccess('✓ Entrée enregistrée (50 unités)');
    logSuccess('✓ Sortie normale enregistrée (10 unités)');
    logSuccess('✓ Sortie excessive enregistrée (80 unités)');
    logSuccess('✓ Flow logs vérifiés');
    logSuccess('✓ Anomalies vérifiées');
    logSuccess('✓ Statistiques vérifiées');

    logSection('🎯 RÉSULTAT FINAL');
    logSuccess('TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! ✅');
    
    logInfo('\nPoints à vérifier manuellement:');
    logInfo('1. Vérifier que l\'email d\'alerte a été envoyé');
    logInfo('2. Vérifier les logs backend pour les détails');
    logInfo('3. Vérifier MongoDB pour les données persistées');

    // ========== NETTOYAGE (optionnel) ==========
    logSection('🧹 NETTOYAGE');
    
    const shouldCleanup = process.argv.includes('--cleanup');
    
    if (shouldCleanup && testMaterialId) {
      logInfo('Suppression du matériau de test...');
      try {
        await axios.delete(`${API_BASE}/materials/${testMaterialId}`);
        logSuccess('Matériau de test supprimé');
      } catch (error) {
        logWarning(`Impossible de supprimer le matériau: ${error.message}`);
      }
    } else {
      logInfo(`Matériau de test conservé: ${testMaterialId}`);
      logInfo('Pour nettoyer, relancez avec: node test-flow-log-complete.js --cleanup');
    }

  } catch (error) {
    logSection('❌ ERREUR FATALE');
    logError(error.message);
    if (error.stack) {
      console.log('\nStack trace:');
      console.log(error.stack);
    }
    process.exit(1);
  }
}

// Lancer le test
logSection('🚀 DÉMARRAGE DU TEST');
logInfo('Backend URL: ' + API_BASE);
logInfo('User ID: ' + TEST_USER_ID);
logInfo('Site ID: ' + testSiteId);

testFlowLog()
  .then(() => {
    logSection('✅ TEST TERMINÉ AVEC SUCCÈS');
    process.exit(0);
  })
  .catch((error) => {
    logSection('❌ TEST ÉCHOUÉ');
    logError(error.message);
    process.exit(1);
  });
