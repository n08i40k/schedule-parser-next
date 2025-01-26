import { Injectable } from "@nestjs/common";
import OAuthRequestDto from "./dto/oauth.request.dto";
import OAuthResponseDto from "./dto/oauth.response.dto";
import axios from "axios";
import { vkIdConstants } from "../contants";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class VKIDService {
	async oauth(oauthRequestDto: OAuthRequestDto): Promise<OAuthResponseDto> {
		const state = uuidv4();

		const response = await axios.post(
			"https://id.vk.com/oauth2/auth",
			"grant_type=authorization_code&" +
				`client_id=${vkIdConstants.clientId}&` +
				`state=${state}&` +
				`code_verifier=${oauthRequestDto.codeVerifier}&` +
				`code=${oauthRequestDto.code}&` +
				`device_id=${oauthRequestDto.deviceId}&` +
				`redirect_uri=${vkIdConstants.redirectUri}`,
		);

		const idToken: string = (response.data as { id_token: string })
			.id_token;

		if (!idToken) {
			console.error(response.data);
			return null;
		}

		return new OAuthResponseDto({
			accessToken: idToken,
		});
	}
}
