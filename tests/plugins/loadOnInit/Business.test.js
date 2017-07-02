import BusinessAutoLoad from 'plugins/loadOnInit/Business';
import Business from 'business/Business';
import Application from 'Application';
import TestReader from '../../mock/TestReader';

let businessAutoLoad;
let testReader;
let application;
let business1 = new Business();
business1.uuid = '1';
let business2 = new Business();
business1.uuid = '2';

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
		expect(application.business.uuid).toBe(business1.uuid);
	});

	test('does nothing if not a business instance', () => {
		businessAutoLoad.updateBusiness({ a: 'b' });
		expect(application.business.uuid).toBe(business1.uuid);
	});

	test('updates application business if new', () => {
		businessAutoLoad.updateBusiness(business2);
		expect(application.business.uuid).toBe(business2.uuid);
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
