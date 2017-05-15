import { serialize, deserialize } from 'serializr';
import Field from 'fields/Field';

let field;

beforeEach(() => {
	field = new Field();
	field.uuid = 'test-uuid';
	field.name = 'test-name';
	field.value = 'test-value';
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		field.required = true;
		data = serialize(field);
	});

	test('saves primitives', () => {
		expect(data).toEqual({
			uuid: field.uuid,
			name: field.name,
			value: field.value,
			required: field.required,
		});
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid-2',
		name: 'test-name-2',
		value: 'test-value-2',
		required: true,
	};

	beforeEach(() => {
		field = deserialize(Field, jsonObject);
	});

	test('restores primitives', () => {
		expect(field.uuid).toBe(jsonObject.uuid);
		expect(field.name).toBe(jsonObject.name);
		expect(field.value).toBe(jsonObject.value);
		expect(field.required).toBe(jsonObject.required);
	});
});

describe('validate()', () => {
	test('fails if value is required but "empty"', () => {
		const values = [undefined, null, '', ' '];
		field.required = true;
		values.forEach((value) => {
			field.value = value;
			expect(field.validate()).toEqual(expect.any(Array));
		});
	});

	test('validates if required and value set', () => {
		field.value = 'test';
		field.required = true;
		expect(field.validate()).toBeUndefined();
	});

	test('validates if not required', () => {
		const values = [undefined, null, '', ' '];
		field.required = false;
		values.forEach((value) => {
			field.value = value;
			expect(field.validate()).toBeUndefined();
		});
	});

	test('uses extra constraints', () => {
		const extraConstraints = { numericality: true };
		field.value = 'test';
		expect(field.validate(extraConstraints)).toEqual(expect.any(Array));
	});
});
