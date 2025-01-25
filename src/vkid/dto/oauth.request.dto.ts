import { IsString } from "class-validator";

export default class OAuthRequestDto {
	@IsString()
	code: string;

	@IsString()
	codeVerifier: string;

	@IsString()
	deviceId: string;
}
