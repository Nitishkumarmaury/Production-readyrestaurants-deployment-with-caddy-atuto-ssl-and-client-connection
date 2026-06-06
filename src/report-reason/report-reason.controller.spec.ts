import { Test, TestingModule } from '@nestjs/testing';
import { ReportReasonController } from './report-reason.controller';

describe('ReportReasonController', () => {
  let controller: ReportReasonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportReasonController],
    }).compile();

    controller = module.get<ReportReasonController>(ReportReasonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
