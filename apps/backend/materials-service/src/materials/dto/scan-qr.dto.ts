import { IsString, IsOptional } from 'class-validator';

export class ScanQRDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}
