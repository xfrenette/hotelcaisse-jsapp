import DeviceAutoLoad from 'plugins/loadOnInit/Device';
import Device from 'business/Device';
import Application from 'Application';
import TestReader from '../../mock/TestReader';

let deviceAutoLoad;
let testReader;
let application;
const device1 = new Device();
device1.currentRegister.uuid = 'register-1';
const device2 = new Device();
device2.currentRegister.uuid = 'register-2';

beforeEach(() => {
	testReader = new TestReader();
	application = new Application();
	application.device = device1;
	deviceAutoLoad = new DeviceAutoLoad(testReader);
	deviceAutoLoad.bootstrap(application);
});

describe('updateDevice', () => {
	test('does nothing if null', () => {
		deviceAutoLoad.updateDevice(null);
		expect(application.device.currentRegister.uuid).toBe(device1.currentRegister.uuid);
	});

	test('does nothing if not a device instance', () => {
		deviceAutoLoad.updateDevice({ a: 'b' });
		expect(application.device.currentRegister.uuid).toBe(device1.currentRegister.uuid);
	});

	test('updates application device if new', () => {
		deviceAutoLoad.updateDevice(device2);
		expect(application.device.currentRegister.uuid).toBe(device2.currentRegister.uuid);
	});

	test('only updates the device, does not replace it', () => {
		const origDevice = application.device;
		deviceAutoLoad.updateDevice(device2);
		expect(application.device).toBe(origDevice);
	});
});

describe('start()', () => {
	test('returns Promise', () => {
		expect(deviceAutoLoad.start()).toBeInstanceOf(Promise);
	});

	test('updates device on resolve', (done) => {
		testReader.data = device2;
		deviceAutoLoad.start()
			.then(() => {
				expect(application.device.currentRegister.uuid).toBe(device2.currentRegister.uuid);
				done();
			});
	});
});
