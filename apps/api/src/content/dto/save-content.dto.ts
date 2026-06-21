import { IsObject } from 'class-validator';

export class SaveContentDto {
  @IsObject()
  content!: Record<string, string>;
}
