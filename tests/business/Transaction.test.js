import Transaction from 'business/Transaction';
import TransactionMode from 'business/TransactionMode';
import Decimal from 'decimal.js';

let transaction;

beforeEach(() => {
	transaction = new Transaction(
		new Decimal(123),
		new TransactionMode('test')
	);
});

describe('constructor()', () => {
	test('sets createdAt time', () => {
		expect(transaction.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount', () => {
		const decimal = new Decimal(10);
		transaction = new Transaction(decimal);
		expect(transaction.amount).toBe(decimal);
	});

	test('sets transactionMode', () => {
		const transactionMode = new TransactionMode(10);
		transaction = new Transaction(new Decimal(1), transactionMode);
		expect(transaction.transactionMode).toBe(transactionMode);
	});
});
