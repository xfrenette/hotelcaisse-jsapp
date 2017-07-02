import ToServer from 'plugins/autosave/business/ToServer';
import Application from 'Application';
import Business from 'business/Business';
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
	application.business = business;
	toServer.bootstrap(application);
	toServer.start();
});

test('register opens', () => {
	business.deviceRegister = register;
	testServer.registerOpened = jest.fn();
	register.open('test');
	expect(testServer.registerOpened).toHaveBeenCalledWith(register);
});

test('register closes', () => {
	business.deviceRegister = register;
	testServer.registerClosed = jest.fn();
	register.close('test');
	expect(testServer.registerClosed).toHaveBeenCalledWith(register);
});
