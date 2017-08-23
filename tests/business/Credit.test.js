import { deserialize, serialize } from 'serializr';
import { isObservable } from 'mobx';
import Decimal from 'decimal.js';
import Credit from 'business/Credit';

let credit;

beforeEach(() => {
	credit = new Credit('credit');
});

describe('constructor()', () => {
	test('sets createdAt time', () => {
		expect(credit.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		credit = new Credit();
		expect(credit.amount).toBeNull();

		const decimal = new Decimal(10);
		credit = new Credit(null, decimal);
		expect(credit.amount).toBe(decimal);
	});

	test('sets uuid if present', () => {
		credit = new Credit();
		expect(credit.uuid).toBeNull();

		const uuid = 'test-uuid';
		credit = new Credit(uuid);
		expect(credit.uuid).toBe(uuid);
	});

	test('sets note if present', () => {
		credit = new Credit();
		expect(credit.note).toBeNull();

		const note = 'test-note';
		credit = new Credit(null, null, note);
		expect(credit.note).toBe(note);
	});
});

describe('amount', () => {
	test('is observable', () => {
		expect(isObservable(credit, 'amount')).toBe(true);
	});
});

describe('note', () => {
	test('is observable', () => {
		expect(isObservable(credit, 'note')).toBe(true);
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		credit = new Credit('test-uuid', new Decimal(12.56), 'test-note');
		data = serialize(credit);
	});

	test('saves primitives', () => {
		expect(data).toEqual(expect.objectContaining({
			note: credit.note,
			uuid: credit.uuid,
			createdAt: expect.any(Number),
		}));
	});

	test('saves amount', () => {
		expect(typeof data.amount).toBe('string');
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid',
		amount: '-1.23',
		note: 'test-note',
		createdAt: Math.round((new Date()).getTime() / 1000),
	};

	beforeEach(() => {
		credit = deserialize(Credit, jsonObject);
	});

	test('restores createdAt', () => {
		expect(credit.createdAt).toBeInstanceOf(Date);
	});

	test('restores primitives', () => {
		expect(credit.note).toBe(jsonObject.note);
		expect(credit.uuid).toBe(jsonObject.uuid);
	});

	test('restores amount', () => {
		expect(credit.amount).toBeInstanceOf(Decimal);
	});
});

describe('static validate()', () => {
	test('rejects invalid note', () => {
		const invalidValues = [undefined, null, 12, ''];
		invalidValues.forEach((value) => {
			expect(Credit.validate({ note: value })).not.toBeUndefined();
		});
	});

	test('rejects invalid amount', () => {
		const invalidValues = [undefined, null, 12, '12', new Decimal(-1), new Decimal(0)];
		invalidValues.forEach((value) => {
			expect(Credit.validate({ amount: value })).not.toBeUndefined();
		});
	});

	test('validates valid data', () => {
		const values = { amount: new Decimal(12), note: 'Test' };
		expect(Credit.validate(values)).toBeUndefined();
	});
});
