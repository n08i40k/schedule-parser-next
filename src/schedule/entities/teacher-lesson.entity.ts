import Lesson from "./lesson.entity";
import { IsOptional, IsString } from "class-validator";
import { NullIf } from "../../utility/class-validators/conditional-field";
import { LessonType } from "../enum/lesson-type.enum";

export default class TeacherLesson extends Lesson {
	/**
	 * Название группы
	 * @example "ИС-214/23"
	 * @optional
	 */
	@IsString()
	@IsOptional()
	@NullIf((self: TeacherLesson) => {
		return self.type === LessonType.BREAK;
	})
	group: string | null;
}
