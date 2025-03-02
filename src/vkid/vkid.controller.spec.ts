import { Test, TestingModule } from "@nestjs/testing";
import { VKIDController } from "./vkid.controller";

describe("VkidController", () => {
	let controller: VKIDController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [VKIDController],
		}).compile();

		controller = module.get<VKIDController>(VKIDController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
