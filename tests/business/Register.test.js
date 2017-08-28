import Register, { STATES } from 'business/Register';
import { CHANNELS, TOPICS } from 'const/message-bus';
import Transaction from 'business/Transaction';
import CashMovement from 'business/CashMovement';
import Decimal from 'decimal.js';
import { deserialize, serialize } from 'serializr';
import postal from 'postal';
import { isObservable } from 'mobx';

let register;
const channel = postal.channel(CHANNELS.register);
let subscription;

beforeEach(() => {
	register = new Register();
	register.uuid = 'test-uuid';
	register.employee = 'test employee';
	register.openedAt = new Date(123);
	register.openingCash = new Decimal(12.32);
	register.closedAt = new Date(963);
	register.closingCash = new Decimal(41.36);
	register.POSTRef = 'test post ref';
	register.POSTAmount = new Decimal(1.35);
});

afterEach(() => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
});

describe('state', () => {
	test('is UNINITIALIZED when created', () => {
		expect(register.state).toBe(STATES.UNINITIALIZED);
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

	test('emits cashMovementAdd', (done) => {
		register.on('cashMovementAdd', (cm) => {
			expect(cm).toBe(cashMovement);
			done();
		});
		register.addCashMovement(cashMovement);
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

	test('emits cashMovementRemove', (done) => {
		register.on('cashMovementRemove', (cm) => {
			expect(cm).toBe(cashMovement1);
			done();
		});
		register.removeCashMovement(cashMovement1);
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

	test('emits open message', (done) => {
		register.on('open', () => {
			done();
		});
		register.open('test', new Decimal(1));
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

	test('emits close message', (done) => {
		register.on('close', () => {
			done();
		});
		register.close(new Decimal(1), 'test', new Decimal(1));
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

describe('update', () => {
	let newRegister;

	beforeEach(() => {
		newRegister = new Register();
		newRegister.state = STATES.OPENED;
		newRegister.uuid = `${register.uuid}-new`;
		newRegister.employee = `${register.employee} new`;
		newRegister.openedAt = new Date(register.openedAt.getTime() + 10000);
		newRegister.openingCash = register.openingCash.add(1);
		newRegister.closedAt = new Date(register.closedAt.getTime() + 10000);
		newRegister.closingCash = register.closingCash.add(1);
		newRegister.POSTRef = `${newRegister.POSTRef}-new`;
		newRegister.POSTAmount = register.POSTAmount.add(1);
		newRegister.cashMovements.push(new CashMovement('cm-new-1'));
		newRegister.cashMovements.push(new CashMovement('cm-new-2'));
	});

	test('replaces attributes', () => {
		register.update(newRegister);
		const newSerialized = serialize(newRegister);
		const currentSerialized = serialize(register);
		expect(currentSerialized).toEqual(newSerialized);
	});

	test('replaces cashMovements', () => {
		register.cashMovements.push(new CashMovement('cm-1'));
		register.update(newRegister);
		expect(register.cashMovements.slice()).toEqual(newRegister.cashMovements.slice());
	});

	test('check cashMovements are updated, but the same array is used', () => {
		register.update(new Register());
		expect(isObservable(register.cashMovements)).toBe(true);
	});

	test('triggers update event', (done) => {
		register.on('update', () => { done(); });
		register.update(new Register());
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
		expect(data.openedAt).toEqual(Math.round(register.openedAt.getTime() / 1000));
	});

	test('serializes openingCash', () => {
		expect(data.openingCash).toEqual(openingCash.toString());
	});

	test('serializes closedAt', () => {
		expect(data.closedAt).toEqual(Math.round(register.closedAt.getTime() / 1000));
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
	const date = new Date();
	date.setMilliseconds(0);

	const data = {
		uuid: 'test-uuid1',
		state: STATES.CLOSED,
		employee: 'test-employee',
		openedAt: date.getTime() / 1000,
		openingCash: '100.34',
		closedAt: date.getTime() / 1000,
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
		expect(newRegister.openedAt).toEqual(date);
	});

	test('restores closedAt', () => {
		expect(newRegister.closedAt).toBeInstanceOf(Date);
		expect(newRegister.closedAt).toEqual(date);
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

describe('Register.validateOpen', () => {
	test('invalid employee', () => {
		const invalidValues = [undefined, '', true, ' '];
		invalidValues.forEach((value) => {
			const res = Register.validateOpen({ employee: value });
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid cashAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = Register.validateOpen({ cashAmount: value });
			expect(res).not.toBeUndefined();
		});
	});

	test('valid values', () => {
		const res = Register.validateOpen({ employee: 'test', cashAmount: new Decimal(12) });
		expect(res).toBeUndefined();
	});
});

describe('Register.validateClose', () => {
	test('invalid cashAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = Register.validateClose({ cashAmount: value });
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid POSTRef', () => {
		const invalidValues = [undefined, '', true, ' '];
		invalidValues.forEach((value) => {
			const res = Register.validateClose({ POSTRef: value });
			expect(res).not.toBeUndefined();
		});
	});

	test('invalid POSTAmount', () => {
		const invalidValues = [undefined, 12, new Decimal(-2)];
		invalidValues.forEach((value) => {
			const res = Register.validateClose({ POSTAmount: value });
			expect(res).not.toBeUndefined();
		});
	});

	test('valid values', () => {
		const values = { cashAmount: new Decimal(12), POSTRef: 'test', POSTAmount: new Decimal(12) };
		const res = Register.validateClose(values);
		expect(res).toBeUndefined();
	});
});

