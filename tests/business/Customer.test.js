import { serialize, deserialize } from 'serializr';
import Customer from 'business/Customer';

let customer;

beforeEach(() => {
	customer = new Customer();
	customer.name = 'test-name';
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
