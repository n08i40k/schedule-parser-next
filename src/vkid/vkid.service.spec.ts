import { Test, TestingModule } from '@nestjs/testing';
import { VKIDService } from './vkid.service';

describe('VkidService', () => {
  let service: VKIDService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VKIDService],
    }).compile();

    service = module.get<VKIDService>(VKIDService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
