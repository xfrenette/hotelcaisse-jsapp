import { serialize, deserialize } from 'serializr';
import SelectField from 'fields/SelectField';

let field;
const values = {
	value1: 'Value 1',
	value2: 'Value 2',
};

beforeEach(() => {
	field = new SelectField();
	field.uuid = 'test-uuid';
	field.name = 'test-name';
	field.values = values;
	field.value = 'value1';
});

describe('validate()', () => {
	test('rejects if value not in values', () => {
		field.value = '__not-in-values';
		expect(field.validate()).toEqual(expect.any(Array));
	});

	test('accepts if value in values', () => {
		field.value = 'value1';
		expect(field.validate()).toBeUndefined();
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		field.values = values;
		data = serialize(field);
	});

	test('saves values', () => {
		expect(data).toEqual(expect.objectContaining({
			values,
		}));
	});
});

describe('deserializing', () => {
	const jsonObject = {
		values,
	};

	beforeEach(() => {
		field = deserialize(SelectField, jsonObject);
	});

	test('restores values', () => {
		expect(field.values).toEqual(values);
	});
});
