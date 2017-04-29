import { serialize, deserialize } from 'serializr';
import Credit from 'business/Credit';
import Decimal from 'decimal.js';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const credit = new Credit();
		expect(credit.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		let credit = new Credit();
		expect(credit.amount).toBeNull();

		const decimal = new Decimal(10);
		credit = new Credit(null, decimal);
		expect(credit.amount).toBe(decimal);
	});

	test('sets uuid if present', () => {
		let credit = new Credit();
		expect(credit.uuid).toBeNull();

		const uuid = 'test-uuid';
		credit = new Credit(uuid);
		expect(credit.uuid).toBe(uuid);
	});

	test('sets note if present', () => {
		let credit = new Credit();
		expect(credit.note).toBeNull();

		const note = 'test-note';
		credit = new Credit(null, null, note);
		expect(credit.note).toBe(note);
	});
});

describe('serializing', () => {
	let data;
	let credit;

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
