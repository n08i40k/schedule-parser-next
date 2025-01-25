import { IsString } from "class-validator";
import {
	ClassTransformerCtor,
	Ctor,
} from "../../utility/class-trasformer/class-transformer-ctor";

@ClassTransformerCtor()
export default class OAuthResponseDto extends Ctor<OAuthResponseDto> {
	@IsString()
	accessToken: string;
}
