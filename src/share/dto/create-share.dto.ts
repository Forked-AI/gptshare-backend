import { IsArray, IsInt, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateShareDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsString()
  previewText?: string;

  @IsOptional()
  @IsArray()
  selectedMessages?: any[]; // Json type

  @IsOptional()
  options?: any; // Json type

  @IsOptional()
  @IsInt()
  characterCount?: number;
}

export class UpdateShareDto {
  @IsString()
  summary!: string;
}
