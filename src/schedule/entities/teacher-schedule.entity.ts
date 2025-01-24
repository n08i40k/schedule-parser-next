import { PickType } from "@nestjs/swagger";
import Schedule from "./schedule.entity";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import Teacher from "./teacher.entity";

export default class TeacherSchedule extends PickType(Schedule, ["updatedAt"]) {
	/**
	 * Расписание преподавателя
	 */
	@IsObject()
	teacher: Teacher;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
