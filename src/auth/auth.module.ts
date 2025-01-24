import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../contants";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleModule } from "../schedule/schedule.module";
import { AuthController } from "./auth.controller";

@Module({
	imports: [
		forwardRef(() => UsersModule),
		forwardRef(() => ScheduleModule),
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "4y" },
		}),
	],
	providers: [AuthService, PrismaService],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
