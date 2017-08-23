import Transaction from 'business/Transaction';
import TransactionMode from 'business/TransactionMode';
import Decimal from 'decimal.js';
import { deserialize, serialize } from 'serializr';

let transaction;

beforeEach(() => {
	transaction = new Transaction(
		'test-uuid',
		new Decimal(123),
		new TransactionMode('test')
	);
});

describe('constructor()', () => {
	test('sets createdAt time', () => {
		expect(transaction.createdAt).toBeInstanceOf(Date);
	});

	test('sets uuid', () => {
		const uuid = 'test-uuid';
		transaction = new Transaction(uuid);
		expect(transaction.uuid).toBe(uuid);
	});

	test('sets amount', () => {
		const decimal = new Decimal(10);
		transaction = new Transaction(null, decimal);
		expect(transaction.amount).toBe(decimal);
	});

	test('sets transactionMode', () => {
		const transactionMode = new TransactionMode(10);
		transaction = new Transaction(null, null, transactionMode);
		expect(transaction.transactionMode).toBe(transactionMode);
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		transaction.note = 'test-note';
		transaction.uuid = 'test-uuid';
		data = serialize(transaction);
	});

	test('saves transactionMode object', () => {
		const tmData = serialize(transaction.transactionMode);
		expect(data.transactionMode).toEqual(tmData);
	});

	test('saves primitives', () => {
		expect(data).toEqual(expect.objectContaining({
			note: transaction.note,
			uuid: transaction.uuid,
			createdAt: expect.any(Number),
		}));
	});

	test('saves amount', () => {
		expect(typeof data.amount).toBe('string');
	});
});

describe('deserializing', () => {
	let newTransaction;
	const jsonObject = {
		amount: '-1.23',
		transactionMode: {
			name: 'test-tm',
		},
		note: 'test-note',
		uuid: 'test-uuid',
		createdAt: Math.round((new Date()).getTime() / 1000),
	};

	beforeEach(() => {
		newTransaction = deserialize(Transaction, jsonObject);
	});

	test('restores createdAt', () => {
		expect(newTransaction.createdAt).toBeInstanceOf(Date);
	});

	test('restores primitives', () => {
		expect(newTransaction.note).toBe(jsonObject.note);
		expect(newTransaction.uuid).toBe(jsonObject.uuid);
	});

	test('restores transactionMode', () => {
		expect(newTransaction.transactionMode).toBeInstanceOf(TransactionMode);
	});

	test('restores amount', () => {
		expect(newTransaction.amount).toBeInstanceOf(Decimal);
	});
});
