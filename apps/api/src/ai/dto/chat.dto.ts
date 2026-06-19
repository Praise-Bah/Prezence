import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  context?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  platform?: string;
}

export class ChatHistoryQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  platform?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(200)
  limit?: number;
}
