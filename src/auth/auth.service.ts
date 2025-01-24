import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { compare, genSalt, hash } from "bcrypt";
import UserRole from "../users/user-role.enum";
import User from "../users/entity/user.entity";
import ChangePasswordDto from "./dto/change-password.dto";
import axios from "axios";
import SignInErrorDto, { SignInErrorCode } from "./dto/sign-in-error.dto";
import { SignUpDto, SignUpVKDto } from "./dto/sign-up.dto";
import SignUpErrorDto, { SignUpErrorCode } from "./dto/sign-up-error.dto";
import { SignInDto, SignInVKDto } from "./dto/sign-in.dto";
import ObjectID from "bson-objectid";
import UserDto from "../users/dto/user.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Получение пользователя по его токену
	 * @param token - jwt токен
	 * @returns {User} - пользователь
	 * @throws {UnauthorizedException} - некорректный или недействительный токен
	 * @throws {UnauthorizedException} - токен указывает на несуществующего пользователя
	 * @throws {UnauthorizedException} - текущий токен устарел и был обновлён на новый
	 * @async
	 */
	async decodeUserToken(token: string): Promise<User> {
		const jwtUser: { id: string } | null =
			await this.jwtService.verifyAsync(token);

		const throwError = () => {
			throw new UnauthorizedException(
				"Некорректный или недействительный токен",
			);
		};

		if (jwtUser === null) throwError();

		const user = await this.usersService.findUnique({ id: jwtUser.id });

		if (!user || user.accessToken !== token) throwError();

		return user;
	}

	async signUp(signUpDto: SignUpDto): Promise<UserDto | SignUpErrorDto> {
		if (![UserRole.STUDENT, UserRole.TEACHER].includes(signUpDto.role))
			return new SignUpErrorDto(SignUpErrorCode.DISALLOWED_ROLE);

		if (await this.usersService.contains({ username: signUpDto.username }))
			return new SignUpErrorDto(SignUpErrorCode.USERNAME_ALREADY_EXISTS);

		const id = ObjectID().toHexString();

		return UserDto.fromPlain(
			await this.usersService.create({
				id: id,
				username: signUpDto.username,
				password: await hash(signUpDto.password, await genSalt(8)),
				accessToken: await this.jwtService.signAsync({ id: id }),
				group: signUpDto.group,
				role: signUpDto.role,
				version: signUpDto.version,
			}),
			["auth"],
		);
	}

	async signIn(signIn: SignInDto): Promise<UserDto | SignInErrorDto> {
		const user = await this.usersService.findUnique({
			username: signIn.username,
		});

		if (!user || !(await compare(signIn.password, user.password)))
			return new SignInErrorDto(SignInErrorCode.INCORRECT_CREDENTIALS);

		return UserDto.fromPlain(
			await this.usersService.update({
				where: { id: user.id },
				data: {
					accessToken: await this.jwtService.signAsync({
						id: user.id,
					}),
				},
			}),
			["auth"],
		);
	}

	private static async parseVKID(accessToken: string): Promise<number> {
		const form = new FormData();
		form.append("access_token", accessToken);
		form.append("v", "5.199");

		const response = await axios.post(
			"https://api.vk.com/method/account.getProfileInfo",
			form,
			{ responseType: "json" },
		);

		const data: { error?: any; response?: { id: number } } =
			response.data as object;

		if (response.status !== 200 || data.error !== undefined) return null;

		return data.response.id;
	}

	async signUpVK(signUpDto: SignUpVKDto): Promise<UserDto | SignUpErrorDto> {
		if (![UserRole.STUDENT, UserRole.TEACHER].includes(signUpDto.role))
			return new SignUpErrorDto(SignUpErrorCode.DISALLOWED_ROLE);

		if (await this.usersService.contains({ username: signUpDto.username }))
			return new SignUpErrorDto(SignUpErrorCode.USERNAME_ALREADY_EXISTS);

		const vkId = await AuthService.parseVKID(signUpDto.accessToken);
		if (!vkId)
			return new SignUpErrorDto(SignUpErrorCode.INVALID_VK_ACCESS_TOKEN);

		if (await this.usersService.contains({ vkId: vkId }))
			return new SignUpErrorDto(SignUpErrorCode.VK_ALREADY_EXISTS);

		const id = ObjectID().toHexString();

		return UserDto.fromPlain(
			await this.usersService.create({
				id: id,
				username: signUpDto.username,
				password: await hash(await genSalt(8), await genSalt(8)),
				vkId: vkId,
				accessToken: await this.jwtService.signAsync({
					id: id,
				}),
				role: signUpDto.role,
				group: signUpDto.group,
				version: signUpDto.version,
			}),
			["auth"],
		);
	}

	async signInVK(
		signInVKDto: SignInVKDto,
	): Promise<UserDto | SignInErrorDto> {
		const vkId = await AuthService.parseVKID(signInVKDto.accessToken);
		if (!vkId)
			return new SignInErrorDto(SignInErrorCode.INVALID_VK_ACCESS_TOKEN);

		const user = await this.usersService.findOne({ vkId: vkId });
		if (!user)
			return new SignInErrorDto(SignInErrorCode.INCORRECT_CREDENTIALS);

		const accessToken = await this.jwtService.signAsync({ id: user.id });

		return UserDto.fromPlain(
			await this.usersService.update({
				where: { id: user.id },
				data: { accessToken: accessToken },
			}),
			["auth"],
		);
	}

	/**
	 * Смена пароля пользователя
	 * @param user - пользователь
	 * @param changePassword - старый и новый пароли
	 * @throws {ConflictException} - пароли идентичны
	 * @throws {UnauthorizedException} - неверный исходный пароль
	 * @async
	 */
	async changePassword(
		user: User,
		changePassword: ChangePasswordDto,
	): Promise<void> {
		const { oldPassword, newPassword } = changePassword;

		if (oldPassword == newPassword)
			throw new ConflictException("Пароли идентичны");

		if (user.password !== (await hash(oldPassword, user.salt)))
			throw new UnauthorizedException("Передан неверный исходный пароль");

		await this.usersService.update({
			where: { id: user.id },
			data: {
				password: await hash(newPassword, user.salt),
			},
		});
	}
}
