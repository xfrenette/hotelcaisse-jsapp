import { serialize, deserialize } from 'serializr';
import NumberField from 'fields/NumberField';

let field;
const constraints = {
	numericality: {
		onlyInteger: true,
	},
};

beforeEach(() => {
	field = new NumberField();
	field.uuid = 'test-uuid';
	field.name = 'test-name';
	field.value = 3;
});

describe('validate()', () => {
	test('uses constraints', () => {
		field.value = 3.1;
		field.constraints = {
			onlyInteger: true,
		};
		expect(field.validate()).toEqual(expect.any(Array));
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		field.constraints = constraints;
		data = serialize(field);
	});

	test('saves constraints', () => {
		expect(data).toEqual(expect.objectContaining({
			constraints: field.constraints,
		}));
	});
});

describe('deserializing', () => {
	const jsonObject = {
		constraints,
	};

	beforeEach(() => {
		field = deserialize(NumberField, jsonObject);
	});

	test('restores constraints', () => {
		expect(field.constraints).toEqual(constraints);
	});
});
