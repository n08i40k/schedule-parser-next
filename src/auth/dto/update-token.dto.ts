import { PickType } from "@nestjs/swagger";
import User from "../../users/entity/user.entity";

export default class UpdateTokenDto extends PickType(User, ["accessToken"]) {}
