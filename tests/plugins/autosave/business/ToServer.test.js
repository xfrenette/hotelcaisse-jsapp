import ToServer from 'plugins/autosave/business/ToServer';
import Application from 'Application';
import Business from 'business/Business';
import CashMovement from 'business/CashMovement';
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
	register.open('test');
	expect(testServer.registerOpened).toHaveBeenCalledWith(register);
});

test('register closes', () => {
	testServer.registerClosed = jest.fn();
	register.close('test');
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
