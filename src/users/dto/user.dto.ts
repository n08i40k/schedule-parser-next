import {
	IsEnum,
	IsJWT,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import { Exclude, Expose, plainToInstance } from "class-transformer";
import UserRole from "../user-role.enum";

@Exclude()
export default class UserDto {
	/**
	 * Идентификатор (ObjectId)
	 * @example "66e1b7e255c5d5f1268cce90"
	 */
	@Expose()
	@IsMongoId()
	id: string;

	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@Expose()
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	username: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@Expose()
	@IsString()
	group: string;

	/**
	 * Роль
	 * @example STUDENT
	 */
	@Expose()
	@IsEnum(UserRole)
	role: UserRole;

	/**
	 * Идентификатор аккаунта VK
	 * @example "2.0.0"
	 */
	@Expose()
	@IsNumber()
	@IsOptional()
	vkId?: number;

	/**
	 * Последний токен доступа
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@Expose({ groups: ["auth"] })
	@IsJWT({ groups: ["auth"] })
	accessToken: string;

	static fromPlain(plain: object, groups: Array<string> = []): UserDto {
		return plainToInstance(UserDto, plain, { groups: groups });
	}
}
