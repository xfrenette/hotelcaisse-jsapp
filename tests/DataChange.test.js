import { serialize, deserialize } from 'serializr';
import DataChange from 'DataChange';

let dataChange;

describe('constructor()', () => {
	test('sets type', () => {
		const type = 'test-type';
		dataChange = new DataChange(type);
		expect(dataChange.type).toBe(type);
	});

	test('sets data', () => {
		const data = { a: 'b' };
		dataChange = new DataChange(null, data);
		expect(dataChange.data).toBe(data);
	});
});

describe('serializing', () => {
	dataChange = new DataChange('test-type', { a: 'b' });
	let data;

	beforeEach(() => {
		data = serialize(dataChange);
	});

	test('saves type', () => {
		expect(data.type).toEqual(dataChange.type);
	});

	test('saves data', () => {
		expect(data.data).toEqual(dataChange.data);
	});
});
