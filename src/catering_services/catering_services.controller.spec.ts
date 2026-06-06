import { Test, TestingModule } from '@nestjs/testing';
import { CateringServicesController } from './catering_services.controller';

describe('CateringServicesController', () => {
  let controller: CateringServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CateringServicesController],
    }).compile();

    controller = module.get<CateringServicesController>(CateringServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
