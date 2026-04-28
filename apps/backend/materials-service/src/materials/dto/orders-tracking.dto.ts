import { IsOptional, IsEnum, IsString } from 'class-validator';

export class GetAllOrdersTrackingDto {
  @IsOptional()
  @IsEnum(['pending', 'in_transit', 'delivered', 'delayed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class OrderTrackingOverviewDto {
  orderId: string;
  orderNumber: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  status: string;
  progress: number;
  currentPosition: { lat: number; lng: number };
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  supplierName: string;
  siteName: string;
  remainingTimeMinutes: number;
  eta: Date;
  route: {
    distance: number;
    duration: number;
    polyline: string;
  };
  createdAt?: Date;
  actualDeparture?: Date;
  estimatedArrival?: Date;
}

export class GlobalTrackingStatsDto {
  totalOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredToday: number;
  delayedOrders: number;
  activeTrucks: number;
  totalDistance: number;
  averageDeliveryTime: number;
}

export class GlobalTrackingResponseDto {
  stats: GlobalTrackingStatsDto;
  orders: OrderTrackingOverviewDto[];
  sites: Array<{
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    activeOrders: number;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    activeOrders: number;
  }>;
}
