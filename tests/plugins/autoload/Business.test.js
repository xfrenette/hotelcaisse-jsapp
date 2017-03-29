import { serialize } from 'serializr';
import BusinessAutoLoad from 'plugins/autoload/Business';
import Business from 'business/Business';
import TestReader from '../../mock/TestReader';

let businessAutoLoad;
let testReader1;
let testReader2;
let application;
const serializedBusiness = serialize(new Business());

beforeEach(() => {
	testReader1 = new TestReader();
	testReader2 = new TestReader();
	application = {};
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
		testReader1.data = serializedBusiness;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeInstanceOf(Business);
				done();
			});
	});

	test('if first rejects, resolves with the second\'s data', (done) => {
		testReader1.succeed = false;
		testReader2.data = serializedBusiness;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeInstanceOf(Business);
				done();
			});
	});

	test('if first resolves with non-Business, resolves with the second\'s data', (done) => {
		testReader1.data = 'allo!';
		testReader2.data = serializedBusiness;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeInstanceOf(Business);
				done();
			});
	});

	test('if first resolves with null, resolves with the second\'s data', (done) => {
		testReader1.data = null;
		testReader2.data = serializedBusiness;
		businessAutoLoad.startReaders()
			.then((res) => {
				expect(res).toBeInstanceOf(Business);
				done();
			});
	});
});

describe('start()', () => {
	test('updates application business if new', (done) => {
		const origBusiness = {};
		application.business = origBusiness;
		testReader1.data = serializedBusiness;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business).toBeInstanceOf(Business);
				done();
			});
	});

	test('does not update application business if null', (done) => {
		const origBusiness = {};
		application.business = origBusiness;
		businessAutoLoad.start()
			.then(() => {
				expect(application.business).toBe(origBusiness);
				done();
			});
	});
});
