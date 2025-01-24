import { IsNumber } from "class-validator";

export default class ClearReplacerDto {
	/**
	 * Количество удалённых заменителей расписания
	 * @example 1
	 */
	@IsNumber()
	count: number;
}
