// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  cin: string;

  @Prop({ required: false }) 
  password: string;

  @Prop()
  profilePicture?: string;
  
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  connected: boolean;

  @Prop()
  preferredLanguage?: string;

  @Prop()
  projectsCount?: number;

  @Prop()
  address: string;

  @Prop({ default: true })
  isActif: boolean;

  @Prop()
  phoneNumber?: string;

  @Prop()
  departement?: string;

  @Prop()
  status?: string;

  @Prop()
  approvedBy?: string;

  @Prop()
  approvedAt?: Date;

  

  @Prop([String])
  certifications?: string[];

  @Prop()
  companyName?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationOtp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop()
  passwordResetCode?: string;

  @Prop()
  passwordResetCodeExpiresAt?: Date;

  // Team assignment fields
  @Prop({ type: Types.ObjectId, ref: 'Site', default: null })
  assignedSite?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  manager?: Types.ObjectId;

  @Prop({ type: String, default: 'worker' })
  responsibilities?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to automatically hash password before saving
UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }
  
  // Skip if password is already hashed (bcrypt hash starts with $2a$, $2b$, or $2y$)
  if (this.password && this.password.startsWith('$2')) {
    return;
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
