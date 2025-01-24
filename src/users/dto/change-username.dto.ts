import { IsString, MaxLength, MinLength } from "class-validator";

export default class ChangeUsernameDto {
	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	username: string;
}
