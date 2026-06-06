import { Test, TestingModule } from '@nestjs/testing';
import { DriverProductsController } from './driver-products.controller';

describe('DriverProductsController', () => {
  let controller: DriverProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverProductsController],
    }).compile();

    controller = module.get<DriverProductsController>(DriverProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
