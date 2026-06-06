import { Test, TestingModule } from '@nestjs/testing';
import { CateringServicesService } from './catering_services.service';

describe('CateringServicesService', () => {
  let service: CateringServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CateringServicesService],
    }).compile();

    service = module.get<CateringServicesService>(CateringServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
