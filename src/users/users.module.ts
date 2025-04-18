import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleModule } from "../schedule/schedule.module";
import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./users.controller";

@Module({
	imports: [forwardRef(() => ScheduleModule), forwardRef(() => AuthModule)],
	providers: [PrismaService, UsersService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
