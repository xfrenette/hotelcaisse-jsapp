import { serialize, deserialize } from 'serializr';
import Field from 'fields/Field';

let field;

beforeEach(() => {
	field = new Field();
	field.uuid = 'test-uuid';
	field.label = 'test-label';
	field.role = 'test-role';
	field.defaultValue = 'test-defaultValue';
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		field.required = true;
		data = serialize(field);
	});

	test('saves primitives', () => {
		expect(data).toEqual({
			type: field.type,
			uuid: field.uuid,
			label: field.label,
			role: field.role,
			required: field.required,
			defaultValue: field.defaultValue,
		});
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid-2',
		label: 'test-label-2',
		role: 'test-role-2',
		required: true,
		defaultValue: 'default-test',
	};

	beforeEach(() => {
		field = deserialize(Field, jsonObject);
	});

	test('restores primitives', () => {
		expect(field.uuid).toBe(jsonObject.uuid);
		expect(field.label).toBe(jsonObject.label);
		expect(field.required).toBe(jsonObject.required);
		expect(field.defaultValue).toBe(jsonObject.defaultValue);
	});
});

describe('validate()', () => {
	test('fails if value is required but "empty"', () => {
		const values = [undefined, null, '', ' '];
		field.required = true;
		values.forEach((value) => {
			expect(field.validate(value)).toEqual(expect.any(Array));
		});
	});

	test('validates if required and value set', () => {
		field.required = true;
		expect(field.validate('test')).toBeUndefined();
	});

	test('validates if not required', () => {
		const values = [undefined, null, '', ' '];
		field.required = false;
		values.forEach((value) => {
			expect(field.validate(value)).toBeUndefined();
		});
	});

	test('uses extra constraints', () => {
		const extraConstraints = { numericality: true };
		expect(field.validate('test', extraConstraints)).toEqual(expect.any(Array));
	});
});
