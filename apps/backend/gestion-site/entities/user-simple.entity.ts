import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class UserSimple extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  cin: string;

  @Prop()
  email: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  address: string;

  @Prop({ default: true })
  isActif: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  role: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site', default: null })
  assignedSite?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserSimple', default: null })
  manager?: Types.ObjectId;

  @Prop({ type: String, default: 'worker' })
  responsibilities?: string;
}

export const UserSimpleSchema = SchemaFactory.createForClass(UserSimple);
