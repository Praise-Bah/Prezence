import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitProofDto {
  @IsUUID()
  requestId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  transactionRef?: string;
}
