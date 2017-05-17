import EmailField from 'fields/EmailField';

let field;

beforeEach(() => {
	field = new EmailField();
	field.uuid = 'test-uuid';
	field.name = 'test-name';
	field.value = 'aaa@bbb.com';
});

describe('validate()', () => {
	test('rejects invalid', () => {
		expect(field.validate('invalid')).toEqual(expect.any(Array));
	});

	test('accepts valid', () => {
		expect(field.validate('valid@bbb.com')).toBeUndefined();
	});
});
