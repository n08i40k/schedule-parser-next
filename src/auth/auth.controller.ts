import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { SignInDto, SignInVKDto } from "./dto/sign-in.dto";
import { SignUpDto, SignUpVKDto } from "./dto/sign-up.dto";
import { ScheduleService } from "../schedule/schedule.service";
import SignInErrorDto from "./dto/sign-in-error.dto";
import { FastifyReply } from "fastify";
import SignUpErrorDto, { SignUpErrorCode } from "./dto/sign-up-error.dto";
import UserDto from "src/users/dto/user.dto";
import GetGroupNamesDto from "../schedule/dto/get-group-names.dto";

@ApiTags("v2/auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly scheduleService: ScheduleService,
	) {}

	@ApiOperation({ summary: "Авторизация по логину и паролю" })
	@ApiBody({ type: SignInDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Авторизация прошла успешно",
		type: UserDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Переданы неверные входные данные",
		type: SignInErrorDto,
	})
	@ResultDto([UserDto, SignInErrorDto])
	@HttpCode(HttpStatus.OK)
	@Post("sign-in")
	async signIn(
		@Body() signInDto: SignInDto,
		@Res({ passthrough: true }) response: FastifyReply,
	): Promise<UserDto | SignInErrorDto> {
		const result = await this.authService.signIn(signInDto);

		if (result instanceof SignInErrorDto)
			response.status(HttpStatus.NOT_ACCEPTABLE);

		return result;
	}

	@ApiOperation({ summary: "Регистрация по логину и паролю" })
	@ApiBody({ type: SignUpDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Регистрация прошла успешно",
		type: UserDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Переданы неверные входные данные",
		type: SignUpErrorDto,
	})
	@ResultDto([UserDto, SignUpErrorDto])
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up")
	async signUp(
		@Body() signUpDto: SignUpDto,
		@Res({ passthrough: true }) response: FastifyReply,
	): Promise<UserDto | SignUpErrorDto> {
		const groupNames = await this.scheduleService
			.getGroupNames()
			.catch((): GetGroupNamesDto => null);

		if (
			groupNames &&
			!groupNames.names.includes(signUpDto.group.replaceAll(" ", ""))
		) {
			response.status(HttpStatus.NOT_ACCEPTABLE);
			return new SignUpErrorDto(SignUpErrorCode.INVALID_GROUP_NAME);
		}

		const result = await this.authService.signUp(signUpDto);
		if (result instanceof SignUpErrorDto)
			response.status(HttpStatus.NOT_ACCEPTABLE);

		return result;
	}

	@ApiOperation({ summary: "Авторизация с помощью VK ID" })
	@ApiBody({ type: SignInVKDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Авторизация прошла успешно",
		type: UserDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Переданы неверные входные данные",
		type: SignInErrorDto,
	})
	@ResultDto([UserDto, SignInErrorDto])
	@HttpCode(HttpStatus.OK)
	@Post("sign-in-vk")
	async signInVK(
		@Body() signInVKDto: SignInVKDto,
		@Res({ passthrough: true }) response: FastifyReply,
	): Promise<UserDto | SignInErrorDto> {
		const result = await this.authService.signInVK(signInVKDto);

		if (result instanceof SignInErrorDto)
			response.status(HttpStatus.NOT_ACCEPTABLE);

		return result;
	}

	@ApiOperation({ summary: "Регистрация с помощью VK ID" })
	@ApiBody({ type: SignUpVKDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Регистрация прошла успешно",
		type: UserDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Переданы неверные входные данные",
		type: SignUpErrorDto,
	})
	@ResultDto([UserDto, SignUpErrorDto])
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up-vk")
	async signUpVK(
		@Body() signUpVKDto: SignUpVKDto,
		@Res({ passthrough: true }) response: FastifyReply,
	): Promise<UserDto | SignUpErrorDto> {
		const groupNames = await this.scheduleService
			.getGroupNames()
			.catch((): GetGroupNamesDto => null);

		if (
			groupNames &&
			!groupNames.names.includes(signUpVKDto.group.replaceAll(" ", ""))
		) {
			response.status(HttpStatus.NOT_ACCEPTABLE);
			return new SignUpErrorDto(SignUpErrorCode.INVALID_GROUP_NAME);
		}

		const result = await this.authService.signUpVK(signUpVKDto);
		if (result instanceof SignUpErrorDto)
			response.status(HttpStatus.NOT_ACCEPTABLE);

		return result;
	}
}
