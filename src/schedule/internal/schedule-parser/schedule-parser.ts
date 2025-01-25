import { XlsDownloaderInterface } from "../xls-downloader/xls-downloader.interface";

import * as XLSX from "xlsx";
import { Range, WorkSheet } from "xlsx";
import { toNormalString, trimAll } from "../../../utility/string.util";
import { plainToInstance, Type } from "class-transformer";
import * as objectHash from "object-hash";
import LessonTime from "../../entities/lesson-time.entity";
import { LessonType } from "../../enum/lesson-type.enum";
import LessonSubGroup from "../../entities/lesson-sub-group.entity";
import Lesson from "../../entities/lesson.entity";
import Day from "../../entities/day.entity";
import Group from "../../entities/group.entity";
import * as assert from "node:assert";
import { ScheduleReplacerService } from "../../schedule-replacer.service";
import Teacher from "../../entities/teacher.entity";
import TeacherDay from "../../entities/teacher-day.entity";
import TeacherLesson from "../../entities/teacher-lesson.entity";
import {
	IsArray,
	IsDate,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { ToMap } from "create-map-transform-fn";
import { ClassProperties } from "../../../utility/class-trasformer/class-transformer-ctor";

type InternalId = {
	/**
	 * Индекс строки
	 */
	row: number;

	/**
	 * Индекс столбца
	 */
	column: number;

	/**
	 * Текст записи
	 */
	name: string;
};

type InternalTime = {
	/**
	 * Временной отрезок
	 */
	timeRange: LessonTime;

	/**
	 * Тип пары на этой строке
	 */
	lessonType: LessonType;

	/**
	 * Индекс пары на этой строке
	 */
	defaultIndex?: number;

	/**
	 * Позиции начальной и конечной записи
	 */
	xlsxRange: Range;
};

export class ScheduleParseResult {
	/**
	 * ETag расписания
	 */
	@IsString()
	etag: string;

	/**
	 * Идентификатор заменённого расписания (ObjectId)
	 */
	@IsString()
	@IsOptional()
	replacerId?: string;

	/**
	 * Дата загрузки расписания на сайт политехникума
	 */
	@IsDate()
	uploadedAt: Date;

	/**
	 * Дата загрузки расписания с сайта политехникума
	 */
	@IsDate()
	downloadedAt: Date;

	/**
	 * Расписание групп в виде списка.
	 * Ключ - название группы.
	 */
	@ToMap({ mapValueClass: Group })
	groups: Map<string, Group>;

	/**
	 * Расписание преподавателей в виде списка.
	 * Ключ - ФИО преподавателя
	 */
	@ToMap({ mapValueClass: Teacher })
	teachers: Map<string, Teacher>;

	/**
	 * Список групп у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - название группы.
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	@ValidateNested({ each: true })
	@Type(() => Number)
	updatedGroups: Array<Array<number>>;

	/**
	 * Список преподавателей у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - ФИО преподавателя.
	 */
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	@ValidateNested({ each: true })
	@Type(() => Number)
	updatedTeachers: Array<Array<number>>;
}

export class ScheduleParser {
	private lastResult: ScheduleParseResult | null = null;

	/**
	 * @param xlsDownloader - класс для загрузки расписания с сайта политехникума
	 * @param scheduleReplacerService - сервис для подмены расписания
	 */
	public constructor(
		private readonly xlsDownloader: XlsDownloaderInterface,
		private readonly scheduleReplacerService?: ScheduleReplacerService,
	) {}

	/**
	 * Получает позиции начальной и конечной записи относительно начальной записи
	 * @param workSheet - xls лист
	 * @param topRow - индекс начальной строки
	 * @param leftColumn - индекс начального столбца
	 * @returns {Range} - позиции начальной и конечной записи
	 * @private
	 * @static
	 */
	private static getMergeFromStart(
		workSheet: XLSX.WorkSheet,
		topRow: number,
		leftColumn: number,
	): Range {
		for (const range of workSheet["!merges"]) {
			if (topRow === range.s.r && leftColumn === range.s.c) return range;
		}

		return {
			s: { r: topRow, c: leftColumn },
			e: { r: topRow, c: leftColumn },
		};
	}

	/**
	 * Получает текст из требуемой записи
	 * @param worksheet - xls лист
	 * @param row - индекс строки
	 * @param column - индекс столбца
	 * @returns {string | null} - текст записи, если присутствует
	 * @private
	 * @static
	 */
	private static getCellData(
		worksheet: XLSX.WorkSheet,
		row: number,
		column: number,
	): string | null {
		const cell = worksheet[
			XLSX.utils.encode_cell({ r: row, c: column })
		] as XLSX.CellObject;

		return toNormalString(cell?.w);
	}

	/**
	 * Парсит информацию о паре исходя из текста в записи
	 * @param text - текст в записи
	 * @returns {{
	 * 		name: string;
	 * 		subGroups: Array<LessonSubGroup>;
	 * 	}} - название пары и список подгрупп
	 * @private
	 * @static
	 */
	private static parseNameAndSubGroups(text: string): {
		name: string;
		subGroups: Array<LessonSubGroup>;
	} {
		if (!text) return { name: text, subGroups: [] };

		// хд
		const lessonRegExp = /(?:[А-Я][а-я]+[А-Я]{2}(?:\([0-9][а-я]+\))?)+$/m;
		const teacherRegExp =
			/([А-Я][а-я]+)([А-Я])([А-Я])(?:\(([0-9])[а-я]+\))?/g;

		const rawTeachers = (text
			.replaceAll(/[\s\n\t.,]+/g, "")
			.match(lessonRegExp) ?? [])[0];

		// если не ничего не найдено
		if (!rawTeachers)
			return {
				name: text
					.replaceAll(/[\t\n]+/g, "") // Убираем все переносы
					.replaceAll(/\s+/g, " ") // Убираем все лишние пробелы
					.trim() // Убираем пробелы по краям
					.replace(/\.$/m, ""), // Убираем точку в конце названия, если присутствует
				subGroups: [],
			};

		const teacherIt = rawTeachers.matchAll(teacherRegExp);

		const subGroups: Array<LessonSubGroup> = [];
		let lessonName: string;

		let m: RegExpMatchArray;
		while ((m = teacherIt.next().value as RegExpMatchArray)) {
			if (!lessonName) {
				lessonName = text
					.substring(0, text.indexOf(m[1]))
					.replaceAll(/[\t\n]+/g, "") // Убираем все переносы
					.replaceAll(/\s+/g, " ") // Убираем все лишние пробелы
					.trim() // Убираем пробелы по краям
					.replace(/\.$/m, ""); // Убираем точку в конце названия, если присутствует
			}

			subGroups.push(
				new LessonSubGroup({
					number: +(m[4] ?? "0"),
					cabinet: null,
					teacher: `${m[1]} ${m[2]}.${m[3]}.`,
				}),
			);
		}

		// фикс, если у кого-то отсутствует индекс подгруппы

		// если 1 преподаватель
		if (subGroups.length === 1) subGroups[0].number = 1;
		else if (subGroups.length === 2) {
			// если индексы отсутствуют у обоих, ставим поочерёдно
			if (subGroups[0].number === 0 && subGroups[1].number === 0) {
				subGroups[0].number = 1;
				subGroups[1].number = 2;
			}
			// если индекс отсутствует у первого, ставим 2, если у второго индекс 1 и наоборот
			else if (subGroups[0].number === 0)
				subGroups[0].number = subGroups[1].number === 1 ? 2 : 1;
			// если индекс отсутствует у второго, ставим 2, если у первого индекс 1 и наоборот
			else if (subGroups[1].number === 0)
				subGroups[1].number = subGroups[0].number === 1 ? 2 : 1;
		}

		return {
			name: lessonName,
			subGroups: subGroups,
		};
	}

	/**
	 * Парсит информацию о группах и днях недели
	 * @param workSheet - xls лист
	 * @returns {{
	 * 		groupSkeletons: Array<InternalId>;
	 * 		daySkeletons: Array<InternalId>;
	 * 	}} - список с индексами и текстом записей групп и дней недели
	 * @private
	 * @static
	 */
	private static parseSkeleton(workSheet: XLSX.WorkSheet): {
		groupSkeletons: Array<InternalId>;
		daySkeletons: Array<InternalId>;
	} {
		const range = XLSX.utils.decode_range(workSheet["!ref"] || "");
		let isHeaderParsed: boolean = false;

		const groups: Array<InternalId> = [];
		const days: Array<InternalId> = [];

		for (let row = range.s.r + 1; row <= range.e.r; ++row) {
			const dayName = ScheduleParser.getCellData(workSheet, row, 0);
			if (!dayName) continue;

			if (!isHeaderParsed) {
				isHeaderParsed = true;

				--row;
				for (
					let column = range.s.c + 2;
					column <= range.e.c;
					++column
				) {
					const groupName = ScheduleParser.getCellData(
						workSheet,
						row,
						column,
					);
					if (!groupName) continue;

					groups.push({ row: row, column: column, name: groupName });
				}
				++row;
			}

			const dayMonthIdx = /[А-Яа-я]+\s(\d+)\.\d+\.\d+/.exec(
				trimAll(dayName),
			);

			if (dayMonthIdx === null) continue;

			days.push({
				row: row,
				column: 0,
				name: dayName,
			});

			if (days.length > 2 && dayName.startsWith("Суббота")) break;
		}

		return { daySkeletons: days, groupSkeletons: groups };
	}

	/**
	 * Возвращает текущий класс для скачивания xls файлов
	 * @returns {XlsDownloaderInterface} - класс для скачивания xls файлов
	 */
	getXlsDownloader(): XlsDownloaderInterface {
		return this.xlsDownloader;
	}

	private static convertGroupsToTeachers(
		groups: Map<string, Group>,
	): Map<string, Teacher> {
		const result = new Map<string, Teacher>();

		for (const groupName of groups.keys()) {
			const group = groups.get(groupName);

			for (const day of group.days) {
				for (const lesson of day.lessons) {
					if (lesson.type !== LessonType.DEFAULT) continue;

					for (const subGroup of lesson.subGroups) {
						let teacherDto: Teacher = result.get(subGroup.teacher);

						if (!teacherDto) {
							teacherDto = new Teacher({
								name: subGroup.teacher,
								days: [],
							});

							result.set(subGroup.teacher, teacherDto);
						}

						let teacherDay = teacherDto.days[
							day.name
						] as TeacherDay;

						if (!teacherDay) {
							teacherDay = teacherDto.days[day.name] =
								new TeacherDay({
									name: day.name,
									date: day.date,
									lessons: [],
								});
						}

						const teacherLesson = structuredClone(
							lesson,
						) as TeacherLesson;
						teacherLesson.group = groupName;

						teacherDay.lessons.push(teacherLesson);
					}
				}
			}
		}

		for (const teacherName of result.keys()) {
			const teacher = result.get(teacherName);

			const days = teacher.days;

			// eslint-disable-next-line @typescript-eslint/no-for-in-array
			for (const dayName in days) {
				const day = days[dayName];

				// eslint-disable-next-line @typescript-eslint/no-array-delete
				delete days[dayName];

				day.lessons.sort(
					(a, b) => a.time.start.valueOf() - b.time.start.valueOf(),
				);

				days.push(day);
			}

			days.sort((a, b) => a.date.valueOf() - b.date.valueOf());
		}

		return result;
	}

	/**
	 * Возвращает текущее расписание
	 * @returns {ScheduleParseResult} - расписание
	 * @async
	 */
	async getSchedule(): Promise<ScheduleParseResult> {
		const headData = await this.xlsDownloader.fetch(true);
		this.xlsDownloader.verifyFetchResult(headData);

		assert(headData.type === "success");

		const replacer = this.scheduleReplacerService
			? await this.scheduleReplacerService.getByEtag(headData.etag)
			: null;

		if (this.lastResult && this.lastResult.etag === headData.etag) {
			if (!replacer) return this.lastResult;

			if (this.lastResult.replacerId === replacer.id)
				return this.lastResult;
		}

		const buffer = async () => {
			if (replacer) return replacer.data;

			const downloadData = await this.xlsDownloader.fetch(false);
			this.xlsDownloader.verifyFetchResult(downloadData);

			assert(downloadData.type === "success");

			return downloadData.data;
		};

		const workBook = XLSX.read(await buffer());
		const workSheet = workBook.Sheets[workBook.SheetNames[0]];

		const { groupSkeletons, daySkeletons } =
			ScheduleParser.parseSkeleton(workSheet);

		const groups = new Map<string, Group>();

		const daysTimes: Array<Array<InternalTime>> = [];
		let daysTimesFilled = false;

		const saturdayEndRow = XLSX.utils.decode_range(workSheet["!ref"] || "")
			.e.r;

		for (const groupSkeleton of groupSkeletons) {
			const group = new Group();
			group.name = groupSkeleton.name;
			group.days = [];

			for (let dayIdx = 0; dayIdx < daySkeletons.length; ++dayIdx) {
				const daySkeleton = daySkeletons[dayIdx];
				const day = new Day();
				{
					const daySpaceIndex = daySkeleton.name.indexOf(" ");
					day.name = daySkeleton.name.substring(0, daySpaceIndex);

					const dateString = daySkeleton.name.substring(
						daySpaceIndex + 1,
					);
					const parseableDateString = `${dateString.substring(3, 5)}.${dateString.substring(0, 2)}.${dateString.substring(6)}`;
					day.date = new Date(Date.parse(parseableDateString));

					day.lessons = [];
				}

				const lessonTimeColumn = daySkeletons[0].column + 1;
				const rowDistance =
					(dayIdx !== daySkeletons.length - 1
						? daySkeletons[dayIdx + 1].row
						: saturdayEndRow) - daySkeleton.row;

				const dayTimes = daysTimesFilled
					? (daysTimes[day.name] as Array<InternalTime>)
					: [];

				if (!daysTimesFilled) {
					for (
						let row = daySkeleton.row;
						row < daySkeleton.row + rowDistance;
						++row
					) {
						const time = ScheduleParser.getCellData(
							workSheet,
							row,
							lessonTimeColumn,
						)?.replaceAll(/[\s\t\n\r]/g, "");

						if (!time) continue;

						// type
						const lessonType = time.includes("пара")
							? LessonType.DEFAULT
							: LessonType.ADDITIONAL;

						const defaultIndex =
							lessonType === LessonType.DEFAULT ? +time[0] : null;

						// time
						const timeRange = new LessonTime({
							start: new Date(day.date),
							end: new Date(day.date),
						});

						const timeString = time.replaceAll(".", ":");
						const timeRegex = /(\d+:\d+)-(\d+:\d+)/g;

						const parseResult = timeRegex.exec(timeString);
						if (!parseResult) {
							throw new Error(
								"Не удалось узнать начало и конец пар!",
							);
						}

						const startStrings = parseResult[1].split(":");
						timeRange.start.setHours(+startStrings[0]);
						timeRange.start.setMinutes(+startStrings[1]);

						const endStrings = parseResult[2].split(":");
						timeRange.end.setHours(+endStrings[0]);
						timeRange.end.setMinutes(+endStrings[1]);

						dayTimes.push({
							timeRange: timeRange,

							lessonType: lessonType,
							defaultIndex: defaultIndex,

							xlsxRange: ScheduleParser.getMergeFromStart(
								workSheet,
								row,
								lessonTimeColumn,
							),
						} as InternalTime);
					}

					daysTimes[day.name] = dayTimes;
				}

				for (const time of dayTimes) {
					const lessonsOrStreet = ScheduleParser.parseLesson(
						workSheet,
						day,
						dayTimes,
						time,
						groupSkeleton.column,
					);

					if (typeof lessonsOrStreet === "string") {
						day.street = lessonsOrStreet;
						continue;
					}

					for (const lesson of lessonsOrStreet)
						day.lessons.push(lesson);
				}

				group.days.push(day);
			}

			if (!daysTimesFilled) daysTimesFilled = true;

			groups.set(group.name, group);
		}

		const updatedGroups = ScheduleParser.getUpdatedGroups(
			this.lastResult?.groups,
			groups,
		);

		const teachers = ScheduleParser.convertGroupsToTeachers(groups);

		return (this.lastResult = {
			downloadedAt: headData.requestedAt,
			uploadedAt: headData.uploadedAt,

			etag: headData.etag,
			replacerId: replacer?.id,

			groups: groups,
			teachers: teachers,

			updatedGroups:
				updatedGroups.length === 0
					? (this.lastResult?.updatedGroups ?? [])
					: updatedGroups,

			updatedTeachers: [], // TODO: Вернуть эту фичу
		});
	}

	private static readonly consultationRegExp = /\(?[кК]онсультация\)?/;
	private static readonly otherStreetRegExp = /^[А-Я][а-я]+,?\s?[0-9]+$/;

	private static parseLesson(
		workSheet: XLSX.Sheet,
		day: Day,
		dayTimes: Array<InternalTime>,
		time: InternalTime,
		column: number,
	): Array<Lesson> | string {
		const row = time.xlsxRange.s.r;

		// name
		let rawName = trimAll(
			ScheduleParser.getCellData(workSheet, row, column)?.replaceAll(
				/[\n\r]/g,
				" ",
			) ?? "",
		);

		if (rawName.length === 0) return [];

		const lessonData = {} as ClassProperties<Lesson>;

		if (this.otherStreetRegExp.test(rawName)) return rawName;
		else if (rawName.includes("ЭКЗАМЕН")) {
			lessonData.type = LessonType.EXAM_DEFAULT;
			rawName = trimAll(rawName.replace("ЭКЗАМЕН", ""));
		} else if (rawName.includes("ЗАЧЕТ С ОЦЕНКОЙ")) {
			lessonData.type = LessonType.EXAM_WITH_GRADE;
			rawName = trimAll(rawName.replace("ЗАЧЕТ С ОЦЕНКОЙ", ""));
		} else if (rawName.includes("ЗАЧЕТ")) {
			lessonData.type = LessonType.EXAM;
			rawName = trimAll(rawName.replace("ЗАЧЕТ", ""));
		} else if (rawName.includes("(консультация)")) {
			lessonData.type = LessonType.CONSULTATION;
			rawName = trimAll(rawName.replace("(консультация)", ""));
		} else if (this.consultationRegExp.test(rawName)) {
			lessonData.type = LessonType.CONSULTATION;
			rawName = trimAll(rawName.replace(this.consultationRegExp, ""));
		} else if (rawName.includes("САМОСТОЯТЕЛЬНАЯ РАБОТА")) {
			lessonData.type = LessonType.INDEPENDENT_WORK;
			rawName = trimAll(rawName.replace("САМОСТОЯТЕЛЬНАЯ РАБОТА", ""));
		} else lessonData.type = time.lessonType;

		lessonData.defaultRange =
			time.defaultIndex !== null
				? [time.defaultIndex, time.defaultIndex]
				: null;

		// check if multi-lesson
		const range = this.getMergeFromStart(workSheet, row, column);
		const endTime = dayTimes.filter((dayTime) => {
			return dayTime.xlsxRange.e.r === range.e.r;
		})[0];

		lessonData.time = new LessonTime({
			start: time.timeRange.start,
			end: endTime?.timeRange.end ?? time.timeRange.end,
		});

		if (lessonData.defaultRange !== null)
			lessonData.defaultRange[1] =
				endTime?.defaultIndex ?? time.defaultIndex;

		// name and subGroups (subGroups unfilled)
		{
			const nameAndGroups = ScheduleParser.parseNameAndSubGroups(
				rawName ?? "",
			);

			lessonData.name = nameAndGroups.name;
			lessonData.subGroups = nameAndGroups.subGroups;
		}

		// cabinets
		{
			const cabinets = ScheduleParser.parseCabinets(
				workSheet,
				row,
				column + 1,
			);

			// Если количество кабинетов равно 1, назначаем этот кабинет всем подгруппам
			if (cabinets.length === 1) {
				// eslint-disable-next-line @typescript-eslint/no-for-in-array
				for (const index in lessonData.subGroups)
					lessonData.subGroups[index].cabinet = cabinets[0] ?? "";
			}
			// Если количество кабинетов совпадает с количеством подгрупп, назначаем кабинеты по порядку
			else if (cabinets.length === lessonData.subGroups.length) {
				// eslint-disable-next-line @typescript-eslint/no-for-in-array
				for (const index in lessonData.subGroups) {
					lessonData.subGroups[index].cabinet =
						cabinets[lessonData.subGroups[index].number - 1] ??
						cabinets[0] ??
						"";
				}
			}
			// Если количество кабинетов не равно нулю, но не совпадает с количеством подгрупп
			else if (cabinets.length !== 0) {
				// Если кабинетов больше, чем подгрупп, добавляем новые подгруппы с ошибкой
				if (cabinets.length > lessonData.subGroups.length) {
					// eslint-disable-next-line @typescript-eslint/no-for-in-array
					for (const index in cabinets) {
						if (lessonData.subGroups[index] === undefined) {
							lessonData.subGroups.push(
								plainToInstance(LessonSubGroup, {
									number: +index + 1,
									teacher: "Ошибка в расписании",
									cabinet: cabinets[index],
								} as LessonSubGroup),
							);

							continue;
						}

						lessonData.subGroups[index].cabinet = cabinets[index];
					}
				}
				// Если кабинетов меньше, чем подгрупп, выбрасываем ошибку
				else throw new Error("Разное кол-во кабинетов и подгрупп!");
			}
			// Если кабинетов нет, но есть подгруппы, назначаем им значение "??"
			else if (lessonData.subGroups.length !== 0) {
				for (const subGroup of lessonData.subGroups)
					subGroup.cabinet = "??";
			}
		}

		const prevLesson =
			(day.lessons?.length ?? 0) === 0
				? null
				: day.lessons[day.lessons.length - 1];

		if (!prevLesson) return [lessonData];

		return [
			new Lesson({
				type: LessonType.BREAK,
				defaultRange: null,
				name: null,
				time: new LessonTime({
					start: prevLesson.time.end,
					end: lessonData.time.start,
				}),
				subGroups: [],
			}),
			new Lesson(lessonData),
		];
	}

	private static parseCabinets(
		workSheet: WorkSheet,
		row: number,
		column: number,
	) {
		const cabinets: Array<string> = [];
		{
			const rawCabinets = ScheduleParser.getCellData(
				workSheet,
				row,
				column,
			);

			if (rawCabinets) {
				const parts = rawCabinets.split(/(\n|\s)/g);

				for (const cabinet of parts) {
					if (!toNormalString(cabinet)) continue;

					cabinets.push(cabinet.replaceAll(/[\n\s\r]/g, " "));
				}
			}
		}
		return cabinets;
	}

	private static getUpdatedGroups(
		cachedGroups: Map<string, Group> | null,
		currentGroups: Map<string, Group>,
	): Array<Array<number>> {
		if (!cachedGroups) return [];

		const updatedGroups = [];

		for (const name of cachedGroups.keys()) {
			const cachedGroup = cachedGroups.get(name);
			const currentGroup = currentGroups.get(name);

			const affectedGroupDays: Array<number> = [];

			// eslint-disable-next-line @typescript-eslint/no-for-in-array
			for (const dayIdx in currentGroup.days) {
				if (
					objectHash.sha1(currentGroup.days[dayIdx]) !==
					objectHash.sha1(cachedGroup.days[dayIdx])
				)
					affectedGroupDays.push(+dayIdx);
			}

			updatedGroups[name] = affectedGroupDays;
		}

		return updatedGroups;
	}
}
