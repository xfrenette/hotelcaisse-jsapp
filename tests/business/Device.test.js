import { serialize, deserialize } from 'serializr';
import Device from 'business/Device';
import CashMovement from 'business/CashMovement';
import Register, { STATES } from 'business/Register';

let device;

beforeEach(() => {
	device = new Device();
	device.nextRegisterNumber = 23;
});

describe('constructor', () => {
	test('makes a register', () => {
		device = new Device();
		expect(device.currentRegister).toBeInstanceOf(Register);
		expect(device.currentRegister.state).toBe(STATES.UNINITIALIZED);
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(device);
	});

	test('serializes primitives', () => {
		expect(data.nextRegisterNumber).toBe(device.nextRegisterNumber);
	});

	test('serializes currentRegister', () => {
		const serializedRegister = serialize(device.currentRegister);
		expect(data.currentRegister).toEqual(serializedRegister);
	});
});

describe('deserializing', () => {
	const data = {
		nextRegisterNumber: 98,
		currentRegister: { state: STATES.OPENED },
	};

	beforeEach(() => {
		device = deserialize(Device, data);
	});

	test('restores primitives', () => {
		expect(device.nextRegisterNumber).toBe(data.nextRegisterNumber);
	});

	test('restores currentRegister', () => {
		expect(device.currentRegister).toBeInstanceOf(Register);
		expect(device.currentRegister.state).toBe(data.currentRegister.state);
	});
});

describe('update', () => {
	test('updates all attributes', () => {
		const data = {
			nextRegisterNumber: device.nextRegisterNumber + 1,
			currentRegister: {
				uuid: 'test-uuid-register',
				cashMovements: [{ uuid: 'test-cash-movement' }],
			},
		};
		device.update(data);
		expect(device.nextRegisterNumber).toBe(data.nextRegisterNumber);
		expect(device.currentRegister.uuid).toBe(data.currentRegister.uuid);
		expect(device.currentRegister.cashMovements[0]).toBeInstanceOf(CashMovement);
		expect(device.currentRegister.cashMovements[0].uuid)
			.toBe(data.currentRegister.cashMovements[0].uuid);
	});

	test('updates only defined attributes', () => {
		const oldNextRegisterNumber = device.nextRegisterNumber;
		device.currentRegister.state = STATES.OPENED;
		device.update({});
		expect(device.nextRegisterNumber).toBe(oldNextRegisterNumber);
		expect(device.currentRegister.state).toBe(STATES.OPENED);
	});

	test('resets currentRegister when is null', () => {
		device.currentRegister.state = STATES.OPENED;
		device.currentRegister.uuid = 'test-uuid';
		device.update({
			currentRegister: null,
		});
		expect(device.currentRegister.state).toBe(STATES.UNINITIALIZED);
		expect(device.currentRegister.uuid).toBeNull();
	});

	test('updates register if defined', () => {
		const data = {
			currentRegister: {},
		};
		device.currentRegister.update = jest.fn();
		device.update(data);
		expect(device.currentRegister.update).toHaveBeenCalledWith(data.currentRegister);
	});

	test('updates all attributes if receives Device', () => {
		const newDevice = new Device();
		newDevice.currentRegister.uuid = 'test-new-register';
		device.update(newDevice);
		expect(device.currentRegister.uuid).toBe(newDevice.currentRegister.uuid);
		expect(device.nextRegisterNumber).toBe(newDevice.nextRegisterNumber);
	});

	test('throws when invalid data', () => {
		const data = {
			currentRegister: 'invalid',
		};
		expect(() => { device.update(data); }).toThrow();
	});

	test('triggers update event', (done) => {
		device.on('update', () => { done(); });
		device.update(new Device());
	});
});
