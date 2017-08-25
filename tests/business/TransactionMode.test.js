import TransactionMode from 'business/TransactionMode';
import { deserialize, serialize } from 'serializr';

let transactionMode;

beforeEach(() => {
	transactionMode = new TransactionMode(12, 'test-name');
	transactionMode.archived = true;
	transactionMode.type = 'cash';
});

describe('constructor()', () => {
	test('it sets id if supplied', () => {
		const id = 4569;
		transactionMode = new TransactionMode(id);
		expect(transactionMode.id).toBe(id);
	});

	test('it sets name if supplied', () => {
		const name = 'test-name';
		transactionMode = new TransactionMode(null, name);
		expect(transactionMode.name).toBe(name);
	});
});

describe('clone', () => {
	test('makes copy', () => {
		const clone = transactionMode.clone();
		expect(clone).not.toBe(transactionMode);
		expect(clone).toBeInstanceOf(TransactionMode);
		expect(clone.id).toEqual(transactionMode.id);
		expect(clone.name).toEqual(transactionMode.name);
		expect(clone.archived).toEqual(transactionMode.archived);
		expect(clone.type).toEqual(transactionMode.type);
	});
});

describe('serializing', () => {
	test('serializes', () => {
		transactionMode.name = 'test-name';
		transactionMode.id = 3456;
		transactionMode.archived = true;
		transactionMode.type = 'cash';
		const data = serialize(transactionMode);
		expect(data).toEqual({
			name: transactionMode.name,
			id: transactionMode.id,
			archived: transactionMode.archived,
			type: transactionMode.type,
		});
	});
});

describe('deserializing', () => {
	test('deserializes', () => {
		const data = {
			name: 'test-name',
			id: 3456,
			archived: true,
			type: 'cash',
		};
		const newTransactionMode = deserialize(TransactionMode, data);
		expect(newTransactionMode).toBeInstanceOf(TransactionMode);
		expect(newTransactionMode.name).toBe(data.name);
		expect(newTransactionMode.id).toBe(data.id);
		expect(newTransactionMode.archived).toBe(data.archived);
		expect(newTransactionMode.type).toBe(data.type);
	});
});
