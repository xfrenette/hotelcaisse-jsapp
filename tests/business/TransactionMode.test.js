import TransactionMode from 'business/TransactionMode';
import { serialize, deserialize } from 'serializr';

let transactionMode;

beforeEach(() => {
	transactionMode = new TransactionMode('test-uuid');
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

describe('serializing', () => {
	test('serializes', () => {
		transactionMode.name = 'test-name';
		transactionMode.id = 3456;
		const data = serialize(transactionMode);
		expect(data).toEqual({
			name: transactionMode.name,
			id: transactionMode.id,
		});
	});
});

describe('deserializing', () => {
	test('deserializes', () => {
		const data = {
			name: 'test-name',
			id: 3456,
		};
		const newTransactionMode = deserialize(TransactionMode, data);
		expect(newTransactionMode).toBeInstanceOf(TransactionMode);
		expect(newTransactionMode.name).toBe(data.name);
		expect(newTransactionMode.id).toBe(data.id);
	});
});
