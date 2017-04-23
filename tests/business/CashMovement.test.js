import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';
import CashMovement from 'business/CashMovement';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const cashMovement = new CashMovement();
		expect(cashMovement.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		const decimal = new Decimal(10);
		const cashMovement = new CashMovement(decimal);
		expect(cashMovement.amount).toBe(decimal);
	});

	test('doesn\'t set amount if not present', () => {
		const cashMovement = new CashMovement();
		expect(cashMovement.amount).toBeNull();
	});
});

describe('serializing', () => {
	let data;
	let cashMovement;

	beforeEach(() => {
		cashMovement = new CashMovement(new Decimal(32.46));
		cashMovement.note = 'test-note';
		cashMovement.uuid = 'test-uuid';
		data = serialize(cashMovement);
	});

	test('serializes primitives', () => {
		expect(data.note).toBe(cashMovement.note);
		expect(data.uuid).toBe(cashMovement.uuid);
		expect(data.createdAt).toEqual(expect.any(Number));
	});

	test('serializes amount', () => {
		expect(data.amount).toEqual(cashMovement.amount.toString());
	});
});

describe('deserializing', () => {
	let cashMovement;
	const data = {
		createdAt: (new Date()).getTime(),
		note: 'test-note',
		amount: '1.34',
	};

	beforeEach(() => {
		cashMovement = deserialize(CashMovement, data);
	});

	test('restores primitives', () => {
		expect(cashMovement.note).toBe(data.note);
		expect(cashMovement.createdAt).toBeInstanceOf(Date);
	});

	test('restores amount', () => {
		expect(cashMovement.amount).toBeInstanceOf(Decimal);
		expect(cashMovement.amount.toString()).toBe(data.amount);
	});
});
