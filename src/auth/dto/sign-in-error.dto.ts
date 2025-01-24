import { IsEnum } from "class-validator";

export enum SignInErrorCode {
	INCORRECT_CREDENTIALS = "INCORRECT_CREDENTIALS",
	INVALID_VK_ACCESS_TOKEN = "INVALID_VK_ACCESS_TOKEN",
}

export default class SignInErrorDto {
	@IsEnum(SignInErrorCode)
	code: SignInErrorCode;

	constructor(errorCode: SignInErrorCode) {
		this.code = errorCode;
	}
}
