// src/teams/schemas/team.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Team extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  site: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  teamCode?: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
