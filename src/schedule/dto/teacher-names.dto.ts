import { IsArray } from "class-validator";

export default class TeacherNamesDto {
	/**
	 * Группы
	 * @example ["Хомченко Н.Е."]
	 */
	@IsArray()
	names: Array<string>;
}
