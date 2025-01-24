import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from "class-validator";

// noinspection FunctionNamingConventionJS
export function NullIf(
	canBeNull: (cls: object) => boolean,
	validationOptions?: ValidationOptions,
) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "nullIf",
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [canBeNull],
			validator: {
				validate(value: any, args: ValidationArguments) {
					const canBeNull = (
						args.constraints[0] as (cls: object) => boolean
					)(args.object);

					// Логика валидации: если одно из полей null, то другое тоже должно быть null
					return canBeNull ? value !== null : value === null;
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be ${args.property === null ? "non-null" : "null"}!`;
				},
			},
		});
	};
}
