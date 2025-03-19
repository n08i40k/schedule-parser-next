import { forwardRef, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminModule } from "../firebase-admin/firebase-admin.module";
import { UsersModule } from "src/users/users.module";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";

@Module({
	imports: [forwardRef(() => UsersModule), FirebaseAdminModule],
	providers: [PrismaService, ScheduleService],
	controllers: [ScheduleController],
	exports: [ScheduleService],
})
export class ScheduleModule {}
