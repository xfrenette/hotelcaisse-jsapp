import Decimal from 'decimal.js';
import ToWriter from 'plugins/autosave/business/ToWriter';
import Application from 'Application';
import Business from 'business/Business';
import CashMovement from 'business/CashMovement';
import Order from 'business/Order';
import Register, { STATES as REGISTER_STATES } from 'business/Register';

let toWriter;
let writer;
let application;
let business;
let register;

beforeEach(() => {
	writer = {
		write: jest.fn(),
	};
	toWriter = new ToWriter(writer);
	application = new Application();
	business = new Business();
	register = new Register();
	business.deviceRegister = register;
	application.business = business;
	toWriter.bootstrap(application);
	toWriter.start();
});

test('register opens', () => {
	register.open('test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('register closes', () => {
	register.close(new Decimal(1), 'test', new Decimal(1));
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('CashMovement added', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('CashMovement removed', () => {
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	register.removeCashMovement(cashMovement);
	expect(writer.write).toHaveBeenCalledTimes(2);
	expect(writer.write).toHaveBeenLastCalledWith(business);
});

test('new Order', () => {
	const order = new Order();
	business.addOrder(order);
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('order change', () => {
	const changes = { a: 'b' };
	const order = new Order();
	order.getChanges = jest.fn().mockImplementation(() => changes);
	business.orders.push(order);
	order.commitChanges();
	expect(writer.write).toHaveBeenCalledWith(business);
});
