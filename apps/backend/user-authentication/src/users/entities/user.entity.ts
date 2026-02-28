// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/entities/role.entity';

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
  telephone?: string;

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

<<<<<<< HEAD
  @Prop({ default: false })
  passwordChnage: boolean;

  @Prop({ default: true })
  firstLogin: boolean;

=======
>>>>>>> 9c0a5749 (feat: implement password reset functionality with forgot password and resend code features)
  @Prop()
  passwordResetCode?: string;

  @Prop()
  passwordResetCodeExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook placeholder (sync hook, nothing to do for now)
UserSchema.pre('save', function () {
  // if (this.roles && !Array.isArray(this.roles)) {
  //   this.roles = "";
  // }
  // if (this.roles && this.roles.length > 0) {
  //   this.roles = this.roles.filter((role) => role && typeof role !== 'string') as Types.ObjectId[] | Role[];
  // }
});
