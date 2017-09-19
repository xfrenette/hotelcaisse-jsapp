import Decimal from 'decimal.js';
import ToWriter from 'plugins/autosave/register/ToWriter';
import Application from 'Application';
import CashMovement from 'business/CashMovement';
import Register from 'business/Register';
import Device from 'business/Device';

let toWriter;
let writer;
let application;
let register;

beforeEach(() => {
	writer = {
		write: jest.fn(),
	};
	toWriter = new ToWriter(writer);
	application = new Application();
	register = new Register();
	const device = new Device();
	device.currentRegister = register;
	application.device = device;
	toWriter.bootstrap(application);
	toWriter.start();
});

test('register opens', () => {
	register.open('test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(register);
});

test('register updates', () => {
	register.update(new Register());
	expect(writer.write).toHaveBeenCalledWith(register);
});

test('register closes', () => {
	register.close(new Decimal(1), 'test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(register);
});

test('CashMovement added', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledWith(register);
});

test('CashMovement removed', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	register.removeCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledTimes(2);
	expect(writer.write).toHaveBeenLastCalledWith(register);
});
