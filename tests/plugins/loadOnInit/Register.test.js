import RegisterAutoLoad from 'plugins/loadOnInit/Register';
import Register from 'business/Register';
import Application from 'Application';
import TestReader from '../../mock/TestReader';

let registerAutoLoad;
let testReader;
let application;
const register1 = new Register();
register1.uuid = 'register-1';
const register2 = new Register();
register2.uuid = 'register-2';

beforeEach(() => {
	testReader = new TestReader();
	application = new Application();
	application.register = register1;
	registerAutoLoad = new RegisterAutoLoad(testReader);
	registerAutoLoad.bootstrap(application);
});

describe('updateRegister', () => {
	test('does nothing if null', () => {
		registerAutoLoad.updateRegister(null);
		expect(application.register.uuid).toBe(register1.uuid);
	});

	test('does nothing if not a register instance', () => {
		registerAutoLoad.updateRegister({ a: 'b' });
		expect(application.register.uuid).toBe(register1.uuid);
	});

	test('updates application register if new', () => {
		registerAutoLoad.updateRegister(register2);
		expect(application.register.uuid).toBe(register2.uuid);
	});

	test('only updates the register, does not replace it', () => {
		const origBusiness = application.register;
		registerAutoLoad.updateRegister(register2);
		expect(application.register).toBe(origBusiness);
	});
});

describe('start()', () => {
	test('returns Promise', () => {
		expect(registerAutoLoad.start()).toBeInstanceOf(Promise);
	});

	test('updates register on resolve', (done) => {
		testReader.data = register2;
		registerAutoLoad.start()
			.then(() => {
				expect(application.register.uuid).toBe(register2.uuid);
				done();
			});
	});
});
