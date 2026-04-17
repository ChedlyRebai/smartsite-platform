import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
  @Prop()
  href: string;
  @Prop()
  access: boolean;
  @Prop()
  create: boolean;
  @Prop()
  delete: boolean;
  @Prop()
  update: boolean;

  @Prop({ trim: true })
  description?: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
