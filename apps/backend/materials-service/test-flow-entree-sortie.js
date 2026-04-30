const axios = require('axios');

const BASE_URL = 'http://localhost:3005/api/material-flow';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

async function testFlowEntreeSortie() {
  console.log(`\n${colors.bright}${colors.cyan}=== TEST FLOW LOG - ENTRÉE/SORTIE ===${colors.reset}\n`);

  try {
    // 1. Récupérer les flux enrichis
    console.log(`${colors.blue}📊 Récupération des flux enrichis avec stockEntree/stockSortie...${colors.reset}`);
    const response = await axios.get(`${BASE_URL}/enriched`, {
      params: {
        limit: 20,
        page: 1,
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log(`${colors.green}✅ ${response.data.data.length} flux récupérés (Total: ${response.data.total})${colors.reset}\n`);
      
      // Afficher les flux sous forme de tableau
      console.log(`${colors.bright}┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
      console.log(`${colors.bright}│ Matériau              │ Type │ Quantité │ Stock Entrée │ Stock Sortie │ Stock Actuel │ Date/Heure      │${colors.reset}`);
      console.log(`${colors.bright}├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
      
      response.data.data.forEach(flow => {
        const name = (flow.materialName || 'N/A').substring(0, 20).padEnd(20);
        const type = flow.type.padEnd(4);
        const quantity = String(flow.quantity || 0).padStart(8);
        const stockEntree = String(flow.stockEntree || 0).padStart(12);
        const stockSortie = String(flow.stockSortie || 0).padStart(12);
        const currentStock = String(flow.currentStock || 0).padStart(12);
        const date = new Date(flow.timestamp).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).padEnd(15);
        
        let typeColor = colors.reset;
        if (flow.type === 'IN') {
          typeColor = colors.green;
        } else if (flow.type === 'OUT') {
          typeColor = colors.red;
        } else if (flow.type === 'DAMAGE') {
          typeColor = colors.yellow;
        }
        
        console.log(`│ ${name} │ ${typeColor}${type}${colors.reset} │ ${quantity} │ ${colors.green}${stockEntree}${colors.reset} │ ${colors.red}${stockSortie}${colors.reset} │ ${currentStock} │ ${date} │`);
      });
      
      console.log(`${colors.bright}└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`);
      
      // Statistiques
      const totalEntrees = response.data.data.reduce((sum, f) => sum + (f.stockEntree || 0), 0);
      const totalSorties = response.data.data.reduce((sum, f) => sum + (f.stockSortie || 0), 0);
      const flowsIN = response.data.data.filter(f => f.type === 'IN').length;
      const flowsOUT = response.data.data.filter(f => f.type === 'OUT').length;
      const flowsOther = response.data.data.filter(f => !['IN', 'OUT'].includes(f.type)).length;
      
      console.log(`${colors.bright}📈 STATISTIQUES:${colors.reset}`);
      console.log(`   ${colors.green}📥 Total Stock Entrée:${colors.reset} ${totalEntrees} unités`);
      console.log(`   ${colors.red}📤 Total Stock Sortie:${colors.reset} ${totalSorties} unités`);
      console.log(`   ${colors.cyan}📊 Solde:${colors.reset} ${totalEntrees - totalSorties} unités`);
      console.log(`\n   ${colors.green}✅ Mouvements IN:${colors.reset} ${flowsIN}`);
      console.log(`   ${colors.red}❌ Mouvements OUT:${colors.reset} ${flowsOUT}`);
      console.log(`   ${colors.yellow}⚡ Autres mouvements:${colors.reset} ${flowsOther}`);
      
      // Afficher un exemple détaillé
      console.log(`\n${colors.bright}📋 Exemple de flux détaillé (premier élément):${colors.reset}`);
      const example = response.data.data[0];
      console.log(`${colors.cyan}Matériau:${colors.reset} ${example.materialName} (${example.materialCode})`);
      console.log(`${colors.cyan}Type de mouvement:${colors.reset} ${example.type}`);
      console.log(`${colors.cyan}Quantité du mouvement:${colors.reset} ${example.quantity}`);
      console.log(`${colors.green}Stock Entrée total:${colors.reset} ${example.stockEntree || 0}`);
      console.log(`${colors.red}Stock Sortie total:${colors.reset} ${example.stockSortie || 0}`);
      console.log(`${colors.cyan}Stock actuel:${colors.reset} ${example.currentStock || 0}`);
      console.log(`${colors.cyan}Stock précédent:${colors.reset} ${example.previousStock || 0}`);
      console.log(`${colors.cyan}Nouveau stock:${colors.reset} ${example.newStock || 0}`);
      console.log(`${colors.cyan}Site:${colors.reset} ${example.siteName}`);
      console.log(`${colors.cyan}Utilisateur:${colors.reset} ${example.userName}`);
      console.log(`${colors.cyan}Date:${colors.reset} ${new Date(example.timestamp).toLocaleString('fr-FR')}`);
      if (example.reason) {
        console.log(`${colors.cyan}Raison:${colors.reset} ${example.reason}`);
      }
      if (example.anomalyDetected && example.anomalyDetected !== 'NONE') {
        console.log(`${colors.yellow}⚠️  Anomalie détectée:${colors.reset} ${example.anomalyDetected}`);
        if (example.anomalyMessage) {
          console.log(`${colors.yellow}   Message:${colors.reset} ${example.anomalyMessage}`);
        }
      }
      
      console.log(`\n${colors.green}✅ Test réussi! Les champs stockEntree et stockSortie sont bien présents.${colors.reset}\n`);
      
      // Exemple de réponse JSON complète
      console.log(`${colors.bright}📄 Structure JSON complète (premier élément):${colors.reset}`);
      console.log(JSON.stringify(example, null, 2));
      
    } else {
      console.log(`${colors.yellow}⚠️  Aucun flux disponible${colors.reset}`);
      console.log(`${colors.cyan}💡 Conseil: Créez des mouvements de stock pour voir les données${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Erreur:${colors.reset}`, error.message);
    if (error.response) {
      console.error(`${colors.red}Détails:${colors.reset}`, error.response.data);
    }
  }
}

// Exécuter le test
testFlowEntreeSortie();
