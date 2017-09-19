import Decimal from 'decimal.js';
import ToWriter from 'plugins/autosave/device/ToWriter';
import Application from 'Application';
import CashMovement from 'business/CashMovement';
import Device from 'business/Device';

let toWriter;
let writer;
let application;
let register;
let device;

beforeEach(() => {
	writer = {
		write: jest.fn(),
	};
	toWriter = new ToWriter(writer);
	application = new Application();
	device = new Device();
	register = device.currentRegister;
	application.device = device;
	toWriter.bootstrap(application);
	toWriter.start();
});

test('device updates', () => {
	device.update(new Device());
	expect(writer.write).toHaveBeenCalledWith(device);
});

test('register opens', () => {
	register.open('test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(device);
});

test('register closes', () => {
	register.close(new Decimal(1), 'test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(device);
});

test('CashMovement added', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledWith(device);
});

test('CashMovement removed', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	register.removeCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledTimes(2);
	expect(writer.write).toHaveBeenLastCalledWith(device);
});
