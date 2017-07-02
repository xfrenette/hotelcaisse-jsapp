import First from 'io/readers/First';
import TestReader from '../../mock/TestReader';

let firstReader;
let testReader1;
let testReader2;

beforeEach(() => {
	testReader1 = new TestReader();
	testReader2 = new TestReader();
	firstReader = new First([testReader1, testReader2]);
});

describe('read()', () => {
	test('if all fails, resolves with null', (done) => {
		testReader1.succeed = false;
		testReader2.succeed = false;
		firstReader.read()
			.then((res) => {
				expect(res).toBeNull();
				done();
			});
	});

	test('if no readers, resolves with null', (done) => {
		firstReader = new First();
		firstReader.read()
			.then((res) => {
				expect(res).toBeNull();
				done();
			});
	});

	test('if first resolves, resolves with its data', (done) => {
		testReader1.data = { a: 'b' };
		firstReader.read()
			.then((res) => {
				expect(res).toBe(testReader1.data);
				done();
			});
	});

	test('if first rejects, resolves with the second\'s data', (done) => {
		testReader1.data = { a: 'b' };
		testReader1.succeed = false;
		testReader2.data = { c: 'd' };
		firstReader.read()
			.then((res) => {
				expect(res).toBe(testReader2.data);
				done();
			});
	});

	test('if first resolves with null, resolves with the second\'s data', (done) => {
		testReader1.data = null;
		testReader2.data = { c: 'd' };
		firstReader.read()
			.then((res) => {
				expect(res).toBe(testReader2.data);
				done();
			});
	});
});
