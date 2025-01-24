import { IsDateString } from "class-validator";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class LessonTime extends Ctor<LessonTime> {
	/**
	 * Начало занятия
	 * @example "2024-10-07T04:30:00.000Z"
	 */
	@IsDateString()
	start: Date;

	/**
	 * Конец занятия
	 * @example "2024-10-07T04:40:00.000Z"
	 */
	@IsDateString()
	end: Date;
}
