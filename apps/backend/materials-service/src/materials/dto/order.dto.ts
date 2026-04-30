import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
  IsEnum,
} from 'class-validator';

export class CreateMaterialOrderDto {
  @IsString()
  materialId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  destinationSiteId: string;

  @IsString()
  supplierId: string;

  @IsNumber()
  estimatedDurationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'in_transit', 'delivered', 'delayed', 'cancelled'])
  status: string;

  @IsOptional()
  @IsObject()
  currentPosition?: { lat: number; lng: number };
}

export class TrackOrderDto {
  @IsString()
  orderId: string;
}
