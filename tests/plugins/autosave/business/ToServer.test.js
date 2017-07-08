import Decimal from 'decimal.js';
import ToServer from 'plugins/autosave/business/ToServer';
import Application from 'Application';
import Business from 'business/Business';
import CashMovement from 'business/CashMovement';
import Order from 'business/Order';
import Register, { STATES as REGISTER_STATES } from 'business/Register';

let toServer;
let application;
let business;
let register;
let testServer;

beforeEach(() => {
	testServer = {};
	toServer = new ToServer(testServer);
	application = new Application();
	business = new Business();
	register = new Register();
	business.deviceRegister = register;
	application.business = business;
	toServer.bootstrap(application);
	toServer.start();
});

test('register opens', () => {
	testServer.registerOpened = jest.fn();
	register.open('test', new Decimal(1));
	expect(testServer.registerOpened).toHaveBeenCalledWith(register);
});

test('register closes', () => {
	testServer.registerClosed = jest.fn();
	register.close(new Decimal(1), 'test', new Decimal(1));
	expect(testServer.registerClosed).toHaveBeenCalledWith(register);
});

test('CashMovement added', () => {
	testServer.cashMovementAdded = jest.fn();
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	expect(testServer.cashMovementAdded).toHaveBeenCalledWith(cashMovement);
});

test('CashMovement removed', () => {
	testServer.cashMovementAdded = jest.fn();
	testServer.cashMovementRemoved = jest.fn();
	const cashMovement = new CashMovement();
	register.addCashMovement(cashMovement);
	register.removeCashMovement(cashMovement);
	expect(testServer.cashMovementRemoved).toHaveBeenCalledWith(cashMovement);
});

test('new Order', () => {
	testServer.orderCreated = jest.fn();
	const order = new Order();
	business.addOrder(order);
	expect(testServer.orderCreated).toHaveBeenCalledWith(order);
});

test('order change', () => {
	testServer.orderChanged = jest.fn();
	const changes = { a: 'b' };
	const order = new Order();
	order.getChanges = jest.fn().mockImplementation(() => changes);
	business.orders.push(order);
	order.commitChanges();
	expect(testServer.orderChanged).toHaveBeenCalledWith(order, changes);
});
