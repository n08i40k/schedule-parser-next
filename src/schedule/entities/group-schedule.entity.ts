import { PickType } from "@nestjs/swagger";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import Schedule from "./schedule.entity";
import Group from "./group.entity";

export default class GroupSchedule extends PickType(Schedule, ["updatedAt"]) {
	/**
	 * Расписание группы
	 */
	@IsObject()
	@Type(() => Group)
	group: Group;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
