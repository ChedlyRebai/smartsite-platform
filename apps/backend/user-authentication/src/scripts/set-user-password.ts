import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function setUserPassword() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  // Get CIN and password from command line arguments
  const cin = process.argv[2];
  const newPassword = process.argv[3];

  if (!cin || !newPassword) {
    console.error(
      '❌ Usage: npx ts-node src/scripts/set-user-password.ts <CIN> <PASSWORD>',
    );
    console.error(
      '   Example: npx ts-node src/scripts/set-user-password.ts 14655641 MyPassword123!',
    );
    process.exit(1);
  }

  console.log(`🔍 Looking for user with CIN: ${cin}`);

  const user = await userModel.findOne({ cin }).exec();

  if (!user) {
    console.error(`❌ User with CIN "${cin}" not found`);
    await app.close();
    process.exit(1);
  }

  console.log(
    `✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`,
  );
  console.log(`🔐 Setting new password...`);

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password
  await userModel.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        firstLogin: true, // Keep firstLogin true so they'll be prompted to change it
        passwordChnage: false,
      },
    },
  );

  console.log(`✅ Password updated successfully for user ${cin}`);
  console.log(`📝 User can now login with:`);
  console.log(`   CIN: ${cin}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   (User will be prompted to change password on first login)`);

  await app.close();
}

setUserPassword()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
