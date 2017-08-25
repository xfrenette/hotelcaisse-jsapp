import { deserialize, serialize } from 'serializr';
import { isObservable } from 'mobx';
import Customer from 'business/Customer';
import { TextField } from 'fields';
import { fieldValues as fieldValuesSerializer } from 'vendor/serializr/propSchemas';

let customer;
let field;

beforeEach(() => {
	field = new TextField();
	field.id = 123;

	customer = new Customer();
	customer.fieldValues.set(field.id, 'two');
	customer.fieldValues.set('three', 4);
});

describe('fieldValues', () => {
	test('is observable', () => {
		expect(isObservable(customer, 'fieldValues')).toBe(true);
	});
});

describe('getFieldValue()', () => {
	test('returns null if field is unknown', () => {
		const newField = new TextField();
		newField.id = 456;
		expect(customer.getFieldValue(newField)).toBeNull();
	});

	test('returns value if field exists', () => {
		customer.fieldValues.set(field.id, false);
		expect(customer.getFieldValue(field)).toBe(false);
	});
});

describe('setFieldValue()', () => {
	test('sets the field value', () => {
		const value = 'test-value';
		customer.setFieldValue(field, value);
		expect(customer.getFieldValue(field)).toBe(value);
	});
});

describe('get()', () => {
	test('returns null if role is unknown', () => {
		expect(customer.get('test.nonexisting')).toBeNull();
	});

	test('returns value if role exists', () => {
		const role = 'test.role';
		field.role = role;
		customer.fields = [field];
		expect(customer.get(role)).toBe(customer.getFieldValue(field));
	});
});

describe('clone()', () => {
	let clone;

	beforeEach(() => {
		clone = customer.clone();
	});

	test('returns different Customer', () => {
		expect(clone).toBeInstanceOf(Customer);
		expect(clone).not.toBe(customer);
	});

	test('has same fieldValues but different instances', () => {
		expect(clone.fieldValues).toEqual(customer.fieldValues);
		expect(clone.fieldValues).not.toBe(customer.fieldValues);
	});
});

describe('isEqualTo()', () => {
	let other;

	beforeEach(() => {
		customer.fieldValues.replace({ a: 'b' });
		other = customer.clone();
	});

	test('returns true if equal', () => {
		expect(customer.isEqualTo(other)).toBe(true);
	});

	describe('returns false if', () => {
		test('different fieldValues', () => {
			other.fieldValues.set('a', `${customer.fieldValues.a} (other)`);
			expect(customer.isEqualTo(other)).toBe(false);
		});
	});
});

describe('validate()', () => {
	beforeEach(() => {
		field.required = true;
		customer.fields = [field];
	});

	test('returns undefined if fields is not set', () => {
		customer.fields = [];
		expect(customer.validate()).toBeUndefined();
	});

	test('returns an object if a field is in error', () => {
		customer.setFieldValue(field, '');
		const res = customer.validate();
		expect(res).toEqual({
			[field.id]: expect.any(Array),
		});
	});

	test('returns undefined if all valid', () => {
		customer.setFieldValue(field, 'valid value');
		const res = customer.validate();
		expect(res).toBeUndefined();
	});
});

describe('serializing', () => {
	let data;
	const fieldValues = {
		a: 'b',
		c: 2,
	};

	beforeEach(() => {
		customer = new Customer();
		customer.fieldValues.replace(fieldValues);
		data = serialize(customer);
	});
	test('saves fieldValues', () => {
		const expected = fieldValuesSerializer().serializer(customer.fieldValues);
		expect(data.fieldValues).toEqual(expected);
	});
});

describe('deserializing', () => {
	let restoredCustomer;
	const data = {
		fieldValues: [
			{ fieldId: 'd', value: 'e' },
			{ fieldId: 'f', value: 4 },
		],
	};

	beforeEach(() => {
		restoredCustomer = deserialize(Customer, data);
	});

	test('restores fieldValues', () => {
		expect(Array.from(restoredCustomer.fieldValues.keys())).toEqual(['d', 'f']);
		expect(Array.from(restoredCustomer.fieldValues.values())).toEqual(['e', 4]);
	});
});
