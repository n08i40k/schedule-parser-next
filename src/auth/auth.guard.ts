import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { Reflector } from "@nestjs/core";
import { AuthRoles, AuthUnauthorized } from "./auth-role.decorator";
import { isJWT } from "class-validator";
import { FastifyRequest } from "fastify";

interface JWTUser {
	id: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
	) {}

	public static extractTokenFromRequest(req: FastifyRequest): string {
		const [type, token] = req.headers.authorization?.split(" ") ?? [];

		if (type !== "Bearer" || !token || token.length === 0) return null;

		return token;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (this.reflector.get(AuthUnauthorized, context.getHandler()))
			return true;

		const request: FastifyRequest = context.switchToHttp().getRequest();
		const token = AuthGuard.extractTokenFromRequest(request);

		if (!token || !isJWT(token)) throw new UnauthorizedException();

		const jwtUser = await this.jwtService
			.verifyAsync<JWTUser>(token)
			.catch((): JWTUser => null);
		if (!jwtUser) throw new UnauthorizedException();

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user) throw new UnauthorizedException();

		const acceptableRoles = this.reflector.get(
			AuthRoles,
			context.getHandler(),
		);

		return !(acceptableRoles && !acceptableRoles.includes(user.role));
	}
}
