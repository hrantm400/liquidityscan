import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  fullDescription: string;

  @IsString()
  @IsNotEmpty()
  category: 'beginner' | 'intermediate' | 'advanced';

  @IsString()
  @IsNotEmpty()
  level: 'Beginner' | 'Intermediate' | 'Advanced';

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsString()
  @IsNotEmpty()
  price: 'Free' | 'Premium';

  @IsString()
  @IsNotEmpty()
  instructor: string;

  @IsString()
  @IsNotEmpty()
  instructorBio: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  students?: number;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @IsString({ each: true })
  whatYouWillLearn: string[];

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
