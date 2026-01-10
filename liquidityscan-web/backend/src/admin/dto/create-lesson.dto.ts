import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: 'video' | 'reading' | 'quiz';

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsObject()
  @IsOptional()
  content?: any; // Video URL, text content, quiz questions, etc.

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}
