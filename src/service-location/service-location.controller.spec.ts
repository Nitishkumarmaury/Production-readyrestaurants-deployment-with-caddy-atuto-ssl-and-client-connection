import { Test, TestingModule } from '@nestjs/testing';
import { ServiceLocationController } from './service-location.controller';

describe('ServiceLocationController', () => {
  let controller: ServiceLocationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceLocationController],
    }).compile();

    controller = module.get<ServiceLocationController>(ServiceLocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
