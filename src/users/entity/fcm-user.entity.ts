import { IsArray, IsString, ValidateNested } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ClassProperties } from "../../utility/class-trasformer/class-transformer-ctor";

// noinspection JSClassNamingConvention
export default class FCM {
	/**
	 * Токен Firebase Cloud Messaging
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@IsString()
	token: string;

	/**
	 * Топики на которые подписан пользователь
	 * @example ["schedule-update"]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@IsString()
	topics: Array<string>;

	static fromObject(object: ClassProperties<FCM>): FCM {
		return plainToInstance(FCM, object);
	}
}
