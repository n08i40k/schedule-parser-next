import {
	IsArray,
	IsDateString,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import Lesson from "./lesson.entity";

// noinspection JSClassNamingConvention
export default class Day {
	/**
	 * День недели
	 * @example "Понедельник"
	 */
	@IsString()
	name: string;

	/**
	 * Улица (v2)
	 * @example "Железнодорожная, 13"
	 */
	@IsString()
	@IsOptional()
	street?: string;

	/**
	 * Дата
	 * @example "2024-10-06T20:00:00.000Z"
	 */
	@IsDateString()
	date: Date;

	/**
	 * Занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Lesson)
	lessons: Array<Lesson>;
}
