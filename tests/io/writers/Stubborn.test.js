import Stubborn from 'io/writers/Stubborn';
import TestWriter from '../../mock/TestWriter';

let stubborn;
let testWriter;

beforeEach(() => {
	testWriter = new TestWriter();
	stubborn = new Stubborn(testWriter);
});

describe('constructor()', () => {
	test('sets writer', () => {
		expect(stubborn.writer).toBe(testWriter);
	});
});

describe('addToQueue()', () => {
	test('adds to internal queue', () => {
		const data1 = 'test';
		const data2 = { a: 'b' };
		stubborn.addToQueue(data1);
		expect(stubborn.queue).toEqual([data1]);
		stubborn.addToQueue(data2);
		expect(stubborn.queue).toEqual([data1, data2]);
	});
});

describe('removeFromQueue()', () => {
	test('removes elements from queue', () => {
		const obj1 = 'a';
		const obj2 = true;
		const obj3 = {};
		stubborn.queue = [obj1, obj2, obj3];
		stubborn.removeFromQueue([obj1, obj3]);
		expect(stubborn.queue).toEqual([obj2]);
		stubborn.removeFromQueue([obj2]);
		expect(stubborn.queue).toEqual([]);
	});
});

describe('dataAddedToQueue()', () => {
	test('returns a Promise', () => {
		const res = stubborn.dataAddedToQueue();
		expect(res instanceof Promise).toBeTruthy();
	});

	test('returns currentTry if defined', () => {
		const testTry = new Promise(() => {});
		stubborn.currentTry = testTry;
		const res = stubborn.dataAddedToQueue();
		expect(res).toBe(testTry);
	});

	test('sets currentTry if no currentTry set', () => {
		const prom = new Promise(() => {});
		stubborn.tryWrite = () => prom;
		stubborn.dataAddedToQueue();
		expect(stubborn.currentTry).toBeInstanceOf(Promise);
	});

	test('clears currentTry when resolves', (done) => {
		const prom = Promise.resolve();
		stubborn.tryWrite = () => prom;
		stubborn.dataAddedToQueue().then(() => {
			expect(stubborn.currentTry).toBeNull();
			done();
		});
	});
});

describe('getCurrentQueue()', () => {
	test('returns current objects in queue', () => {
		const queue = [{}, true];
		stubborn.queue = queue;
		const res = stubborn.getCurrentQueue();
		expect(res).toEqual(queue);
	});

	test('is independent of queue', () => {
		const obj1 = {};
		const obj2 = true;
		stubborn.queue = [obj1];
		const res = stubborn.getCurrentQueue();
		stubborn.queue.push(obj2);
		expect(res).toEqual([obj1]);
	});
});

describe('tryWrite', () => {
	test('calls writer with queue', (done) => {
		const queue = [{}];
		stubborn.queue = queue;
		testWriter.on('write', (data) => {
			expect(data).toEqual(queue);
			done();
		});
		stubborn.tryWrite();
	});

	test('returns promise', () => {
		testWriter.setTimeout(50);
		stubborn.queue.push({});
		const res = stubborn.tryWrite();
		expect(res).toBeInstanceOf(Promise);
	});

	test('resolves if no element in queue', (done) => {
		stubborn.queue = [];
		stubborn.tryWrite().then(() => {
			done();
		});
	});

	test('calls writer.write another time if data was added', (done) => {
		let count = 0;
		testWriter.setTimeout(50);
		testWriter.on('write', () => {
			count += 1;
			if (count === 2) {
				done();
			}
		});
		stubborn.queue = [{}];
		stubborn.tryWrite();
		// We add data after the tryWrite, this should trigger another tryWrite
		stubborn.queue.push('a');
	});

	describe('on success', () => {
		test('resolves', (done) => {
			stubborn.queue.push('a');
			stubborn.tryWrite().then(() => {
				done();
			});
		});

		test('calls removeFromQueue()', (done) => {
			const queue = [{}, true, 'a'];
			stubborn.removeFromQueue = jest.fn().mockImplementation(stubborn.removeFromQueue);
			stubborn.queue = queue;
			stubborn.tryWrite().then(() => {
				expect(stubborn.removeFromQueue).toHaveBeenCalledWith(queue);
				done();
			});
		});

		test('returns promise of next call to tryWrite()', (done) => {
			const key = 'test';
			const fnToTest = stubborn.tryWrite.bind(stubborn);
			stubborn.queue = [{}];
			stubborn.tryWrite = () => Promise.resolve(key);
			fnToTest().then((res) => {
				expect(res).toEqual(key);
				done();
			});
		});
	});

	describe('on fail', () => {
		test('returns retryLater() Promise', (done) => {
			const key = 'test-key';
			testWriter.fail();
			stubborn.retryLater = () => Promise.resolve(key);
			stubborn.queue = [{}];
			stubborn.tryWrite().then((res) => {
				expect(res).toEqual(key);
				done();
			});
		});

		test('calls getNextTimeout()', (done) => {
			testWriter.fail();
			stubborn.retryLater = () => Promise.resolve();
			stubborn.queue = [{}];
			stubborn.getNextTimeout = jest.fn().mockImplementation(() => 20);
			stubborn.tryWrite().then(() => {
				expect(stubborn.getNextTimeout).toHaveBeenCalled();
				done();
			});
		});
	});
});

describe('getNextTimeout()', () => {
	test('returns number', () => {
		const res = stubborn.getNextTimeout();
		expect(Number.isInteger(res)).toBeTruthy();
	});
});

describe('retryLater()', () => {
	test('returns Promise', () => {
		const res = stubborn.retryLater();
		expect(res instanceof Promise).toBeTruthy();
	});

	test('calls tryWrite() after delay', (done) => {
		const delay = 50;
		stubborn.tryWrite = () => {
			const now = (new Date()).getTime();
			expect(now - then - delay).toBeLessThan(delay);
			done();
		};
		const then = (new Date()).getTime();
		stubborn.retryLater(delay);
	});

	test('returns tryWrite() Promise', (done) => {
		const key = 'success';

		stubborn.tryWrite = () => {
			return Promise.resolve(key);
		};
		stubborn.retryLater(1).then((res) => {
			expect(res).toEqual(key);
			done();
		});
	});
});

describe('write', () => {
	test('returns Promise', () => {
		const res = stubborn.write({});
		expect(res instanceof Promise).toBeTruthy();
	});

	test('returns dataAddedToQueue() Promise', () => {
		const prom = Promise.resolve();
		stubborn.dataAddedToQueue = jest.fn().mockImplementation(() => prom);
		const res = stubborn.write('test');
		expect(res).toBe(prom);
	});

	test('calls addToQueue() with data', () => {
		const data = {};
		stubborn.addToQueue = jest.fn();
		stubborn.write(data);
		expect(stubborn.addToQueue).toHaveBeenCalledWith(data);
	});
});
