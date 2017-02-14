import Register, { STATES } from 'business/Register';
import Transaction from 'business/Transaction';
import CashMovement from 'business/CashMovement';
import Decimal from 'decimal.js';

let register;

beforeEach(() => {
	register = new Register();
});

describe('state', () => {
	test('is NEW when created', () => {
		expect(register.state).toBe(STATES.NEW);
	});
});

describe('addTransaction()', () => {
	let transaction;

	beforeEach(() => {
		transaction = new Transaction();
	});

	test('sets register on transaction', () => {
		register.addTransaction(transaction);
		expect(transaction.register).toBe(register);
	});
});

describe('addCashMovement()', () => {
	let cashMovement;

	beforeEach(() => {
		cashMovement = new CashMovement();
	});

	test('sets register on cashMovement', () => {
		register.addCashMovement(cashMovement);
		expect(cashMovement.register).toBe(register);
	});

	test('saves in internal array', () => {
		register.addCashMovement(cashMovement);
		expect(register.cashMovements).toEqual([cashMovement]);
	});
});

describe('open()', () => {
	test('changes state', () => {
		register.open('test', new Decimal(1));
		expect(register.state).toBe(STATES.OPENED);
	});

	test('sets employee', () => {
		const employee = 'test-employee';
		register.open(employee, new Decimal(1));
		expect(register.employee).toEqual(employee);
	});

	test('sets declared cash amount', () => {
		const amount = new Decimal(123.45);
		register.open('test', amount);
		expect(register.openingData.declaredCash).toEqual(amount);
	});

	test('sets opening datetime', () => {
		register.open('test', new Decimal(1));
		expect(register.openingData.openedAt).toBeInstanceOf(Date);
	});
});

describe('close()', () => {
	const testData = [new Decimal(1), 'test', new Decimal(1)];

	test('changes state', () => {
		register.close(...testData);
		expect(register.state).toBe(STATES.CLOSED);
	});

	test('sets declared cash amount', () => {
		const amount = new Decimal(123.45);
		register.close(amount, 'test', new Decimal(1));
		expect(register.closingData.declaredCash).toEqual(amount);
	});

	test('sets POST ref', () => {
		const postRef = 'test-1234';
		register.close(new Decimal(1), postRef, new Decimal(1));
		expect(register.closingData.POSTRef).toEqual(postRef);
	});

	test('sets POST amount', () => {
		const postAmount = new Decimal(456.78);
		register.close(new Decimal(1), 'test', postAmount);
		expect(register.closingData.POSTAmount).toEqual(postAmount);
	});

	test('sets closing datetime', () => {
		register.close(new Decimal(1), 'test', new Decimal(1));
		expect(register.closingData.closedAt).toBeInstanceOf(Date);
	});
});
