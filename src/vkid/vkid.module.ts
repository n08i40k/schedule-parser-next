import { Module } from "@nestjs/common";
import { VKIDService } from "./vkid.service";
import { VKIDController } from "./vkid.controller";
import { UsersModule } from "../users/users.module";

@Module({
	imports: [UsersModule],
	providers: [VKIDService],
	controllers: [VKIDController],
})
export class VKIDModule {}
