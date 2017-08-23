import BusinessAutoLoad from 'plugins/loadOnInit/Business';
import Register from 'business/Register';
import Business from 'business/Business';
import Application from 'Application';
import TestReader from '../../mock/TestReader';

let businessAutoLoad;
let testReader;
let application;
const business1 = new Business();
business1.deviceRegister = new Register();
business1.deviceRegister.uuid = 'register-test-1';
const business2 = new Business();
business2.deviceRegister = new Register();
business2.deviceRegister.uuid = 'register-test-2';

beforeEach(() => {
	testReader = new TestReader();
	application = new Application();
	application.business = business1;
	businessAutoLoad = new BusinessAutoLoad(testReader);
	businessAutoLoad.bootstrap(application);
});

describe('updateBusiness', () => {
	test('does nothing if null', () => {
		businessAutoLoad.updateBusiness(null);
		expect(application.business.deviceRegister.uuid).toBe(business1.deviceRegister.uuid);
	});

	test('does nothing if not a business instance', () => {
		businessAutoLoad.updateBusiness({ a: 'b' });
		expect(application.business.deviceRegister.uuid).toBe(business1.deviceRegister.uuid);
	});

	test('updates application business if new', () => {
		businessAutoLoad.updateBusiness(business2);
		expect(application.business.deviceRegister.uuid).toBe(business2.deviceRegister.uuid);
	});

	test('only updates the business, does not replace it', () => {
		const origBusiness = application.business;
		businessAutoLoad.updateBusiness(business2);
		expect(application.business).toBe(origBusiness);
	});
});

describe('start()', () => {
	test('returns Promise', () => {
		expect(businessAutoLoad.start()).toBeInstanceOf(Promise);
	});

	test('udates business on resolve', (done) => {
		testReader.data = business2;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business.uuid).toBe(business2.uuid);
				done();
			});
	});
});
