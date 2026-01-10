import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  type: 'article' | 'news' | 'notification';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
