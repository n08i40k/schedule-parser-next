import { IsBoolean, IsHash, IsNumber } from "class-validator";

export default class CacheStatusDto {
	/**
	 * Хеш данных парсера
	 * @example "40bd001563085fc35165329ea1ff5c5ecbdbbeef"
	 */
	@IsHash("sha1")
	cacheHash: string;

	/**
	 * Требуется ли обновление кеша?
	 * @example true
	 */
	@IsBoolean()
	cacheUpdateRequired: boolean;

	/**
	 * Время последнего обновления кеша в формате timestamp
	 * @example 1729288173002
	 */
	@IsNumber()
	lastCacheUpdate: number;

	/**
	 * Время последнего обновления расписания в формате timestamp
	 * @example 1729288173002
	 */
	@IsNumber()
	lastScheduleUpdate: number;
}
