import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidatorOptions } from "class-validator";
import { PartialValidationPipe } from "./utility/validation/partial-validation.pipe";
import { ClassValidatorInterceptor } from "./utility/validation/class-validator.interceptor";
import { apiConstants } from "./contants";
import { VersioningType } from "@nestjs/common";
import {
	FastifyAdapter,
	NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);
	const validatorOptions: ValidatorOptions = {
		enableDebugMessages: true,
		forbidNonWhitelisted: true,
		strictGroups: true,
	};
	app.useGlobalPipes(new PartialValidationPipe(validatorOptions));
	app.useGlobalInterceptors(new ClassValidatorInterceptor(validatorOptions));
	app.enableCors();

	app.setGlobalPrefix("api");
	app.enableVersioning({ type: VersioningType.URI });

	const swaggerConfig = new DocumentBuilder()
		.setTitle("Schedule Parser")
		.setDescription(
			"API для парсинга и управления расписанием учебных занятий",
		)
		.setVersion(apiConstants.version)
		.build();

	const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
		deepScanRoutes: true,
	});

	swaggerDocument.servers = [
		{
			url: "https://polytechnic-dev.n08i40k.ru",
			description: "Сервер для разработки и тестирования",
		},
		{
			url: "https://polytechnic.n08i40k.ru",
			description: "Сервер для продакшн окружения",
		},
	];

	SwaggerModule.setup("api-docs", app, swaggerDocument, {});

	await app.listen(apiConstants.port);
}

bootstrap().then();
