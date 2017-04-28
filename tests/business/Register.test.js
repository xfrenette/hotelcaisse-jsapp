import Register, { STATES } from 'business/Register';
import { CHANNELS, TOPICS } from 'const/message-bus';
import Transaction from 'business/Transaction';
import CashMovement from 'business/CashMovement';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';
import postal from 'postal';
import { isObservable } from 'mobx';

let register;
const channel = postal.channel(CHANNELS.register);
let subscription;

beforeEach(() => {
	register = new Register();
});

afterEach(() => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
});

describe('state', () => {
	test('is NEW when created', () => {
		expect(register.state).toBe(STATES.NEW);
	});

	test('is observable', () => {
		expect(isObservable(register, 'state')).toBe(true);
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

describe('cashMovements', () => {
	test('is observable', () => {
		expect(isObservable(register, 'cashMovements')).toBe(true);
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
		expect(register.cashMovements.length).toBe(1);
		expect(register.cashMovements[0]).toBe(cashMovement);
	});

	test('publishes message', (done) => {
		subscription = channel.subscribe(
			TOPICS.register.cashMovement.added,
			(data) => {
				expect(data.cashMovement).toBe(cashMovement);
				expect(data.register).toBe(register);
				done();
			},
		);
		register.addCashMovement(cashMovement);
	});
});

describe('removeCashMovement()', () => {
	let cashMovement1;
	let cashMovement2;

	beforeEach(() => {
		cashMovement1 = new CashMovement();
		cashMovement2 = new CashMovement();
		register.cashMovements.push(cashMovement1);
		register.cashMovements.push(cashMovement2);
	});

	test('removes cashMovement from array', () => {
		register.removeCashMovement(cashMovement1);
		expect(register.cashMovements.length).toBe(1);
		expect(register.cashMovements[0]).toBe(cashMovement2);
		register.removeCashMovement(cashMovement2);
		expect(register.cashMovements.length).toBe(0);
	});

	test('works with non-existing cashMovement', () => {
		register.removeCashMovement(new CashMovement());
		expect(register.cashMovements.length).toBe(2);
		expect(register.cashMovements[0]).toBe(cashMovement1);
		expect(register.cashMovements[1]).toBe(cashMovement2);
	});

	test('removes register from cashMovement', () => {
		cashMovement1.register = register;
		register.removeCashMovement(cashMovement1);
		expect(cashMovement1.register).toBeNull();
	});

	test('publishes message', (done) => {
		register.addCashMovement(cashMovement1);
		subscription = channel.subscribe(
			TOPICS.register.cashMovement.removed,
			(data) => {
				expect(data.cashMovement).toBe(cashMovement1);
				expect(data.register).toBe(register);
				done();
			},
		);
		register.removeCashMovement(cashMovement1);
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

	test('publishes message', (done) => {
		subscription = channel.subscribe(
			TOPICS.register.opened,
			(data) => {
				expect(data.register).toBe(register);
				done();
			},
		);
		register.open('test', new Decimal(1));
	});

	test('does nothing if invalid data', () => {
		register.open('test', new Decimal(-1));
		expect(register.state).not.toBe(STATES.OPENED);
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

	test('publishes message', (done) => {
		subscription = channel.subscribe(
			TOPICS.register.closed,
			(data) => {
				expect(data.register).toBe(register);
				done();
			},
		);
		register.close(new Decimal(1), 'test', new Decimal(1));
	});

	test('does nothing if invalid data', () => {
		register.close(new Decimal(-1), 'test', new Decimal(1));
		expect(register.state).not.toBe(STATES.CLOSED);
	});
});

describe('serializing', () => {
	let data;
	let cm1;
	let cm2;
	const openingCash = new Decimal(100.12);
	const closingCash = new Decimal(308.69);
	const POSTAmount = new Decimal(876.04);

	beforeEach(() => {
		cm1 = new CashMovement();
		cm1.note = 'test-note1';
		cm2 = new CashMovement();
		cm2.note = 'test-note2';

		register.uuid = 'test-uuid';
		register.open('employee-name', openingCash);

		register.cashMovements.push(cm1);
		register.cashMovements.push(cm2);

		register.close(closingCash, 'test-gfgfs', POSTAmount);

		data = serialize(register);
	});

	test('serializes primitives', () => {
		expect(data.uuid).toBe(register.uuid);
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
		uuid: 'test-uuid1',
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
		expect(newRegister.uuid).toBe(data.uuid);
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

describe('validateOpen', () => {
	test('invalid employee', () => {
		const invalidValues = [undefined, '', true, ' '];
		invalidValues.forEach((value) => {
			const res = register.validateOpen(value, new Decimal(23));
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid cashAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = register.validateOpen('test', value);
			expect(res).not.toBeUndefined();
		});
	});

	test('valid values', () => {
		const res = register.validateOpen('test', new Decimal(12));
		expect(res).toBeUndefined();
	});
});

describe('validateClose', () => {
	test('invalid cashAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = register.validateClose(value, 'test', new Decimal(0));
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid POSTRef', () => {
		const invalidValues = [undefined, '', true, ' '];
		invalidValues.forEach((value) => {
			const res = register.validateClose(new Decimal(0), value, new Decimal(0));
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid POSTAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = register.validateClose(new Decimal(0), 'test', value);
			expect(res).not.toBeUndefined();
		});
	});

	test('valid values', () => {
		const res = register.validateClose(new Decimal(12), 'test', new Decimal(12));
		expect(res).toBeUndefined();
	});
});

