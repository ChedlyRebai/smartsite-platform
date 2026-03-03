import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'teams' })
export class Team extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  site: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true })
  teamCode?: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// Add virtuals to JSON
TeamSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

TeamSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
