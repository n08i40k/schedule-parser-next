import {
	IsArray,
	IsDateString,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import TeacherLesson from "./teacher-lesson.entity";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class TeacherDay extends Ctor<TeacherDay> {
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
	@Type(() => TeacherLesson)
	lessons: Array<TeacherLesson>;
}
