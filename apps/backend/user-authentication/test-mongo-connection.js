const mongoose = require('mongoose');
require('dotenv').config();

const testConnections = async () => {
  console.log('🔍 Test de connexion MongoDB Atlas\n');
  console.log('URI utilisée:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
  
  const uris = [
    // URI actuelle du .env
    process.env.MONGODB_URI,
    // URI simplifiée sans SSL
    'mongodb://admin:admin@ac-qxujhb0-shard-00-00.6zcerbm.mongodb.net:27017/smartsite?authSource=admin',
    // URI avec tous les shards
    'mongodb://admin:admin@ac-qxujhb0-shard-00-00.6zcerbm.mongodb.net:27017,ac-qxujhb0-shard-00-01.6zcerbm.mongodb.net:27017,ac-qxujhb0-shard-00-02.6zcerbm.mongodb.net:27017/smartsite?ssl=true&authSource=admin',
  ];

  for (let i = 0; i < uris.length; i++) {
    console.log(`\n--- Test ${i + 1}/${uris.length} ---`);
    try {
      await mongoose.connect(uris[i], {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('✅ CONNEXION RÉUSSIE !');
      console.log('URI fonctionnelle:', uris[i].replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.log('❌ Échec:', error.message);
      if (error.message.includes('Authentication failed')) {
        console.log('   → Problème: Credentials incorrects (username/password)');
      } else if (error.message.includes('Server selection timed out')) {
        console.log('   → Problème: IP non autorisée OU cluster inaccessible');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('   → Problème: DNS ou réseau');
      }
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  console.log('\n❌ Aucune URI ne fonctionne. Actions requises:');
  console.log('1. Vérifiez que votre IP est autorisée dans MongoDB Atlas (Network Access)');
  console.log('2. Vérifiez les credentials dans Database Access');
  console.log('3. Obtenez l\'URI correcte depuis Atlas: Database > Connect > Drivers');
  process.exit(1);
};

testConnections();
