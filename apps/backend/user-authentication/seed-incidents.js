// Script seed pour créer 3 utilisateurs de test avec différentes permissions
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
    console.log('✅ Connecté à MongoDB\n');

    const User = mongoose.model('User', userSchema, 'users');
    const Role = mongoose.model('Role', roleSchema, 'roles');

    // Créer les rôles nécessaires
    const roles = {
      client: null,
      qhse: null,
      projectManager: null,
    };

    console.log('📋 Création/Récupération des rôles...');
    for (const [key, _] of Object.entries(roles)) {
      let role;
      if (key === 'client') {
        role = await Role.findOne({ name: 'client' });
        if (!role) {
          role = await Role.create({
            name: 'client',
            description: 'Client (Lecture seule)',
          });
          console.log('✅ Rôle "client" créé');
        } else {
          console.log('ℹ️  Rôle "client" existe déjà');
        }
      } else if (key === 'qhse') {
        role = await Role.findOne({ name: 'qhse_manager' });
        if (!role) {
          role = await Role.create({
            name: 'qhse_manager',
            description: 'Responsable QHSE (Lecture, Écriture, Traitement)',
          });
          console.log('✅ Rôle "qhse_manager" créé');
        } else {
          console.log('ℹ️  Rôle "qhse_manager" existe déjà');
        }
      } else if (key === 'projectManager') {
        role = await Role.findOne({ name: 'project_manager' });
        if (!role) {
          role = await Role.create({
            name: 'project_manager',
            description: 'Chef de Projet (Lecture, Écriture, Traitement)',
          });
          console.log('✅ Rôle "project_manager" créé');
        } else {
          console.log('ℹ️  Rôle "project_manager" existe déjà');
        }
      }
      roles[key] = role;
    }

    console.log('\n📝 Création des utilisateurs de test...\n');

    // 1️⃣ UTILISATEUR LECTURE SEULE (Client)
    let userLecture = await User.findOne({ cin: 'lecture001' });
    if (!userLecture) {
      const hashedPassword = await bcrypt.hash('lecture123', 10);
      userLecture = await User.create({
        firstname: 'Jean',
        lastname: 'Client',
        cin: 'lecture001',
        motDePasse: hashedPassword,
        role: roles.client._id,
        estActif: true,
        telephone: '+216 99 111 111',
        departement: 'Client',
      });
      console.log('✅ Utilisateur LECTURE créé');
    } else {
      console.log('ℹ️  Utilisateur LECTURE existe déjà');
    }

    // 2️⃣ UTILISATEUR LECTURE & ÉCRITURE (QHSE Manager)
    let userEcriture = await User.findOne({ cin: 'ecriture001' });
    if (!userEcriture) {
      const hashedPassword = await bcrypt.hash('ecriture123', 10);
      userEcriture = await User.create({
        firstname: 'Marie',
        lastname: 'QHSE',
        cin: 'ecriture001',
        motDePasse: hashedPassword,
        role: roles.qhse._id,
        estActif: true,
        telephone: '+216 99 222 222',
        departement: 'QHSE',
        certifications: ['ISO 45001', 'ISO 14001'],
      });
      console.log('✅ Utilisateur LECTURE & ÉCRITURE créé');
    } else {
      console.log('ℹ️  Utilisateur LECTURE & ÉCRITURE existe déjà');
    }

    // 3️⃣ UTILISATEUR LECTURE, ÉCRITURE & TRAITEMENT (Project Manager)
    let userTraitement = await User.findOne({ cin: 'traitement001' });
    if (!userTraitement) {
      const hashedPassword = await bcrypt.hash('traitement123', 10);
      userTraitement = await User.create({
        firstname: 'Ahmed',
        lastname: 'Chef Projet',
        cin: 'traitement001',
        motDePasse: hashedPassword,
        role: roles.projectManager._id,
        estActif: true,
        telephone: '+216 99 333 333',
        departement: 'Gestion de Projets',
      });
      console.log('✅ Utilisateur LECTURE, ÉCRITURE & TRAITEMENT créé');
    } else {
      console.log('ℹ️  Utilisateur LECTURE, ÉCRITURE & TRAITEMENT existe déjà');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 IDENTIFIANTS DE CONNEXION POUR LES TESTS');
    console.log('='.repeat(60) + '\n');

    console.log('1️⃣  UTILISATEUR LECTURE SEULE (Client)');
    console.log('   ┌─ Permissions: Voir les incidents uniquement');
    console.log('   ├─ CIN: lecture001');
    console.log('   └─ Mot de passe: lecture123\n');

    console.log('2️⃣  UTILISATEUR LECTURE & ÉCRITURE (QHSE Manager)');
    console.log('   ┌─ Permissions: Voir + Créer des incidents');
    console.log('   ├─ CIN: ecriture001');
    console.log('   └─ Mot de passe: ecriture123\n');

    console.log(
      '3️⃣  UTILISATEUR LECTURE, ÉCRITURE & TRAITEMENT (Chef de Projet)',
    );
    console.log('   ┌─ Permissions: Voir + Créer + Résoudre les incidents');
    console.log('   ├─ CIN: traitement001');
    console.log('   └─ Mot de passe: traitement123\n');

    console.log('='.repeat(60));
    console.log('🎯 BONUS: Utilisateur Admin (déjà créé)');
    console.log('   ├─ CIN: test123');
    console.log('   └─ Mot de passe: password123');
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seed();
