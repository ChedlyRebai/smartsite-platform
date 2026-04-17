import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

async function fixUserRoles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const roleModel = app.get<Model<Role>>(getModelToken(Role.name));

  console.log('🔍 Checking for users with string role values...');

  // Find all users
  const users = await userModel.find().lean().exec();
  console.log(`📊 Found ${users.length} users total`);

  // Role name to ObjectId mapping
  const roleMap: { [key: string]: Types.ObjectId } = {
    super_admin: new Types.ObjectId('699e1c79ccc723bcf4a61cad'),
    director: new Types.ObjectId('699e1c79ccc723bcf4a61cae'),
    project_manager: new Types.ObjectId('699e1c79ccc723bcf4a61caf'),
    site_manager: new Types.ObjectId('699e1c79ccc723bcf4a61cb0'),
    works_manager: new Types.ObjectId('699e1c79ccc723bcf4a61cb1'),
    accountant: new Types.ObjectId('699e1c79ccc723bcf4a61cb2'),
    procurement_manager: new Types.ObjectId('699e1c79ccc723bcf4a61cb3'),
    qhse_manager: new Types.ObjectId('699e1c79ccc723bcf4a61cb4'),
    client: new Types.ObjectId('699e1c79ccc723bcf4a61cb5'),
    subcontractor: new Types.ObjectId('699e1c79ccc723bcf4a61cb6'),
    user: new Types.ObjectId('699e1c79ccc723bcf4a61cb7'),
  };

  let fixedCount = 0;
  let errorCount = 0;

  for (const user of users) {
    const roleValue = user.role;

    // Check if role is a string
    if (typeof roleValue === 'string') {
      console.log(`\n⚠️  User ${user.cin} has string role: "${roleValue}"`);

      // Try to map the string to an ObjectId
      if (roleMap[roleValue]) {
        try {
          await userModel.updateOne(
            { _id: user._id },
            { $set: { role: roleMap[roleValue] } },
          );
          console.log(
            `✅ Fixed user ${user.cin}: "${roleValue}" -> ${roleMap[roleValue]}`,
          );
          fixedCount++;
        } catch (error) {
          console.error(`❌ Error fixing user ${user.cin}:`, error);
          errorCount++;
        }
      } else {
        // Try to find role by name
        const roleDoc = await roleModel.findOne({ name: roleValue }).exec();
        if (roleDoc) {
          try {
            await userModel.updateOne(
              { _id: user._id },
              { $set: { role: roleDoc._id } },
            );
            console.log(
              `✅ Fixed user ${user.cin}: "${roleValue}" -> ${roleDoc._id}`,
            );
            fixedCount++;
          } catch (error) {
            console.error(`❌ Error fixing user ${user.cin}:`, error);
            errorCount++;
          }
        } else {
          console.error(
            `❌ No role found for "${roleValue}" for user ${user.cin}`,
          );
          errorCount++;
        }
      }
    } else if (!(roleValue instanceof Types.ObjectId)) {
      console.log(
        `⚠️  User ${user.cin} has non-ObjectId role:`,
        typeof roleValue,
        roleValue,
      );
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixedCount} users`);
  console.log(`   ❌ Errors: ${errorCount} users`);
  console.log(`   📝 Total checked: ${users.length} users`);

  await app.close();
}

fixUserRoles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
