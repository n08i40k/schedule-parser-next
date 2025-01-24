import {
	IsEnum,
	IsSemVer,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import UserRole from "../../users/user-role.enum";

export class SignUpDto {
	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	username: string;

	/**
	 * Пароль в исходном виде
	 * @example "my-password"
	 */
	@IsString()
	password: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	group: string;

	/**
	 * Роль
	 * @example STUDENT
	 */
	@IsEnum(UserRole)
	role: UserRole;

	/**
	 * Версия установленного приложения
	 * @example "2.0.0"
	 */
	@IsSemVer()
	version: string;
}

export class SignUpVKDto {
	/**
	 * Токен VK
	 * @example "хз"
	 */
	@IsString()
	accessToken: string;

	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	username: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	group: string;

	/**
	 * Роль
	 * @example STUDENT
	 */
	@IsEnum(UserRole)
	role: UserRole;

	/**
	 * Версия установленного приложения
	 * @example "2.0.0"
	 */
	@IsSemVer()
	version: string;
}
