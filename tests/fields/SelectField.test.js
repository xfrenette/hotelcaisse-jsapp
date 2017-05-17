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
});

describe('validate()', () => {
	test('rejects if value not in values', () => {
		expect(field.validate('__not-in-values')).toEqual(expect.any(Array));
	});

	test('accepts if value in values', () => {
		expect(field.validate('value1')).toBeUndefined();
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
