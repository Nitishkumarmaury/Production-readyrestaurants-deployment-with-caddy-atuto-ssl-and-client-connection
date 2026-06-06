import { Test, TestingModule } from '@nestjs/testing';
import { PartyBlastController } from './party-blast.controller';

describe('PartyBlastController', () => {
  let controller: PartyBlastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartyBlastController],
    }).compile();

    controller = module.get<PartyBlastController>(PartyBlastController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
