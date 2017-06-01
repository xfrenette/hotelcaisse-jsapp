import { serialize, deserialize } from 'serializr';
import Customer from 'business/Customer';
import { TextField } from 'fields';

let customer;
let field;

beforeEach(() => {
	field = new TextField();
	field.uuid = 'field-uuid';

	customer = new Customer('customer-uuid');
	customer.fieldValues = {
		[field.uuid]: 'two',
		three: 4,
	};
});

describe('construct', () => {
	test('sets uuid', () => {
		const uuid = 'test-uuid';
		customer = new Customer(uuid);
		expect(customer.uuid).toBe(uuid);
	});
});

describe('getFieldValue()', () => {
	test('returns null if field is unknown', () => {
		const newField = new TextField();
		newField.uuid = 'test-new-field';
		expect(customer.getFieldValue(newField)).toBeNull();
	});

	test('returns value if field exists', () => {
		customer.fieldValues[field.uuid] = false;
		expect(customer.getFieldValue(field)).toBe(false);
	});
});

describe.only('get()', () => {
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
		customer.fieldValues = {
			a: 'b',
		};
		other = customer.clone();
	});

	test('returns true if equal', () => {
		expect(customer.isEqualTo(other)).toBe(true);
	});

	describe('returns false if', () => {
		test('different uuid', () => {
			other.uuid = `${customer.uuid} (other)`;
			expect(customer.isEqualTo(other)).toBe(false);
		});

		test('different fieldValues', () => {
			other.fieldValues.a = `${customer.fieldValues.a} (other)`;
			expect(customer.isEqualTo(other)).toBe(false);
		});
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		customer = new Customer('customer-uuid');
		customer.fieldValues = {
			a: 'b',
			c: 2,
		};
		data = serialize(customer);
	});

	test('saves primitives', () => {
		expect(data.uuid).toBe(customer.uuid);
		expect(data.fieldValues).toEqual(customer.fieldValues);
	});
});

describe('deserializing', () => {
	let restoredCustomer;
	const data = {
		uuid: 'test-uuid',
		fieldValues: {
			d: 'e',
			f: 4,
		},
	};

	beforeEach(() => {
		restoredCustomer = deserialize(Customer, data);
	});

	test('restores primitives', () => {
		expect(restoredCustomer.uuid).toBe(data.uuid);
		expect(restoredCustomer.fieldValues).toEqual(data.fieldValues);
	});
});
