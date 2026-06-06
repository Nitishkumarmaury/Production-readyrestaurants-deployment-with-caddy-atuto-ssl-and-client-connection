import { PartialType } from '@nestjs/swagger';
import { CreateEmbeddingDto } from './create-embedding.dto';

export class UpdateEmbeddingDto extends PartialType(CreateEmbeddingDto) {}
