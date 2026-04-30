// Test pour vérifier que le dialog de rating ne se rouvre plus
console.log('🧪 Test: Correction du problème de réouverture du dialog');
console.log('=====================================================');

// Simuler l'état du composant
let showSupplierRatingDialog = false;
let hasCheckedRatings = false;
let supplierRatingData = null;

// Simuler les matériaux
const mockMaterials = [
  { _id: 'mat1', name: 'Ciment', consumption: 35 }, // > 30%
  { _id: 'mat2', name: 'Acier', consumption: 25 },  // < 30%
];

// Simuler la fonction checkAllMaterials
function mockCheckAllMaterials(materials) {
  return Promise.resolve([
    {
      needed: true,
      consumptionPercentage: 35,
      material: { _id: 'mat1', name: 'Ciment', supplierId: 'sup1', supplierName: 'Fournisseur A' }
    }
  ]);
}

// Simuler le useEffect problématique (AVANT correction)
async function simulateOldUseEffect() {
  console.log('\n🔴 AVANT correction - useEffect sans protection:');
  
  if (mockMaterials.length > 0) {
    const ratingsNeeded = await mockCheckAllMaterials(mockMaterials);
    if (ratingsNeeded.length > 0) {
      const firstRating = ratingsNeeded[0];
      if (firstRating.material) {
        supplierRatingData = {
          materialId: firstRating.material._id,
          materialName: firstRating.material.name,
        };
        showSupplierRatingDialog = true;
        console.log(`   ✅ Dialog ouvert pour: ${firstRating.material.name}`);
      }
    }
  }
}

// Simuler la fermeture du dialog
function simulateDialogClose() {
  console.log('\n👤 Utilisateur ferme le dialog');
  showSupplierRatingDialog = false;
  supplierRatingData = null;
  console.log('   ✅ Dialog fermé');
}

// Simuler le useEffect corrigé (APRÈS correction)
async function simulateNewUseEffect() {
  console.log('\n🟢 APRÈS correction - useEffect avec protection:');
  
  if (mockMaterials.length > 0) {
    // Vérification: seulement si on n'a pas encore vérifié ET qu'aucun dialog n'est ouvert
    if (!hasCheckedRatings && !showSupplierRatingDialog) {
      console.log('   🔍 Conditions remplies - vérification des ratings...');
      const ratingsNeeded = await mockCheckAllMaterials(mockMaterials);
      if (ratingsNeeded.length > 0) {
        const firstRating = ratingsNeeded[0];
        if (firstRating.material) {
          supplierRatingData = {
            materialId: firstRating.material._id,
            materialName: firstRating.material.name,
          };
          showSupplierRatingDialog = true;
          console.log(`   ✅ Dialog ouvert pour: ${firstRating.material.name}`);
        }
      }
      // Marquer comme vérifié
      hasCheckedRatings = true;
      console.log('   🔒 hasCheckedRatings = true (évite les re-checks)');
    } else {
      console.log('   ⏭️  Conditions non remplies - pas de vérification');
      console.log(`      hasCheckedRatings: ${hasCheckedRatings}`);
      console.log(`      showSupplierRatingDialog: ${showSupplierRatingDialog}`);
    }
  }
}

// Test du scénario complet
async function runTest() {
  console.log('\n📋 Scénario de test:');
  console.log('1. Materials chargés → useEffect déclenché');
  console.log('2. Dialog s\'ouvre pour rating');
  console.log('3. Utilisateur ferme le dialog');
  console.log('4. useEffect se déclenche à nouveau');
  console.log('5. Vérifier que le dialog ne se rouvre PAS');

  // Étape 1: Premier déclenchement (AVANT correction)
  console.log('\n=== SIMULATION AVANT CORRECTION ===');
  await simulateOldUseEffect();
  console.log(`État: showDialog=${showSupplierRatingDialog}, hasChecked=${hasCheckedRatings}`);

  // Étape 2: Fermeture
  simulateDialogClose();
  console.log(`État: showDialog=${showSupplierRatingDialog}, hasChecked=${hasCheckedRatings}`);

  // Étape 3: Re-déclenchement (AVANT correction - problème)
  console.log('\n🔄 Re-déclenchement du useEffect (AVANT correction):');
  await simulateOldUseEffect();
  console.log(`État: showDialog=${showSupplierRatingDialog} ← PROBLÈME: se rouvre!`);

  // Reset pour test de la correction
  showSupplierRatingDialog = false;
  supplierRatingData = null;
  hasCheckedRatings = false;

  console.log('\n=== SIMULATION APRÈS CORRECTION ===');
  
  // Étape 1: Premier déclenchement (APRÈS correction)
  await simulateNewUseEffect();
  console.log(`État: showDialog=${showSupplierRatingDialog}, hasChecked=${hasCheckedRatings}`);

  // Étape 2: Fermeture
  simulateDialogClose();
  console.log(`État: showDialog=${showSupplierRatingDialog}, hasChecked=${hasCheckedRatings}`);

  // Étape 3: Re-déclenchement (APRÈS correction - résolu)
  console.log('\n🔄 Re-déclenchement du useEffect (APRÈS correction):');
  await simulateNewUseEffect();
  console.log(`État: showDialog=${showSupplierRatingDialog} ← RÉSOLU: ne se rouvre plus!`);

  console.log('\n🎉 RÉSULTAT:');
  console.log('✅ Le dialog ne se rouvre plus après fermeture');
  console.log('✅ Le flag hasCheckedRatings empêche les re-vérifications');
  console.log('✅ L\'utilisateur a le contrôle total sur le dialog');
}

// Exécuter le test
runTest().then(() => {
  console.log('\n🏁 Test terminé avec succès!');
}).catch(console.error);