import { serialize, deserialize } from 'serializr';
import Device from 'business/Device';
import Register, { STATES } from 'business/Register';

let device;

beforeEach(() => {
	device = new Device();
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

	test('serializes currentRegister', () => {
		const serializedRegister = serialize(device.currentRegister);
		expect(data.currentRegister).toEqual(serializedRegister);
	});
});

describe('deserializing', () => {
	const data = {
		currentRegister: { state: STATES.OPENED },
	};

	beforeEach(() => {
		device = deserialize(Device, data);
	});

	test('restores currentRegister', () => {
		expect(device.currentRegister).toBeInstanceOf(Register);
		expect(device.currentRegister.state).toBe(data.currentRegister.state);
	});
});

describe('update', () => {
	let newDevice;

	beforeEach(() => {
		newDevice = new Device();
		newDevice.currentRegister = new Register();
		newDevice.currentRegister.state = STATES.CLOSED;
	});

	test('updates register only if defined', () => {
		device.currentRegister.update = jest.fn();
		device.update(newDevice);
		expect(device.currentRegister.update).toHaveBeenCalledWith(newDevice.currentRegister);
	});

	test('updates when register is null', (done) => {
		newDevice.currentRegister = null;
		device.currentRegister.update = jest.fn((newRegister) => {
			expect(newRegister).toBeInstanceOf(Register);
			expect(newRegister.state).toBe(STATES.UNINITIALIZED);
			done();
		});
		device.update(newDevice);
	});

	test('triggers update event', (done) => {
		device.on('update', () => { done(); });
		device.update(new Device());
	});
});
