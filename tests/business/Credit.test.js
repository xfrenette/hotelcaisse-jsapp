import { serialize, deserialize } from 'serializr';
import Credit from 'business/Credit';
import Decimal from 'decimal.js';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const credit = new Credit();
		expect(credit.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		const decimal = new Decimal(10);
		const credit = new Credit(decimal);
		expect(credit.amount).toBe(decimal);
	});

	test('doesn\'t set amount if not present', () => {
		const credit = new Credit();
		expect(credit.amount).toBeNull();
	});
});

describe('serializing', () => {
	let data;
	let credit;

	beforeEach(() => {
		credit = new Credit(new Decimal(12.56));
		credit.uuid = 'test-uuid';
		credit.note = 'test-note';
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
	let credit;
	const jsonObject = {
		uuid: 'test-uuid',
		amount: '-1.23',
		note: 'test-note',
		createdAt: (new Date()).getTime(),
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
