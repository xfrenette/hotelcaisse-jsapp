import { deserialize, serialize } from 'serializr';
import Decimal from 'decimal.js';
import AppliedTax from 'business/AppliedTax';

let appliedTax;

beforeEach(() => {
	appliedTax = new AppliedTax(4963, 'test', new Decimal(56.369));
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(appliedTax);
	});

	test('saves primitives', () => {
		expect(data).toEqual({
			amount: appliedTax.amount.toString(),
			name: appliedTax.name,
			taxId: appliedTax.taxId,
		});
	});
});

describe('deserializing', () => {
	const jsonObject = {
		taxId: 9875,
		amount: 86.965,
		name: 'test name',
	};

	beforeEach(() => {
		appliedTax = deserialize(AppliedTax, jsonObject);
	});

	test('restores primitives', () => {
		expect(appliedTax.taxId).toBe(jsonObject.taxId);
		expect(appliedTax.amount.toNumber()).toBe(jsonObject.amount);
		expect(appliedTax.name).toBe(jsonObject.name);
	});
});
