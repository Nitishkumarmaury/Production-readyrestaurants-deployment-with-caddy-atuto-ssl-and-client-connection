import { Test, TestingModule } from '@nestjs/testing';
import { ServiceLocationService } from './service-location.service';

describe('ServiceLocationService', () => {
  let service: ServiceLocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceLocationService],
    }).compile();

    service = module.get<ServiceLocationService>(ServiceLocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
