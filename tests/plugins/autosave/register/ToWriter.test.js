import Decimal from 'decimal.js';
import ToWriter from 'plugins/autosave/register/ToWriter';
import Application from 'Application';
import CashMovement from 'business/CashMovement';
import Register from 'business/Register';

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
	application.register = register;
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
