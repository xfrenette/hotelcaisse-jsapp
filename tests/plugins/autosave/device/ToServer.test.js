import Decimal from 'decimal.js';
import ToServer from 'plugins/autosave/device/ToServer';
import Application from 'Application';
import Device from 'business/Device';
import CashMovement from 'business/CashMovement';

let toServer;
let application;
let device;
let register;
let testServer;

beforeEach(() => {
	testServer = {};
	toServer = new ToServer(testServer);
	application = new Application();
	device = new Device();
	register = device.currentRegister;
	application.device = device;
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

