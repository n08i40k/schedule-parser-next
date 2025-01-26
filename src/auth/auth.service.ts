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
	 * Получает пользователя по его JWT токену
	 * @param {string} token - JWT токен для аутентификации
	 * @returns {Promise<User>} - Объект пользователя, если токен валиден
	 * @throws {UnauthorizedException} - Если токен некорректен или недействителен
	 * @throws {UnauthorizedException} - Если пользователь, указанный в токене, не существует
	 * @throws {UnauthorizedException} - Если токен устарел и был заменён на новый
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

	/**
	 * Регистрирует нового пользователя в системе.
	 *
	 * @param signUpDto - Объект с данными для регистрации, включая имя пользователя, пароль, роль и группу.
	 * @returns Возвращает объект UserDto с данными зарегистрированного пользователя или объект SignUpErrorDto в случае ошибки.
	 * @throws SignUpErrorDto - Если роль пользователя недопустима или имя пользователя уже существует.
	 */
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

	/**
	 * Асинхронная функция для входа пользователя в систему.
	 *
	 * @param {SignInDto} signIn - Объект, содержащий данные для входа (имя пользователя и пароль).
	 * @returns {Promise<UserDto | SignInErrorDto>} - Возвращает объект UserDto в случае успешного входа или SignInErrorDto в случае ошибки.
	 *
	 * @throws {SignInErrorDto} - Если пользователь не найден или пароль неверный, возвращается объект SignInErrorDto с кодом ошибки INCORRECT_CREDENTIALS.
	 *
	 * @example
	 * const signInData = { username: 'user123', password: 'password123' };
	 * const result = await signIn(signInData);
	 * if (result instanceof UserDto) {
	 *   console.log('Вход выполнен успешно:', result);
	 * } else {
	 *   console.log('Ошибка входа:', result);
	 * }
	 */
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

	/**
	 * Парсит VK ID пользователя по access token
	 *
	 * @param accessToken - Access token пользователя VK
	 * @returns Promise, который разрешается в VK ID пользователя или null в случае ошибки
	 *
	 * @example
	 * const vkId = await parseVKID('access_token_here');
	 * if (vkId) {
	 *   console.log(`VK ID пользователя: ${vkId}`);
	 * } else {
	 *   console.error('Ошибка при получении VK ID');
	 * }
	 */
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

		if (response.status !== 200 || data.error !== undefined) {
			console.warn(data);
			return null;
		}

		return data.response.id;
	}

	/**
	 * Регистрация пользователя через VK
	 * @param signUpDto - DTO с данными для регистрации через VK
	 * @returns Promise<UserDto | SignUpErrorDto> - возвращает DTO пользователя в случае успешной регистрации
	 * или DTO ошибки в случае возникновения проблем
	 */
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

	/**
	 * Авторизация пользователя через VK
	 * @param signInVKDto - DTO с данными для авторизации через VK
	 * @returns Promise<UserDto | SignInErrorDto> - возвращает DTO пользователя в случае успешной авторизации или DTO ошибки в случае неудачи
	 */
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
	 * @param user - пользователь, для которого меняется пароль
	 * @param changePassword - объект, содержащий старый и новый пароли
	 * @throws {ConflictException} - выбрасывается, если старый и новый пароли идентичны
	 * @throws {UnauthorizedException} - выбрасывается, если передан неверный исходный пароль
	 * @async
	 * @returns {Promise<void>} - возвращает Promise, который разрешается, когда пароль успешно изменен
	 */
	async changePassword(
		user: User,
		changePassword: ChangePasswordDto,
	): Promise<void> {
		const { oldPassword, newPassword } = changePassword;

		if (oldPassword == newPassword)
			throw new ConflictException("Пароли идентичны");

		if (!(await compare(oldPassword, user.password)))
			throw new UnauthorizedException("Передан неверный исходный пароль");

		await this.usersService.update({
			where: { id: user.id },
			data: {
				password: await hash(newPassword, await genSalt(8)),
			},
		});
	}
}
