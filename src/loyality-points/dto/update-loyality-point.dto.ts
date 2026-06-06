import { PartialType } from '@nestjs/swagger';
import { CreateLoyalityPointDto } from './create-loyality-point.dto';

export class UpdateLoyalityPointDto extends PartialType(CreateLoyalityPointDto) {}
