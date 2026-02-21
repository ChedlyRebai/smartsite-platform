// Script seed pour créer un utilisateur de test
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URL =
  process.env.MONGO_URL || 'mongodb://localhost:27017/smartsite';

const userSchema = new mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    cin: { type: String, unique: true },
    motDePasse: String,
    role: mongoose.Schema.Types.ObjectId,
    estActif: Boolean,
    telephone: String,
    departement: String,
    certifications: [String],
  },
  { timestamps: true },
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    description: String,
  },
  { timestamps: true },
);

async function seed() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connecté à MongoDB');

    const User = mongoose.model('User', userSchema, 'users');
    const Role = mongoose.model('Role', roleSchema, 'roles');

    // Créer un rôle par défaut
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Administrateur du système',
      });
      console.log('✅ Rôle admin créé');
    } else {
      console.log('ℹ️  Rôle admin existe déjà');
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ cin: 'test123' });
    if (user) {
      console.log('ℹ️  Utilisateur de test existe déjà');
    } else {
      // Hash le mot de passe
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Créer l'utilisateur
      user = await User.create({
        firstname: 'Test',
        lastname: 'User',
        cin: 'test123',
        motDePasse: hashedPassword,
        role: adminRole._id,
        estActif: true,
        telephone: '+216 99 123 456',
        departement: 'IT',
      });
      console.log('✅ Utilisateur de test créé');
    }

    console.log('\n📋 Identifiants de connexion:');
    console.log('------------------------');
    console.log('CIN: test123');
    console.log('Mot de passe: password123');
    console.log('------------------------\n');

    await mongoose.connection.close();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seed();
