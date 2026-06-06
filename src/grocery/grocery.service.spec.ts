import { Test, TestingModule } from '@nestjs/testing';
import { GroceryService } from './grocery.service';

describe('GroceryService', () => {
  let service: GroceryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroceryService],
    }).compile();

    service = module.get<GroceryService>(GroceryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
