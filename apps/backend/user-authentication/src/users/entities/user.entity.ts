// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/entities/role.entity';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstname: string;

  @Prop({ required: true, trim: true })
  lastname: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  cin: string;

  @Prop({ required: true })
  motDePasse: string;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role: Types.ObjectId;

  @Prop({ default: true })
  estActif: boolean;

  @Prop()
  telephone?: string;

  @Prop()
  departement?: string;

  @Prop([String])
  certifications?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to ensure roles is always an array of ObjectIds or empty
UserSchema.pre('save', function (next) {
  // if (this.roles && !Array.isArray(this.roles)) {
  //   this.roles = "";
  // }
  // if (this.roles && this.roles.length > 0) {
  //   this.roles = this.roles.filter((role) => role && typeof role !== 'string') as Types.ObjectId[] | Role[];
  // }
  next;
});
