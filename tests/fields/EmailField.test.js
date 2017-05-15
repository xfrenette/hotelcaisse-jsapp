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
		field.value = 'invalid';
		expect(field.validate()).toEqual(expect.any(Array));
	});

	test('accepts valid', () => {
		field.value = 'valid@bbb.com';
		expect(field.validate()).toBeUndefined();
	});
});
