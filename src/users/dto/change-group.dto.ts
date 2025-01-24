import { IsString } from "class-validator";

export default class ChangeGroupDto {
	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	group: string;
}
