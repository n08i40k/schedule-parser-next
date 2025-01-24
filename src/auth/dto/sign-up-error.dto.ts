import { IsEnum } from "class-validator";

export enum SignUpErrorCode {
	USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
	VK_ALREADY_EXISTS = "VK_ALREADY_EXISTS",
	INVALID_VK_ACCESS_TOKEN = "INVALID_VK_ACCESS_TOKEN",
	INVALID_GROUP_NAME = "INVALID_GROUP_NAME",
	DISALLOWED_ROLE = "DISALLOWED_ROLE",
}

export default class SignUpErrorDto {
	@IsEnum(SignUpErrorCode)
	code: SignUpErrorCode;

	constructor(errorCode: SignUpErrorCode) {
		this.code = errorCode;
	}
}
