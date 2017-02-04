import Memory from 'data-sources/Memory';

let memory;

beforeEach(() => {
	memory = new Memory();
});

describe('write()', () => {
	test('returns a Promise', () => {
		const res = memory.write({});
		expect(res).toBeInstanceOf(Promise);
	});

	test('resolves', (done) => {
		const res = memory.write({});
		res.then(() => done());
	});

	test('sets internal data', () => {
		const obj = { aaa: 'bbb' };

		memory.write(obj);
		expect(memory.data).toBe(obj);

		memory.write('string');
		expect(memory.data).toEqual('string');
	});
});

describe('read', () => {
	test('returns a Promise', () => {
		const res = memory.read();
		expect(res).toBeInstanceOf(Promise);
	});

	test('resolves with written data', (done) => {
		memory.write('string');
		const res1 = memory.read().then((data) => {
			expect(data).toEqual('string');
		});

		const obj = { aaa: 'bbb' };
		memory.write(obj);
		const res2 = memory.read().then((data) => {
			expect(data).toBe(obj);
		});

		Promise.all([res1, res2]).then(done);
	});
});
