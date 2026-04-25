import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type IncidentDocument = Incident & Document;

// Align with frontend types (src/app/types/index.ts)
export enum IncidentType {
  SAFETY = "safety",
  QUALITY = "quality",
  DELAY = "delay",
  OTHER = "other",
}

export enum IncidentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IncidentStatus {
  OPEN = "open",
  INVESTIGATING = "investigating",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true, enum: IncidentType })
  type: IncidentType;

  @Prop({ required: true, enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  reporterName?: string;

  @Prop()
  reporterPhone?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  assignedToCin?: string;

  @Prop({ type: Types.ObjectId, ref: "Project", required: false })
  project?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Site", required: false })
  site?: Types.ObjectId;

  @Prop({ trim: true, required: false })
  reportedBy?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  assignedTo?: Types.ObjectId;

  @Prop({ trim: true })
  assignedUserRole?: string;

  @Prop({ required: true, enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

IncidentSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    console.log('🔍 Transform appelé pour incident:', ret._id || ret.id);
    console.log('🔍 Type de ret:', typeof ret);
    console.log('🔍 Est-ce un objet lean?:', ret.constructor.name === 'Object' && !ret._doc);

    ret.id = (ret._id as any)?.toString?.() ?? ret._id ?? ret.id;
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
    if (ret.resolvedAt instanceof Date) ret.resolvedAt = ret.resolvedAt.toISOString();

    // Inclure les champs d'assignation dans la réponse
    console.log('🔍 assignedToCin:', ret.assignedToCin);
    console.log('🔍 assignedUserRole:', ret.assignedUserRole);
    console.log('🔍 reportedBy (ObjectId):', ret.reportedBy);

    if (ret.assignedToCin) {
      ret.assignedTo = ret.assignedToCin;
      console.log('✅ assignedTo défini à:', ret.assignedTo);
    }

    if (ret.assignedUserRole) {
      console.log('✅ assignedUserRole déjà présent:', ret.assignedUserRole);
    }

    // Gérer le champ reportedBy - convertir ObjectId en chaîne si possible
    if (ret.reportedBy) {
      if (typeof ret.reportedBy === 'object' && ret.reportedBy.cin) {
        ret.reportedBy = ret.reportedBy.cin;
        console.log('✅ reportedBy converti en CIN:', ret.reportedBy);
      } else if (typeof ret.reportedBy === 'string') {
        console.log('✅ reportedBy déjà une chaîne:', ret.reportedBy);
      }
    }

    console.log('🔍 Résultat final:', JSON.stringify(ret, null, 2));
    return ret;
  },
});
