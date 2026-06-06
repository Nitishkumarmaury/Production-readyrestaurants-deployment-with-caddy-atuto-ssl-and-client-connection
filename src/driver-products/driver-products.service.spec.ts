import { Test, TestingModule } from '@nestjs/testing';
import { DriverProductsService } from './driver-products.service';

describe('DriverProductsService', () => {
  let service: DriverProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverProductsService],
    }).compile();

    service = module.get<DriverProductsService>(DriverProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
