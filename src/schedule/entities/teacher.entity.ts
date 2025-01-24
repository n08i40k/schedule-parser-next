import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import TeacherDay from "./teacher-day.entity";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class Teacher extends Ctor<Teacher> {
	/**
	 * ФИО преподавателя
	 * @example "Хомченко Н.Е."
	 */
	@IsString()
	name: string;

	/**
	 * Расписание каждого дня
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => TeacherDay)
	days: Array<TeacherDay>;
}
