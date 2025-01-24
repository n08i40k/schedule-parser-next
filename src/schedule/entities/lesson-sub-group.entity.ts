import { IsNumber, IsOptional, IsString } from "class-validator";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class LessonSubGroup extends Ctor<LessonSubGroup> {
	/**
	 * Номер подгруппы
	 * @example 1
	 */
	@IsNumber()
	number: number;

	/**
	 * Кабинет
	 * @example "с\з"
	 * @example "42"
	 */
	@IsString()
	@IsOptional()
	cabinet: string | null;

	/**
	 * ФИО преподавателя
	 * @example "Хомченко Н. Е."
	 */
	@IsString()
	teacher: string;
}
