import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

enum ToneEnum {
  PROFESSIONAL = 'professional',
  FORMAL = 'formal',
  CASUAL = 'casual',
  ENTHUSIASTIC = 'enthusiastic',
}

enum SummaryDetailEnum {
  BRIEF = 'brief',
  BALANCED = 'balanced',
  DETAILED = 'detailed',
}

export class SummaryOptions {
  @IsOptional()
  @IsEnum(ToneEnum, { message: 'Tone must be one of: professional, formal, casual, enthusiastic' })
  tone?: 'professional' | 'formal' | 'casual' | 'enthusiastic';

  @IsOptional()
  @IsBoolean()
  hideSensitive?: boolean;

  @IsOptional()
  @IsEnum(SummaryDetailEnum, { message: 'Summary detail must be one of: brief, balanced, detailed' })
  summaryDetail?: 'brief' | 'balanced' | 'detailed';

  @IsOptional()
  @IsString()
  @MaxLength(240, { message: 'Custom instruction cannot exceed 240 characters' })
  customInstruction?: string;
}

export class SummaryRequestDto {
  @IsArray()
  @IsString({ each: true })
  readonly convo!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SummaryOptions)
  readonly options?: SummaryOptions;
}
