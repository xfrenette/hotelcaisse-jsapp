import { serialize, deserialize } from 'serializr';
import Customer from 'business/Customer';

let customer;

beforeEach(() => {
	customer = new Customer();
	customer.name = 'test-name';
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

	test('has same name', () => {
		expect(clone.name).toBe(customer.name);
	});
});

describe('isEqualTo()', () => {
	let other;

	beforeEach(() => {
		other = customer.clone();
	});

	test('returns true if equal', () => {
		expect(customer.isEqualTo(other)).toBe(true);
	});

	describe('returns false if', () => {
		test('different name', () => {
			other.name = `${customer.name} (other)`;
			expect(customer.isEqualTo(other)).toBe(false);
		});
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(customer);
	});

	test('serializes name', () => {
		expect(data.name).toBe(customer.name);
	});
});

describe('deserializing', () => {
	let newCustomer;
	const data = {
		name: 'new-name',
	};

	beforeEach(() => {
		newCustomer = deserialize(Customer, data);
	});

	test('creates Customer', () => {
		expect(newCustomer).toBeInstanceOf(Customer);
	});

	test('restores name', () => {
		expect(newCustomer.name).toBe(data.name);
	});
});
