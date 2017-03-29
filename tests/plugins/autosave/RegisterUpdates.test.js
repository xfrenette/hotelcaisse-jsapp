import { serialize, deserialize } from 'serializr';
import RegisterUpdates from 'plugins/autosave/RegisterUpdates';
import Register from 'business/Register';
import CashMovement from 'business/CashMovement';
import DataChange from 'DataChange';
import DATA_CHANGE_TYPES from 'const/data-change-types';
import TestWriter from '../../mock/TestWriter';

let registerUpdates;
let register;
let testWriter;

beforeEach(() => {
	register = new Register();
	testWriter = new TestWriter();
	registerUpdates = new RegisterUpdates(testWriter);
});

describe('constructor()', () => {
	test('saves writer', () => {
		registerUpdates = new RegisterUpdates(testWriter);
		expect(registerUpdates.writer).toBe(testWriter);
	});
});

describe('registerOpened()', () => {
	test('called when register opens', () => {
		registerUpdates.registerOpened = jest.fn();
		registerUpdates.start();
		register.open();
		expect(registerUpdates.registerOpened).toHaveBeenCalledWith(register);
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		registerUpdates.registerOpened(register);
	});

	test('writer called with expected DataChange', (done) => {
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.register.opened,
			serialize(register)
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		registerUpdates.registerOpened(register);
	});
});

describe('registerClosed()', () => {
	test('called when register closes', () => {
		registerUpdates.registerClosed = jest.fn();
		registerUpdates.start();
		register.close();
		expect(registerUpdates.registerClosed).toHaveBeenCalledWith(register);
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		registerUpdates.registerClosed(register);
	});

	test('writer called with expected DataChange', (done) => {
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.register.closed,
			serialize(register)
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		registerUpdates.registerClosed(register);
	});
});

describe('cashMovementAdded()', () => {
	const cashMovement = new CashMovement();

	test('called when CashMovement added', () => {
		registerUpdates.cashMovementAdded = jest.fn();
		registerUpdates.start();
		register.addCashMovement(cashMovement);
		expect(registerUpdates.cashMovementAdded).toHaveBeenCalledWith(cashMovement, register);
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		registerUpdates.cashMovementAdded(cashMovement, register);
	});

	test('writer called with expected DataChange', (done) => {
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.register.cashMovement.added,
			{
				registerUUID: register.uuid,
				cashMovement: serialize(cashMovement),
			}
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		registerUpdates.cashMovementAdded(cashMovement, register);
	});
});

describe('cashMovementRemoved()', () => {
	const cashMovement = new CashMovement();

	test('called when CashMovement removed', () => {
		registerUpdates.cashMovementRemoved = jest.fn();
		registerUpdates.start();
		register.removeCashMovement(cashMovement);
		expect(registerUpdates.cashMovementRemoved).toHaveBeenCalledWith(cashMovement, register);
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		registerUpdates.cashMovementRemoved(cashMovement, register);
	});

	test('writer called with expected DataChange', (done) => {
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.register.cashMovement.removed,
			{
				registerUUID: register.uuid,
				cashMovement: serialize(cashMovement),
			}
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		registerUpdates.cashMovementRemoved(cashMovement, register);
	});
});
