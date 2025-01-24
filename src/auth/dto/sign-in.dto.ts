import { IsString, MaxLength, MinLength } from "class-validator";

export class SignInDto {
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
}

export class SignInVKDto {
	/**
	 * Токен VK
	 * @example "хз"
	 */
	@IsString()
	accessToken: string;
}
