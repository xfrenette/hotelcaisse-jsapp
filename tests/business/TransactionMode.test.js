import TransactionMode from 'business/TransactionMode';
import { serialize, deserialize } from 'serializr';

let transactionMode;

beforeEach(() => {
	transactionMode = new TransactionMode('test-uuid');
});

describe('constructor()', () => {
	test('it sets uuid if supplied', () => {
		const uuid = 'test-uuid';
		transactionMode = new TransactionMode(uuid);
		expect(transactionMode.uuid).toBe(uuid);
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
		transactionMode.uuid = 'test-uuid';
		const data = serialize(transactionMode);
		expect(data).toEqual({
			name: transactionMode.name,
			uuid: transactionMode.uuid,
		});
	});
});

describe('deserializing', () => {
	test('deserializes', () => {
		const data = {
			name: 'test-name',
			uuid: 'test-uuid',
		};
		const newTransactionMode = deserialize(TransactionMode, data);
		expect(newTransactionMode).toBeInstanceOf(TransactionMode);
		expect(newTransactionMode.name).toBe(data.name);
		expect(newTransactionMode.uuid).toBe(data.uuid);
	});
});
