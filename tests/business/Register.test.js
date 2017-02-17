import Register, { STATES } from 'business/Register';
import Transaction from 'business/Transaction';
import CashMovement from 'business/CashMovement';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';

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
		expect(register.openingCash).toEqual(amount);
	});

	test('sets opening datetime', () => {
		register.open('test', new Decimal(1));
		expect(register.openedAt).toBeInstanceOf(Date);
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
		expect(register.closingCash).toEqual(amount);
	});

	test('sets POST ref', () => {
		const postRef = 'test-1234';
		register.close(new Decimal(1), postRef, new Decimal(1));
		expect(register.POSTRef).toEqual(postRef);
	});

	test('sets POST amount', () => {
		const postAmount = new Decimal(456.78);
		register.close(new Decimal(1), 'test', postAmount);
		expect(register.POSTAmount).toEqual(postAmount);
	});

	test('sets closing datetime', () => {
		register.close(new Decimal(1), 'test', new Decimal(1));
		expect(register.closedAt).toBeInstanceOf(Date);
	});
});

describe('serializing', () => {
	let data;
	let cm1;
	let cm2;
	let openingCash = new Decimal(100.12);
	let closingCash = new Decimal(308.69);
	let POSTAmount = new Decimal(876.04);

	beforeEach(() => {
		cm1 = new CashMovement();
		cm1.note = 'test-note1';
		cm2 = new CashMovement();
		cm2.note = 'test-note2';

		register.open('employee-name', openingCash);

		register.cashMovements.push(cm1);
		register.cashMovements.push(cm2);

		register.close(closingCash, 'test-gfgfs', POSTAmount);

		data = serialize(register);
	});

	test('serializes primitives', () => {
		expect(data.employee).toBe(register.employee);
		expect(data.state).toBe(register.state);
		expect(data.POSTRef).toBe(register.POSTRef);
	});

	test('serializes cashMovements', () => {
		expect(data.cashMovements.length).toBe(2);
		expect(data.cashMovements[1].note).toBe(cm2.note);
	});

	test('serializes openedAt', () => {
		expect(data.openedAt).toEqual(expect.any(Number));
	});

	test('serializes openingCash', () => {
		expect(data.openingCash).toEqual(openingCash.toString());
	});

	test('serializes closedAt', () => {
		expect(data.closedAt).toEqual(expect.any(Number));
	});

	test('serializes closingCash', () => {
		expect(data.closingCash).toEqual(closingCash.toString());
	});

	test('serializes POSTAmount', () => {
		expect(data.POSTAmount).toEqual(POSTAmount.toString());
	});
});

describe('deserializing', () => {
	let newRegister;
	const data = {
		state: STATES.CLOSED,
		employee: 'test-employee',
		openedAt: (new Date()).getTime(),
		openingCash: '100.34',
		closedAt: (new Date()).getTime(),
		closingCash: '456.21',
		POSTRef: 'test-ref-1234',
		POSTAmount: '34.87',
		cashMovements: [
			{ note: 'note1' },
			{ note: 'note2' },
		],
	};

	beforeEach(() => {
		newRegister = deserialize(Register, data);
	});

	test('restores primitives', () => {
		expect(newRegister.state).toBe(data.state);
		expect(newRegister.employee).toBe(data.employee);
		expect(newRegister.POSTRef).toBe(data.POSTRef);
	});

	test('restores openedAt', () => {
		expect(newRegister.openedAt).toBeInstanceOf(Date);
	});

	test('restores closedAt', () => {
		expect(newRegister.closedAt).toBeInstanceOf(Date);
	});

	test('restores openingCash', () => {
		expect(newRegister.openingCash.toString()).toBe(data.openingCash);
	});

	test('restores closingCash', () => {
		expect(newRegister.closingCash.toString()).toBe(data.closingCash);
	});

	test('restores POSTAmount', () => {
		expect(newRegister.POSTAmount.toString()).toBe(data.POSTAmount);
	});

	test('restores cashMovements', () => {
		expect(newRegister.cashMovements.length).toBe(data.cashMovements.length);
		expect(newRegister.cashMovements[0]).toBeInstanceOf(CashMovement);
	});
});
