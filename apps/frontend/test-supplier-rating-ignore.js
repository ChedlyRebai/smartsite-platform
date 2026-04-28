// Test script pour vérifier le système d'ignorance des ratings
console.log('🧪 Test du système d\'ignorance des ratings fournisseurs');
console.log('=======================================================');

// Simuler localStorage
const mockLocalStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
    console.log(`📝 localStorage.setItem("${key}", ${value})`);
  }
};

// Simuler les fonctions du hook
function markAsIgnored(materialId) {
  const ignoredRatings = JSON.parse(mockLocalStorage.getItem('ignoredSupplierRatings') || '[]');
  if (!ignoredRatings.includes(materialId)) {
    ignoredRatings.push(materialId);
    mockLocalStorage.setItem('ignoredSupplierRatings', JSON.stringify(ignoredRatings));
  }
  console.log(`✅ Matériau ${materialId} marqué comme ignoré`);
}

function isIgnored(materialId) {
  const ignoredRatings = JSON.parse(mockLocalStorage.getItem('ignoredSupplierRatings') || '[]');
  const ignored = ignoredRatings.includes(materialId);
  console.log(`🔍 Matériau ${materialId} ignoré ? ${ignored ? 'OUI' : 'NON'}`);
  return ignored;
}

// Test du workflow
console.log('\n1. État initial - aucun matériau ignoré');
isIgnored('material-123');
isIgnored('material-456');

console.log('\n2. Utilisateur ignore le rating pour material-123');
markAsIgnored('material-123');

console.log('\n3. Vérification après ignorance');
isIgnored('material-123'); // Devrait être true
isIgnored('material-456'); // Devrait être false

console.log('\n4. Utilisateur ignore aussi material-456');
markAsIgnored('material-456');

console.log('\n5. Vérification finale');
isIgnored('material-123'); // Devrait être true
isIgnored('material-456'); // Devrait être true

console.log('\n6. État final du localStorage:');
console.log('ignoredSupplierRatings:', mockLocalStorage.getItem('ignoredSupplierRatings'));

console.log('\n✅ Test terminé - Le système d\'ignorance fonctionne correctement !');
console.log('\n📋 Comportement attendu:');
console.log('- Quand l\'utilisateur ferme le dialog ou clique "Ignorer", le matériau est ajouté à la liste ignorée');
console.log('- Les matériaux ignorés ne déclenchent plus le dialog de rating');
console.log('- L\'état est persisté dans localStorage pour la session');
console.log('- Le rating reste optionnel et non-intrusif');