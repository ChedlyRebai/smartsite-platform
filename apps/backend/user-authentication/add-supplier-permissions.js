const mongoose = require('mongoose');
require('dotenv').config();

async function addSupplierPermissions() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite';
    console.log(`📡 Connecting to MongoDB: ${mongoUri.replace(/([^:]*):([^@]*)@/, '$1:***@')}`);
    await mongoose.connect(mongoUri);
    
    const permissionsCollection = mongoose.connection.db.collection('permissions');
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Permissions à ajouter
    const newPermissions = [
      { 
        name: 'supplier-detail', 
        href: '/suppliers/:id', 
        access: true, 
        create: false, 
        update: false, 
        delete: false, 
        description: 'Supplier detail view' 
      },
      { 
        name: 'edit-supplier', 
        href: '/suppliers/:id/edit', 
        access: true, 
        create: false, 
        update: true, 
        delete: false, 
        description: 'Edit supplier' 
      }
    ];
    
    // Insérer les permissions
    const permIds = [];
    for (const perm of newPermissions) {
      const existing = await permissionsCollection.findOne({ name: perm.name });
      if (!existing) {
        const result = await permissionsCollection.insertOne({
          ...perm,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        permIds.push(result.insertedId);
        console.log('✅ Permission créée:', perm.name);
      } else {
        permIds.push(existing._id);
        console.log('ℹ️  Permission existe déjà:', perm.name);
      }
    }
    
    // Ajouter aux rôles procurement_manager et qhse_manager
    const rolesToUpdate = ['procurement_manager', 'qhse_manager'];
    for (const roleName of rolesToUpdate) {
      const role = await rolesCollection.findOne({ name: roleName });
      if (role) {
        const currentPerms = role.permissions || [];
        const updatedPerms = [...new Set([...currentPerms, ...permIds])];
        await rolesCollection.findByIdAndUpdate(role._id, { 
          permissions: updatedPerms,
          updatedAt: new Date()
        });
        console.log(`✅ Permissions ajoutées au rôle: ${roleName}`);
      } else {
        console.log(`❌ Rôle non trouvé: ${roleName}`);
      }
    }
    
    console.log('🎉 Toutes les permissions sont ajoutées!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addSupplierPermissions();
