const axios = require('axios');

const BASE_URL = 'http://localhost:3005/api/materials';

async function debugPredictions() {
  console.log('\n🔍 DEBUG PRÉDICTIONS IA\n');

  try {
    // 1. Tester l'endpoint predictions
    console.log('📊 Test endpoint /predictions...');
    const response = await axios.get(`${BASE_URL}/predictions`);
    
    console.log(`✅ Réponse reçue: ${response.data.length} prédictions\n`);
    
    if (response.data.length > 0) {
      // Afficher les 3 premières prédictions en détail
      console.log('📋 DÉTAILS DES PRÉDICTIONS:\n');
      response.data.slice(0, 3).forEach((pred, index) => {
        console.log(`\n${index + 1}. ${pred.materialName} (${pred.materialCode})`);
        console.log(`   materialId: ${pred.materialId}`);
        console.log(`   currentStock: ${pred.currentStock}`);
        console.log(`   hourlyConsumption: ${pred.hourlyConsumption}`);
        console.log(`   hoursRemaining: ${pred.hoursRemaining}`);
        console.log(`   daysRemaining: ${pred.daysRemaining}`);
        console.log(`   status: ${pred.status}`);
        console.log(`   alertLevel: ${pred.alertLevel}`);
        console.log(`   confidence: ${pred.confidence}`);
        console.log(`   dataPoints: ${pred.dataPoints}`);
        if (pred.estimatedStockoutDate) {
          console.log(`   estimatedStockoutDate: ${new Date(pred.estimatedStockoutDate).toLocaleString('fr-FR')}`);
        }
      });
      
      // Vérifier les problèmes potentiels
      console.log('\n\n⚠️  ANALYSE DES PROBLÈMES:\n');
      
      const withInfiniteHours = response.data.filter(p => p.hoursRemaining > 100000);
      if (withInfiniteHours.length > 0) {
        console.log(`❌ ${withInfiniteHours.length} matériaux avec hoursRemaining infini (pas de consommation détectée)`);
      }
      
      const withZeroConsumption = response.data.filter(p => p.hourlyConsumption === 0);
      if (withZeroConsumption.length > 0) {
        console.log(`❌ ${withZeroConsumption.length} matériaux avec consommation horaire = 0`);
      }
      
      const withLowConfidence = response.data.filter(p => p.confidence < 0.6);
      if (withLowConfidence.length > 0) {
        console.log(`⚠️  ${withLowConfidence.length} matériaux avec confiance < 60%`);
      }
      
      const withFewDataPoints = response.data.filter(p => p.dataPoints < 5);
      if (withFewDataPoints.length > 0) {
        console.log(`⚠️  ${withFewDataPoints.length} matériaux avec < 5 points de données`);
      }
      
      // Statistiques
      console.log('\n\n📊 STATISTIQUES:\n');
      const critical = response.data.filter(p => p.status === 'critical').length;
      const warning = response.data.filter(p => p.status === 'warning').length;
      const attention = response.data.filter(p => p.status === 'attention').length;
      const stable = response.data.filter(p => p.status === 'stable').length;
      
      console.log(`🔴 Critiques: ${critical}`);
      console.log(`🟡 Alertes: ${warning}`);
      console.log(`🟠 Attention: ${attention}`);
      console.log(`🟢 Stables: ${stable}`);
      
      // Vérifier la structure de données pour le frontend
      console.log('\n\n🔧 VÉRIFICATION STRUCTURE POUR FRONTEND:\n');
      const firstPred = response.data[0];
      const requiredFields = ['materialId', 'materialName', 'currentStock', 'hourlyConsumption', 'hoursRemaining', 'status'];
      const missingFields = requiredFields.filter(field => !(field in firstPred));
      
      if (missingFields.length > 0) {
        console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
      } else {
        console.log(`✅ Tous les champs requis sont présents`);
      }
      
      // Format attendu par le frontend
      console.log('\n\n📄 FORMAT ATTENDU PAR LE FRONTEND:\n');
      console.log(JSON.stringify({
        materialId: firstPred.materialId,
        materialName: firstPred.materialName,
        currentStock: firstPred.currentStock,
        consumptionRate: firstPred.hourlyConsumption,
        hoursToLowStock: firstPred.hoursRemaining * 0.7,
        hoursToOutOfStock: firstPred.hoursRemaining,
        status: firstPred.status === 'critical' ? 'critical' : firstPred.status === 'warning' ? 'warning' : 'safe',
        recommendedOrderQuantity: firstPred.currentStock * 2,
        predictionModelUsed: firstPred.confidence > 0.7,
        confidence: firstPred.confidence,
        message: `Rupture prévue dans ${firstPred.hoursRemaining}h (${firstPred.daysRemaining}j)`
      }, null, 2));
      
    } else {
      console.log('❌ Aucune prédiction retournée');
      console.log('\n💡 SOLUTIONS POSSIBLES:');
      console.log('1. Vérifier que des matériaux existent dans la base de données');
      console.log('2. Vérifier que ConsumptionHistory contient des données');
      console.log('3. Créer des mouvements de stock pour générer des données');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('\n💡 VÉRIFICATIONS:');
    console.log('1. Le service materials-service est-il démarré sur le port 3005?');
    console.log('2. MongoDB est-il accessible?');
    console.log('3. Y a-t-il des erreurs dans les logs du service?');
  }
}

debugPredictions();
