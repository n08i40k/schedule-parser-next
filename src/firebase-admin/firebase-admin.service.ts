import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";

import { initializeApp, App } from "firebase-admin/app";
import { credential } from "firebase-admin";
import {
	BaseMessage,
	getMessaging,
	Messaging,
	TopicMessage,
} from "firebase-admin/messaging";

import { firebaseConstants } from "../contants";
import { UsersService } from "../users/users.service";

import User from "../users/entity/user.entity";
import { TokenMessage } from "firebase-admin/lib/messaging/messaging-api";
import FCM from "../users/entity/fcm-user.entity";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
	) {}

	private app: App;
	private messaging: Messaging;

	private readonly defaultTopics = new Set(["common"]);

	onModuleInit() {
		this.app = initializeApp({
			credential: credential.cert(firebaseConstants.serviceAccountPath),
		});
		this.messaging = getMessaging(this.app);
	}

	async sendByTopic(topic: string, message: BaseMessage): Promise<void> {
		const topicMessage = message as TopicMessage;
		topicMessage.topic = topic;

		await this.send(topicMessage);
	}

	async send(message: TopicMessage | TokenMessage): Promise<void> {
		await this.messaging.send(message);
	}

	private async getFcm(user: User, token: string): Promise<FCM> {
		const userToFCM = (user: User) =>
			user.fcm ? FCM.fromObject(user.fcm) : null;

		const fcm = await this.usersService
			.findUnique({
				where: { id: user.id },
				include: { fcm: true },
			})
			.then(userToFCM);

		if (fcm) return FCM.fromObject(fcm);

		return await this.usersService
			.update({
				where: { id: user.id },
				data: { fcm: { create: { token: token, topics: [] } } },
				include: { fcm: true },
			})
			.then(userToFCM);
	}

	async updateToken(user: User, token: string): Promise<User> {
		const fcm = await this.getFcm(user, token);

		if (user.fcm !== null) {
			if (fcm.token === token) {
				user.fcm = fcm;
				return user;
			}

			for (const topic of fcm.topics)
				await this.messaging.subscribeToTopic(token, topic);
			fcm.token = token;
		}

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: { update: { token: fcm.token } } },
			include: { fcm: true },
		});
	}

	async unsubscribe(user: User, topics: Set<string>): Promise<User> {
		if (!user.fcm) throw new Error("User does not have fcm data!");

		const fcm = user.fcm;
		const userTopics = new Set<string>([...fcm.topics]);

		for (const topic of topics) {
			if (!fcm.topics.includes(topic)) continue;

			await this.messaging.unsubscribeFromTopic(fcm.token, topic);
			userTopics.delete(topic);
		}
		if (userTopics.size === fcm.topics.length) return user;

		fcm.topics = Array.from(userTopics);

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: { update: { topics: fcm.topics } } },
			include: { fcm: true },
		});
	}

	async subscribe(
		user: User,
		topics: Set<string>,
		force: boolean = false,
	): Promise<User> {
		const additionalTopics = new Set([...this.defaultTopics, ...topics]);

		const fcm = user.fcm;
		const newTopics = new Set(fcm.topics);

		for (const topic of additionalTopics) {
			if (force)
				await this.messaging.unsubscribeFromTopic(fcm.token, topic);
			else if (fcm.topics.includes(topic)) continue;

			newTopics.add(topic);

			await this.messaging.subscribeToTopic(fcm.token, topic);
		}

		if (newTopics.size === fcm.topics.length) return user;

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: { update: { topics: Array.from(newTopics) } } },
			include: { fcm: true },
		});
	}

	async updateApp(user: User, version: string): Promise<void> {
		await this.subscribe(user, new Set(), true).then(async (userDto) => {
			await this.usersService.update({
				where: { id: userDto.id },
				data: { version: version },
			});
		});
	}
}
