import { serialize } from 'serializr';
import BusinessAutoLoad from 'plugins/autoload/Business';
import Business from 'business/Business';
import TestReader from '../../mock/TestReader';

let businessAutoLoad;
let testReader1;
let testReader2;
let application;
let business1 = new Business();
business1.uuid = '1';
let business2 = new Business();
business1.uuid = '2';
const serializedBusiness1 = serialize(business1);
const serializedBusiness2 = serialize(business2);

beforeEach(() => {
	testReader1 = new TestReader();
	testReader2 = new TestReader();
	application = { business: business1 };
	businessAutoLoad = new BusinessAutoLoad([testReader1, testReader2]);
	businessAutoLoad.bootstrap(application);
});

describe('startReaders()', () => {
	test('if all fails, resolves with null', (done) => {
		testReader1.succeed = false;
		testReader2.succeed = false;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeNull();
				done();
			});
	});

	test('if no readers, resolves with null', (done) => {
		businessAutoLoad = new BusinessAutoLoad();
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeNull();
				done();
			});
	});

	test('if first resolves, resolves with its data', (done) => {
		testReader1.data = serializedBusiness2;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res.uuid).toBe(business2.uuid);
				done();
			});
	});

	test('if first rejects, resolves with the second\'s data', (done) => {
		testReader1.data = serializedBusiness1;
		testReader1.succeed = false;
		testReader2.data = serializedBusiness2;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res.uuid).toBe(business2.uuid);
				done();
			});
	});

	test('if first resolves with non-Business, resolves with the second\'s data', (done) => {
		testReader1.data = 'not-business';
		testReader2.data = serializedBusiness2;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res.uuid).toBe(business2.uuid);
				done();
			});
	});

	test('if first resolves with null, resolves with the second\'s data', (done) => {
		testReader1.data = null;
		testReader2.data = serializedBusiness2;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res.uuid).toBe(business2.uuid);
				done();
			});
	});
});

describe('start()', () => {
	test('updates application business if new', (done) => {
		testReader1.data = serializedBusiness2;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business.uuid).toBe(business2.uuid);
				done();
			});
	});

	test('does not update application business if null', (done) => {
		businessAutoLoad.start()
			.then(() => {
				expect(application.business.uuid).toBe(business1.uuid);
				done();
			});
	});

	test('only updates the business, does not replace it', (done) => {
		const origBusiness = application.business;
		testReader1.data = serializedBusiness2;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business).toBe(origBusiness);
				done();
			});
	});
});
