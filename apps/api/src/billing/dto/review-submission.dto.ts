import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewSubmissionDto {
  @IsIn(['approve', 'reject'])
  action!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNotes?: string;
}
