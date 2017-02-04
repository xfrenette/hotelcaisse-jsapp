import Config from 'Config';

let config;

beforeEach(() => {
	config = new Config();
});

describe('set()', () => {
	test('sets internal object', () => {
		const obj = {
			aaa: 'bbb',
			ccc: {
				ddd: 'eee',
			},
		};
		config.set(obj);
		expect(config.getAll()).toEqual(obj);
	});
});

describe('getAll()', () => {
	test('returns the whole config object', () => {
		const obj = {
			aaa: 'bbb',
			ccc: {
				ddd: 'eee',
			},
		};
		config.set(obj);
		expect(config.getAll()).toEqual(obj);
	});
});

describe('get()', () => {
	test('returns first level config', () => {
		const obj = {
			aaa: 'bbb',
		};
		config.set(obj);
		expect(config.get('aaa')).toEqual(obj.aaa);
	});

	test('returns sub level config', () => {
		const obj = {
			aaa: {
				bbb: 'ccc',
			},
		};
		config.set(obj);
		expect(config.get('aaa.bbb')).toEqual(obj.aaa.bbb);
	});

	test('returns null if no default', () => {
		expect(config.get('inexistant')).toBeUndefined();
	});

	test('returns default first level', () => {
		const obj = {
			aaa: 'bbb',
		};
		const def = 'xxx';
		config.set(obj);
		expect(config.get('ccc', def)).toEqual(def);
	});

	test('returns default sub level', () => {
		const obj = {
			aaa: 'bbb',
		};
		const def = 'xxx';
		config.set(obj);
		expect(config.get('aaa.ccc', def)).toEqual(def);
	});

	test('returns default all path wrong', () => {
		const obj = {
			aaa: 'bbb',
		};
		const def = 'xxx';
		config.set(obj);
		expect(config.get('ccc.ddd', def)).toEqual(def);
	});
});
