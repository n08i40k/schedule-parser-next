import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import User from "./entity/user.entity";

@Injectable()
export class UsersService {
	constructor(private readonly prismaService: PrismaService) {}

	async findUnique(where: Prisma.UserWhereUniqueInput): Promise<User>;
	async findUnique(args: Prisma.UserFindUniqueArgs): Promise<User>;

	async findUnique(
		args: Prisma.UserWhereUniqueInput | Prisma.UserFindUniqueArgs,
	): Promise<User> {
		return User.fromPlain(
			await this.prismaService.user.findUnique(
				"where" in args ? args : { where: args },
			),
		);
	}

	async findOne(where: Prisma.UserWhereInput): Promise<User> {
		return User.fromPlain(
			await this.prismaService.user.findFirst({ where: where }),
		);
	}

	async update(args: Prisma.UserUpdateArgs): Promise<User> {
		return User.fromPlain(await this.prismaService.user.update(args));
	}

	async create(data: Prisma.UserCreateInput): Promise<User> {
		return User.fromPlain(await this.prismaService.user.create({ data }));
	}

	async contains(where: Prisma.UserWhereInput): Promise<boolean> {
		return await this.prismaService.user
			.count({ where })
			.then((count) => count > 0);
	}
}
