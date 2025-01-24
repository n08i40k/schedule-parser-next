import { IsString } from "class-validator";

export default class ChangePasswordDto {
	/**
	 * Старый пароль
	 * @example "my-old-password"
	 */
	@IsString()
	oldPassword: string;

	/**
	 * Новый пароль
	 * @example "my-new-password"
	 */
	@IsString()
	newPassword: string;
}
