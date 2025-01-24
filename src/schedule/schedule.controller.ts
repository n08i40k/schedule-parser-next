import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotAcceptableException,
	Param,
	Patch,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { AuthRoles, AuthUnauthorized } from "../auth/auth-role.decorator";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { ScheduleService } from "./schedule.service";
import { CacheInterceptor, CacheKey } from "@nestjs/cache-manager";
import Schedule from "./entities/schedule.entity";
import UserRole from "src/users/user-role.enum";
import GroupSchedule from "./entities/group-schedule.entity";
import User from "src/users/entity/user.entity";
import GroupNamesDto from "./dto/get-group-names.dto";
import TeacherSchedule from "./entities/teacher-schedule.entity";
import TeacherNamesDto from "./dto/teacher-names.dto";
import CacheStatusDto from "./dto/cache-status.dto";
import UpdateDownloadUrlDto from "./dto/update-download-url.dto";

@ApiTags("v1/schedule")
@ApiBearerAuth()
@Controller({ path: "schedule", version: "1" })
@UseGuards(AuthGuard)
export class ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) {}

	@ApiOperation({
		summary: "Получение расписания",
		tags: ["admin"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: Schedule,
	})
	@ResultDto(Schedule)
	@AuthRoles([UserRole.ADMIN])
	@CacheKey("schedule")
	@UseInterceptors(CacheInterceptor)
	@HttpCode(HttpStatus.OK)
	@Get()
	async getSchedule(): Promise<Schedule> {
		return await this.scheduleService.getSchedule();
	}

	@ApiOperation({ summary: "Получение расписания группы" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: GroupSchedule,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемая группа не найдена",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Get("group")
	async getGroupSchedule(
		@UserToken(UserPipe) user: User,
	): Promise<GroupSchedule> {
		return await this.scheduleService.getGroup(user.group);
	}

	@ApiOperation({ summary: "Получение списка названий групп" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
		type: GroupNamesDto,
	})
	@ResultDto(null)
	@CacheKey("schedule-group-names")
	@UseInterceptors(CacheInterceptor)
	@AuthUnauthorized()
	@Get("group-names")
	async getGroupNames(): Promise<GroupNamesDto> {
		return await this.scheduleService.getGroupNames();
	}

	@ApiOperation({ summary: "Получение расписания преподавателя" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: TeacherSchedule,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемый преподаватель не найден",
	})
	@ResultDto(null)
	@Get("teacher/:name")
	async getTeacherSchedule(
		@Param("name") name: string,
		@UserToken(UserPipe) user: User,
	): Promise<TeacherSchedule> {
		if (name === "self") {
			if (user.role === UserRole.STUDENT)
				throw new NotAcceptableException();

			return await this.scheduleService.getTeacher(user.username);
		}

		return await this.scheduleService.getTeacher(name);
	}

	@ApiOperation({ summary: "Получение списка ФИО преподавателей" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
		type: TeacherNamesDto,
	})
	@ResultDto(null)
	@CacheKey("schedule-teacher-names")
	@UseInterceptors(CacheInterceptor)
	@AuthUnauthorized()
	@Get("teacher-names")
	async getTeacherNames(): Promise<TeacherNamesDto> {
		return await this.scheduleService.getTeacherNames();
	}

	@ApiOperation({ summary: "Обновление основной страницы политехникума" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Данные обновлены успешно",
		type: CacheStatusDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Передан некорректный код страницы",
	})
	@ResultDto(CacheStatusDto)
	@HttpCode(HttpStatus.OK)
	@Patch("update-download-url")
	async updateDownloadUrl(
		@Body() reqDto: UpdateDownloadUrlDto,
	): Promise<CacheStatusDto> {
		return await this.scheduleService.updateDownloadUrl(reqDto.url);
	}

	@ApiOperation({
		summary: "Получение информации о кеше",
		tags: ["cache"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение данных прошло успешно",
		type: CacheStatusDto,
	})
	@ResultDto(CacheStatusDto)
	@Get("cache-status")
	getCacheStatus(): CacheStatusDto {
		return this.scheduleService.getCacheStatus();
	}
}
