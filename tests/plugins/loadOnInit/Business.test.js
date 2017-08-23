import BusinessAutoLoad from 'plugins/loadOnInit/Business';
import Business from 'business/Business';
import Application from 'Application';
import TransactionMode from 'business/TransactionMode';
import TestReader from '../../mock/TestReader';

let businessAutoLoad;
let testReader;
let application;
const business1 = new Business();
business1.transactionModes.push(new TransactionMode(12, 'mode 1'));
const business2 = new Business();
business2.transactionModes.push(new TransactionMode(36, 'mode 2'));

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
		expect(application.business.transactionModes[0].id).toBe(business1.transactionModes[0].id);
	});

	test('does nothing if not a business instance', () => {
		businessAutoLoad.updateBusiness({ a: 'b' });
		expect(application.business.transactionModes[0].id).toBe(business1.transactionModes[0].id);
	});

	test('updates application business if new', () => {
		businessAutoLoad.updateBusiness(business2);
		expect(application.business.transactionModes[0].id).toBe(business2.transactionModes[0].id);
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

	test('updates business on resolve', (done) => {
		testReader.data = business2;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business.transactionModes[0].id).toBe(business2.transactionModes[0].id);
				done();
			});
	});
});
