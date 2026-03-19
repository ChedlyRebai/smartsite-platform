// src/roles/schemas/role.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Permission } from '../../permissions/entities/permission.entity';

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string; 
  @Prop()
  description: string; 

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions: Types.ObjectId[] | Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);