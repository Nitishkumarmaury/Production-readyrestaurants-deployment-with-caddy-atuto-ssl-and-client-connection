import { PartialType } from '@nestjs/swagger';
import { CreateSosSystemDto } from './create-sos-system.dto';

export class UpdateSosSystemDto extends PartialType(CreateSosSystemDto) {}
