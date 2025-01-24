import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import Day from "./day.entity";

export default class Group {
	/**
	 * Название группы
	 * @example "ИС-214/23"
	 */
	@IsString()
	name: string;

	/**
	 * Расписание каждого дня
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Day)
	days: Array<Day>;
}
