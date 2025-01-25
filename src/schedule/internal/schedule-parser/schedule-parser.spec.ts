import { ScheduleParser, ScheduleParseResult } from "./schedule-parser";
import { BasicXlsDownloader } from "../xls-downloader/basic-xls-downloader";
import Day from "../../entities/day.entity";
import Group from "../../entities/group.entity";
import instanceToInstance2 from "../../../utility/class-trasformer/instance-to-instance-2";

describe("ScheduleParser", () => {
	let parser: ScheduleParser;

	beforeEach(() => {
		const xlsDownloader = new BasicXlsDownloader();
		parser = new ScheduleParser(xlsDownloader);
	});

	describe("Ошибки", () => {
		it("Должен вернуть ошибку из-за отсутствия ссылки на скачивание", async () => {
			await expect(() => parser.getSchedule()).rejects.toThrow();
		});
	});

	async function setLink(link: string): Promise<void> {
		await parser.getXlsDownloader().setDownloadUrl(link);
	}

	const defaultTest = async () => {
		const schedule = await parser.getSchedule();

		expect(schedule).toBeDefined();
	};

	const nameTest = async () => {
		const schedule = await parser.getSchedule();
		expect(schedule).toBeDefined();

		const group: Group | undefined = schedule.groups.get("ИС-214/23");
		expect(group).toBeDefined();

		const monday: Day = group.days[0];
		expect(monday).toBeDefined();

		const name = monday.name;
		expect(name).toBeDefined();
		expect(name.length).toBeGreaterThan(0);
	};
	//
	// function mapReplacer(key: any, value: any) {
	// 	if (value instanceof Map) {
	// 		return Array.from(value.entries());
	// 	} else {
	// 		return value;
	// 	}
	// }

	describe("Расписание", () => {
		beforeEach(async () => {
			await setLink(
				"https://politehnikum-eng.ru/2024/poltavskaja_15_s_9_po_13.12-1-.xls",
			);
		});

		it("Должен вернуть расписание", defaultTest);
		it("Название дня не должно быть пустым или null", nameTest);

		it("Зачёт с оценкой v2", async () => {
			const schedule = await parser.getSchedule().then((v) =>
				instanceToInstance2(ScheduleParseResult, v, {
					groups: ["v2"],
				}),
			);
			expect(schedule).toBeDefined();

			const group: Group | undefined = schedule.groups.get("ИС-114/23");
			expect(group).toBeDefined();

			const day = group.days[0];
			expect(day).toBeDefined();

			expect(day.lessons.length).toBeGreaterThan(0);
			expect(day.lessons[0].name).toBe("Линейка");
		});
	});
});
