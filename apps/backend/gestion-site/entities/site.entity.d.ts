import { Document, Types } from 'mongoose';
export declare class Site extends Document {
    nom: string;
    adresse: string;
    localisation: string;
    budget: number;
    description?: string;
    isActif: boolean;
    area: number;
    status: string;
    progress: number;
    workStartDate: Date;
    workEndDate: Date;
    projectId: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    teams: Types.ObjectId[];
    teamIds: Types.ObjectId[];
    get formattedBudget(): string;
}
export declare const SiteSchema: import("mongoose").Schema<Site, import("mongoose").Model<Site, any, any, any, any, any, Site>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Site, Document<unknown, {}, Site, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nom?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adresse?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    localisation?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    budget?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActif?: import("mongoose").SchemaDefinitionProperty<boolean, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    area?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    progress?: import("mongoose").SchemaDefinitionProperty<number, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    workStartDate?: import("mongoose").SchemaDefinitionProperty<Date, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    workEndDate?: import("mongoose").SchemaDefinitionProperty<Date, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    projectId?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coordinates?: import("mongoose").SchemaDefinitionProperty<{
        lat: number;
        lng: number;
    }, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teams?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teamIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readonly formattedBudget?: import("mongoose").SchemaDefinitionProperty<string, Site, Document<unknown, {}, Site, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Site & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Site>;
