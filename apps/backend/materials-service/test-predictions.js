const axios = require('axios');

const BASE_URL = 'http://localhost:3005/api/materials';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testPredictions() {
  console.log(`\n${colors.bright}${colors.cyan}=== TEST PRÉDICTIONS IA - RUPTURE DE STOCK ===${colors.reset}\n`);

  try {
    // 1. Récupérer les prédictions
    console.log(`${colors.blue}📊 Récupération des prédictions...${colors.reset}`);
    const response = await axios.get(`${BASE_URL}/predictions`);
    
    if (response.data && response.data.length > 0) {
      console.log(`${colors.green}✅ ${response.data.length} prédictions récupérées${colors.reset}\n`);
      
      // Afficher les prédictions sous forme de tableau
      console.log(`${colors.bright}┌─────────────────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
      console.log(`${colors.bright}│ Matériau                    │ Stock │ Conso/h │ Heures restantes │ Jours │ Statut    │${colors.reset}`);
      console.log(`${colors.bright}├─────────────────────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
      
      response.data.slice(0, 15).forEach(pred => {
        const name = pred.materialName.substring(0, 25).padEnd(25);
        const stock = String(pred.currentStock).padStart(5);
        const consumption = String(pred.hourlyConsumption).padStart(7);
        const hours = pred.hoursRemaining > 9999 
          ? '  ∞    '.padStart(16)
          : String(pred.hoursRemaining).padStart(16);
        const days = pred.daysRemaining > 999 
          ? '  ∞  '.padStart(5)
          : String(pred.daysRemaining).padStart(5);
        
        let statusColor = colors.reset;
        let statusText = pred.status.padEnd(9);
        
        if (pred.status === 'critical') {
          statusColor = colors.red;
          statusText = '🔴 CRITIQUE';
        } else if (pred.status === 'warning') {
          statusColor = colors.yellow;
          statusText = '⚠️  ALERTE ';
        } else if (pred.status === 'attention') {
          statusColor = colors.yellow;
          statusText = '⚡ ATTENTION';
        } else if (pred.status === 'stable') {
          statusColor = colors.green;
          statusText = '✅ STABLE  ';
        }
        
        console.log(`│ ${name} │ ${stock} │ ${consumption} │ ${hours} │ ${days} │ ${statusColor}${statusText}${colors.reset} │`);
      });
      
      console.log(`${colors.bright}└─────────────────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`);
      
      // Statistiques
      const critical = response.data.filter(p => p.status === 'critical').length;
      const warning = response.data.filter(p => p.status === 'warning').length;
      const attention = response.data.filter(p => p.status === 'attention').length;
      const stable = response.data.filter(p => p.status === 'stable').length;
      
      console.log(`${colors.bright}📈 STATISTIQUES:${colors.reset}`);
      console.log(`   ${colors.red}🔴 Critiques (< 24h):${colors.reset} ${critical}`);
      console.log(`   ${colors.yellow}⚠️  Alertes (< 72h):${colors.reset} ${warning}`);
      console.log(`   ${colors.yellow}⚡ Attention (< 7j):${colors.reset} ${attention}`);
      console.log(`   ${colors.green}✅ Stables:${colors.reset} ${stable}`);
      
      // Afficher les 3 matériaux les plus critiques
      if (critical > 0 || warning > 0) {
        console.log(`\n${colors.bright}${colors.red}⚠️  MATÉRIAUX NÉCESSITANT UNE ATTENTION IMMÉDIATE:${colors.reset}`);
        response.data
          .filter(p => p.status === 'critical' || p.status === 'warning')
          .slice(0, 5)
          .forEach((pred, index) => {
            console.log(`\n${index + 1}. ${colors.bright}${pred.materialName}${colors.reset} (${pred.materialCode})`);
            console.log(`   Stock actuel: ${pred.currentStock} unités`);
            console.log(`   Consommation: ${pred.hourlyConsumption} unités/heure`);
            console.log(`   ${colors.red}⏰ Rupture estimée dans: ${pred.hoursRemaining}h (${pred.daysRemaining} jours)${colors.reset}`);
            if (pred.estimatedStockoutDate) {
              console.log(`   📅 Date estimée: ${new Date(pred.estimatedStockoutDate).toLocaleString('fr-FR')}`);
            }
            console.log(`   🎯 Confiance: ${(pred.confidence * 100).toFixed(0)}% (${pred.dataPoints} points de données)`);
          });
      }
      
      console.log(`\n${colors.green}✅ Test des prédictions réussi!${colors.reset}\n`);
      
      // Exemple de réponse JSON
      console.log(`${colors.bright}📋 Exemple de réponse JSON (premier élément):${colors.reset}`);
      console.log(JSON.stringify(response.data[0], null, 2));
      
    } else {
      console.log(`${colors.yellow}⚠️  Aucune prédiction disponible${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Erreur:${colors.reset}`, error.message);
    if (error.response) {
      console.error(`${colors.red}Détails:${colors.reset}`, error.response.data);
    }
  }
}

// Exécuter le test
testPredictions();
