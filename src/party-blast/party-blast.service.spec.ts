import { Test, TestingModule } from '@nestjs/testing';
import { PartyBlastService } from './party-blast.service';

describe('PartyBlastService', () => {
  let service: PartyBlastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartyBlastService],
    }).compile();

    service = module.get<PartyBlastService>(PartyBlastService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
