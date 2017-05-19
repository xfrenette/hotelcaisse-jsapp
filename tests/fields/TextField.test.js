import TextField from 'fields/TextField';

let field;

beforeEach(() => {
	field = new TextField();
	field.uuid = 'test-uuid';
	field.name = 'test-name';
	field.value = 'test-value';
});

describe('validate()', () => {
	test('rejects invalid', () => {
		expect(field.validate(2)).toEqual(expect.any(Array));
	});

	test('accepts valid', () => {
		expect(field.validate('valid')).toBeUndefined();
	});
});
