import Decimal from 'decimal.js';
import { deserialize, serialize } from 'serializr';
import { timestamp as timestampPropSchema } from 'vendor/serializr/propSchemas';
import CashMovement from 'business/CashMovement';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const cashMovement = new CashMovement();
		expect(cashMovement.createdAt).toBeInstanceOf(Date);
	});

	test('sets uuid if present', () => {
		const uuid = 'test-uuid';
		const cashMovement = new CashMovement(uuid);
		expect(cashMovement.uuid).toBe(uuid);
	});

	test('sets amount if present', () => {
		const decimal = new Decimal(10);
		const cashMovement = new CashMovement(null, decimal);
		expect(cashMovement.amount).toBe(decimal);
	});

	test('sets note if present', () => {
		const note = 'test-note';
		const cashMovement = new CashMovement(null, null, note);
		expect(cashMovement.note).toBe(note);
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
		cashMovement = new CashMovement('test-uuid', new Decimal(32.46), 'test-note');
		data = serialize(cashMovement);
	});

	test('serializes primitives', () => {
		expect(data.note).toBe(cashMovement.note);
		expect(data.uuid).toBe(cashMovement.uuid);
		expect(data.createdAt).toBe(timestampPropSchema().serializer(cashMovement.createdAt));
	});

	test('serializes amount', () => {
		expect(data.amount).toEqual(cashMovement.amount.toString());
	});
});

describe('deserializing', () => {
	let cashMovement;
	const date = new Date();
	date.setMilliseconds(0);

	const data = {
		createdAt: date.getTime() / 1000,
		uuid: 'test-uuid',
		note: 'test-note',
		amount: '1.34',
	};

	beforeEach(() => {
		cashMovement = deserialize(CashMovement, data);
	});

	test('restores primitives', () => {
		expect(cashMovement.note).toBe(data.note);
		expect(cashMovement.uuid).toBe(data.uuid);
		expect(cashMovement.createdAt).toBeInstanceOf(Date);
		expect(cashMovement.createdAt).toEqual(date);
	});

	test('restores amount', () => {
		expect(cashMovement.amount).toBeInstanceOf(Decimal);
		expect(cashMovement.amount.toString()).toBe(data.amount);
	});
});

describe('CashMovement.validate()', () => {
	test('rejects invalid amount', () => {
		const invalidValues = [undefined, null, 12, '12'];
		invalidValues.forEach((value) => {
			expect(CashMovement.validate({ amount: value })).not.toBeUndefined();
		});
	});

	test('rejects invalid note', () => {
		const invalidValues = ['', ' ', null, true, new Date()];
		invalidValues.forEach((value) => {
			expect(CashMovement.validate({ note: value })).not.toBeUndefined();
		});
	});

	test('validates valid data', () => {
		const values = { amount: new Decimal(12), note: 'Test' };
		expect(CashMovement.validate(values)).toBeUndefined();
	});
});
