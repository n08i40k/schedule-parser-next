import {
	Body,
	ConflictException,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { UserToken } from "../auth/auth.decorator";
import { UsersService } from "./users.service";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import User from "./entity/user.entity";
import ChangeUsernameDto from "./dto/change-username.dto";
import UserRole from "./user-role.enum";
import ChangeGroupDto from "./dto/change-group.dto";
import { UserPipe } from "../auth/auth.pipe";
import { ScheduleService } from "../schedule/schedule.service";
import UserDto from "./dto/user.dto";

@ApiTags("v1/users")
@ApiBearerAuth()
@Controller({ path: "users", version: "1" })
@UseGuards(AuthGuard)
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly scheduleService: ScheduleService,
	) {}

	@ApiOperation({ summary: "Получение данных о профиле пользователя" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение профиля прошло успешно",
		type: UserDto,
	})
	@ResultDto(UserDto)
	@Get("me")
	getMe(@UserToken(UserPipe) user: User): UserDto {
		return user.toDto();
	}

	@ApiOperation({ summary: "Смена имени пользователя" })
	@ApiBody({ type: ChangeUsernameDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Смена имени профиля прошла успешно",
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: "Пользователь с таким именем уже существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-username")
	async changeUsername(
		@Body() changeUsernameDto: ChangeUsernameDto,
		@UserToken(UserPipe) user: User,
	): Promise<void> {
		changeUsernameDto.username =
			user.role == UserRole.ADMIN
				? changeUsernameDto.username
				: changeUsernameDto.username.replace(/\s/g, "");

		if (user.username === changeUsernameDto.username) return;

		if (
			await this.usersService.contains({
				username: changeUsernameDto.username,
			})
		) {
			throw new ConflictException(
				"Пользователь с таким именем уже существует",
			);
		}

		await this.usersService.update({
			where: { id: user.id },
			data: { username: changeUsernameDto.username },
		});
	}

	@ApiOperation({ summary: "Смена группы пользователя" })
	@ApiBody({ type: ChangeGroupDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Смена группы прошла успешно",
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Группа с таким названием не существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-group")
	async changeGroup(
		@Body() changeGroupDto: ChangeGroupDto,
		@UserToken(UserPipe) user: User,
	): Promise<void> {
		if (user.group === changeGroupDto.group) return;

		const groupNames = await this.scheduleService.getGroupNames();
		if (!groupNames.names.includes(changeGroupDto.group)) {
			throw new NotFoundException(
				"Группа с таким названием не существует",
			);
		}

		await this.usersService.update({
			where: { id: user.id },
			data: { group: changeGroupDto.group },
		});
	}
}
