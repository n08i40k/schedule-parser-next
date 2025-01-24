import { IsArray } from "class-validator";

export default class GetGroupNamesDto {
	/**
	 * Группы
	 * @example ["ИС-214/23", "ИС-213/23"]
	 */
	@IsArray()
	names: Array<string>;
}
