import "reflect-metadata";
import { plainToInstance } from "class-transformer";

export type ClassProperties<T> = {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	[K in keyof T]: T[K] extends Function ? never : T[K];
};

export class Ctor<T> {
	constructor(object: ClassProperties<T>) {
		if (object != undefined)
			throw new Error(
				"You should use ClassTransformerCtor decorator on class to use this feature!",
			);
	}
}

// noinspection FunctionNamingConventionJS
export function ClassTransformerCtor() {
	return function (target: any) {
		const newCtor: any = function (object: object) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
			const obj: any = new target();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			Object.assign(obj, plainToInstance(target, object));

			return obj;
		};

		return newCtor;
	};
}
