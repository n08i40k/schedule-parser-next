
import {
	Body,
	Controller,
	HttpStatus,
	NotAcceptableException,
	Post,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VKIDService } from "./vkid.service";
import OAuthRequestDto from "./dto/oauth.request.dto";
import OAuthResponseDto from "./dto/oauth.response.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";

@ApiTags("v1/vkid")
@Controller({ path: "vkid", version: "1" })
export class VKIDController {
	constructor(private readonly vkidService: VKIDService) {}

	@ApiOperation({
		summary: "OAuth аутентификация",
		description: "Аутентификация пользователя с использованием OAuth",
	})
	@ApiBody({ type: OAuthRequestDto, description: "Данные для OAuth запроса" })
	@ApiResponse({
		status: HttpStatus.OK,
		type: OAuthResponseDto,
		description: "OAuth аутентификация прошла успешно",
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Ошибка в процессе OAuth",
	})
	@ResultDto(OAuthResponseDto)
	@Post("oauth")
	async oauth(
		@Body() oAuthRequestDto: OAuthRequestDto,
	): Promise<OAuthResponseDto> {
		const result = await this.vkidService.oauth(oAuthRequestDto);
		if (!result) throw new NotAcceptableException("OAuth process failed");

		return result;
	}
}
