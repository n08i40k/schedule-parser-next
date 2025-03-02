import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BasicXlsDownloader } from "./internal/xls-downloader/basic-xls-downloader";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { plainToInstance } from "class-transformer";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { scheduleConstants } from "../contants";
import {
	ScheduleParser,
	ScheduleParseResult,
} from "./internal/schedule-parser/schedule-parser";
import * as objectHash from "object-hash";
import CacheStatusDto from "./dto/cache-status.dto";
import Schedule from "./entities/schedule.entity";
import GroupSchedule from "./entities/group-schedule.entity";
import TeacherSchedule from "./entities/teacher-schedule.entity";
import GetGroupNamesDto from "./dto/get-group-names.dto";
import TeacherNamesDto from "./dto/teacher-names.dto";

/**
 * Сервис для работы с расписанием
 */
@Injectable()
export class ScheduleService {
	readonly scheduleParser: ScheduleParser;

	private cacheUpdatedAt: Date = new Date(0);
	private cacheHash: string = "0000000000000000000000000000000000000000";

	private scheduleUpdatedAt: Date = new Date(0);

	/**
	 * Конструктор сервиса
	 * @param cacheManager Менеджер кэша
	 * @param scheduleReplacerService Сервис замены расписания
	 * @param firebaseAdminService Сервис работы с Firebase
	 */
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly scheduleReplacerService: ScheduleReplacerService,
		private readonly firebaseAdminService: FirebaseAdminService,
	) {
		setInterval(() => {
			const now = new Date();
			if (now.getHours() != 7 || now.getMinutes() != 30) return;

			this.firebaseAdminService
				.sendByTopic("common", {
					android: {
						priority: "high",
						ttl: 60 * 60 * 1000,
					},
					data: {
						type: "lessons-start",
					},
				})
				.then();
		}, 60000);

		this.scheduleParser = new ScheduleParser(
			new BasicXlsDownloader(),
			this.scheduleReplacerService,
		);
	}

	/**
	 * Получение статуса кэша
	 * @returns Объект с информацией о состоянии кэша
	 */
	getCacheStatus(): CacheStatusDto {
		return plainToInstance(CacheStatusDto, {
			cacheHash: this.cacheHash,
			cacheUpdateRequired:
				(Date.now() - this.cacheUpdatedAt.valueOf()) / 1000 / 60 >=
				scheduleConstants.cacheInvalidateDelay,
			lastCacheUpdate: this.cacheUpdatedAt.valueOf(),
			lastScheduleUpdate: this.scheduleUpdatedAt.valueOf(),
		});
	}

	/**
	 * Получение исходного расписания
	 * @returns Результат парсинга расписания
	 */
	async getSourceSchedule(): Promise<ScheduleParseResult> {
		const schedule = await this.scheduleParser.getSchedule();

		this.cacheUpdatedAt = new Date();

		const oldHash = this.cacheHash;
		this.cacheHash = objectHash.sha1(schedule.etag);

		if (this.cacheHash !== oldHash) {
			if (this.scheduleUpdatedAt.valueOf() !== 0) {
				const isReplaced = await this.scheduleReplacerService.hasByEtag(
					schedule.etag,
				);

				await this.firebaseAdminService.sendByTopic("common", {
					data: {
						type: "schedule-update",
						replaced: isReplaced.toString(),
						etag: schedule.etag,
					},
				});
			}
			this.scheduleUpdatedAt = new Date();
		}

		return schedule;
	}

	/**
	 * Получение расписания
	 * @returns Объект расписания
	 */
	async getSchedule(): Promise<Schedule> {
		const sourceSchedule = await this.getSourceSchedule();

		return {
			updatedAt: this.cacheUpdatedAt,
			groups: sourceSchedule.groups,
			updatedGroups: sourceSchedule.updatedGroups ?? [],
		};
	}

	/**
	 * Получение расписания для группы
	 * @param name Название группы
	 * @returns Расписание группы
	 * @throws NotFoundException Если группа не найдена
	 */
	async getGroup(name: string): Promise<GroupSchedule> {
		const schedule = await this.getSourceSchedule();

		const group = schedule.groups.get(name);
		if (group === undefined) {
			throw new NotFoundException(
				"Группы с таким названием не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			group: group,
			updated: (schedule.updatedGroups[name] as Array<number>) ?? [],
		};
	}

	/**
	 * Получение списка названий групп
	 * @returns Объект с массивом названий групп
	 */
	async getGroupNames(): Promise<GetGroupNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name of schedule.groups.keys()) names.push(name);

		return plainToInstance(GetGroupNamesDto, {
			names: names,
		});
	}

	/**
	 * Получение расписания для преподавателя
	 * @param name ФИО преподавателя
	 * @returns Расписание преподавателя
	 * @throws NotFoundException Если преподаватель не найден
	 */
	async getTeacher(name: string): Promise<TeacherSchedule> {
		const schedule = await this.getSourceSchedule();

		const teacher = schedule.teachers.get(name);
		if (teacher === undefined) {
			throw new NotFoundException(
				"Преподавателя с таким ФИО не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			teacher: teacher,
			updated: (schedule.updatedGroups[name] as Array<number>) ?? [],
		};
	}

	/**
	 * Получение списка ФИО преподавателей
	 * @returns Объект с массивом ФИО преподавателей
	 */
	async getTeacherNames(): Promise<TeacherNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name of schedule.teachers.keys()) {
			if (name === "Ошибка в расписании" || name === "Только у другой")
				continue;
			names.push(name);
		}

		return plainToInstance(TeacherNamesDto, {
			names: names,
		});
	}

	/**
	 * Обновление URL для загрузки расписания
	 * @param url Новый URL
	 * @returns Объект с информацией о состоянии кэша
	 */
	async updateDownloadUrl(url: string): Promise<CacheStatusDto> {
		await this.scheduleParser.getXlsDownloader().setDownloadUrl(url);

		await this.refreshCache();

		return this.getCacheStatus();
	}

	/**
	 * Обновление кэша
	 */
	async refreshCache() {
		await this.cacheManager.clear();

		await this.getSourceSchedule();
	}
}
