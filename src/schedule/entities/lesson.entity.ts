import "reflect-metadata";

import { LessonType } from "../enum/lesson-type.enum";
import {
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { NullIf } from "../../utility/class-validators/conditional-field";
import LessonTime from "./lesson-time.entity";
import LessonSubGroup from "./lesson-sub-group.entity";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class Lesson extends Ctor<Lesson> {
	/**
	 * Тип занятия
	 * @example DEFAULT
	 */
	@IsEnum(LessonType)
	type: LessonType;

	/**
	 * Индексы пар, если присутствуют
	 * @example [1, 3]
	 * @optional
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	@IsOptional()
	@NullIf((self: Lesson) => {
		return self.type !== LessonType.DEFAULT;
	})
	defaultRange: Array<number> | null;

	/**
	 * Название занятия
	 * @example "Элементы высшей математики"
	 * @optional
	 */
	@IsString()
	@IsOptional()
	@NullIf((self: Lesson) => {
		return self.type === LessonType.BREAK;
	})
	name: string | null;

	/**
	 * Начало и конец занятия
	 */
	@Type(() => LessonTime)
	time: LessonTime;

	/**
	 * Тип занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => LessonSubGroup)
	@IsOptional()
	@NullIf((self: Lesson) => {
		return self.type !== LessonType.DEFAULT;
	})
	subGroups: Array<LessonSubGroup> | null;
}
