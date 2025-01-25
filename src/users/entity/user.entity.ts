import {
	IsEnum,
	IsJWT,
	IsMongoId,
	IsNumber,
	IsObject,
	IsOptional,
	IsSemVer,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import { plainToInstance, Type } from "class-transformer";
import UserRole from "../user-role.enum";

import FCM from "./fcm-user.entity";
import UserDto from "../dto/user.dto";

export default class User {
	/**
	 * Идентификатор (ObjectId)
	 * @example "66e1b7e255c5d5f1268cce90"
	 */
	@IsMongoId()
	id: string;

	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	username: string;

	/**
	 * Хеш пароля
	 * @example "$2b$08$34xwFv1WVJpvpVi3tZZuv."
	 */
	@IsString()
	password: string;

	/**
	 * Последний токен доступа
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@IsJWT()
	accessToken: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	group: string;

	/**
	 * Роль
	 * @example STUDENT
	 */
	@IsEnum(UserRole)
	role: UserRole;

	/**
	 * Данные Firebase Cloud Messaging
	 */
	@IsObject()
	@Type(() => FCM)
	@IsOptional()
	fcm?: FCM;

	/**
	 * Версия установленного приложения
	 * @example "2.0.0"
	 */
	@IsSemVer()
	version: string;

	/**
	 * Идентификатор аккаунта VK
	 * @example "2.0.0"
	 */
	@IsNumber()
	vkId?: number;

	static fromPlain(plain: object): User {
		return plainToInstance(User, plain);
	}

	toDto(groups: Array<string> = []): UserDto {
		return plainToInstance(UserDto, this, { groups: groups });
	}
}
